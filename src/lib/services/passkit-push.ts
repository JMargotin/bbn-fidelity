import { connect } from "node:http2";
import forge from "node-forge";
import { prisma } from "@/lib/prisma";

type PemPair = { cert: string; key: string };
let cachedPem: PemPair | null = null;

function getApnsPem(): PemPair {
  if (cachedPem) return cachedPem;

  const p12B64 = process.env.APPLE_PASS_CERT_P12_BASE64;
  const password = process.env.APPLE_PASS_CERT_PASSWORD;
  if (!p12B64 || password === undefined) {
    throw new Error("Apple pass cert env vars are not set");
  }

  const der = forge.util.decode64(p12B64);
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

  let cert: forge.pki.Certificate | undefined;
  let key: forge.pki.PrivateKey | undefined;
  for (const safeContents of p12.safeContents) {
    for (const bag of safeContents.safeBags) {
      if (bag.type === forge.pki.oids.certBag && bag.cert) {
        cert = bag.cert;
      } else if (
        (bag.type === forge.pki.oids.pkcs8ShroudedKeyBag ||
          bag.type === forge.pki.oids.keyBag) &&
        bag.key
      ) {
        key = bag.key;
      }
    }
  }
  if (!cert || !key) throw new Error("Could not extract cert/key from .p12 for APNs");

  cachedPem = {
    cert: forge.pki.certificateToPem(cert),
    key: forge.pki.privateKeyToPem(key),
  };
  return cachedPem;
}

async function sendApnsPush(pushToken: string, topic: string): Promise<void> {
  const { cert, key } = getApnsPem();
  console.log(`[APNs] connecting for token ${pushToken.slice(0, 12)}...`);

  return new Promise((resolve, reject) => {
    const client = connect("https://api.push.apple.com", { cert, key });

    const timeout = setTimeout(() => {
      client.close();
      reject(new Error("APNs timeout (10s)"));
    }, 10_000);

    client.on("error", (err) => {
      clearTimeout(timeout);
      client.close();
      reject(new Error(`http2 client error: ${err.message}`));
    });

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${pushToken}`,
      "apns-topic": topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });

    let status = 0;
    let body = "";
    req.on("response", (headers) => {
      status = Number(headers[":status"]) || 0;
    });
    req.setEncoding("utf8");
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      clearTimeout(timeout);
      client.close();
      console.log(`[APNs] response status=${status} body=${body || "(empty)"}`);
      if (status >= 200 && status < 300) resolve();
      else reject(new Error(`APNs ${status}: ${body}`));
    });
    req.on("error", (err) => {
      clearTimeout(timeout);
      client.close();
      reject(new Error(`http2 req error: ${err.message}`));
    });

    req.end("{}");
  });
}

export async function pushPassUpdateForCustomer(customerId: string): Promise<void> {
  if (!process.env.APPLE_PASS_WEB_SERVICE_URL) return;

  const devices = await prisma.passDevice.findMany({ where: { customerId } });
  if (devices.length === 0) return;

  await Promise.allSettled(
    devices.map(async (device) => {
      try {
        await sendApnsPush(device.pushToken, device.passTypeIdentifier);
        console.log(
          `[APNs] push OK for device ${device.deviceLibraryIdentifier} (customer ${customerId})`,
        );
      } catch (err) {
        console.warn(
          `[APNs] push FAILED for device ${device.deviceLibraryIdentifier} (customer ${customerId}):`,
          err instanceof Error ? err.message : err,
        );
      }
    }),
  );
}

export async function broadcastPassUpdateToAll(): Promise<{
  devices: number;
  ok: number;
  failed: number;
}> {
  if (!process.env.APPLE_PASS_WEB_SERVICE_URL) return { devices: 0, ok: 0, failed: 0 };

  const devices = await prisma.passDevice.findMany({
    select: { pushToken: true, passTypeIdentifier: true },
  });

  // Dedupe by pushToken (a single device can register multiple times)
  const tokenToTopic = new Map<string, string>();
  for (const d of devices) tokenToTopic.set(d.pushToken, d.passTypeIdentifier);

  const results = await Promise.allSettled(
    [...tokenToTopic.entries()].map(([token, topic]) => sendApnsPush(token, topic)),
  );

  let ok = 0;
  let failed = 0;
  for (const r of results) (r.status === "fulfilled" ? ok++ : failed++);

  console.log(`[APNs] broadcast: ${ok} OK, ${failed} échecs sur ${tokenToTopic.size} appareils`);
  return { devices: tokenToTopic.size, ok, failed };
}

/**
 * Touch every customer who has a pass device so that the iOS device picks up
 * any change (e.g. an announcement) on next sync. We do this by incrementing
 * pointsTotal by 0 — Prisma still runs an UPDATE which bumps updatedAt.
 */
export async function bumpAllCustomersWithDevices(): Promise<{
  devices: number;
  ok: number;
  failed: number;
}> {
  if (!process.env.APPLE_PASS_WEB_SERVICE_URL) return { devices: 0, ok: 0, failed: 0 };

  const customerIds = (
    await prisma.passDevice.findMany({
      distinct: ["customerId"],
      select: { customerId: true },
    })
  ).map((d) => d.customerId);

  if (customerIds.length > 0) {
    await prisma.customer.updateMany({
      where: { id: { in: customerIds } },
      data: { pointsTotal: { increment: 0 } },
    });
  }

  return broadcastPassUpdateToAll();
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import forge from "node-forge";
import { PKPass } from "passkit-generator";
import { prisma } from "@/lib/prisma";
import { signQrToken } from "@/lib/services/qr";

type CustomerPassInput = {
  id: string;
  firstName: string;
  pointsTotal: number;
};

type Reward = { label: string; thresholdPoints: number };

type CertBundle = {
  wwdr: string;
  signerCert: string;
  signerKey: string;
  signerKeyPassphrase: string;
};

type AssetMap = Record<string, Buffer>;

const ASSET_FILES = [
  "icon.png",
  "icon@2x.png",
  "icon@3x.png",
  "logo.png",
  "logo@2x.png",
  "logo@3x.png",
] as const;

const FALLBACK_REWARDS: Reward[] = [
  { label: "Boisson offerte", thresholdPoints: 50 },
  { label: "Burger offert", thresholdPoints: 100 },
  { label: "Menu offert", thresholdPoints: 200 },
];

let cachedCerts: CertBundle | null = null;
let cachedAssets: AssetMap | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function extractCertAndKey(p12Base64: string, password: string) {
  const der = forge.util.decode64(p12Base64);
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
  if (!cert) throw new Error("No certificate found in .p12");
  if (!key) throw new Error("No private key found in .p12");

  return {
    cert: forge.pki.certificateToPem(cert),
    key: forge.pki.privateKeyToPem(key),
  };
}

function loadCerts(): CertBundle {
  if (cachedCerts) return cachedCerts;
  const p12 = requireEnv("APPLE_PASS_CERT_P12_BASE64");
  const passphrase = requireEnv("APPLE_PASS_CERT_PASSWORD");
  const wwdrB64 = requireEnv("APPLE_WWDR_CERT_PEM_BASE64");
  const { cert, key } = extractCertAndKey(p12, passphrase);
  cachedCerts = {
    wwdr: Buffer.from(wwdrB64, "base64").toString("utf8"),
    signerCert: cert,
    signerKey: key,
    signerKeyPassphrase: passphrase,
  };
  return cachedCerts;
}

async function loadAssets(): Promise<AssetMap> {
  if (cachedAssets) return cachedAssets;
  const dir = join(process.cwd(), "src/lib/wallet-assets");
  const entries = await Promise.all(
    ASSET_FILES.map(async (name) => [name, await readFile(join(dir, name))] as const),
  );
  cachedAssets = Object.fromEntries(entries) as AssetMap;
  return cachedAssets;
}

async function loadActiveRewards(): Promise<Reward[]> {
  const rewards = await prisma.reward.findMany({
    where: { active: true },
    orderBy: { thresholdPoints: "asc" },
    select: { label: true, thresholdPoints: true },
  });
  return rewards.length > 0 ? rewards : FALLBACK_REWARDS;
}

/** Compact reward label for the auxiliary "rewards list" field on the front. */
function compactRewardLabel(label: string): string {
  return label.replace(/\s*(offerte?|complet|gratuite?)\s*/gi, " ").trim() || label;
}

export async function buildApplePass(customer: CustomerPassInput): Promise<Buffer> {
  const certs = loadCerts();
  const assets = await loadAssets();
  const passTypeId = requireEnv("APPLE_PASS_TYPE_ID");
  const teamId = requireEnv("APPLE_TEAM_ID");

  // Web service URL is optional. Without it, pass updates simply don't work,
  // but the static pass still functions. We only enable webServiceURL when the
  // configured URL is a real HTTPS endpoint (Apple rejects http://).
  const rawWebUrl = process.env.APPLE_PASS_WEB_SERVICE_URL;
  const webServiceURL =
    rawWebUrl && rawWebUrl.startsWith("https://") ? rawWebUrl.replace(/\/$/, "") : null;

  const authToken = await signQrToken({ customerId: customer.id });

  const passJson: Record<string, unknown> = {
    formatVersion: 1,
    passTypeIdentifier: passTypeId,
    teamIdentifier: teamId,
    serialNumber: customer.id,
    organizationName: "Burger by Night",
    description: "Carte de fidélité Burger by Night",
    logoText: "Burger by Night",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(32, 10, 60)",
    labelColor: "rgb(255, 110, 180)",
  };

  if (webServiceURL) {
    passJson.webServiceURL = `${webServiceURL}/api/passes/apple/`;
    passJson.authenticationToken = authToken;
  }

  const pass = new PKPass(
    assets,
    {
      wwdr: certs.wwdr,
      signerCert: certs.signerCert,
      signerKey: certs.signerKey,
      signerKeyPassphrase: certs.signerKeyPassphrase,
    },
    passJson,
  );
  pass.type = "storeCard";

  const rewards = await loadActiveRewards();
  const latestAnnouncement = await prisma.announcement.findFirst({
    orderBy: { createdAt: "desc" },
  });

  pass.headerFields.push({
    key: "member",
    label: "Membre",
    value: customer.firstName.toUpperCase(),
    textAlignment: "PKTextAlignmentRight",
  });

  pass.primaryFields.push({
    key: "points",
    label: "Mes points",
    value: customer.pointsTotal,
    changeMessage: "Solde mis à jour : %@ pts",
  });

  if (rewards.length > 0) {
    pass.auxiliaryFields.push({
      key: "rewards",
      label: "Liste des récompenses",
      value: rewards.map((r) => `${compactRewardLabel(r.label)} ${r.thresholdPoints}`).join("   ·   "),
    });
  }

  if (latestAnnouncement) {
    pass.backFields.push({
      key: "announcement",
      label: latestAnnouncement.title,
      value: latestAnnouncement.body,
      changeMessage: "%@",
    });
  }

  pass.backFields.push(
    {
      key: "howItWorks",
      label: "Comment ça marche",
      value:
        "1€ dépensé = 1 point. Cumule des points et débloque tes récompenses au camion Burger by Night !",
    },
    {
      key: "rewards",
      label: "Récompenses",
      value: rewards.map((r) => `${compactRewardLabel(r.label)} — ${r.thresholdPoints} pts`).join("\n"),
    },
    { key: "contact", label: "Contact", value: "06 03 25 07 23" },
    {
      key: "instructions",
      label: "Comment l'utiliser",
      value:
        "Présente cette carte au camion. Le QR au recto sert à créditer tes points et utiliser tes récompenses.",
    },
  );

  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: authToken,
    messageEncoding: "iso-8859-1",
    altText: customer.firstName,
  });

  return pass.getAsBuffer();
}

/**
 * Apple PassKit web service spec — devices POST diagnostic logs here when
 * something goes wrong with a pass. We just shape-check and forward to stdout
 * so it lands in our app logs.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (Array.isArray(body?.logs)) {
      for (const line of body.logs) console.warn("[ApplePass log]", line);
    }
  } catch {
    // Body wasn't JSON — ignore, Apple still expects 200.
  }
  return new Response(null, { status: 200 });
}

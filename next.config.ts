import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // The Apple Wallet generator at /api/passes/apple/** reads the asset PNGs
  // (icon/logo/strip/thumbnail @1x/2x/3x) from src/lib/wallet-assets at runtime.
  // Standalone output traces files reached via import; raw fs reads must be
  // declared explicitly so the wallet assets land in the output bundle.
  outputFileTracingIncludes: {
    "/api/passes/apple/**": ["./src/lib/wallet-assets/**"],
  },

  allowedDevOrigins: ["172.20.10.3"],
};

export default nextConfig;

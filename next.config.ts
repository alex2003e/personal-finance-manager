import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" es para el Dockerfile (self-hosted); en Vercel choca con su
  // propio tracing de archivos y rompe el build (ENOENT ...nft.json).
  output: process.env.VERCEL ? undefined : "standalone",
  devIndicators: false,
  allowedDevOrigins: ["lamonica-unreproducible-jacinda.ngrok-free.dev"],
};

export default nextConfig;

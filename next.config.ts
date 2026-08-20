import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  allowedDevOrigins: ["lamonica-unreproducible-jacinda.ngrok-free.dev"],
};

export default nextConfig;

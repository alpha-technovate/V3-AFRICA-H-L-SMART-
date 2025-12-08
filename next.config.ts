import type { NextConfig } from "next";

// Enable legacy OpenSSL provider to fix `ERR_OSSL_UNSUPPORTED`
process.env.NODE_OPTIONS = "--openssl-legacy-provider";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@google/generative-ai",
    "https-proxy-agent",
    "google-auth-library",
  ],

  webpack(config: any) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@opentelemetry/exporter-trace-otlp-http": false,
      "@opentelemetry/exporter-trace-otlp-proto": false,
      "@opentelemetry/exporter-trace-otlp-grpc": false,
      "@opentelemetry/exporter-zipkin": false,
      "@opentelemetry/propagator-b3": false,
      "@opentelemetry/propagator-jaeger": false,
    };
    return config;
  },
};

export default nextConfig;

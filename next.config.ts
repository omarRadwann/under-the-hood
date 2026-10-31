import type { NextConfig } from "next";

const pages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  basePath,
  ...(pages ? { output: "export", trailingSlash: true } : {}),
  ...(!pages && {
    async headers() {
      return [
        {
          source: "/playground-assets/worker-runtime.js",
          headers: [
            {
              key: "Content-Security-Policy",
              value:
                "default-src 'none'; script-src 'unsafe-eval'; connect-src 'none'; object-src 'none'",
            },
            { key: "X-Content-Type-Options", value: "nosniff" },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;

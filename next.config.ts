import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: `output: "standalone"` was removed — it is only for self-hosting
  // (Docker / VPS) and breaks Vercel's framework detection.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // better-sqlite3 is a native addon — must NOT be bundled by webpack/turbopack
  serverExternalPackages: ["better-sqlite3"],
  // Include the SQLite database file in the build output
  outputFileTracingIncludes: {
    "/api/students": ["./src/data/students.db"],
    "/api/student/[rank]": ["./src/data/students.db"],
  },
};

export default nextConfig;

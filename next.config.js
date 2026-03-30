const os = require("node:os")

/** @type {import("next").NextConfig} */
const systemUser = (() => {
  try {
    return os.userInfo().username || "app"
  } catch {
    return process.env.USER || "app"
  }
})()

const buildOwner = `${String(systemUser).replace(/[^a-zA-Z0-9_-]/g, "") || "app"}-${typeof process.getuid === "function" ? process.getuid() : "na"}`

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || `.next-${buildOwner}`,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

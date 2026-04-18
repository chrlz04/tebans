import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: false,
  allowedDevOrigins: [
    '192.168.1.33',
    '192.168.1.34',
    '10.207.134.67',
    '192.168.1.*',
  ],

  // ── Security Headers ───────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key:   'X-Frame-Options',
            value: 'DENY',               // prevents clickjacking
          },
          {
            key:   'X-Content-Type-Options',
            value: 'nosniff',            // prevents MIME sniffing
          },
          {
            key:   'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key:   'X-XSS-Protection',
            value: '1; mode=block',      // legacy XSS filter
          },
          {
            key:   'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig

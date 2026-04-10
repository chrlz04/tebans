import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: false,
  allowedDevOrigins: [
    '192.168.1.33',
    '192.168.1.34',
    '10.207.134.67',
    '192.168.1.*',
  ],
}

export default nextConfig
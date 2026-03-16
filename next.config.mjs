/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: 'standalone',
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

export default nextConfig
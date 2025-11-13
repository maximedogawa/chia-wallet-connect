/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  sw: 'service-worker.js',
  disableDevLogs: true,
})

module.exports = withPWA({
  reactStrictMode: true,
  // Set the workspace root to silence the multiple lockfiles warning
  outputFileTracingRoot: require('path').resolve(__dirname, '..'),
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
})

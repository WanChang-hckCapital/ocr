/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
      formats: ['image/avif', 'image/webp'],
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'firebasestorage.googleapis.com'
          },
          {
              protocol: 'https',
              hostname: 'lh3.googleusercontent.com'
          },
          {
              protocol: 'https',
              hostname: 'profile.line-scdn.net'
          },
          {
              protocol: 'https',
              hostname: '*'
          }
      ]
  },
  // experimental: {
  //     serverComponentsExternalPackages: ['tesseract.js'],
  //     outputFileTracingIncludes: {
  //       '/api/**/*': ['./node_modules/**/*.wasm', './node_modules/**/*.proto']
  //     }
  //   }
}

module.exports = nextConfig

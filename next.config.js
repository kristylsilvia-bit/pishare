/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large file uploads through Vercel API routes
  // For files > 4.5MB on Hobby plan, users will need Vercel Pro
  // or set up direct-to-Pi uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};

module.exports = nextConfig;

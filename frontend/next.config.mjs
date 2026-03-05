/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // allow images from any domain if needed later
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;

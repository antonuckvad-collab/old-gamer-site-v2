/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Нужно для работы Tina CMS в production
  experimental: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.tina.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.imgur.com" },
    ],
  },
};

export default nextConfig;

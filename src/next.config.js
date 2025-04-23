/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow builds to succeed even with ESLint errors/warnings
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

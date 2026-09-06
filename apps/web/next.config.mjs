/** @type {import('next').NextConfig} */
const nextConfig = {
  // The current prototype is fully mock-data driven, so a static export gives
  // every route a shareable deployment while preserving the Next.js structure.
  output: "export",
};

export default nextConfig;

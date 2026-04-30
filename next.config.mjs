/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: '/PROJECT-X-client',
  assetPrefix: '/PROJECT-X-client',
  trailingSlash: true,  // Добавляем слеш в конце
};

export default nextConfig;

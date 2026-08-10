/** @type {import('next').NextConfig} */
const nextConfig = {
  // 100% static: `next build` produce direct folderul `out/`.
  // Fara backend, fara runtime Node — deploy pe Vercel ca site static.
  output: 'export',
  reactStrictMode: true,
  images: {
    // Nu folosim optimizarea de imagini (incompatibila cu export static).
    unoptimized: true,
  },
  // URL-uri cu trailing slash => hosting static predictibil (index.html per ruta).
  trailingSlash: true,
};

export default nextConfig;

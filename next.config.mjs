/**
 * GitHub Pages serves under /<repo-name>/ for project pages.
 * Set NEXT_PUBLIC_BASE_PATH in your CI/build env to that value (e.g. "/sunset-quality").
 * Leave it empty for local dev or for a user/organisation root page.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;

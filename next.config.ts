import type { NextConfig } from "next";

// GH_PAGES=true → статический экспорт под суб-путь /slk-labs-v7 (GitHub Pages).
// Локальная сборка/дев без флага — обычный режим (важно для будущей фазы 4 с API).
const isPages = process.env.GH_PAGES === "true";

const nextConfig: NextConfig = isPages
  ? {
      output: "export",
      images: { unoptimized: true },
      basePath: "/slk-labs-v7",
      assetPrefix: "/slk-labs-v7",
    }
  : {};

export default nextConfig;

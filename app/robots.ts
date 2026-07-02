import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// output:'export' требует статичного роута (иначе билд падает).
export const dynamic = "force-static";

// На project-page github.io краулеры robots.txt в подкаталоге не читают —
// файл станет рабочим после переезда на свой домен; sitemap до тех пор
// сабмитится в Search Console вручную.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}

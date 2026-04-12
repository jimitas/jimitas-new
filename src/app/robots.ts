// ======================================================
// robots.txt 自動生成
//
// Next.js App Router の規約で、このファイルを置くだけで
// /robots.txt が自動生成される。
// 検索エンジンのクロールを許可し、sitemap の場所を伝える。
// ======================================================

import type { MetadataRoute } from "next"

const SITE_URL = "https://jimitas.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}

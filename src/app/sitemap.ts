// ======================================================
// サイトマップ自動生成
//
// Next.js App Router の規約で、このファイルを置くだけで
// /sitemap.xml が自動生成される。
// apps.ts のデータを使って全アプリのURLを含める。
// ======================================================

import type { MetadataRoute } from "next"
import { apps } from "@/data/apps"

const SITE_URL = "https://jimitas.com"

export default function sitemap(): MetadataRoute.Sitemap {
  // トップページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]

  // 有効なアプリページ（disabled でないもの）
  const appPages: MetadataRoute.Sitemap = apps
    .filter(app => !app.disabled)
    .map(app => ({
      url: `${SITE_URL}${app.path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))

  return [...staticPages, ...appPages]
}

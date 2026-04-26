// ======================================================
// サイトマップ自動生成
//
// Next.js App Router の規約で、このファイルを置くだけで
// /sitemap.xml が自動生成される。
//
// 含めるURL:
//   - トップ + /about（静的）
//   - 各アプリページ（apps.ts から、disabled 除外）
//   - じみぷり 各プリント（ALL_PRINTS から、isImplemented 通過のみ）
// ======================================================

import type { MetadataRoute } from "next"
import { apps } from "@/data/apps"
import { ALL_PRINTS, isImplemented } from "@/app/(apps)/jimipri/_lib/prints"

const SITE_URL = "https://jimitas.com"

export default function sitemap(): MetadataRoute.Sitemap {
  // 同じ Date を使い回して lastModified を統一する
  const now = new Date()

  // トップページ + Aboutページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]

  // 有効なアプリページ（disabled でないもの）
  const appPages: MetadataRoute.Sitemap = apps
    .filter(app => !app.disabled)
    .map(app => ({
      url: `${SITE_URL}${app.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))

  // じみぷり 各プリント（動的ルート [printId]）
  // isImplemented 通過のものだけ sitemap に含める（未実装ページを除外）
  const printPages: MetadataRoute.Sitemap = ALL_PRINTS
    .filter(p => isImplemented(p))
    .map(p => ({
      url: `${SITE_URL}/jimipri/${p.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

  return [...staticPages, ...appPages, ...printPages]
}

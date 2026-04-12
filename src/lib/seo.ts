// ======================================================
// SEO ヘルパー
//
// apps.ts のデータから各アプリページ用の metadata を生成する。
// 使い方: 各 page.tsx の先頭に以下を追加するだけ：
//   export const metadata = getAppMetadata("app-id")
// ======================================================

import type { Metadata } from "next"
import { apps } from "@/data/apps"

// サイトのベースURL（本番環境）
const SITE_URL = "https://jimitas.com"

/**
 * アプリIDから metadata を生成する
 * apps.ts の title と description を使って、各ページ固有の
 * タイトル・説明文・OGPを自動設定する
 */
export function getAppMetadata(appId: string): Metadata {
  const app = apps.find(a => a.id === appId && !a.disabled)
  if (!app) return {}

  // 学年表示を作る（例: "1〜3年生"）
  const gradeNums = app.grades.filter((g) => typeof g === "number") as number[]
  const gradeStrs = app.grades.filter((g) => typeof g === "string") as string[]
  const gradeParts: string[] = []
  if (gradeNums.length > 0) {
    gradeParts.push(
      gradeNums.length === 1
        ? `${gradeNums[0]}年生`
        : `${gradeNums[0]}〜${gradeNums[gradeNums.length - 1]}年生`
    )
  }
  gradeParts.push(...gradeStrs)
  const gradeText = gradeParts.join("・")

  // 説明文にキーワードを補強
  const description = `${app.description}（${gradeText}向け・無料）`

  return {
    title: app.title,
    description,
    openGraph: {
      title: `${app.title} | Jimitas`,
      description,
      url: `${SITE_URL}${app.path}`,
      siteName: "Jimitas（ジミタス）",
      type: "website",
      locale: "ja_JP",
    },
  }
}

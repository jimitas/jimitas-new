// ======================================================
// SEO / AIO ヘルパー
//
// apps.ts のデータから各アプリページ用の metadata と
// JSON-LD 構造化データを生成する。
//
// 使い方: 各アプリの layout.tsx で以下のように使う：
//   export const metadata = getAppMetadata("app-id")
//   → Layout 内で <JsonLd appId="app-id" /> を配置
// ======================================================

import type { Metadata } from "next"
import { apps } from "@/data/apps"
import type { AppItem } from "@/types"

// サイトのベースURL（本番環境）
const SITE_URL = "https://jimitas.com"

/**
 * 学年表示テキストを生成する（例: "1〜3年生"）
 * getAppMetadata と getAppJsonLd で共通利用
 */
function buildGradeText(grades: AppItem["grades"]): string {
  const gradeNums = grades.filter((g) => typeof g === "number") as number[]
  const gradeStrs = grades.filter((g) => typeof g === "string") as string[]
  const gradeParts: string[] = []
  if (gradeNums.length > 0) {
    gradeParts.push(
      gradeNums.length === 1
        ? `${gradeNums[0]}年生`
        : `${gradeNums[0]}〜${gradeNums[gradeNums.length - 1]}年生`
    )
  }
  gradeParts.push(...gradeStrs)
  return gradeParts.join("・")
}

/**
 * アプリIDから metadata を生成する
 * apps.ts の title と description を使って、各ページ固有の
 * タイトル・説明文・OGPを自動設定する
 *
 * description の選択優先順:
 *   1. seoDescription があればそれを使う（長文・SEO向け）
 *   2. なければ description にフォールバック（カード用の短文）
 */
export function getAppMetadata(appId: string): Metadata {
  const app = apps.find(a => a.id === appId && !a.disabled)
  if (!app) return {}

  const gradeText = buildGradeText(app.grades)
  const baseText = app.seoDescription ?? app.description
  const description = `${baseText}（${gradeText}向け・無料）`

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

/**
 * アプリIDから JSON-LD 構造化データを生成する
 * Google・AI が「教育アプリ」と認識しやすくなる
 * EducationalApplication スキーマを使用
 */
export function getAppJsonLd(appId: string): object | null {
  const app = apps.find(a => a.id === appId && !a.disabled)
  if (!app) return null

  const gradeText = buildGradeText(app.grades)
  // seoDescription があればそれを使う（長文・SEO向け）。なければ description にフォールバック。
  const baseText = app.seoDescription ?? app.description

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": app.title,
    "description": `${baseText}（${gradeText}向け・無料）`,
    "url": `${SITE_URL}${app.path}`,
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY",
    },
    "inLanguage": "ja",
    "isAccessibleForFree": true,
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student",
      "description": `小学${gradeText}`,
    },
    "learningResourceType": app.type === "print" ? "教材プリント" : "インタラクティブ学習アプリ",
    "educationalLevel": gradeText,
    "keywords": [app.title, ...app.subjects, ...app.tags].join(", "),
    "provider": {
      "@type": "Organization",
      "name": "Jimitas（ジミタス）",
      "url": SITE_URL,
    },
  }
}

// ======================================================
// llms.txt 動的生成
//
// AIクローラー向けのサイト説明ファイル。
// robots.txt の AI 版のようなもので、LLM がサイトの概要と
// コンテンツ一覧を把握しやすくする。
// apps.ts のデータから自動生成するため、アプリ追加時に更新不要。
// ======================================================

import { apps } from "@/data/apps"

export function GET() {
  // 有効なアプリのみ（disabled 除外）
  const activeApps = apps.filter(app => !app.disabled)

  // 教科ごとにグループ化
  const bySubject = new Map<string, typeof activeApps>()
  for (const app of activeApps) {
    for (const subject of app.subjects) {
      const list = bySubject.get(subject) ?? []
      list.push(app)
      bySubject.set(subject, list)
    }
  }

  // 学年テキスト生成
  const gradeText = (grades: (number | string)[]) => {
    const nums = grades.filter((g) => typeof g === "number") as number[]
    const strs = grades.filter((g) => typeof g === "string") as string[]
    const parts: string[] = []
    if (nums.length > 0) {
      parts.push(
        nums.length === 1 ? `${nums[0]}年生` : `${nums[0]}〜${nums[nums.length - 1]}年生`
      )
    }
    parts.push(...strs)
    return parts.join("・")
  }

  // llms.txt 本文を組み立て
  const lines: string[] = [
    "# Jimitas（ジミタス）",
    "> 小学生向けの無料学習Webアプリポータル。「地味に助かる」がコンセプト。",
    "> 算数・国語・音楽・英語・社会・図工など40本超のアプリがブラウザだけで使える。",
    "> タブレット（iPad等）での利用を前提に設計。ログイン不要・広告なし。",
    "> URL: https://jimitas.com",
    "",
    "## 対象ユーザー",
    "- 小学1〜6年生の児童",
    "- 小学校の先生（授業支援ツール・教材作成）",
    "- 保護者（家庭学習のサポート）",
    "",
    "## 特徴",
    "- 全アプリ無料・登録不要",
    "- タブレットファースト設計（タッチ操作・ドラッグ&ドロップ対応）",
    "- 効果音・ゲーミフィケーション（コイン獲得）で楽しく学べる",
    "- プリント生成機能あり（漢字テスト・算数プリント）",
    "",
  ]

  // 教科ごとにアプリ一覧を出力
  for (const [subject, subjectApps] of bySubject) {
    lines.push(`## ${subject}`)
    for (const app of subjectApps) {
      lines.push(`- ${app.title}（${gradeText(app.grades)}）: ${app.description} → https://jimitas.com${app.path}`)
    }
    lines.push("")
  }

  const body = lines.join("\n")

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}

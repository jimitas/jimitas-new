// ======================================================
// トップページ
//
// 設計書の画面設計：
//   ┌──────────────────────┐
//   │  Jimitas             │
//   │  地味に助かる…       │
//   ├──────────────────────┤
//   │  １年生              │
//   │  [カード] [カード]…  │
//   ├──────────────────────┤
//   │  ２年生              │
//   │  [カード] [カード]…  │
//   ├──────────────────────┤
//   │  📄 教材作成         │
//   │  [じみぷり] …        │
//   └──────────────────────┘
//
// サーバーコンポーネントでOK（データ取得・表示のみ）。
// ======================================================

import GradeSection from "@/components/common/GradeSection"
import { apps } from "@/data/apps"
import { AppItem, Grade } from "@/types"

// -------------------------------------------------------
// セクションの定義
//
// トップページに表示するセクションの順番と
// 「どのアプリをそのセクションに入れるか」のルールを定義する。
// -------------------------------------------------------
type SectionDef = {
  /** セクションの表示タイトル */
  title: string
  /** このセクションに入れるアプリを判定する関数 */
  filter: (app: AppItem) => boolean
}

const SECTIONS: SectionDef[] = [
  // 学年別（1〜6年）
  // grades 配列に該当する学年が含まれているアプリを表示
  { title: "１年生",  filter: (app) => app.grades.includes(1 as Grade) },
  { title: "２年生",  filter: (app) => app.grades.includes(2 as Grade) },
  { title: "３年生",  filter: (app) => app.grades.includes(3 as Grade) },
  { title: "４年生",  filter: (app) => app.grades.includes(4 as Grade) },
  { title: "５年生",  filter: (app) => app.grades.includes(5 as Grade) },
  { title: "６年生",  filter: (app) => app.grades.includes(6 as Grade) },

  // 教科別（音楽・体育・その他）
  {
    title: "🎵 音楽・体育・その他",
    filter: (app) =>
      app.subjects.some((s) => ["音楽", "体育", "図工", "英語", "社会", "授業支援"].includes(s)),
  },

  // 先生向けツール
  {
    title: "🛠️ 先生向けツール",
    filter: (app) => app.grades.includes("先生向け"),
  },

  // 教材作成（print 種別）
  {
    title: "📄 教材作成",
    filter: (app) => app.type === "print",
  },
]

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ===== ページタイトルエリア ===== */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">Jimitas</h1>
        <p className="text-gray-500 text-sm">
          先生・子ども・保護者のための、地味に助かる学習コンテンツ
        </p>
      </div>

      {/* ===== 学年・グループ別セクション ===== */}
      {/*
        SECTIONS 配列をループして、各セクションを表示する。
        filter 関数で apps.ts の全アプリを絞り込み、
        該当するアプリだけを GradeSection に渡す。
      */}
      {SECTIONS.map((section) => (
        <GradeSection
          key={section.title}
          title={section.title}
          apps={apps.filter(section.filter)}
        />
      ))}

    </div>
  )
}

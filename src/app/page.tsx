// ======================================================
// トップページ
//
// 設計書の画面設計：
//   ┌──────────────────────┐
//   │  Jimitas             │
//   │  地味に助かる…       │
//   ├──────────────────────┤
//   │  １年生  (#grade-1)  │
//   │  [カード] [カード]…  │
//   ├──────────────────────┤
//   │  …（2〜6年生）       │
//   ├──────────────────────┤
//   │  どうぐばこ (#tools) │
//   │  [音楽] [体育] …     │
//   ├──────────────────────┤
//   │  📄 教材作成(#print) │
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
// id はヘッダーの学年ジャンプナビ（Header.tsx の NAV_ITEMS）と対応する。
//   Header の href="#grade-1" → <section id="grade-1"> にジャンプする
// -------------------------------------------------------
type SectionDef = {
  /** セクションの表示タイトル */
  title: string
  /** ページ内ジャンプ用ID（Header の NAV_ITEMS の href と対応） */
  id: string
  /** このセクションに入れるアプリを判定する関数 */
  filter: (app: AppItem) => boolean
}

const SECTIONS: SectionDef[] = [
  // 学年別（1〜6年）
  // type !== "print" で教材作成系アプリを学年セクションから除外する
  // （教材作成アプリは下の「📄 教材作成」セクションにのみ表示する）
  { id: "grade-1", title: "１年生", filter: (app) => app.grades.includes(1 as Grade) && app.type !== "print" },
  { id: "grade-2", title: "２年生", filter: (app) => app.grades.includes(2 as Grade) && app.type !== "print" },
  { id: "grade-3", title: "３年生", filter: (app) => app.grades.includes(3 as Grade) && app.type !== "print" },
  { id: "grade-4", title: "４年生", filter: (app) => app.grades.includes(4 as Grade) && app.type !== "print" },
  { id: "grade-5", title: "５年生", filter: (app) => app.grades.includes(5 as Grade) && app.type !== "print" },
  { id: "grade-6", title: "６年生", filter: (app) => app.grades.includes(6 as Grade) && app.type !== "print" },

  // 音楽・体育・その他：教科系アプリ＋先生向けツールをまとめる
  {
    id: "tools",
    title: "🎵 音楽・体育・その他",
    filter: (app) =>
      app.subjects.some((s) =>
        ["音楽", "体育", "図工", "英語", "社会", "授業支援"].includes(s)
      ) || app.grades.includes("先生向け"),
  },

  // 教材作成（print 種別のみ）
  {
    id: "print",
    title: "📄 教材作成",
    filter: (app) => app.type === "print",
  },
]

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ===== ページタイトルエリア ===== */}
      {/* ロゴはヘッダーに表示しているため、ここはシンプルなキャッチコピーのみ */}
      <div className="mb-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          先生・子ども・保護者のための、地味に助かる学習コンテンツ
        </p>
      </div>

      {/* ===== 学年・グループ別セクション ===== */}
      {/*
        SECTIONS 配列をループして各セクションを表示する。
        id を GradeSection に渡すことで <section id="grade-1"> が生成され、
        ヘッダーの学年ナビのアンカーリンクが機能する。
      */}
      {SECTIONS.map((section) => (
        <GradeSection
          key={section.id}
          id={section.id}
          title={section.title}
          apps={apps.filter(section.filter)}
        />
      ))}

    </div>
  )
}

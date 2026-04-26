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

import Link from "next/link"
import GradeSection from "@/components/common/GradeSection"
import { apps } from "@/data/apps"
import { AppItem, Grade } from "@/types"

// -------------------------------------------------------
// セクションの定義
//
// id はヘッダーの学年ジャンプナビ（Header.tsx の NAV_ITEMS）と対応する。
//   Header の href="#grade-1" → <section id="grade-1"> にジャンプする
//
// order: カードの表示順をアプリIDで明示指定する（省略時は apps.ts の並び順）。
//   リストにないIDは末尾に追加される。
// -------------------------------------------------------
type SectionDef = {
  /** セクションの表示タイトル */
  title: string
  /** ページ内ジャンプ用ID（Header の NAV_ITEMS の href と対応） */
  id: string
  /** このセクションに入れるアプリを判定する関数 */
  filter: (app: AppItem) => boolean
  /** カードの表示順（アプリIDの配列。省略時は apps.ts の並び順） */
  order?: string[]
}

// その学年に該当する数値が grades に含まれているか
const hasGrade = (app: AppItem, n: number) => app.grades.includes(n as Grade)
// 数値の学年（1〜6）が一つでも含まれているか
const hasAnyNumericGrade = (app: AppItem) =>
  app.grades.some((g) => typeof g === "number")

const SECTIONS: SectionDef[] = [
  // 学年別（1〜6年）
  // grades に該当学年の数値が含まれていれば、教科を問わずそのセクションに表示。
  // 例: リコーダー(grades:[3,4,5]) は3年・4年・5年に出る → 先生が学年から探しやすい
  // print 種別だけは「📄 教材作成」に分離する。
  {
    id: "grade-1",
    title: "１ねんせい",
    filter: (app) => hasGrade(app, 1) && app.type !== "print",
    order: [
      "suuzu-block", "kazoeyou", "ikutu",
      "tashizan-1", "tasu-renshu", "nanbanme",
      "hikizan-1", "hiku-renshu", "tokei",
      "kazoe-bou", "okane", "katakana",
      "sansu-note", "kenban-easy", "eawase", "masu-nuri",
    ],
  },
  {
    id: "grade-2",
    title: "２年生",
    filter: (app) => hasGrade(app, 2) && app.type !== "print",
    order: [
      "tokei", "kazoe-bou", "okane",
      "tashi-hissan", "hiki-hissan",
      "kuku-hyo", "kuku-array", "kuku-yomi",
      "sansu-note", "kenban", "masu-nuri",
    ],
  },
  {
    id: "grade-3",
    title: "３年生",
    filter: (app) => hasGrade(app, 3) && app.type !== "print",
    order: [
      // 3年のはじめに九九を復習する場面が多いため先頭に配置
      "kuku-hyo",
      "tashi-hissan", "hiki-hissan", "kuku-array",
      "kuku-yomi", "kake-hissan-1", "warizan",
      "warizan2", "kake-hissan2", "romaji",
      "recorder", "oto-dashiyo", "kyoto-ku",
    ],
  },
  {
    id: "grade-4",
    title: "４年生",
    filter: (app) => hasGrade(app, 4) && app.type !== "print",
    order: ["nihon-todouhuken"],
  },
  {
    id: "grade-5",
    title: "５年生",
    filter: (app) => hasGrade(app, 5) && app.type !== "print",
  },
  {
    id: "grade-6",
    title: "６年生",
    filter: (app) => hasGrade(app, 6) && app.type !== "print",
    order: ["waaon"],
  },

  // その他：数値学年（1〜6）に該当しないアプリをまとめる
  // 「全学年」「先生向け」「中学」「高校」など、特定学年に紐付かないものが対象。
  // これにより各アプリが学年セクションと重複表示されない。
  {
    id: "tools",
    title: "🎵 そのほか・先生向け",
    filter: (app) => app.type !== "print" && !hasAnyNumericGrade(app),
  },

  // 教材作成（print 種別、jimipri はバナーで別表示するので除外）
  {
    id: "print",
    title: "📄 教材作成",
    filter: (app) => app.type === "print" && app.id !== "jimipri",
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
      {SECTIONS.map((section) => {
        // フィルタ後のアプリ一覧（disabled なアプリは除外）
        const filtered = apps.filter(a => !a.disabled && section.filter(a))
        // order が指定されている場合はその順に並べ替える
        // order に含まれないアプリは末尾に追加される
        const sorted = section.order
          ? [...filtered].sort((a, b) => {
              const ai = section.order!.indexOf(a.id)
              const bi = section.order!.indexOf(b.id)
              if (ai === -1 && bi === -1) return 0
              if (ai === -1) return 1
              if (bi === -1) return -1
              return ai - bi
            })
          : filtered

        return (
          <div key={section.id}>
            <GradeSection
              id={section.id}
              title={section.title}
              apps={sorted}
            />
            {/* 「音楽・体育・その他」の直後にじみぷりバナーを挿入 */}
            {section.id === "tools" && (
              <section className="mb-10 scroll-mt-24">
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b-2 border-brand-400">
                  🖨️ じみぷり（算数プリント）
                </h2>
                <Link href="/jimipri">
                  <div className="
                    rounded-xl border-2 border-green-300 dark:border-green-700
                    bg-gradient-to-r from-green-50 to-emerald-50
                    dark:from-green-950 dark:to-emerald-950
                    p-4 hover:shadow-md hover:-translate-y-0.5
                    transition-all duration-150 cursor-pointer
                  ">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">📝</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                          じみぷり ― 地味に助かる学習プリント
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          たし算・ひき算・かけ算・わり算・分数など、1〜6年生の算数プリントを自動生成して印刷できます（全39種）
                        </p>
                        <div className="flex gap-2 mt-2">
                          {["1年", "2年", "3年", "4年", "5年", "6年"].map((g) => (
                            <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}
          </div>
        )
      })}

    </div>
  )
}

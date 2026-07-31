// ======================================================
// トップページ
//
// 画面設計：
//   ┌────────────────────────┐
//   │  Jimitas               │
//   │  地味に助かる…         │
//   ├────────────────────────┤
//   │  📄 教材作成  (#print) │  ← 先生向け。じみぷりを含む
//   │  [じみぷり] [漢字…]    │
//   ├────────────────────────┤
//   │  １年生    (#grade-1)  │
//   │  [カード] [カード]…    │
//   ├────────────────────────┤
//   │  …（2〜6年生）         │
//   ├────────────────────────┤
//   │  そのほか    (#tools)  │
//   │  [音楽] [体育] …       │
//   └────────────────────────┘
//
// 教材作成を最上部に置いているのは、プリントを探しに来る先生の導線を
// 最短にするため（じみぷりが最下部で埋もれて使われなかった経緯がある）。
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

// 学年セクション内のカード並び順（教科優先）
// 算数を主軸として、左上から右下に向かって、よく使う順に配置する
const SUBJECT_ORDER = [
  "算数", "国語", "英語", "音楽", "体育",
  "社会", "理科", "図工", "生活", "その他",
]
const subjectIndex = (app: AppItem) => {
  const i = SUBJECT_ORDER.indexOf(app.subjects[0])
  return i === -1 ? SUBJECT_ORDER.length : i
}

const SECTIONS: SectionDef[] = [
  // 教材作成（print 種別すべて。じみぷり・漢字テスト作成・漢字プリント作成）
  // 先生がプリントを探しに来る導線なので最上部に置く。
  // 並び順は下のソート規則（SUBJECT_ORDER）だけで
  // じみぷり(算数) → 漢字テスト・漢字プリント(国語) になるため order の指定は不要。
  {
    id: "print",
    title: "📄 教材作成（先生向け）",
    filter: (app) => app.type === "print",
  },

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
      "recorder", "recorder-play", "oto-dashiyo", "kyoto-ku",
    ],
  },
  {
    id: "grade-4",
    title: "４年生",
    filter: (app) => hasGrade(app, 4) && app.type !== "print",
    order: ["kake-hissan2", "wari-hissan", "shishagonyu", "nihon-todouhuken"],
  },
  {
    id: "grade-5",
    title: "５年生",
    filter: (app) => hasGrade(app, 5) && app.type !== "print",
    order: ["kake-hissan2", "wari-hissan"],
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
        // ソート規則:
        //   1. 教科優先（SUBJECT_ORDER）
        //   2. 同じ教科内では section.order を尊重（指定があれば）
        //   3. それ以外は apps.ts の並び順を維持
        const sorted = [...filtered].sort((a, b) => {
          // 1. 教科順
          const subDiff = subjectIndex(a) - subjectIndex(b)
          if (subDiff !== 0) return subDiff
          // 2. 同じ教科内では section.order が指定されていればそれを尊重
          if (section.order) {
            const ai = section.order.indexOf(a.id)
            const bi = section.order.indexOf(b.id)
            if (ai === -1 && bi === -1) return 0
            if (ai === -1) return 1
            if (bi === -1) return -1
            return ai - bi
          }
          return 0
        })

        return (
          <GradeSection
            key={section.id}
            id={section.id}
            title={section.title}
            apps={sorted}
          />
        )
      })}

    </div>
  )
}

// ======================================================
// GradeSection コンポーネント
//
// トップページの「学年別セクション」1つ分。
//
// 構造：
//   <GradeSection title="１年生" apps={...}>
//     ↓
//   【１年生】
//   [カード] [カード] [カード] ...
//
// AppCard を横に並べてグリッド表示する。
// ======================================================

import AppCard from "@/components/common/AppCard"
import { AppItem } from "@/types"

// このコンポーネントが受け取るデータの型
type Props = {
  /** セクションのタイトル（例：「１年生」「📄 教材作成」） */
  title: string
  /** このセクションに表示するアプリの配列 */
  apps: AppItem[]
  /**
   * ページ内ジャンプ用のID（省略可）
   * Header の学年ナビの href="#grade-1" などと対応させる
   */
  id?: string
}

export default function GradeSection({ title, apps, id }: Props) {
  // アプリが1件もない学年はセクション自体を表示しない
  if (apps.length === 0) return null

  return (
    // id をつけることでヘッダーのジャンプナビ（#grade-1 など）のリンク先になる
    <section id={id} className="mb-10 scroll-mt-24">
      {/* ===== セクションタイトル ===== */}
      {/* scroll-mt-24：ヘッダーが sticky のため、ジャンプ時に隠れないようオフセットを設ける */}
      <h2 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b-2 border-brand-400">
        {title}
      </h2>

      {/* ===== アプリカードのグリッド ===== */}
      {/* SP:2列 / タブレット:3列 / PC:4列 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {/* apps 配列をループしてカードを1枚ずつ表示する */}
        {apps.map((app) => (
          // key は React がリストの変化を検知するために必要な一意の値
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </section>
  )
}

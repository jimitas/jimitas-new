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
}

export default function GradeSection({ title, apps }: Props) {
  // アプリが1件もない学年はセクション自体を表示しない
  if (apps.length === 0) return null

  return (
    <section className="mb-10">
      {/* ===== セクションタイトル ===== */}
      <h2 className="text-base font-bold text-gray-700 mb-3 pb-2 border-b-2 border-orange-300">
        {title}
      </h2>

      {/* ===== アプリカードのグリッド ===== */}
      {/*
        grid-cols-2：スマホは2列
        sm:grid-cols-3：タブレットは3列
        lg:grid-cols-4：PCは4列
        gap-3：カード同士の隙間
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* apps 配列をループしてカードを1枚ずつ表示する */}
        {apps.map((app) => (
          // key は React がリストの変化を検知するために必要な一意の値
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </section>
  )
}

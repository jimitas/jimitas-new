// ======================================================
// AppCard コンポーネント
//
// トップページに並ぶ「アプリカード」1枚分。
// クリックするとそのアプリのページへ遷移する。
//
// 表示内容：
//   - 左端のカラーライン（種別を色で区別）
//   - タイトル
//   - 説明文（1行）
//
// アイコンは省略してコンパクトにし、
// 1画面により多くのアプリを表示できるようにしている。
// ======================================================

import Link from "next/link"
import { AppItem } from "@/types"

type Props = {
  app: AppItem
}

// 種別ごとの左端ラインの色と背景色を定義する
// アイコンの代わりに細いカラーラインで種別を表現する
const TYPE_CONFIG: Record<AppItem["type"], { line: string; bg: string; hover: string }> = {
  app:   { line: "bg-blue-400",   bg: "bg-white",      hover: "hover:bg-blue-50" },
  print: { line: "bg-green-400",  bg: "bg-white",      hover: "hover:bg-green-50" },
  tool:  { line: "bg-purple-400", bg: "bg-white",      hover: "hover:bg-purple-50" },
}

export default function AppCard({ app }: Props) {
  const config = TYPE_CONFIG[app.type]

  return (
    <Link href={app.path}>
      <div
        className={`
          ${config.bg} ${config.hover}
          border border-gray-200 rounded-lg
          flex items-stretch
          hover:shadow-sm hover:-translate-y-0.5
          transition-all duration-150 cursor-pointer
          h-full overflow-hidden
        `}
      >
        {/* ===== 左端のカラーライン（種別の色分け） ===== */}
        {/* w-1 で細く、h-full でカードの高さいっぱいに伸びる */}
        <div className={`${config.line} w-1 flex-shrink-0`} />

        {/* ===== テキストエリア ===== */}
        <div className="px-3 py-2 flex flex-col justify-center gap-0.5">
          {/* タイトル */}
          <h3 className="text-sm font-bold text-gray-800 leading-snug">
            {app.title}
          </h3>

          {/* 説明文（1行で収める）*/}
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-1">
            {app.description}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ======================================================
// AppCard コンポーネント
//
// トップページに並ぶ「アプリカード」1枚分。
// クリックするとそのアプリのページへ遷移する。
//
// 表示内容：
//   - アプリ種別アイコン（app / print / tool）
//   - タイトル
//   - 説明文
// ======================================================

import Link from "next/link"
import { AppItem } from "@/types"

// このコンポーネントが受け取るデータの型
// AppItem 型は src/types/index.ts で定義してある
type Props = {
  app: AppItem
}

// 種別ごとのアイコンと色を定義する
// Record<型A, 型B> は「型Aのキーに対して型Bの値を持つオブジェクト」という意味
const TYPE_CONFIG: Record<AppItem["type"], { icon: string; bg: string; border: string }> = {
  app:   { icon: "🎮", bg: "bg-blue-50",   border: "border-blue-200" },
  print: { icon: "📄", bg: "bg-green-50",  border: "border-green-200" },
  tool:  { icon: "🛠️", bg: "bg-purple-50", border: "border-purple-200" },
}

export default function AppCard({ app }: Props) {
  // この app の種別に対応するアイコンと色を取り出す
  const config = TYPE_CONFIG[app.type]

  return (
    // Link でカード全体をクリッカブルにする
    <Link href={app.path}>
      <div
        className={`
          ${config.bg} ${config.border}
          border rounded-xl p-4
          flex flex-col gap-2
          hover:shadow-md hover:-translate-y-0.5
          transition-all duration-150 cursor-pointer
          h-full
        `}
      >
        {/* ===== アイコン ===== */}
        <span className="text-2xl">{config.icon}</span>

        {/* ===== タイトル ===== */}
        <h3 className="text-sm font-bold text-gray-800 leading-snug">
          {app.title}
        </h3>

        {/* ===== 説明文（タブレット以上で表示） ===== */}
        <p className="hidden sm:block text-xs text-gray-500 leading-relaxed line-clamp-2">
          {app.description}
        </p>
      </div>
    </Link>
  )
}

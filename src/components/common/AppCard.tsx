// ======================================================
// AppCard コンポーネント
//
// トップページに並ぶ「アプリカード」1枚分。
// ダークモード対応のクラスを追加済み。
// ======================================================

import Link from "next/link"
import { AppItem } from "@/types"

type Props = {
  app: AppItem
}

// 種別ごとのカラーライン・背景・ホバー色（ライト＆ダーク両対応）
const TYPE_CONFIG: Record<AppItem["type"], { line: string; bg: string; hover: string }> = {
  app:   {
    line:  "bg-blue-400",
    bg:    "bg-white dark:bg-gray-800",
    hover: "hover:bg-blue-50 dark:hover:bg-gray-700",
  },
  print: {
    line:  "bg-green-400",
    bg:    "bg-white dark:bg-gray-800",
    hover: "hover:bg-green-50 dark:hover:bg-gray-700",
  },
  tool:  {
    line:  "bg-purple-400",
    bg:    "bg-white dark:bg-gray-800",
    hover: "hover:bg-purple-50 dark:hover:bg-gray-700",
  },
}

export default function AppCard({ app }: Props) {
  const config = TYPE_CONFIG[app.type]

  return (
    <Link href={app.path}>
      <div
        className={`
          ${config.bg} ${config.hover}
          border border-gray-200 dark:border-gray-700
          rounded-lg flex items-stretch
          hover:shadow-sm hover:-translate-y-0.5
          transition-all duration-150 cursor-pointer
          h-full overflow-hidden
        `}
      >
        {/* 左端のカラーライン */}
        <div className={`${config.line} w-1 flex-shrink-0`} />

        {/* テキストエリア */}
        <div className="px-3 py-2 flex flex-col justify-center gap-0.5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug">
            {app.title}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-1">
            {app.description}
          </p>
        </div>
      </div>
    </Link>
  )
}

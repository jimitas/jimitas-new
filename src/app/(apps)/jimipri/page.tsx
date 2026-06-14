// ======================================================
// じみぷり ポータルページ
//
// 39種の算数プリントを学年別に一覧表示する。
// 各プリントへのリンクカードを表示し、
// クリックで /jimipri/[printId] に遷移する。
//
// サーバーコンポーネント（状態管理不要）
// ======================================================

import Link from "next/link"
import { getGradeGroups, isImplemented } from "./_lib/prints"

// 学年ごとの背景色
const GRADE_COLORS: Record<number, string> = {
  1: "bg-pink-50 dark:bg-pink-950",
  2: "bg-orange-50 dark:bg-orange-950",
  3: "bg-yellow-50 dark:bg-yellow-950",
  4: "bg-green-50 dark:bg-green-950",
  5: "bg-blue-50 dark:bg-blue-950",
  6: "bg-purple-50 dark:bg-purple-950",
}

const GRADE_BORDER: Record<number, string> = {
  1: "border-pink-300 dark:border-pink-700",
  2: "border-orange-300 dark:border-orange-700",
  3: "border-yellow-300 dark:border-yellow-700",
  4: "border-green-300 dark:border-green-700",
  5: "border-blue-300 dark:border-blue-700",
  6: "border-purple-300 dark:border-purple-700",
}

const GRADE_TEXT: Record<number, string> = {
  1: "text-pink-700 dark:text-pink-300",
  2: "text-orange-700 dark:text-orange-300",
  3: "text-yellow-700 dark:text-yellow-300",
  4: "text-green-700 dark:text-green-300",
  5: "text-blue-700 dark:text-blue-300",
  6: "text-purple-700 dark:text-purple-300",
}

export default function JimipriPortalPage() {
  const gradeGroups = getGradeGroups()

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* タイトル */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          じみぷり
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          地味に助かる学習プリント ― 算数プリントを自動生成して印刷できます
        </p>
      </div>

      {/* 学年別セクション */}
      {gradeGroups.map((group) => (
        <section key={group.grade} className="mb-8">
          <h2 className={`text-lg font-bold mb-3 ${GRADE_TEXT[group.grade] || ""}`}>
            {group.label}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {group.prints.map((print) => {
              const implemented = isImplemented(print)
              // 未実装のプリントはリンクではなくdivで表示
              if (!implemented) {
                return (
                  <div
                    key={print.id}
                    className="block rounded-lg border p-3 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50"
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      No.{print.originalNumber}
                    </div>
                    <div className="font-bold text-sm leading-tight">
                      {print.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      準備中
                    </div>
                  </div>
                )
              }
              return (
                <Link
                  key={print.id}
                  href={`/jimipri/${print.id}`}
                  prefetch={false}
                  className={`
                    block rounded-lg border p-3 transition-shadow hover:shadow-md
                    ${GRADE_COLORS[print.grade] || ""} ${GRADE_BORDER[print.grade] || ""}
                  `}
                >
                  <div className="text-xs text-gray-400 mb-1">
                    No.{print.originalNumber}
                  </div>
                  <div className="font-bold text-sm leading-tight">
                    {print.title}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}

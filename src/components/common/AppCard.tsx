// ======================================================
// AppCard コンポーネント
//
// トップページに並ぶ「アプリカード」1枚分。
// ダークモード対応のクラスを追加済み。
// クリック時に効果音を再生する（ミュート中は無音）。
// ======================================================

"use client"

import Link from "next/link"
import { AppItem } from "@/types"
import { useSound, UI_SOUNDS } from "@/hooks/useSound"

type Props = {
  app: AppItem
}

// 教科ごとのカラーライン
// 算数=青 / 国語=赤 / 音楽=紫 / 英語=茶 / 体育=オレンジ
// 社会=黄 / 理科=エメラルド / 図工=ピンク / 生活=ライム / その他=緑
const SUBJECT_LINE: Record<string, string> = {
  "算数":   "bg-blue-400",
  "国語":   "bg-red-400",
  "音楽":   "bg-purple-400",
  "英語":   "bg-amber-700",
  "体育":   "bg-orange-400",
  "社会":   "bg-yellow-500",
  "理科":   "bg-emerald-500",
  "図工":   "bg-pink-400",
  "生活":   "bg-lime-500",
  "その他": "bg-green-500",
}

// 左端カラーラインの色を判定する
// 1. 中学・高校系の grades が含まれる → 黒系（小学校を逸脱するもの）
// 2. それ以外 → subjects[0] で教科色を決定（未定義の教科はグレーフォールバック）
//    「先生向け」も教科色を優先（例: sakusen-board は体育色オレンジ）
function getLineColor(app: AppItem): string {
  if (app.grades.some(g => g === "中学" || g === "高校")) return "bg-gray-800"
  return SUBJECT_LINE[app.subjects[0]] ?? "bg-gray-400"
}

export default function AppCard({ app }: Props) {
  const lineColor = getLineColor(app)
  const { play } = useSound()

  return (
    <Link href={app.path} onClick={() => play(UI_SOUNDS.card)}>
      <div
        className="
          bg-white dark:bg-gray-800
          hover:bg-gray-50 dark:hover:bg-gray-700
          border border-gray-200 dark:border-gray-700
          rounded-lg flex items-stretch
          hover:shadow-sm hover:-translate-y-0.5
          transition-all duration-150 cursor-pointer
          h-full overflow-hidden
        "
      >
        {/* 左端のカラーライン（教科で色分け） */}
        <div className={`${lineColor} w-1 shrink-0`} />

        {/* テキストエリア（タイトル位置を揃えるため上詰め） */}
        <div className="px-3 py-2 flex flex-col justify-start gap-0.5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug">
            {app.title}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2">
            {app.description}
          </p>
        </div>
      </div>
    </Link>
  )
}

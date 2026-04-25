"use client"

// ======================================================
// じみぷり 各プリントページ（動的ルート）
//
// /jimipri/[printId] で各プリントを表示する。
// 左: コントロールパネル（モード選択・もんだい・いんさつ）
// 右: A4プレビュー（印刷対象エリア）
//
// 問題生成は純粋関数で行い、stateで保持 → JSXで描画する。
// ======================================================

import { useParams } from "next/navigation"
import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { getPrintDef, isImplemented } from "../_lib/prints"
import type { OneLineResult } from "../_lib/types"

// 丸数字（①〜⑳）
const BANGOU = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"]

export default function JimipriPrintPage() {
  const params = useParams()
  const printId = params.printId as string
  const printDef = getPrintDef(printId)

  // 状態: モード選択と問題データ
  const [modeIndex, setModeIndex] = useState(0)
  const [data, setData] = useState<OneLineResult | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)

  // 問題を生成する関数
  const generateProblem = useCallback(() => {
    if (!printDef || !isImplemented(printDef)) return
    const result = printDef.generate(modeIndex)
    setData(result)
    setShowAnswers(false)
  }, [printDef, modeIndex])

  // 初回ロード時に問題を生成
  useEffect(() => {
    generateProblem()
  }, [generateProblem])

  // プリント定義が見つからない場合
  if (!printDef) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8 text-center">
        <h1 className="text-xl font-bold mb-4">プリントが見つかりません</h1>
        <Link href="/jimipri" className="text-brand-500 underline">
          じみぷりメニューへ戻る
        </Link>
      </main>
    )
  }

  // 未実装の場合
  if (!isImplemented(printDef)) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8 text-center">
        <h1 className="text-xl font-bold mb-4">{printDef.title}</h1>
        <p className="text-gray-500 mb-4">このプリントはまだ準備中です</p>
        <Link href="/jimipri" className="text-brand-500 underline">
          じみぷりメニューへ戻る
        </Link>
      </main>
    )
  }

  // 今日の日付
  const now = new Date()
  const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`

  return (
    <main className="min-h-screen flex flex-col px-4 py-4">

      {/* ===== コントロールパネル（印刷時非表示） ===== */}
      <div className="jimipri-no-print mb-4 flex flex-wrap items-center gap-2">
        {/* じみぷりメニューへ戻る */}
        <Link
          href="/jimipri"
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded text-sm font-bold hover:bg-gray-300"
        >
          じみぷりメニュー
        </Link>

        {/* モード選択（複数モードがある場合のみ表示） */}
        {printDef.modes.length > 1 && (
          <select
            value={modeIndex}
            onChange={(e) => {
              const idx = Number(e.target.value)
              setModeIndex(idx)
            }}
            className="px-2 py-2 border rounded text-sm bg-pink-100 dark:bg-pink-900"
          >
            {printDef.modes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        )}

        {/* もんだいボタン */}
        <button
          onClick={generateProblem}
          className="px-4 py-2 bg-brand-500 text-white rounded font-bold text-sm hover:bg-brand-600"
        >
          もんだい
        </button>

        {/* こたえ表示/非表示 */}
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className={`px-4 py-2 rounded font-bold text-sm ${
            showAnswers
              ? "bg-warm-500 text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          こたえ
        </button>

        {/* いんさつボタン */}
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-accent-500 text-white rounded font-bold text-sm hover:bg-accent-600"
        >
          いんさつ
        </button>
      </div>

      {/* ===== A4プレビュー ===== */}
      {/* @page を portrait に強制（このページだけ） */}
      <style>{`@page { size: A4 portrait; margin: 0mm; }`}</style>

      <div className="jimipri-print-wrapper mx-auto">
        <div className="jimipri-print-area">

          {/* ヘッダー: タイトル + 名前欄 */}
          <table className="w-full mb-2" style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td
                  className="border border-black px-2 py-1"
                  style={{ fontSize: "5mm" }}
                >
                  {printDef.originalNumber}　{printDef.title}
                </td>
                <td
                  className="border border-black px-2 py-1"
                  style={{ fontSize: "5mm", width: "50%" }}
                >
                  <ruby>名前<rp>(</rp><rt>なまえ</rt><rp>)</rp></ruby>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 問題テーブル（1行式: 10行×2列 = 20問） */}
          {data && printDef.displayType === "oneLine" && (
            <OneLineTable
              left={data.left}
              operator={printDef.operator}
              right={data.right}
            />
          )}

          {/* 答えエリア（こたえボタンON時のみ表示） */}
          {data && showAnswers && (
            <div className="mt-4">
              <AnswerArea answers={data.answers} />
            </div>
          )}

          {/* フッター */}
          <div
            className="absolute bottom-4 left-0 w-full px-4 text-right"
            style={{ fontSize: "3mm" }}
          >
            <span>{dateStr}　</span>
            <strong>じみぷり（地味に助かる学習プリント）</strong>
            　©jimitas.com
          </div>
        </div>
      </div>
    </main>
  )
}

// -------------------------------------------------------
// 1行式テーブル（10行×2列 = 20問）
// 元の oneLineFormulaCreate のReact版
// -------------------------------------------------------
function OneLineTable({
  left,
  operator,
  right,
}: {
  left: number[]
  operator: string
  right: number[]
}) {
  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <tbody>
        {Array.from({ length: 10 }, (_, row) => (
          <tr key={row}>
            {/* 左側の問題（①〜⑩） */}
            <td className="text-center" style={tdStyle("10mm", "20mm")}>{BANGOU[row]}</td>
            <td className="text-center" style={tdStyle("15mm", "20mm")}>{left[row]}</td>
            <td className="text-center" style={tdStyle("15mm", "20mm")}>{operator}</td>
            <td className="text-center" style={tdStyle("15mm", "20mm")}>{right[row]}</td>
            <td className="text-left" style={tdStyle("40mm", "20mm")}>=</td>
            {/* 右側の問題（⑪〜⑳） */}
            <td className="text-center" style={tdStyle("10mm", "20mm")}>{BANGOU[row + 10]}</td>
            <td className="text-center" style={tdStyle("15mm", "20mm")}>{left[row + 10]}</td>
            <td className="text-center" style={tdStyle("15mm", "20mm")}>{operator}</td>
            <td className="text-center" style={tdStyle("15mm", "20mm")}>{right[row + 10]}</td>
            <td className="text-left" style={tdStyle("40mm", "20mm")}>=</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// テーブルセルのインラインスタイル
function tdStyle(width: string, height: string): React.CSSProperties {
  return {
    width,
    height,
    fontSize: "10mm",
    lineHeight: height,
  }
}

// -------------------------------------------------------
// 答えエリア
// 元の answerCreate のReact版
// -------------------------------------------------------
function AnswerArea({ answers }: { answers: (number | string)[] }) {
  const cols = Math.floor(answers.length / 2 + 0.5)
  const widthPct = 100 / cols

  return (
    <div className="flex flex-wrap" style={{ fontSize: "4mm", borderTop: "dashed 1px black", paddingTop: "2mm" }}>
      {answers.map((ans, i) => (
        <div key={i} className="flex" style={{ width: `${widthPct}%` }}>
          {BANGOU[i]}　{ans}
        </div>
      ))}
    </div>
  )
}

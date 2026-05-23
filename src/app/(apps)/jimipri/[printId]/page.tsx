"use client"

// ======================================================
// じみぷり 各プリントページ（動的ルート）
//
// /jimipri/[printId] で各プリントを表示する。
// コントロールパネル（モード選択・もんだい・いんさつ）
// A4プレビュー（印刷対象エリア）
//
// 問題生成は純粋関数で行い、stateで保持 → JSXで描画する。
// 表示コンポーネントは _lib/components/ に分割済み。
// ======================================================

import { useParams } from "next/navigation"
import { useState, useCallback } from "react"
import Link from "next/link"
import { getPrintDef, isImplemented } from "../_lib/prints"
import type { OneLineResult, ThreeLineResult, CustomResult, NanjiResult, NanbanmeResult } from "../_lib/types"
import { playSe, set as seSet, pi as sePi } from "@/lib/se"

// 表示コンポーネント
import { OneLineTable } from "../_lib/components/OneLineTable"
import { ThreeLineTable } from "../_lib/components/ThreeLineTable"
import { ColumnCalcTable } from "../_lib/components/ColumnCalcTable"
import { DivisionTable } from "../_lib/components/DivisionTable"
import { DecimalCalcTable } from "../_lib/components/DecimalCalcTable"
import { CustomProblemDisplay } from "../_lib/components/CustomProblemDisplay"
import { AnswerArea } from "../_lib/components/AnswerArea"
import { NanbanmeDisplay } from "../_lib/components/NanbanmeDisplay"
import { NanjiDisplay } from "../_lib/components/NanjiDisplay"

// フォント定数
const FONT_KYOKASHO_BOLD   = '"UD Digi Kyokasho N-R", "UD デジタル 教科書体 N-R", "UD Digi Kyokasho NK-R", "UD デジタル 教科書体 NK-R", var(--font-biz-udp-gothic), sans-serif'
const FONT_KYOKASHO_NORMAL = '"UD Digi Kyokasho NK-R", "UD デジタル 教科書体 NK-R", "UD Digi Kyokasho N-R", "UD デジタル 教科書体 N-R", var(--font-biz-udp-gothic), sans-serif'
const FONT_MINCHO = 'var(--font-biz-ud-mincho), "BIZ UDMincho", "游明朝", "YuMincho", "ヒラギノ明朝 ProN W3", "Hiragino Mincho ProN", serif'
const FONT_GOTHIC = '"BIZ UDGothic", var(--font-biz-ud-gothic), "游ゴシック", "YuGothic", "メイリオ", "Meiryo", sans-serif'

// モード別演算記号（operatorが空のプリントで使用）
const MODE_OPERATORS: Record<string, Record<number, string>> = {
  "100made":    { 0: "+", 1: "-", 2: "+", 3: "-" },
  "hissan-1":   { 0: "+", 1: "+", 2: "-", 3: "-" },
  "hissan-2":   { 0: "+", 1: "+", 2: "-", 3: "-" },
  "shousu-kiso": { 0: "×", 1: "÷", 2: "×", 3: "÷" },
}

// shousu-kiso のモード別表示タイプ（モードによって表示形式が変わる特殊プリント）
const MODE_DISPLAY: Record<string, Record<number, string>> = {
  "shousu-kiso": { 0: "oneLine", 1: "oneLine", 2: "decimalColumn", 3: "division" },
}

export default function JimipriPrintPage() {
  const params = useParams()
  const printId = params.printId as string
  const printDef = getPrintDef(printId)

  // 状態: モード選択と問題データ
  const [modeIndex, setModeIndex] = useState(0)
  // 初期データは useState の初期値関数で生成（useEffect 不要）
  const [data, setData] = useState<OneLineResult | ThreeLineResult | CustomResult | NanjiResult | NanbanmeResult | null>(
    () => (printDef && isImplemented(printDef)) ? printDef.generate(0) : null
  )
  const [showAnswers, setShowAnswers] = useState(false)
  const [fontStyle, setFontStyle] = useState<"kyokasho" | "mincho" | "gothic">("kyokasho")
  const [isBold, setIsBold] = useState(true)

  // 問題を生成する関数（ボタン押下・モード変更時に呼ぶ）
  const generateProblem = useCallback((mode: number = modeIndex) => {
    if (!printDef || !isImplemented(printDef)) return
    const result = printDef.generate(mode)
    setData(result)
    setShowAnswers(false)
    playSe(seSet)
  }, [printDef, modeIndex])

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

  // 演算記号の決定（一部プリントはモードごとに記号が変わる）
  const modeOps = MODE_OPERATORS[printDef.id]
  const operator = modeOps
    ? modeOps[modeIndex] || "+"
    : printDef.operator

  // 表示タイプの決定（shousu-kiso はモードごとに変わる）
  const modeDisp = MODE_DISPLAY[printDef.id]
  const displayType = modeDisp
    ? modeDisp[modeIndex] || printDef.displayType
    : printDef.displayType

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
              generateProblem(idx)
            }}
            className="px-2 py-2 border rounded text-sm bg-pink-100 dark:bg-pink-900 w-[300px]"
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
          onClick={() => generateProblem()}
          className="px-4 py-2 bg-brand-500 text-white rounded font-bold text-sm hover:bg-brand-600"
        >
          もんだい
        </button>

        {/* こたえ表示/非表示 */}
        <button
          onClick={() => {
            setShowAnswers(!showAnswers)
            playSe(sePi)
          }}
          className={`px-4 py-2 rounded font-bold text-sm ${
            showAnswers
              ? "bg-warm-500 text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          こたえ
        </button>

        {/* 書体選択 */}
        <select
          value={fontStyle}
          onChange={e => setFontStyle(e.target.value as "kyokasho" | "mincho" | "gothic")}
          className="px-2 py-2 border rounded text-sm bg-white dark:bg-gray-800"
        >
          <option value="kyokasho">教科書体</option>
          <option value="mincho">UD明朝</option>
          <option value="gothic">UDゴシック</option>
        </select>

        {/* 太字切り替え */}
        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isBold}
            onChange={e => setIsBold(e.target.checked)}
            className="accent-warm-500"
          />
          太字
        </label>

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
        <div
          className="jimipri-print-area"
          style={{
            fontFamily:
              fontStyle === "gothic"   ? FONT_GOTHIC :
              fontStyle === "kyokasho" ? (isBold ? FONT_KYOKASHO_BOLD : FONT_KYOKASHO_NORMAL) :
              FONT_MINCHO,
            fontWeight: isBold ? "bold" : "normal",
          }}
        >

          {/* ヘッダー: タイトル + 名前欄（元: #title-header） */}
          <table className="w-full" style={{ borderCollapse: "collapse", marginBottom: "1rem" }}>
            <tbody>
              <tr>
                <td
                  style={{ border: "solid 1px black", fontSize: "6mm", height: "15mm", paddingLeft: "2mm" }}
                >
                  {printDef.originalNumber}　{printDef.title}
                </td>
                <td
                  style={{ border: "solid 1px black", fontSize: "6mm", height: "15mm", paddingLeft: "2mm", paddingTop: "15px", width: "50%" }}
                >
                  <ruby>名前<rp>(</rp><rt>なまえ</rt><rp>)</rp></ruby>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 問題テーブル（1行式: 10行×2列 = 20問） */}
          {data && displayType === "oneLine" && (
            <OneLineTable
              left={(data as OneLineResult).left}
              operator={operator}
              right={(data as OneLineResult).right}
            />
          )}

          {/* 問題テーブル（3つの数: 10行×1列 = 10問） */}
          {data && displayType === "threeLine" && (
            <ThreeLineTable data={data as ThreeLineResult} />
          )}

          {/* 問題テーブル（筆算: 3列×N行） */}
          {data && displayType === "column" && (
            <ColumnCalcTable
              left={(data as OneLineResult).left}
              right={(data as OneLineResult).right}
              operator={operator}
            />
          )}

          {/* 問題テーブル（わり算の筆算: 3列×3行） */}
          {data && displayType === "division" && (
            <DivisionTable
              left={(data as OneLineResult).left}
              right={(data as OneLineResult).right}
            />
          )}

          {/* 問題テーブル（小数の筆算: 3列×3行） */}
          {data && displayType === "decimalColumn" && (
            <DecimalCalcTable
              left={(data as OneLineResult).left}
              right={(data as OneLineResult).right}
              operator={operator}
            />
          )}

          {/* なんばんめ専用表示 */}
          {data && displayType === "custom" && printDef.id === "nanbanme" && (
            <NanbanmeDisplay data={data as NanbanmeResult} />
          )}

          {/* なんじ系専用表示（Canvas時計） */}
          {data && displayType === "custom" && (printDef.id === "nanji-1" || printDef.id === "nanji-2") && (
            <NanjiDisplay data={data as NanjiResult} />
          )}

          {/* 問題表示（カスタムテキスト形式、nanbanme/nanji以外） */}
          {data && displayType === "custom" && printDef.id !== "nanbanme" && printDef.id !== "nanji-1" && printDef.id !== "nanji-2" && (
            <CustomProblemDisplay data={data as CustomResult} printId={printDef.id} />
          )}

          {/* 答え+著作権エリア（A4下端に固定・print-area内に配置して font-family を継承） */}
          <section className="jimipri-footer-area" style={showAnswers ? undefined : { borderTop: "none" }}>
            {data && showAnswers && (
              "answerHtml" in data && data.answerHtml
                ? <div dangerouslySetInnerHTML={{ __html: data.answerHtml }} />
                : <AnswerArea answers={data.answers} />
            )}
            <div style={{ position: "absolute", height: "5mm", bottom: "2mm", right: "5mm", fontSize: "3mm" }}>
              <span>{dateStr}　</span>
              <strong>じみぷり（地味に助かる学習プリント）</strong>
              　©jimitas.com
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}

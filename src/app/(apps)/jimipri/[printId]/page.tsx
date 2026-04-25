"use client"

// ======================================================
// じみぷり 各プリントページ（動的ルート）
//
// /jimipri/[printId] で各プリントを表示する。
// コントロールパネル（モード選択・もんだい・いんさつ）
// A4プレビュー（印刷対象エリア）
//
// 問題生成は純粋関数で行い、stateで保持 → JSXで描画する。
// ======================================================

import { useParams } from "next/navigation"
import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { getPrintDef, isImplemented } from "../_lib/prints"
import type { OneLineResult, ThreeLineResult, CustomResult } from "../_lib/types"
import { playSe, set as seSet, pi as sePi } from "@/lib/se"

// 丸数字（①〜⑳）
const BANGOU = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"]

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
  const [data, setData] = useState<OneLineResult | ThreeLineResult | CustomResult | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)

  // 問題を生成する関数
  const generateProblem = useCallback(() => {
    if (!printDef || !isImplemented(printDef)) return
    const result = printDef.generate(modeIndex)
    setData(result)
    setShowAnswers(false)
    playSe(seSet)
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

          {/* 問題表示（カスタムテキスト形式） */}
          {data && displayType === "custom" && (
            <CustomProblemDisplay data={data as CustomResult} />
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

// -------------------------------------------------------
// 3つの数テーブル（10行×1列 = 10問）
// 元の oneLine3FormulaCreate のReact版
// -------------------------------------------------------
function ThreeLineTable({ data }: { data: ThreeLineResult }) {
  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <tbody>
        {Array.from({ length: 10 }, (_, row) => (
          <tr key={row}>
            <td className="text-center" style={tdStyle3("20mm", "22mm")}>{BANGOU[row]}</td>
            <td className="text-center" style={tdStyle3("12mm", "22mm")}>{data.left[row]}</td>
            <td className="text-center" style={tdStyle3("12mm", "22mm")}>{data.kigo1[row]}</td>
            <td className="text-center" style={tdStyle3("12mm", "22mm")}>{data.mid[row]}</td>
            <td className="text-center" style={tdStyle3("12mm", "22mm")}>{data.kigo2[row]}</td>
            <td className="text-center" style={tdStyle3("12mm", "22mm")}>{data.right[row]}</td>
            <td className="text-left" style={tdStyle3("60mm", "22mm")}>=</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// テーブルセルのインラインスタイル（1行式用）
function tdStyle(width: string, height: string): React.CSSProperties {
  return {
    width,
    height,
    fontSize: "10mm",
    lineHeight: height,
  }
}

// テーブルセルのインラインスタイル（3つの数用）
function tdStyle3(width: string, height: string): React.CSSProperties {
  return {
    width,
    height,
    fontSize: "10mm",
    lineHeight: height,
    textAlign: "center",
  }
}

// -------------------------------------------------------
// 筆算テーブル（3列×N行）
// 元の columnCalcCreate2Digit / columnCalcCreate3Digit のReact版
// 数値の桁数から自動で2桁/3桁レイアウトを判定する
// -------------------------------------------------------
function ColumnCalcTable({
  left,
  right,
  operator,
}: {
  left: number[]
  right: number[]
  operator: string
}) {
  const total = left.length
  const cols = 3
  const rows = Math.ceil(total / cols)

  // 最大桁数を判定（上の数が3桁以上なら3桁レイアウト）
  const maxDigits = Math.max(...left) >= 100 ? 3 : 2

  // 行の高さ調整（行数が少ないほど余白を大きく）
  const answerHeight = rows <= 3 ? "38mm" : rows <= 4 ? "20mm" : "10mm"

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <tbody>
        {Array.from({ length: rows }, (_, row) =>
          // 各問題は4行で構成: 空行、上の数、下の数（演算記号+下線）、答え記入欄
          [0, 1, 2, 3].map((subRow) => (
            <tr key={`${row}-${subRow}`}>
              {Array.from({ length: cols }, (_, col) => {
                const idx = row * cols + col
                if (idx >= total) {
                  // 問題数に満たない場合は空セル
                  return maxDigits === 3
                    ? [0, 1, 2, 3, 4].map(c => <td key={c} style={colStyle(maxDigits)} />)
                    : [0, 1, 2, 3].map(c => <td key={c} style={colStyle(maxDigits)} />)
                }

                const a = left[idx]
                const b = right[idx]

                if (maxDigits === 3) {
                  return renderColumn3Digit(subRow, idx, a, b, operator, answerHeight)
                } else {
                  return renderColumn2Digit(subRow, idx, a, b, operator, answerHeight)
                }
              })}
            </tr>
          ))
        ).flat()}
      </tbody>
    </table>
  )
}

// 2桁筆算の1問分のセルを描画（番号、十の位、一の位、余白）
function renderColumn2Digit(
  subRow: number, idx: number, a: number, b: number,
  operator: string, answerHeight: string
) {
  const cellW = "18mm"
  const cellH = "10mm"
  const fontSize = "11mm"

  switch (subRow) {
    case 0: // 空行
      return [
        <td key={`${idx}-0-0`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-1`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-2`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-3`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 1: // 番号 + 上の数
      return [
        <td key={`${idx}-1-0`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>{BANGOU[idx]}</td>,
        <td key={`${idx}-1-1`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>
          {Math.floor(a / 10) !== 0 ? Math.floor(a / 10) : ""}
        </td>,
        <td key={`${idx}-1-2`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>{a % 10}</td>,
        <td key={`${idx}-1-3`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 2: // 演算記号 + 下の数 + 下線
      return [
        <td key={`${idx}-2-0`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>{operator}</td>,
        <td key={`${idx}-2-1`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>
          {Math.floor(b / 10) !== 0 ? Math.floor(b / 10) : ""}
        </td>,
        <td key={`${idx}-2-2`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>{b % 10}</td>,
        <td key={`${idx}-2-3`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 3: // 答え記入欄
      return [
        <td key={`${idx}-3-0`} style={{ ...colCellStyle(cellW, answerHeight, fontSize) }} />,
        <td key={`${idx}-3-1`} style={{ ...colCellStyle(cellW, answerHeight, fontSize) }} />,
        <td key={`${idx}-3-2`} style={{ ...colCellStyle(cellW, answerHeight, fontSize) }} />,
        <td key={`${idx}-3-3`} style={{ ...colCellStyle("40mm", answerHeight, fontSize) }} />,
      ]
    default:
      return null
  }
}

// 3桁筆算の1問分のセルを描画（番号、百の位、十の位、一の位、余白）
function renderColumn3Digit(
  subRow: number, idx: number, a: number, b: number,
  operator: string, answerHeight: string
) {
  const cellW = "16mm"
  const cellH = "10mm"
  const fontSize = "11mm"

  switch (subRow) {
    case 0: // 空行
      return [
        <td key={`${idx}-0-0`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-1`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-2`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-3`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-4`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 1: // 番号 + 上の数
      return [
        <td key={`${idx}-1-0`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>{BANGOU[idx]}</td>,
        <td key={`${idx}-1-1`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>
          {Math.floor(a / 100) !== 0 ? Math.floor(a / 100) : ""}
        </td>,
        <td key={`${idx}-1-2`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>{Math.floor((a % 100) / 10)}</td>,
        <td key={`${idx}-1-3`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>{a % 10}</td>,
        <td key={`${idx}-1-4`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 2: // 演算記号 + 下の数 + 下線
      return [
        <td key={`${idx}-2-0`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>{operator}</td>,
        <td key={`${idx}-2-1`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>
          {/* 下の数が3桁の場合: 百の位 / 2桁の場合: 空 */}
          {b >= 100 ? Math.floor(b / 100) : ""}
        </td>,
        <td key={`${idx}-2-2`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>
          {Math.floor(b / 10) % 10 !== 0 || b >= 100 ? Math.floor(b / 10) % 10 : ""}
          {/* 2桁の場合は十の位、0でなければ表示 */}
        </td>,
        <td key={`${idx}-2-3`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>{b % 10}</td>,
        <td key={`${idx}-2-4`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 3: // 答え記入欄
      return [
        <td key={`${idx}-3-0`} style={{ ...colCellStyle(cellW, answerHeight, fontSize) }} />,
        <td key={`${idx}-3-1`} style={{ ...colCellStyle(cellW, answerHeight, fontSize) }} />,
        <td key={`${idx}-3-2`} style={{ ...colCellStyle(cellW, answerHeight, fontSize) }} />,
        <td key={`${idx}-3-3`} style={{ ...colCellStyle(cellW, answerHeight, fontSize) }} />,
        <td key={`${idx}-3-4`} style={{ ...colCellStyle("40mm", answerHeight, fontSize) }} />,
      ]
    default:
      return null
  }
}

// 筆算セルの共通スタイル
function colCellStyle(width: string, height: string, fontSize: string): React.CSSProperties {
  return {
    width,
    height,
    lineHeight: height,
    fontSize,
    textAlign: "center",
  }
}

// 空セルスタイル（桁数で変える）
function colStyle(maxDigits: number): React.CSSProperties {
  return {
    width: maxDigits === 3 ? "16mm" : "18mm",
    height: "10mm",
  }
}

// -------------------------------------------------------
// わり算筆算テーブル（3列×3行 = 9問）
// 元の columnCalcCreateDivision のReact版
// レイアウト: 番号行 → 除数 ) 被除数（上に横線） → 余白行
// -------------------------------------------------------
function DivisionTable({
  left,
  right,
}: {
  left: number[]
  right: number[]
}) {
  const total = left.length
  const cols = 3
  const rows = Math.ceil(total / cols)
  const answerHeight = rows <= 3 ? "45mm" : "30mm"

  return (
    <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "10mm" }}>
      <tbody>
        {Array.from({ length: rows }, (_, row) =>
          // 各問題は3行: 番号+答え記入線、除数)被除数、余白
          [0, 1, 2].map((subRow) => (
            <tr key={`${row}-${subRow}`}>
              {Array.from({ length: cols }, (_, col) => {
                const idx = row * cols + col
                if (idx >= total) {
                  return [0, 1, 2, 3, 4].map(c =>
                    <td key={c} style={{ width: "10mm", height: "10mm" }} />
                  )
                }

                const a = left[idx]  // 被除数
                const b = right[idx] // 除数
                const divCellW = "10mm"
                const divCellH = "10mm"
                const fontSize = "10mm"

                switch (subRow) {
                  case 0: // 番号 + 答え書く線（被除数の上）
                    return [
                      <td key={`${idx}-0-0`} style={{ width: divCellW, height: divCellH, fontSize }}>{BANGOU[idx]}</td>,
                      <td key={`${idx}-0-1`} style={{ width: divCellW, height: divCellH, fontSize }} />,
                      <td key={`${idx}-0-2`} style={{ width: "16px", height: divCellH, fontSize }} />,
                      <td key={`${idx}-0-3`} style={{ width: divCellW, height: divCellH, fontSize, borderBottom: "solid 3px black" }} />,
                      <td key={`${idx}-0-4`} style={{ width: "40mm", height: divCellH, fontSize }} />,
                    ]
                  case 1: // 除数 ) 被除数
                    return [
                      <td key={`${idx}-1-0`} style={{ width: divCellW, height: divCellH, fontSize }} />,
                      <td key={`${idx}-1-1`} style={{ width: divCellW, height: divCellH, fontSize, textAlign: "center" }}>{b}</td>,
                      <td key={`${idx}-1-2`} style={{ width: "16px", height: divCellH, fontSize, textAlign: "right", borderTop: "solid 3px black" }}>{")"}</td>,
                      <td key={`${idx}-1-3`} style={{
                        width: divCellW, height: divCellH, fontSize,
                        letterSpacing: a > 999 ? "8px" : (!Number.isInteger(a) ? "0px" : "16px"),
                      }}>{a}</td>,
                      <td key={`${idx}-1-4`} style={{ width: "40mm", height: divCellH, fontSize }} />,
                    ]
                  case 2: // 余白（筆算計算スペース）
                    return [
                      <td key={`${idx}-2-0`} style={{ width: divCellW, height: answerHeight }} />,
                      <td key={`${idx}-2-1`} style={{ width: divCellW, height: answerHeight }} />,
                      <td key={`${idx}-2-2`} style={{ width: "16px", height: answerHeight }} />,
                      <td key={`${idx}-2-3`} style={{ width: divCellW, height: answerHeight }} />,
                      <td key={`${idx}-2-4`} style={{ width: "40mm", height: answerHeight }} />,
                    ]
                  default:
                    return null
                }
              })}
            </tr>
          ))
        ).flat()}
      </tbody>
    </table>
  )
}

// -------------------------------------------------------
// 小数筆算テーブル（3列×3行 = 9問）
// 元の columnCalcCreateDecimals のReact版
// 小数点を含む数の筆算表示
// -------------------------------------------------------
function DecimalCalcTable({
  left,
  right,
  operator,
}: {
  left: number[]
  right: number[]
  operator: string
}) {
  const total = left.length
  const cols = 3
  const rows = Math.ceil(total / cols)
  const answerHeight = rows <= 3 ? "38mm" : "20mm"
  const cellW = "16mm"
  const cellH = "10mm"
  const fontSize = "11mm"

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <tbody>
        {Array.from({ length: rows }, (_, row) =>
          [0, 1, 2, 3].map((subRow) => (
            <tr key={`${row}-${subRow}`}>
              {Array.from({ length: cols }, (_, col) => {
                const idx = row * cols + col
                if (idx >= total) {
                  return [0, 1, 2, 3, 4].map(c =>
                    <td key={c} style={{ width: cellW, height: cellH }} />
                  )
                }

                const a = left[idx]
                const b = right[idx]

                // 数値を小数点区切りで分解する関数
                const splitDecimal = (n: number) => {
                  if (Number.isInteger(n)) {
                    return { whole: Math.floor(n / 10), dot: "", frac: String(n % 10) }
                  }
                  const whole = Math.floor(n)
                  const frac = Math.floor((n * 10) % 10)
                  return { whole: String(whole), dot: ".", frac: String(frac) }
                }

                const aStr = splitDecimal(a)
                const bStr = splitDecimal(b)

                switch (subRow) {
                  case 0: // 空行
                    return [0, 1, 2, 3, 4].map(c =>
                      <td key={`${idx}-0-${c}`} style={{ width: c === 4 ? "30mm" : cellW, height: cellH, fontSize, textAlign: "center" }} />
                    )
                  case 1: // 番号 + 上の数
                    return [
                      <td key={`${idx}-1-0`} style={{ width: cellW, height: cellH, fontSize, textAlign: "center" }}>{BANGOU[idx]}</td>,
                      <td key={`${idx}-1-1`} style={{ width: cellW, height: cellH, fontSize, textAlign: "right" }}>{aStr.whole}</td>,
                      <td key={`${idx}-1-2`} style={{ width: "0", height: cellH, fontSize: "8mm", textAlign: "center", padding: 0 }}>{aStr.dot}</td>,
                      <td key={`${idx}-1-3`} style={{ width: cellW, height: cellH, fontSize, textAlign: "left" }}>{aStr.frac}</td>,
                      <td key={`${idx}-1-4`} style={{ width: "30mm", height: cellH, fontSize }} />,
                    ]
                  case 2: // 演算記号 + 下の数 + 下線
                    return [
                      <td key={`${idx}-2-0`} style={{ width: cellW, height: cellH, fontSize, textAlign: "center", borderBottom: "solid 1px black" }}>{operator}</td>,
                      <td key={`${idx}-2-1`} style={{ width: cellW, height: cellH, fontSize, textAlign: "right", borderBottom: "solid 1px black" }}>{bStr.whole}</td>,
                      <td key={`${idx}-2-2`} style={{ width: "0", height: cellH, fontSize: "8mm", textAlign: "center", padding: 0, borderBottom: "solid 1px black" }}>{bStr.dot}</td>,
                      <td key={`${idx}-2-3`} style={{ width: cellW, height: cellH, fontSize, textAlign: "left", borderBottom: "solid 1px black" }}>{bStr.frac}</td>,
                      <td key={`${idx}-2-4`} style={{ width: "30mm", height: cellH, fontSize }} />,
                    ]
                  case 3: // 答え記入欄
                    return [0, 1, 2, 3, 4].map(c =>
                      <td key={`${idx}-3-${c}`} style={{ width: c === 4 ? "30mm" : cellW, height: answerHeight }} />
                    )
                  default:
                    return null
                }
              })}
            </tr>
          ))
        ).flat()}
      </tbody>
    </table>
  )
}

// -------------------------------------------------------
// カスタムテキスト問題表示
// 文章題・穴埋め・単位変換などテキスト形式の問題を表示
// problems配列の各要素を改行(\n)で分割して描画する
// -------------------------------------------------------
function CustomProblemDisplay({ data }: { data: CustomResult }) {
  // HTMLタグを含む問題（分数表示など）はdangerouslySetInnerHTMLで描画
  // 全問題テキストは内部生成のため安全
  return (
    <div style={{ fontSize: "5mm", lineHeight: "9mm" }}>
      {data.problems.map((text, i) => {
        const hasHtml = text.includes("<")
        if (hasHtml) {
          return (
            <div
              key={i}
              style={{ marginBottom: "3mm" }}
              dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, "<br/>") }}
            />
          )
        }
        return (
          <div key={i} style={{ marginBottom: "3mm" }}>
            {text.split("\n").map((line, j) => (
              <span key={j}>
                {line}
                {j < text.split("\n").length - 1 && <br />}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
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

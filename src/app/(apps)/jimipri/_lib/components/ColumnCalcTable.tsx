// 筆算テーブル（3列×N行）
// 元の columnCalcCreate2Digit / columnCalcCreate3Digit のReact版
// 数値の桁数から自動で2桁/3桁レイアウトを判定する

import { BANGOU } from "../constants"

// 筆算セルの共通スタイル
function colCellStyle(width: string, height: string, fontSize: string): React.CSSProperties {
  return { width, height, lineHeight: height, fontSize, textAlign: "center" }
}

// 空セルスタイル（桁数で変える）
function colStyle(maxDigits: number): React.CSSProperties {
  return { width: maxDigits === 3 ? "16mm" : "18mm", height: "10mm" }
}

export function ColumnCalcTable({
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
  const maxDigits = Math.max(...left) >= 100 ? 3 : 2
  const answerHeight = rows <= 3 ? "38mm" : rows <= 4 ? "20mm" : "10mm"

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <tbody>
        {Array.from({ length: rows }, (_, row) =>
          [0, 1, 2, 3].map((subRow) => (
            <tr key={`${row}-${subRow}`}>
              {Array.from({ length: cols }, (_, col) => {
                const idx = row * cols + col
                if (idx >= total) {
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

// 2桁筆算の1問分のセルを描画
function renderColumn2Digit(
  subRow: number, idx: number, a: number, b: number,
  operator: string, answerHeight: string
) {
  const cellW = "18mm"
  const cellH = "10mm"
  const fontSize = "11mm"

  switch (subRow) {
    case 0:
      return [
        <td key={`${idx}-0-0`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-1`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-2`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-3`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 1:
      return [
        <td key={`${idx}-1-0`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>{BANGOU[idx]}</td>,
        <td key={`${idx}-1-1`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>
          {Math.floor(a / 10) !== 0 ? Math.floor(a / 10) : ""}
        </td>,
        <td key={`${idx}-1-2`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>{a % 10}</td>,
        <td key={`${idx}-1-3`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 2:
      return [
        <td key={`${idx}-2-0`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>{operator}</td>,
        <td key={`${idx}-2-1`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>
          {Math.floor(b / 10) !== 0 ? Math.floor(b / 10) : ""}
        </td>,
        <td key={`${idx}-2-2`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>{b % 10}</td>,
        <td key={`${idx}-2-3`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 3:
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

// 3桁筆算の1問分のセルを描画
function renderColumn3Digit(
  subRow: number, idx: number, a: number, b: number,
  operator: string, answerHeight: string
) {
  const cellW = "16mm"
  const cellH = "10mm"
  const fontSize = "11mm"

  switch (subRow) {
    case 0:
      return [
        <td key={`${idx}-0-0`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-1`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-2`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-3`} style={{ ...colCellStyle(cellW, cellH, fontSize) }} />,
        <td key={`${idx}-0-4`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 1:
      return [
        <td key={`${idx}-1-0`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>{BANGOU[idx]}</td>,
        <td key={`${idx}-1-1`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>
          {Math.floor(a / 100) !== 0 ? Math.floor(a / 100) : ""}
        </td>,
        <td key={`${idx}-1-2`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>{Math.floor((a % 100) / 10)}</td>,
        <td key={`${idx}-1-3`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center" }}>{a % 10}</td>,
        <td key={`${idx}-1-4`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 2:
      return [
        <td key={`${idx}-2-0`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>{operator}</td>,
        <td key={`${idx}-2-1`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>
          {b >= 100 ? Math.floor(b / 100) : ""}
        </td>,
        <td key={`${idx}-2-2`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>
          {Math.floor(b / 10) % 10 !== 0 || b >= 100 ? Math.floor(b / 10) % 10 : ""}
        </td>,
        <td key={`${idx}-2-3`} style={{ ...colCellStyle(cellW, cellH, fontSize), textAlign: "center", borderBottom: "solid 1px black" }}>{b % 10}</td>,
        <td key={`${idx}-2-4`} style={{ ...colCellStyle("40mm", cellH, fontSize) }} />,
      ]
    case 3:
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

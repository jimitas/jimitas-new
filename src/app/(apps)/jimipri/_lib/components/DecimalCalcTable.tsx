// 小数筆算テーブル（3列×3行 = 9問）
// 元の columnCalcCreateDecimals のReact版

import { BANGOU } from "../constants"

export function DecimalCalcTable({
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
                  case 0:
                    return [0, 1, 2, 3, 4].map(c =>
                      <td key={`${idx}-0-${c}`} style={{ width: c === 4 ? "30mm" : cellW, height: cellH, fontSize, textAlign: "center" }} />
                    )
                  case 1:
                    return [
                      <td key={`${idx}-1-0`} style={{ width: cellW, height: cellH, fontSize, textAlign: "center" }}>{BANGOU[idx]}</td>,
                      <td key={`${idx}-1-1`} style={{ width: cellW, height: cellH, fontSize, textAlign: "right" }}>{aStr.whole}</td>,
                      <td key={`${idx}-1-2`} style={{ width: "0", height: cellH, fontSize: "8mm", textAlign: "center", padding: 0 }}>{aStr.dot}</td>,
                      <td key={`${idx}-1-3`} style={{ width: cellW, height: cellH, fontSize, textAlign: "left" }}>{aStr.frac}</td>,
                      <td key={`${idx}-1-4`} style={{ width: "30mm", height: cellH, fontSize }} />,
                    ]
                  case 2:
                    return [
                      <td key={`${idx}-2-0`} style={{ width: cellW, height: cellH, fontSize, textAlign: "center", borderBottom: "solid 1px black" }}>{operator}</td>,
                      <td key={`${idx}-2-1`} style={{ width: cellW, height: cellH, fontSize, textAlign: "right", borderBottom: "solid 1px black" }}>{bStr.whole}</td>,
                      <td key={`${idx}-2-2`} style={{ width: "0", height: cellH, fontSize: "8mm", textAlign: "center", padding: 0, borderBottom: "solid 1px black" }}>{bStr.dot}</td>,
                      <td key={`${idx}-2-3`} style={{ width: cellW, height: cellH, fontSize, textAlign: "left", borderBottom: "solid 1px black" }}>{bStr.frac}</td>,
                      <td key={`${idx}-2-4`} style={{ width: "30mm", height: cellH, fontSize }} />,
                    ]
                  case 3:
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

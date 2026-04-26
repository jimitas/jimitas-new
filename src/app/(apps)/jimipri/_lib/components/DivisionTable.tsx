// わり算筆算テーブル（3列×3行 = 9問）
// 元の columnCalcCreateDivision のReact版

import { BANGOU } from "../constants"

export function DivisionTable({
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
          [0, 1, 2].map((subRow) => (
            <tr key={`${row}-${subRow}`}>
              {Array.from({ length: cols }, (_, col) => {
                const idx = row * cols + col
                if (idx >= total) {
                  return [0, 1, 2, 3, 4].map(c =>
                    <td key={c} style={{ width: "10mm", height: "10mm" }} />
                  )
                }

                const a = left[idx]
                const b = right[idx]
                const divCellW = "10mm"
                const divCellH = "10mm"
                const fontSize = "10mm"

                switch (subRow) {
                  case 0:
                    return [
                      <td key={`${idx}-0-0`} style={{ width: divCellW, height: divCellH, fontSize }}>{BANGOU[idx]}</td>,
                      <td key={`${idx}-0-1`} style={{ width: divCellW, height: divCellH, fontSize }} />,
                      <td key={`${idx}-0-2`} style={{ width: "16px", height: divCellH, fontSize }} />,
                      <td key={`${idx}-0-3`} style={{ width: divCellW, height: divCellH, fontSize, borderBottom: "solid 3px black" }} />,
                      <td key={`${idx}-0-4`} style={{ width: "40mm", height: divCellH, fontSize }} />,
                    ]
                  case 1:
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
                  case 2:
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

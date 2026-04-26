// 3つの数テーブル（10行×1列 = 10問）
// 元の oneLine3FormulaCreate のReact版

import type { ThreeLineResult } from "../types"
import { BANGOU } from "../constants"

// テーブルセルのインラインスタイル
function tdStyle3(width: string, height: string): React.CSSProperties {
  return { width, height, fontSize: "10mm", lineHeight: height, textAlign: "center" }
}

export function ThreeLineTable({ data }: { data: ThreeLineResult }) {
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

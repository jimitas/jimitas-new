// カスタムテキスト問題表示
// 文章題・穴埋め・単位変換などテキスト形式の問題を表示
// problems配列の各要素を改行(\n)で分割して描画する

import type { CustomResult } from "../types"

// 問題固有のスタイル設定（元のJSで TBL.style.xxx や インラインで設定されていた値）
const CUSTOM_STYLES: Record<string, React.CSSProperties> = {
  // 元: TBL.style.lineHeight = "1.6"; TBL.style.fontSize = "18px";
  "hirei":       { fontSize: "18px", lineHeight: "1.6" },
  // 元: TBL.style.lineHeight = "1.7"; TBL.style.fontSize = "18px";
  "mojitoshiki": { fontSize: "18px", lineHeight: "1.7" },
  // 元: <div class="h4" style="line-height:36px;"> (Bootstrap .h4 = 1.5rem = 24px)
  "1000made":    { fontSize: "24px", lineHeight: "36px" },
  // 元: <div class="h4" style="line-height:34px;">
  "10000made":   { fontSize: "24px", lineHeight: "34px" },
  // 元: <h5 style="width:18cm;"> (Bootstrap .h5 = 1.25rem = 20px)
  "hayasa":      { fontSize: "20px", width: "18cm" },
  "taiseki":     { fontSize: "20px", width: "18cm" },
  "taniryou":    { fontSize: "20px", width: "18cm" },
}

export function CustomProblemDisplay({ data, printId }: { data: CustomResult; printId: string }) {
  const customStyle = CUSTOM_STYLES[printId]
  return (
    <div style={customStyle || { fontSize: "5mm", lineHeight: "9mm" }}>
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

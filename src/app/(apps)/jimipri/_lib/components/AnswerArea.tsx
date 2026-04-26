// 答えエリア（元: answerCreate のReact版）
//
// cols = ceil(問題数/2)
// 各答えを div(display:flex, width: 100/cols %) で配置
// → 均等幅で2行に並ぶ（例: 20問なら10列×2行）
//
// answerCreate() を使わないプリントは answerHtml を使い、
// この AnswerArea は呼ばれない。

import { BANGOU } from "../constants"

export function AnswerArea({ answers }: { answers: (number | string)[] }) {
  const cols = Math.ceil(answers.length / 2)
  const widthPct = 100 / cols

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {answers.map((ans, i) => {
        const text = `${BANGOU[i]}　${ans}`
        const hasHtml = typeof ans === "string" && ans.includes("<")
        return hasHtml ? (
          <div
            key={i}
            style={{ display: "flex", width: `${widthPct}%` }}
            dangerouslySetInnerHTML={{ __html: text }}
          />
        ) : (
          <div key={i} style={{ display: "flex", width: `${widthPct}%` }}>
            {text}
          </div>
        )
      })}
    </div>
  )
}

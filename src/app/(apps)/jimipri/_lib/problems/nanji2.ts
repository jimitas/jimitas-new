// なんじ　なんぷん
// 元: 09_nanji2.js
// 6問: 時計の読み取り（分単位、SVG時計版）
// tokei アプリの描画ロジックを SVG に変換して印刷対応

import { CustomResult } from "../types"
import { clockSvg } from "../clockSvg"

export function generateNanji2(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  const BANGOU = ["①", "②", "③", "④", "⑤", "⑥"]
  const usedTimes: string[] = []

  problems.push(`つぎの　じこくを　こたえましょう。`)

  for (let i = 0; i < 6; i++) {
    let hour: number, minute: number, timeKey: string

    // 重複しない時刻を生成（5分刻み）
    do {
      hour = Math.floor(Math.random() * 12 + 1)
      minute = Math.floor(Math.random() * 12) * 5 // 0,5,10,...,55
      timeKey = `${hour}:${minute}`
    } while (usedTimes.includes(timeKey))
    usedTimes.push(timeKey)

    // 時計SVGを生成
    const clock = clockSvg(hour, minute, 28)

    problems.push(`<div style="display:flex;align-items:center;gap:8px;margin:2mm 0;">${BANGOU[i]}　${clock}　（　　じ　　ふん）</div>`)
    answers.push(`${hour}じ${minute}ふん`)
  }

  return { problems, answers }
}

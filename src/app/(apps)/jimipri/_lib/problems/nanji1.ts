// なんじ　なんじはん
// 元: 04_nanji1.js
// 6問: 時計の読み取り（SVG時計版）
// tokei アプリの描画ロジックを SVG に変換して印刷対応

import { CustomResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"
import { clockSvg } from "../clockSvg"

export function generateNanji1(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  const BANGOU = ["①", "②", "③", "④", "⑤", "⑥"]
  const checkArray: number[] = []

  problems.push(`つぎの　じこくを　こたえましょう。`)

  for (let i = 0; i < 6; i++) {
    let hour: number
    do {
      hour = Math.floor(Math.random() * 12 + 1)
    } while (!duplicationCheck(hour, checkArray))
    checkArray.push(hour)

    // なんじはん: 半分の確率で「〇時」か「〇時はん（30分）」
    const isHalf = Math.random() < 0.5
    const minute = isHalf ? 30 : 0

    // 時計SVGを生成
    const clock = clockSvg(hour, minute, 28)

    problems.push(`<div style="display:flex;align-items:center;gap:8px;margin:2mm 0;">${BANGOU[i]}　${clock}　（　　じ　　ふん）</div>`)

    if (isHalf) {
      answers.push(`${hour}じ30ぷん（${hour}じはん）`)
    } else {
      answers.push(`${hour}じ`)
    }
  }

  return { problems, answers }
}

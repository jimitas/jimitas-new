// なんじ　なんじはん
// 元: 04_nanji1.js
// 6問: 時計の読み取り（テキスト版）
// 元はCanvasで時計を描画していたが、プリント版はテキストで出題

import { CustomResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

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

    // なんじはん: 半分の確率で「〇時」か「〇時はん（半）」
    const isHalf = Math.random() < 0.5

    if (isHalf) {
      // 短針は hour と hour+1 の間、長針は6（下）
      problems.push(`${BANGOU[i]}　みじかいはりが　${hour}と${hour === 12 ? 1 : hour + 1}のあいだ、\n　　ながいはりが　6をさしています。\n　　　　　　　（　　じ　　ふん）`)
      answers.push(`${hour}じ30ぷん（${hour}じはん）`)
    } else {
      // 短針は hour、長針は12（上）
      problems.push(`${BANGOU[i]}　みじかいはりが　${hour}、\n　　ながいはりが　12をさしています。\n　　　　　　　（　　じ）`)
      answers.push(`${hour}じ`)
    }
  }

  return { problems, answers }
}

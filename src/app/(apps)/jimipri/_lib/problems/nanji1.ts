// なんじ　なんじはん
// 元: 04_nanji1.js
// 6問: 時計の読み取り（Canvas時計版）
// tokei アプリと同じ Canvas 描画で時計を表示

import { NanjiResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"
import { BANGOU } from "../constants"

export function generateNanji1(): NanjiResult {
  const problems: string[] = []
  const answers: (number | string)[] = []
  const clocks: { hour: number; minute: number }[] = []

  const checkArray: number[] = []

  // 元の nanji-1 にはタイトル行がない（プリントタイトルはヘッダーに表示）

  for (let i = 0; i < 6; i++) {
    let hour: number
    do {
      hour = Math.floor(Math.random() * 12 + 1)
    } while (!duplicationCheck(hour, checkArray))
    checkArray.push(hour)

    // なんじはん: 半分の確率で「〇時」か「〇時はん（30分）」
    const isHalf = Math.random() < 0.5
    const minute = isHalf ? 30 : 0

    clocks.push({ hour, minute })
    // 問題テキスト（時計画像はページ側で Canvas 描画）
    // 元: <div class="clock_answer_text">  じ　　　　</div>
    problems.push(`${BANGOU[i]}　じ　　　　`)

    if (isHalf) {
      answers.push(`${hour}じ30ぷん（${hour}じはん）`)
    } else {
      answers.push(`${hour}じ`)
    }
  }

  return { problems, answers, clocks }
}

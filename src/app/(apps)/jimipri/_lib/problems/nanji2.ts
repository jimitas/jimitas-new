// なんじ　なんぷん
// 元: 09_nanji2.js
// 6問: 時計の読み取り（分単位、Canvas時計版）
// tokei アプリと同じ Canvas 描画で時計を表示

import { NanjiResult } from "../types"

const BANGOU = ["①", "②", "③", "④", "⑤", "⑥"]

export function generateNanji2(): NanjiResult {
  const problems: string[] = []
  const answers: (number | string)[] = []
  const clocks: { hour: number; minute: number }[] = []

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

    clocks.push({ hour, minute })
    // 元: <div class="clock_answer_text">  　　じ　　ふん</div>
    problems.push(`${BANGOU[i]}　　　じ　　ふん`)
    answers.push(`${hour}じ${minute}ふん`)
  }

  return { problems, answers, clocks }
}

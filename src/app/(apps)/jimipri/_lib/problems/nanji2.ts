// なんじ　なんぷん
// 元: 09_nanji2.js
// 6問: 時計の読み取り（分単位、テキスト版）
// 元はCanvasで時計を描画していたが、プリント版はテキストで出題

import { CustomResult } from "../types"

export function generateNanji2(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  const BANGOU = ["①", "②", "③", "④", "⑤", "⑥"]
  const usedTimes: string[] = []

  problems.push(`つぎの　じこくを　こたえましょう。`)

  for (let i = 0; i < 6; i++) {
    let hour: number, minute: number, timeKey: string

    // 重複しない時刻を生成
    do {
      hour = Math.floor(Math.random() * 12 + 1)
      minute = Math.floor(Math.random() * 12) * 5 // 0,5,10,...,55
      timeKey = `${hour}:${minute}`
    } while (usedTimes.includes(timeKey))
    usedTimes.push(timeKey)

    // 長針の位置を数字で表現
    const longHandPos = minute === 0 ? 12 : minute / 5

    if (minute === 0) {
      problems.push(`${BANGOU[i]}　みじかいはりが　${hour}、\n　　ながいはりが　12をさしています。\n　　　　　　　（　　じ　　ふん）`)
    } else {
      // 短針の位置表現（分が30以上なら次の時間に近い）
      const nextHour = hour === 12 ? 1 : hour + 1
      if (minute >= 30) {
        problems.push(`${BANGOU[i]}　みじかいはりが　${hour}と${nextHour}のあいだで${nextHour}にちかく、\n　　ながいはりが　${longHandPos}をさしています。\n　　　　　　　（　　じ　　ふん）`)
      } else if (minute > 0) {
        problems.push(`${BANGOU[i]}　みじかいはりが　${hour}と${nextHour}のあいだで${hour}にちかく、\n　　ながいはりが　${longHandPos}をさしています。\n　　　　　　　（　　じ　　ふん）`)
      }
    }

    answers.push(`${hour}じ${minute}ふん`)
  }

  return { problems, answers }
}

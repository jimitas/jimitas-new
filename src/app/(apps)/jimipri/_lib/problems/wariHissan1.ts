// 1けたでわるわり算の筆算
// 元: 25_wari_hissan1.js
// Mode 0: 2けた÷1けた（9問）
// Mode 1: 3けた÷1けた（9問）
// 答えは割り切れない場合 "商あまりR" 形式

import { OneLineResult } from "../types"

export function generateWariHissan1(modeIndex: number): OneLineResult {
  const left: number[] = []   // わられる数（被除数）
  const right: number[] = []  // わる数（除数）
  const answers: (number | string)[] = []

  for (let i = 0; i < 9; i++) {
    let a: number, b: number

    switch (modeIndex) {
      case 0: // 2けた÷1けた
        a = Math.floor(Math.random() * 50 + 50) // 50〜99
        b = Math.floor(Math.random() * 8 + 2)   // 2〜9
        break
      case 1: // 3けた÷1けた
        b = Math.floor(Math.random() * 8 + 2)
        a = Math.floor(Math.random() * 80 * (b - 1) + 100)
        break
      default:
        a = 50; b = 2
    }

    const ans = a % b === 0
      ? Math.floor(a / b)
      : `${Math.floor(a / b)}あまり${a % b}`

    left.push(a)
    right.push(b)
    answers.push(ans)
  }
  return { left, right, answers }
}

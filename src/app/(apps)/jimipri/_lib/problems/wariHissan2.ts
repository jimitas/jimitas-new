// 2けたでわるわり算の筆算
// 元: 26_wari_hissan2.js
// Mode 0: 2けた÷2けた（9問）
// Mode 1: 3けた÷2けた（9問）
// Mode 2: 4けた÷2けた（9問）

import { OneLineResult } from "../types"

export function generateWariHissan2(modeIndex: number): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: (number | string)[] = []

  for (let i = 0; i < 9; i++) {
    let a: number, b: number

    switch (modeIndex) {
      case 0: // 2けた÷2けた
        a = Math.floor(Math.random() * 50 + 50)
        b = Math.floor((Math.random() * a) / 2 + 10)
        break
      case 1: // 3けた÷2けた
        a = Math.floor(Math.random() * 899 + 100)
        b = Math.floor(Math.random() * 89 + 10)
        break
      case 2: // 4けた÷2けた
        b = Math.floor(Math.random() * 49 + 50)
        a = Math.floor(Math.random() * b * 80 + 1000)
        break
      default:
        a = 50; b = 10
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

// 100までのかずのけいさん
// 元: 11_100made.js
// Mode 0: 〇0+〇0（10の位どうしのたし算）
// Mode 1: 〇0-〇0（10の位どうしのひき算）
// Mode 2: 〇〇+〇（1の位のたし算、くり上がりなし）
// Mode 3: 〇〇-〇（1の位のひき算、くり下がりなし）

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateHyakuMade(modeIndex: number): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  // モードごとの演算記号は prints.ts の operator で管理できないため
  // ここでは answers だけ返す（operator は page.tsx で動的に扱う）
  while (checkArray.length < 20) {
    let a: number, b: number, ans: number

    switch (modeIndex) {
      case 0: // 〇0+〇0
        a = Math.floor(Math.random() * 9) * 10 + 10           // 10,20,...,90
        b = Math.floor((Math.random() * (100 - a)) / 10) * 10 + 10 // a+b<=100
        ans = a + b
        break
      case 1: // 〇0-〇0
        a = Math.floor(Math.random() * 8) * 10 + 20           // 20,30,...,90
        b = Math.floor(Math.random() * ((a - 10) / 10)) * 10 + 10
        ans = a - b
        break
      case 2: // 〇〇+〇（くり上がりなし）
        a = Math.floor(Math.random() * 8) * 10 + 10 + Math.floor(Math.random() * 8 + 1) // 11〜88, 1の位1〜8
        b = Math.floor(Math.random() * (9 - (a % 10)) + 1)
        ans = a + b
        break
      case 3: // 〇〇-〇（くり下がりなし）
        a = Math.floor(Math.random() * 9) * 10 + 10 + Math.floor(Math.random() * 8 + 2) // 12〜99, 1の位2〜9
        b = Math.floor(Math.random() * (a % 10) + 1)
        ans = a - b
        break
      default:
        a = 10; b = 10; ans = 20
    }

    const check = a * 100 + b
    if (duplicationCheck(check, checkArray)) {
      checkArray.push(check)
      left.push(a)
      right.push(b)
      answers.push(ans)
    }
  }
  return { left, right, answers }
}

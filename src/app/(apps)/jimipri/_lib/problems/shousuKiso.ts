// 小数のかけ算やわり算（基礎）
// 元: 27_shousu_kakewari_kiso.js
// Mode 0: 小数×1けた（oneLine 20問）
// Mode 1: 小数÷1けた（oneLine 20問）
// Mode 2: 小数×2けた（decimal column 9問）
// Mode 3: 小数÷2けた（division 9問）

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateShousuKiso(modeIndex: number): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: (number | string)[] = []
  const checkArray: number[] = []

  // Mode 0-1: 20問、Mode 2-3: 9問
  const total = modeIndex <= 1 ? 20 : 9

  while (checkArray.length < total) {
    let a: number, b: number, ans: number | string

    switch (modeIndex) {
      case 0: { // 小数×1けた
        const c = Math.floor(Math.random() * 9)
        const d = Math.floor(Math.random() * 9 + 1)
        a = (c * 10 + d) / 10
        b = Math.floor(Math.random() * 9 + 1)
        const result = a * b
        ans = Number.isInteger(result) ? result : Number(result.toFixed(1))
        break
      }
      case 1: { // 小数÷1けた
        b = Math.floor(Math.random() * 8 + 2)
        const quotient = Math.floor(Math.random() * 8 + 2) / 10
        a = Number((b * quotient).toFixed(1))
        if (Number.isInteger(a)) a = a + b / 10
        ans = quotient
        break
      }
      case 2: { // 小数×2けた
        const c = Math.floor(Math.random() * 9)
        const d = Math.floor(Math.random() * 9 + 1)
        a = (c * 10 + d) / 10
        b = Math.floor(Math.random() * 89 + 10)
        const result = a * b
        ans = Number.isInteger(result) ? result : Number(result.toFixed(1))
        break
      }
      case 3: { // 小数÷2けた（商とあまり）
        a = Math.floor(Math.random() * 399 + 500) / 10
        b = Math.floor((Math.random() * (a - 11)) / 2 + 11)
        if (Number.isInteger(a)) a = a + b / 10
        const remainder = a % b
        const fixedRemainder = Number.isInteger(remainder) ? remainder : Number(remainder.toFixed(1))
        if (fixedRemainder === 0) {
          ans = Math.floor(a / b)
        } else {
          ans = `${Math.floor(a / b)}あまり${fixedRemainder}`
        }
        break
      }
      default:
        a = 1; b = 1; ans = 1
    }

    const check = Number((a * 100 + b).toFixed(0))
    if (duplicationCheck(check, checkArray)) {
      checkArray.push(check)
      left.push(a)
      right.push(b)
      answers.push(ans)
    }
  }
  return { left, right, answers }
}

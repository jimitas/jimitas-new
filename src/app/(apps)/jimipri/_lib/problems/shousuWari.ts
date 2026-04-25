// 小数のわり算
// 元: 31_shousu_warizan.js
// Mode 0: 割り切れるまで（division 9問）
// Mode 1: 四捨五入（division 9問）
// Mode 2: 商とあまり（division 9問）

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateShousuWari(modeIndex: number): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: (number | string)[] = []
  const checkArray: number[] = []

  // 9問生成（division表示は3行×3列）
  while (checkArray.length < 9) {
    let a: number, b: number, ans: number | string

    switch (modeIndex) {
      case 0: { // 割り切れるまで
        b = Math.floor(Math.random() * 99) / 10
        if (Number.isInteger(b)) b = b + 0.1
        const q = Math.floor(Math.random() * 99) / 10
        a = Math.floor(b * q * 100 * 1.0001) / 100
        ans = q
        break
      }
      case 1: { // 四捨五入
        a = Math.floor(Math.random() * 899 + 100) / 100
        b = Math.floor(Math.random() * 89 + 10) / 10
        if (Number.isInteger(b)) b = b + 0.1
        ans = Math.round((a / b) * 10) / 10
        break
      }
      case 2: { // 商とあまり
        a = Math.floor(Math.random() * 399 + 500) / 10
        b = Math.floor((Math.random() * (a - 11)) / 2 + 11) / 10
        if (Number.isInteger(b)) b = b + 0.1
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
        a = 1; b = 0.1; ans = 10
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

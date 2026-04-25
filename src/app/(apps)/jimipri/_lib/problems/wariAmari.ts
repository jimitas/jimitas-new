// あまりのあるわり算
// 元: 22_wari_amari.js
// ans（2〜9）× b（2〜9）+ amari（1〜b-1）= a
// 答えは "商…あまり" 形式

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateWariAmari(): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: (number | string)[] = []
  const checkArray: number[] = []

  while (checkArray.length < 20) {
    const ans = Math.floor(Math.random() * 8 + 2) // 商: 2〜9
    const b = Math.floor(Math.random() * 8 + 2)   // 割る数: 2〜9
    const amari = Math.floor(Math.random() * (b - 1) + 1) // あまり: 1〜(b-1)
    const a = ans * b + amari

    const check = a * 100 + b
    if (duplicationCheck(check, checkArray)) {
      checkArray.push(check)
      left.push(a)
      right.push(b)
      answers.push(`${ans}…${amari}`)
    }
  }
  return { left, right, answers }
}

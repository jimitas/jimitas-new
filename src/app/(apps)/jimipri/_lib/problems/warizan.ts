// わり算のれんしゅう
// 元: 20_warizan.js
// ans（2〜9）× b（2〜9）= a → a ÷ b = ans

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateWarizan(): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 20) {
    const ans = Math.floor(Math.random() * 8 + 2) // 2〜9
    const b = Math.floor(Math.random() * 8 + 2) // 2〜9
    const a = ans * b // 割り切れる数になる

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

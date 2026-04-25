// かけ算（2〜5の段）
// 元: 16_kake1.js
// a（2〜5）× b（1〜9）のかけ算を20問生成する

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateKake1(): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 20) {
    const a = Math.floor(Math.random() * 4 + 2) // 2〜5
    const b = Math.floor(Math.random() * 9 + 1) // 1〜9
    const ans = a * b

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

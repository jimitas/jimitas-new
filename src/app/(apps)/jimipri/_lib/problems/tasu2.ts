// 20までのたしざん
// 元: 06_tasu_2.js
// くり上がりのあるたし算（答えが10超え）を20問生成する

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateTasu2(): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 20) {
    const a = Math.floor(Math.random() * 8 + 2) // 2〜9
    const b = Math.floor(Math.random() * a + (8 - a) + 2) // a+bが10超えになる範囲
    const ans = a + b

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

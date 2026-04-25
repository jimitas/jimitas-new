// 10までのひきざん
// 元: 03_hiku_1.js
// a（2〜10）からb（1〜a-1）を引くひき算を20問生成する

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateHiku1(): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 20) {
    const a = Math.floor(Math.random() * 9 + 2) // 2〜10
    const b = Math.floor(Math.random() * (a - 1) + 1) // 1〜(a-1)
    const ans = a - b

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

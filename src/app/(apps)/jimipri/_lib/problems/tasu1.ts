// 10までのたしざん
// 元: 02_tasu_1.js
// 答えが2〜10になるたし算を20問生成する

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateTasu1(): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 20) {
    // 答え（ans）を先に決めて、それをa+bに分解する
    const ans = Math.floor(Math.random() * 9 + 2) // 2〜10
    const a = Math.floor(Math.random() * (ans - 1) + 1) // 1〜(ans-1)
    const b = ans - a

    const check = a * 100 + b // 重複チェック用のユニークキー
    if (duplicationCheck(check, checkArray)) {
      checkArray.push(check)
      left.push(a)
      right.push(b)
      answers.push(ans)
    }
  }
  return { left, right, answers }
}

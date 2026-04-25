// くりさがりありのひきざん
// 元: 07_hiku_2.js
// モード0: くりさがりあり（11〜19 - b、答えが一の位をまたぐ）
// モード1: 1□-□（11〜19 - 1〜(a-11)、くりさがりなし）

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateHiku2(modeIndex: number = 0): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 20) {
    let a: number, b: number

    switch (modeIndex) {
      case 0: {
        // くりさがりあり: a=11〜19, bはくりさがりが発生する値
        a = Math.floor(Math.random() * 9 + 11) // 11〜19
        const ichi = 20 - a // a の一の位の補数
        b = Math.floor(Math.random() * ichi + (10 - ichi))
        break
      }
      case 1:
        // 1□-□: a=11〜19, b=1〜(a-11) でくりさがりなし
        a = Math.floor(Math.random() * 9 + 11) // 11〜19
        b = Math.floor(Math.random() * (a - 11) + 1)
        break
      default:
        a = 11
        b = 1
    }
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

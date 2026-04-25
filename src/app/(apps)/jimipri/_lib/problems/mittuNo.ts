// 3つのかずのけいさん
// 元: 05_3tuno.js
// Mode 0: 〇+〇+〇
// Mode 1: 〇-〇-〇
// Mode 2: +と-のまじった
// 10問（1列）、各問に3つの数と2つの記号がある

import { ThreeLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateMittuNo(modeIndex: number): ThreeLineResult {
  const left: number[] = []
  const mid: number[] = []
  const right: number[] = []
  const kigo1: string[] = []
  const kigo2: string[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 10) {
    let a: number, b: number, c: number
    let k1: string, k2: string
    let ans: number

    switch (modeIndex) {
      case 0: // 〇+〇+〇
        a = Math.floor(Math.random() * 9 + 1)
        b = Math.floor(Math.random() * 9 + 1)
        c = Math.floor(Math.random() * Math.min(20 - (a + b), 9) + 1)
        ans = a + b + c
        k1 = "+"; k2 = "+"
        break
      case 1: // 〇-〇-〇
        a = Math.floor(Math.random() * 14 + 5) // 5〜18
        b = Math.floor(Math.random() * Math.min(a - 2, 9) + 1)
        c = Math.floor(Math.random() * Math.min(a - b - 1, 9) + 1)
        ans = a - b - c
        k1 = "-"; k2 = "-"
        break
      case 2: { // +と-のまじった
        const mode = Math.floor(Math.random() * 2 + 1)
        if (mode === 1) {
          a = Math.floor(Math.random() * 9 + 1)
          b = Math.floor(Math.random() * 9 + 1)
          c = Math.floor(Math.random() * (a + b - 1) + 1)
          ans = a + b - c
          k1 = "+"; k2 = "-"
        } else {
          a = Math.floor(Math.random() * 14 + 5)
          b = Math.floor(Math.random() * Math.min(a, 9) + 1)
          c = Math.floor(Math.random() * Math.min(20 - (a - b), 9) + 1)
          ans = a - b + c
          k1 = "-"; k2 = "+"
        }
        break
      }
      default:
        a = 1; b = 1; c = 1; ans = 3; k1 = "+"; k2 = "+"
    }

    const check = a * 100 + b * 10 + c
    if (duplicationCheck(check, checkArray)) {
      checkArray.push(check)
      left.push(a)
      mid.push(b)
      right.push(c)
      kigo1.push(k1)
      kigo2.push(k2)
      answers.push(ans)
    }
  }
  return { left, kigo1, mid, kigo2, right, answers }
}

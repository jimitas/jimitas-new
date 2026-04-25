// たし算とひき算のひっ算（１）― 2けた
// 元: 13_tasu_hiku_hissan1.js
// Mode 0: +くり上がりなし
// Mode 1: +くり上がりあり
// Mode 2: -くりさがりなし
// Mode 3: -くりさがりあり
// 15問（5行×3列）

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateHissan1(modeIndex: number): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 15) {
    let a: number, b: number, ans: number

    switch (modeIndex) {
      case 0: { // +くり上がりなし
        const a1 = Math.floor(Math.random() * 8 + 1)
        const b1 = Math.floor(Math.random() * (9 - a1) + 1)
        const a2 = Math.floor(Math.random() * 9 + 1)
        const b2 = Math.floor(Math.random() * (9 - a2))
        a = a1 * 10 + a2
        b = b1 * 10 + b2
        ans = a + b
        break
      }
      case 1: { // +くり上がりあり
        const a1 = Math.floor(Math.random() * 7 + 1)
        const b1 = Math.floor(Math.random() * (7 - a1) + 1)
        const a2 = Math.floor(Math.random() * 8 + 2)
        const b2 = Math.floor(Math.random() * a2 + (8 - a2) + 2)
        a = a1 * 10 + a2
        b = b1 * 10 + b2
        ans = a + b
        break
      }
      case 2: // -くりさがりなし
        a = Math.floor(Math.random() * 4 + 5) * 10 + Math.floor(Math.random() * 4 + 5)
        b = Math.floor(Math.random() * 4 + 1) * 10 + Math.floor(Math.random() * 4 + 1)
        ans = a - b
        break
      case 3: // -くりさがりあり
        a = Math.floor(Math.random() * 4 + 5) * 10 + Math.floor(Math.random() * 4 + 1)
        b = Math.floor(Math.random() * 4 + 1) * 10 + Math.floor(Math.random() * 4 + 5)
        ans = a - b
        break
      default:
        a = 10; b = 10; ans = 20
    }

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

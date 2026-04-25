// たし算とひき算のひっ算（２）― 3けた
// 元: 15_tasu_hiku_hissan2.js
// Mode 0: 100をこえるたし算（2けた表示）
// Mode 1: 99+99まで（2けた表示）
// Mode 2: 100をこえるひき算（3けた表示）
// Mode 3: 1○○-○○（3けた表示）
// 15問（5行×3列）

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateHissan2(modeIndex: number): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 15) {
    let a: number, b: number, ans: number

    switch (modeIndex) {
      case 0: { // 100をこえるたし算
        const total = Math.floor(Math.random() * 10 + 100) // 100〜109
        b = Math.floor(Math.random() * (total - 20) + 10)
        a = total - b
        ans = a + b
        break
      }
      case 1: // 99+99まで
        a = Math.floor(Math.random() * 49 + 50)
        b = Math.floor(Math.random() * 49 + 50)
        ans = a + b
        break
      case 2: // 100をこえるひき算
        a = Math.floor(Math.random() * 49 + 150)
        b = Math.floor(Math.random() * 49 + 1)
        ans = a - b
        break
      case 3: // 1○○-○○
        a = Math.floor(Math.random() * 9 + 100)
        b = Math.floor(Math.random() * 99 + 1)
        ans = a - b
        break
      default:
        a = 100; b = 10; ans = 110
    }

    const check = a * 1000 + b
    if (duplicationCheck(check, checkArray)) {
      checkArray.push(check)
      left.push(a)
      right.push(b)
      answers.push(ans)
    }
  }
  return { left, right, answers }
}

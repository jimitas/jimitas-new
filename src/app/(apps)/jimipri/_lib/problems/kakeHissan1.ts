// 1けたをかけるかけ算の筆算
// 元: 23_kake_hissan1.js
// Mode 0: くり上がりなし
// Mode 1: くり上がり1回A（十の位がくり上がる）
// Mode 2: くり上がり1回B（一の位がくり上がる）
// Mode 3: くり上がり2回
// 15問（5行×3列）

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateKakeHissan1(modeIndex: number): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 15) {
    // b（1けたの数）を決定
    let b: number
    if (modeIndex === 0) {
      b = Math.floor(Math.random() * 9 + 1)
    } else {
      b = Math.floor(Math.random() * 8 + 2)
    }

    // b に応じた上限 c を設定
    let c: number
    switch (b) {
      case 1: c = 9; break
      case 2: c = 4; break
      case 3: c = 3; break
      case 4: c = 2; break
      default: c = 1; break
    }

    // a（2けたの数）を決定
    let a: number
    switch (modeIndex) {
      case 0: // くり上がりなし
        a = Math.floor(Math.random() * c + 1) * 10 + Math.floor(Math.random() * c + 1)
        break
      case 1: // くり上がり1回A
        a = Math.floor(Math.random() * (9 - c) + c + 1) * 10 + Math.floor(Math.random() * c + 1)
        break
      case 2: // くり上がり1回B
        a = Math.floor(Math.random() * c + 1) * 10 + Math.floor(Math.random() * (9 - c) + c + 1)
        break
      case 3: // くり上がり2回
        a = Math.floor(Math.random() * (9 - c) + c + 1) * 10 + Math.floor(Math.random() * (9 - c) + c + 1)
        break
      default:
        a = 11
    }

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

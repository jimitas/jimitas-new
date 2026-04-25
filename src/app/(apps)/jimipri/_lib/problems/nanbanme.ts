// なんばんめ
// 元: 01_nanbanme.js
// 5問: 順番の問題（イラスト版）
// nanbanme アプリと同じ動物画像（public/images/）を使用
// NanbanmeResult を返し、page.tsx の NanbanmeDisplay で描画

import { NanbanmeResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

// nanbanme アプリと同じ10匹の動物（public/images/ 内の png）
const ANIMALS = ["dog", "cat", "monkey", "frog", "usagi", "niwatori", "ika", "tako", "iruka", "butterfly"]

export function generateNanbanme(): NanbanmeResult {
  // 10匹からランダムに6匹を選んでシャッフル
  const selected = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 6)
  const animals = selected.map(i => ANIMALS[i])

  // 6つの位置から重複なしで5つ選ぶ
  const checkArray: number[] = []
  const positions: number[] = []
  while (checkArray.length < 5) {
    const pos = Math.floor(Math.random() * 6 + 1)
    if (duplicationCheck(pos, checkArray)) {
      checkArray.push(pos)
      positions.push(pos)
    }
  }

  // 答え（answerCreate用のフォールバック）
  const answers: (number | string)[] = [
    `ひだりから${positions[0]}ばんめ`,
    `みぎから${7 - positions[1]}ばんめ`,
    `ひだりから${positions[2]}ばんめ、みぎから${7 - positions[2]}ばんめ`,
    `ひだりから${positions[3]}ばんめ、みぎから${7 - positions[3]}ばんめ`,
    `ひだりから${positions[4]}ばんめ、みぎから${7 - positions[4]}ばんめ`,
  ]

  // 元: answerCreate()を使わず area.innerHTML に直接流し込み
  const answerHtml = `
    ①　ひだりから${positions[0]}ばんめ
    ②　みぎから${7 - positions[1]}ばんめ
    ③　ひだりから${positions[2]}ばんめ、みぎから${7 - positions[2]}ばんめ
    <br/>
    ④　ひだりから${positions[3]}ばんめ、みぎから${7 - positions[3]}ばんめ
    ⑤　ひだりから${positions[4]}ばんめ、みぎから${7 - positions[4]}ばんめ
  `

  return { animals, positions, answers, answerHtml }
}

function shuffleArray(arr: number[]): number[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// なんばんめ
// 元: 01_nanbanme.js
// 5問: 順番の問題（テキスト版）
// 元はどうぶつ画像を使っていたが、プリント版はテキストで出題

import { CustomResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

const ANIMALS = ["いぬ", "あひる", "かえる", "うま", "さる", "ねずみ"]
const BANGOU = ["①", "②", "③", "④", "⑤"]

export function generateNanbanme(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // 動物の順番をシャッフル
  const order = shuffleArray([0, 1, 2, 3, 4, 5])
  const orderedAnimals = order.map(i => ANIMALS[i])

  // 5つの異なる位置を選ぶ
  const checkArray: number[] = []
  const positions: number[] = []
  while (checkArray.length < 5) {
    const pos = Math.floor(Math.random() * 6 + 1)
    if (duplicationCheck(pos, checkArray)) {
      checkArray.push(pos)
      positions.push(pos)
    }
  }

  // 並び順を表示
  problems.push(`なんばんめですか。`)
  problems.push(`ひだり　${orderedAnimals.join("　")}　みぎ`)

  // ①ひだりからなんばんめ
  problems.push(`${BANGOU[0]}　${orderedAnimals[positions[0] - 1]}は、ひだりから（　　）ばんめ`)
  answers.push(`${positions[0]}ばんめ`)

  // ②みぎからなんばんめ
  problems.push(`${BANGOU[1]}　${orderedAnimals[positions[1] - 1]}は、みぎから（　　）ばんめ`)
  answers.push(`${7 - positions[1]}ばんめ`)

  // ③〜⑤ ひだりから＆みぎから
  for (let i = 2; i < 5; i++) {
    const animal = orderedAnimals[positions[i] - 1]
    problems.push(`${BANGOU[i]}　${animal}は、\n　　ひだりから（　　）ばんめ、みぎから（　　）ばんめ`)
    answers.push(`ひだりから${positions[i]}ばんめ、みぎから${7 - positions[i]}ばんめ`)
  }

  return { problems, answers }
}

function shuffleArray(arr: number[]): number[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

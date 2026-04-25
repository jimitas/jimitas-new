// なんばんめ
// 元: 01_nanbanme.js
// 5問: 順番の問題（イラスト版）
// nanbanme アプリと同じ動物画像（public/images/）を使用

import { CustomResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

// nanbanme アプリと同じ10匹の動物（public/images/ 内の png）
const ANIMALS = ["dog", "cat", "monkey", "frog", "usagi", "niwatori", "ika", "tako", "iruka", "butterfly"]
// 日本語名（問題文で使用）
const ANIMAL_NAMES: Record<string, string> = {
  dog: "いぬ", cat: "ねこ", monkey: "さる", frog: "かえる", usagi: "うさぎ",
  niwatori: "にわとり", ika: "いか", tako: "たこ", iruka: "いるか", butterfly: "ちょう",
}

const BANGOU = ["①", "②", "③", "④", "⑤"]
const IMG_SIZE = 50 // 画像サイズ（px、印刷時は小さめ）

/** 動物画像のimgタグを生成 */
function animalImg(name: string, size = IMG_SIZE): string {
  return `<img src="/images/${name}.png" alt="${ANIMAL_NAMES[name]}" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;" />`
}

export function generateNanbanme(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // 10匹からランダムに6匹を選んでシャッフル
  const selected = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 6)
  const orderedAnimals = selected.map(i => ANIMALS[i])

  // 6匹の異なる位置を5つ選ぶ
  const checkArray: number[] = []
  const positions: number[] = []
  while (checkArray.length < 5) {
    const pos = Math.floor(Math.random() * 6 + 1)
    if (duplicationCheck(pos, checkArray)) {
      checkArray.push(pos)
      positions.push(pos)
    }
  }

  // 並び順を画像で表示
  problems.push(`なんばんめですか。`)

  // 動物の並びを画像で表示（ひだり〜みぎ）
  const animalRow = orderedAnimals.map(a => animalImg(a)).join("　")
  problems.push(`<div style="display:flex;align-items:center;border:solid 1px #888;padding:8px 12px;gap:4px;"><span style="font-size:4mm;">ひだり</span>${animalRow}<span style="font-size:4mm;">みぎ</span></div>`)

  // ①ひだりからなんばんめ
  const a1 = orderedAnimals[positions[0] - 1]
  problems.push(`${BANGOU[0]}　${animalImg(a1, 36)}は、ひだりから（　　）ばんめ`)
  answers.push(`${positions[0]}ばんめ`)

  // ②みぎからなんばんめ
  const a2 = orderedAnimals[positions[1] - 1]
  problems.push(`${BANGOU[1]}　${animalImg(a2, 36)}は、みぎから（　　）ばんめ`)
  answers.push(`${7 - positions[1]}ばんめ`)

  // ③〜⑤ ひだりから＆みぎから
  for (let i = 2; i < 5; i++) {
    const animal = orderedAnimals[positions[i] - 1]
    problems.push(`${BANGOU[i]}　${animalImg(animal, 36)}は、\n　　ひだりから（　　）ばんめ、みぎから（　　）ばんめ`)
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

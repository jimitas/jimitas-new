// なんばんめ
// 元: 01_nanbanme.js
// 5問: 順番の問題（イラスト版）
// nanbanme アプリと同じ動物画像（public/images/）を使用

import { CustomResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

// nanbanme アプリと同じ10匹の動物（public/images/ 内の png）
const ANIMALS = ["dog", "cat", "monkey", "frog", "usagi", "niwatori", "ika", "tako", "iruka", "butterfly"]
// 日本語名（alt属性で使用）
const ANIMAL_NAMES: Record<string, string> = {
  dog: "いぬ", cat: "ねこ", monkey: "さる", frog: "かえる", usagi: "うさぎ",
  niwatori: "にわとり", ika: "いか", tako: "たこ", iruka: "いるか", butterfly: "ちょう",
}

const IMG_SIZE = 50 // 並びの画像サイズ（px）
const Q_IMG_SIZE = 36 // 問題文中の画像サイズ（px）

/** 動物画像のimgタグを生成 */
function animalImg(name: string, size: number): string {
  return `<img src="/images/${name}.png" alt="${ANIMAL_NAMES[name]}" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;" />`
}

/** 入力欄（印刷用の下線） */
const BLANK = `<span style="display:inline-block;width:3em;border-bottom:1px solid #000;">&nbsp;</span>`

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

  // タイトル
  problems.push(`<div style="font-size:6mm;font-weight:bold;">なんばんめですか。</div>`)

  // 動物の並びを画像で表示（ひだり〜みぎ）
  const animalRow = orderedAnimals.map(a => animalImg(a, IMG_SIZE)).join("")
  problems.push(`<div style="display:flex;align-items:center;border:solid 1px black;padding:8px 16px;gap:4px;"><div style="padding-top:12px;">ひだり</div><div>${animalRow}</div><div style="padding-top:12px;">みぎ　</div></div>`)

  // ① ○○は、ひだりから___ばんめ
  const a1 = orderedAnimals[positions[0] - 1]
  problems.push(`<div style="margin-top:4mm;">①　${animalImg(a1, Q_IMG_SIZE)}は、ひだりから${BLANK}ばんめ</div>`)
  answers.push(`ひだりから${positions[0]}ばんめ`)

  // ② ○○は、みぎから___ばんめ
  const a2 = orderedAnimals[positions[1] - 1]
  problems.push(`<div style="margin-top:4mm;">②　${animalImg(a2, Q_IMG_SIZE)}は、みぎから${BLANK}ばんめ</div>`)
  answers.push(`みぎから${7 - positions[1]}ばんめ`)

  // ③〜⑤ ○○は、（改行）ひだりから___ばんめ、みぎから___ばんめ
  const bangou = ["③", "④", "⑤"]
  for (let i = 2; i < 5; i++) {
    const animal = orderedAnimals[positions[i] - 1]
    problems.push(`<div style="margin-top:4mm;">${bangou[i - 2]}　${animalImg(animal, Q_IMG_SIZE)}は、<br/>　　ひだりから${BLANK}ばんめ、みぎから${BLANK}ばんめ</div>`)
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

// 文字と式
// 元: 36_mojitoshiki.js
// 9問: 表の読み取り + 文字式

import { CustomResult } from "../types"

export function generateMojitoshiki(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // (1) 正多角形の問題
  const numberOfAngles = Math.floor(Math.random() * 4 + 3)
  const num = Math.floor(Math.random() * 4 + 6)
  const Angle = ["正三角形", "正方形", "正五角形", "正六角形"]

  problems.push(`(１)  １辺の長さが xcmの、${Angle[numberOfAngles - 3]}があります。`)

  problems.push(`①　周りの長さを ycm として、xとyの関係を式に表しましょう。\n　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）`)
  answers.push(`x×${numberOfAngles}＝y`)

  // 表の行（x: 3,4,5,6 → y: ?）
  const xVals = [3, 4, 5, 6]
  const yVals = xVals.map(x => x * numberOfAngles)
  problems.push(`②　xの値を3,4,5,6,…としたとき、\n　　それぞれに対応するyの値を求めて、表にかきましょう。\n　┌────┬──┬──┬──┬──┬──┐\n　│ x(cm) │ 3 │ 4 │ 5 │ 6 │…│\n　├────┼──┼──┼──┼──┼──┤\n　│ y(cm) │　 │　 │　 │　 │…│\n　└────┴──┴──┴──┴──┴──┘`)
  answers.push(`${yVals.join(",")}`)

  problems.push(`③　yの値が${numberOfAngles * num}となるxの値を求めましょう。\n　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）`)
  answers.push(`x=${num}`)

  // (2) 三角形の面積の問題
  const teihen = Math.floor(Math.random() * 4 + 2) * 2
  const num2 = Math.floor(Math.random() * 4 + 10)

  problems.push(`(２)  底辺の長さが ${teihen}cmの三角形があります。`)

  problems.push(`④　高さを xcm 、面積をy㎠として、xとyの関係を式に表しましょう。\n　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）`)
  answers.push(`${teihen}×x÷2＝y`)

  const xVals2 = [7, 8, 9, 10]
  const yVals2 = xVals2.map(x => (teihen * x) / 2)
  problems.push(`⑤　xの値を7,8,9,10,…としたとき、\n　　それぞれに対応するyの値を求めて、表にかきましょう。\n　┌────┬──┬──┬──┬──┬──┐\n　│ x(cm) │ 7 │ 8 │ 9 │10│…│\n　├────┼──┼──┼──┼──┼──┤\n　│ y(㎠) │　 │　 │　 │　 │…│\n　└────┴──┴──┴──┴──┴──┘`)
  answers.push(`${yVals2.join(",")}`)

  problems.push(`⑥　yの値が${(teihen * num2) / 2}となるxの値を求めましょう。\n　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）`)
  answers.push(`x=${num2}`)

  // (3) 文字式を答える問題
  const num3 = Math.floor(Math.random() * 4 + 4)
  const initialValue3 = Math.floor(Math.random() * 4 + 2) * 100

  const textA = `水がxmL入った水そうに${initialValue3}mLの水を${num3}回入れたときの全体の水の量`
  const textB = `重さxgのボール${num3}個を${initialValue3}gの箱に入れたときの全体の重さ`
  const textC = `x円のクッキー１まいと、${initialValue3}円のケーキ１こを組にして${num3}組買ったときの代金`
  const TEXT = [textA, textB, textC]
  const ANSWER = [`x+${initialValue3}×${num3}`, `x×${num3}+${initialValue3}`, `(x+${initialValue3})×${num3}`]
  const order = shuffleArray([0, 1, 2])

  problems.push(`(３)　次のことがらを式であらわしましょう。`)

  problems.push(`⑦　${TEXT[order[0]]}\n　　　　　　　　　　　　　　　　　　式（　　　　　　　　　　　　　）`)
  answers.push(ANSWER[order[0]])

  problems.push(`⑧　${TEXT[order[1]]}\n　　　　　　　　　　　　　　　　　　式（　　　　　　　　　　　　　）`)
  answers.push(ANSWER[order[1]])

  problems.push(`⑨　${TEXT[order[2]]}\n　　　　　　　　　　　　　　　　　　式（　　　　　　　　　　　　　）`)
  answers.push(ANSWER[order[2]])

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

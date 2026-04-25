// 比例と反比例
// 元: 39_hirei_hanpirei.js
// 10問: 表の読み取り + 比例/反比例判定

import { CustomResult } from "../types"

export function generateHirei(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // (1) 正多角形の比例問題
  const numberOfAngles = Math.floor(Math.random() * 4 + 3)
  const num = Math.floor(Math.random() * 4 + 6)
  const Angle = ["正三角形", "正方形", "正五角形", "正六角形"]

  // 表の値を計算
  const yVals1 = [1, 2, 3, 4, 5].map(x => x * numberOfAngles)

  problems.push(`(１) 次の表は、${Angle[numberOfAngles - 3]}で、１辺の長さをいろいろに変えたときの、\n　1辺の長さ xcm と、周りの長さ y cm の関係を表したものです。\n　┌────┬──┬──┬──┬──┬──┬──┐\n　│ x(cm) │ 1 │ 2 │ 3 │ 4 │ 5 │…│\n　├────┼──┼──┼──┼──┼──┼──┤\n　│ y(cm) │ ${yVals1[0]} │ ${yVals1[1]} │ ${yVals1[2]} │${yVals1[3]}│${yVals1[4]}│…│\n　└────┴──┴──┴──┴──┴──┴──┘`)

  problems.push(`①　1辺の長さ xcm と周りの長さ ycm は比例しますか、反比例しますか？\n　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）`)
  answers.push("比例する")

  problems.push(`②　x と y の関係を式に表しましょう。\n　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）`)
  answers.push(`y=${numberOfAngles}×x`)

  problems.push(`③　1辺の長さが${num}cmのとき、周りの長さは、何cmになりますか。\n　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）`)
  answers.push(`${numberOfAngles * num}cm`)

  // (2) 三角形の反比例問題
  const areaOfTriangle = Math.floor(Math.random() * 4 + 1) * 18
  const teihen = Math.floor(Math.random() * 3 + 1) * 6

  // 表の値を計算（面積一定の三角形: 底辺×高さ÷2 = 面積 → 高さ = 面積×2÷底辺）
  const yVals2 = [1, 2, 3, 4, 5].map(x => areaOfTriangle / x)

  problems.push(`(２) 次の表は、面積が決まっている三角形で、底辺の長さをいろいろに\n　変えたときの底辺の長さ xcm と、高さ y cm の関係を表したものです。\n　┌────┬──┬──┬──┬──┬──┬──┐\n　│ x(cm) │ 1 │ 2 │ 3 │ 4 │ 5 │…│\n　├────┼──┼──┼──┼──┼──┼──┤\n　│ y(cm) │${yVals2[0]}│${yVals2[1]}│${yVals2[2]}│${yVals2[3]}│${yVals2[4]}│…│\n　└────┴──┴──┴──┴──┴──┴──┘`)

  problems.push(`④　底辺の長さ xcm と高さ ycm は比例しますか、反比例しますか？\n　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）`)
  answers.push("反比例する")

  problems.push(`⑤　x と y の関係を式に表しましょう。\n　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）`)
  answers.push(`y=${areaOfTriangle}÷x`)

  problems.push(`⑥　底辺の長さが${teihen}cmのとき、高さは、何cmになりますか。\n　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）`)
  answers.push(`${areaOfTriangle / teihen}cm`)

  // (3) 比例/反比例/どちらでもないの判定問題
  const a = Math.floor(Math.random() * 8 + 2)
  const b = Math.floor(Math.random() * 4 + 2)
  const c = Math.floor(Math.random() * 8 + 2)
  const d = Math.floor(Math.random() * 8 + 2)
  const e = Math.floor(Math.random() * 8 + 2)

  const textA = `底辺が ${a}cm の三角形の高さ x (cm)と面積 y (㎠)`
  const textB = `面積が ${b * 6}(㎠) の平行四辺形の底辺x(cm)と高さ y (cm)`
  const textC = `1mあたり${c * 20}円のリボンの長さ x (m)と代金 y (円)`
  const textD = `${d * 6}kmの道のりを移動するときの、時速 x (km)と y (時間)`
  const textE = `${e * 2}cm のろうそくに火をつけたときの、時間 x (分)と長さ y (cm)`
  const TEXT = [textA, textB, textC, textD, textE]
  const ANSWER = ["○", "△", "○", "△", "×"]

  const order = shuffleArray([0, 1, 2, 3, 4]).slice(0, 4)

  problems.push(`(３)　比例…〇、反比例…△、どちらでもない…×の記号をつけましょう。`)

  const bangou = ["⑦", "⑧", "⑨", "⑩"]
  for (let i = 0; i < 4; i++) {
    problems.push(`${bangou[i]}（　　）${TEXT[order[i]]}`)
    answers.push(ANSWER[order[i]])
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

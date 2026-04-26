// 比例と反比例
// 元: 39_hirei_hanpirei.js
// 10問: 表の読み取り + 比例/反比例判定
// 元のCSS: TBL.style.lineHeight = "1.6"; TBL.style.fontSize = "18px";
// 表: <table style="margin-left:50px"> + <td class="graphTd"> + 先頭列 width:100px

import { CustomResult } from "../types"
import { shuffled } from "@/lib/utils"

export function generateHirei(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // (1) 正多角形の比例問題
  const numberOfAngles = Math.floor(Math.random() * 4 + 3)
  const num = Math.floor(Math.random() * 4 + 6)
  const Angle = ["正三角形", "正方形", "正五角形", "正六角形"]

  // 表の値を計算
  const yVals1 = [1, 2, 3, 4, 5].map(x => x * numberOfAngles)

  // (1) テキスト + テーブル + 小問3つをまとめて1つのHTMLブロックにする
  let block1 = `<div>(１)  次の表は、${Angle[numberOfAngles - 3]}で、１辺の長さをいろいろに変えたときの、<br>`
  block1 += `　　1辺の長さ xcm と、周りの長さ y cm の関係を表したものです。</div>`

  // テーブル（元: generateTable 関数）
  block1 += `<table style="margin-left:50px;">`
  block1 += `<tr>`
  block1 += `<td class="graphTd" style="width:100px;">x(cm)</td>`
  for (let j = 1; j <= 5; j++) {
    block1 += `<td class="graphTd">${j}</td>`
  }
  block1 += `<td class="graphTd">…</td>`
  block1 += `</tr>`
  block1 += `<tr>`
  block1 += `<td class="graphTd" style="width:100px;">y(cm)</td>`
  for (let j = 0; j < 5; j++) {
    block1 += `<td class="graphTd">${yVals1[j]}</td>`
  }
  block1 += `<td class="graphTd">…</td>`
  block1 += `</tr>`
  block1 += `</table>`

  // 小問①②③
  block1 += `<div>　①　1辺の長さ xcm と周りの長さ ycm は比例しますか、反比例しますか？<br>`
  block1 += `　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）</div>`
  block1 += `<div>　②　x と y の関係を式に表しましょう。<br>`
  block1 += `　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）</div>`
  block1 += `<div>　③　1辺の長さが${num}cmのとき、周りの長さは、何cmになりますか。<br>`
  block1 += `　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）<br><br></div>`

  problems.push(block1)

  answers.push("比例する")
  answers.push(`y=${numberOfAngles}×x`)
  answers.push(`${numberOfAngles * num}cm`)

  // (2) 三角形の反比例問題
  const areaOfTriangle = Math.floor(Math.random() * 4 + 1) * 18
  const teihen = Math.floor(Math.random() * 3 + 1) * 6

  // 表の値を計算（面積一定の三角形: 底辺×高さ÷2 = 面積 → 高さ = 面積×2÷底辺）
  const yVals2 = [1, 2, 3, 4, 5].map(x => areaOfTriangle / x)

  let block2 = `<div>(2)  次の表は、面積が決まっている三角形で、底辺の長さをいろいろに<br>`
  block2 += `　　変えたときの底辺の長さ xcm と、高さ y cm の関係を表したものです。</div>`

  // テーブル
  block2 += `<table style="margin-left:50px;">`
  block2 += `<tr>`
  block2 += `<td class="graphTd" style="width:100px;">x(cm)</td>`
  for (let j = 1; j <= 5; j++) {
    block2 += `<td class="graphTd">${j}</td>`
  }
  block2 += `<td class="graphTd">…</td>`
  block2 += `</tr>`
  block2 += `<tr>`
  block2 += `<td class="graphTd" style="width:100px;">y(cm)</td>`
  for (let j = 0; j < 5; j++) {
    block2 += `<td class="graphTd">${yVals2[j]}</td>`
  }
  block2 += `<td class="graphTd">…</td>`
  block2 += `</tr>`
  block2 += `</table>`

  // 小問④⑤⑥
  block2 += `<div>　④　底辺の長さ xcm と高さ ycm は比例しますか、反比例しますか？<br>`
  block2 += `　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）</div>`
  block2 += `<div>　⑤　x と y の関係を式に表しましょう。<br>`
  block2 += `　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）</div>`
  block2 += `<div>　⑥　底辺の長さが${teihen}cmのとき、高さは、何cmになりますか。<br>`
  block2 += `　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）<br><br></div>`

  problems.push(block2)

  answers.push("反比例する")
  answers.push(`y=${areaOfTriangle}÷x`)
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

  const order = shuffled([0, 1, 2, 3, 4]).slice(0, 4)

  let block3 = `<div>(３)　比例…〇、反比例…△、どちらでもない…×の記号をつけましょう。</div>`
  block3 += `<div>　⑦（　　）${TEXT[order[0]]}</div>`
  block3 += `<div>　⑧（　　）${TEXT[order[1]]}</div>`
  block3 += `<div>　⑨（　　）${TEXT[order[2]]}</div>`
  block3 += `<div>　⑩（　　）${TEXT[order[3]]}</div>`

  problems.push(block3)

  answers.push(ANSWER[order[0]])
  answers.push(ANSWER[order[1]])
  answers.push(ANSWER[order[2]])
  answers.push(ANSWER[order[3]])

  return { problems, answers }
}

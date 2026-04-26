// 文字と式
// 元: 36_mojitoshiki.js
// 9問: 表の読み取り + 文字式
// 元のCSS: TBL.style.lineHeight = "1.7"; TBL.style.fontSize = "18px";
// 表: <table style="margin-left:50px"> + <td class="graphTd"> + 先頭列 width:100px
// 元の構造: テキスト → 小問1 → 小問2(表を埋める) → テーブル → 小問3

import { CustomResult } from "../types"
import { shuffled } from "@/lib/utils"

export function generateMojitoshiki(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // (1) 正多角形の問題
  const numberOfAngles = Math.floor(Math.random() * 4 + 3)
  const num = Math.floor(Math.random() * 4 + 6)
  const Angle = ["正三角形", "正方形", "正五角形", "正六角形"]

  // 表の生成ヘルパー（元: generateTable の table 部分）
  function makeTable(initialValue: number, showY: boolean): string {
    let html = `<table style="margin-left:50px;">`
    html += `<tr>`
    html += `<td class="graphTd" style="width:100px;">x(cm)</td>`
    for (let j = 1; j <= 4; j++) {
      html += `<td class="graphTd">${j + initialValue - 1}</td>`
    }
    html += `<td class="graphTd">…</td>`
    html += `</tr>`
    html += `<tr>`
    html += `<td class="graphTd" style="width:100px;">${showY ? "y(㎠)" : "y(cm)"}</td>`
    // y行は空欄（生徒が記入する）
    for (let j = 1; j <= 4; j++) {
      html += `<td class="graphTd"></td>`
    }
    html += `<td class="graphTd">…</td>`
    html += `</tr>`
    html += `</table>`
    return html
  }

  // ブロック1: (1) テキスト + ①②③ + テーブル
  let block1 = `<div>(１)  １辺の長さが xcmの、${Angle[numberOfAngles - 3]}があります。</div>`
  block1 += `<div>　①　周りの長さを ycm として、xとyの関係を式に表しましょう。<br>`
  block1 += `　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）</div>`
  block1 += `<div>　②　xの値を3,4,5,6,…としたとき、<br>`
  block1 += `　　　それぞれに対応するyの値を求めて、表にかきましょう。</div>`
  block1 += makeTable(3, false)
  block1 += `<div>　③　yの値が${numberOfAngles * num}となるxの値を求めましょう。<br>`
  block1 += `　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）<br><br></div>`

  problems.push(block1)

  answers.push(`x×${numberOfAngles}＝y`)
  const xVals = [3, 4, 5, 6]
  answers.push(`${xVals.map(x => x * numberOfAngles).join(",")}`)
  answers.push(`x=${num}`)

  // (2) 三角形の面積の問題
  const teihen = Math.floor(Math.random() * 4 + 2) * 2
  const num2 = Math.floor(Math.random() * 4 + 10)

  let block2 = `<div>(２)  底辺の長さが ${teihen}cmの三角形があります。</div>`
  block2 += `<div>　④　高さを xcm 、面積をy㎠として、xとyの関係を式に表しましょう。<br>`
  block2 += `　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）</div>`
  block2 += `<div>　⑤　xの値を7,8,9,10,…としたとき、<br>`
  block2 += `　　　それぞれに対応するyの値を求めて、表にかきましょう。</div>`
  block2 += makeTable(7, true)
  block2 += `<div>　⑥　yの値が${(teihen * num2) / 2}となるxの値を求めましょう。<br>`
  block2 += `　　　　　　　　　　　　　　　　　　答え（　　　　　　　　　　　　　）<br><br></div>`

  problems.push(block2)

  answers.push(`${teihen}×x÷2＝y`)
  const xVals2 = [7, 8, 9, 10]
  answers.push(`${xVals2.map(x => (teihen * x) / 2).join(",")}`)
  answers.push(`x=${num2}`)

  // (3) 文字式を答える問題
  const num3 = Math.floor(Math.random() * 4 + 4)
  const initialValue3 = Math.floor(Math.random() * 4 + 2) * 100

  const textA = `水がxmL入った水そうに${initialValue3}mLの水を${num3}回入れたときの全体の水の量`
  const textB = `重さxgのボール${num3}個を${initialValue3}gの箱に入れたときの全体の重さ`
  const textC = `x円のクッキー１まいと、${initialValue3}円のケーキ１こを組にして${num3}組買ったときの代金`
  const TEXT = [textA, textB, textC]
  const ANSWER = [`x+${initialValue3}×${num3}`, `x×${num3}+${initialValue3}`, `(x+${initialValue3})×${num3}`]
  const order = shuffled([0, 1, 2])

  let block3 = `<div>(３)　次のことがらを式であらわしましょう。</div>`
  block3 += `<div>　⑦ ${TEXT[order[0]]}<br>　　　　　　　　　　　　　　　　　　　式（　　　　　　　　　　　　　）<br></div>`
  block3 += `<div>　⑧ ${TEXT[order[1]]}<br>　　　　　　　　　　　　　　　　　　　式（　　　　　　　　　　　　　）<br></div>`
  block3 += `<div>　⑨ ${TEXT[order[2]]}<br>　　　　　　　　　　　　　　　　　　　式（　　　　　　　　　　　　　）<br></div>`

  problems.push(block3)

  answers.push(ANSWER[order[0]])
  answers.push(ANSWER[order[1]])
  answers.push(ANSWER[order[2]])

  return { problems, answers }
}

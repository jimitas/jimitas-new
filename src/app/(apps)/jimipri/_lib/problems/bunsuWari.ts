// 分数÷分数
// 元: 38_bunsuu_warizan.js
// 10問: 4モード（分数÷整数、分数÷分数、帯分数÷分数、帯分数÷帯分数）

import { CustomResult } from "../types"
import { fracHtml, mixedFracHtml, reduceFraction, bunsuDivision } from "../bunsuu"

const BANGOU = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"]

export function generateBunsuWari(modeIndex: number): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  problems.push(`☆次の計算をしましょう。`)

  for (let i = 0; i < 10; i++) {
    let a = Math.floor(Math.random() * 2 + 1) // 左…帯分数
    let c = Math.floor(Math.random() * 7 + 3) // 左…分母
    let b = Math.floor(Math.random() * (c - 1) + 1) // 左…分子
    let d = Math.floor(Math.random() * 2 + 1) // 右…帯分数
    let f = Math.floor(Math.random() * 7 + 3) // 右…分母
    let e = Math.floor(Math.random() * (f - 1) + 1) // 右…分子

    switch (modeIndex) {
      case 0: // 分数÷整数
        a = 0; d = Math.floor(Math.random() * 5 + 1); e = 0; f = 1
        break
      case 1: // 分数÷分数
        a = 0; d = 0
        break
      case 2: { // 帯分数÷分数
        const mode = Math.floor(Math.random() * 2)
        if (mode === 0) { a = Math.floor(Math.random() * 5 + 1); d = 0 }
        else { a = 0; d = Math.floor(Math.random() * 3 + 1) }
        break
      }
      // case 3: 帯分数÷帯分数（修正なし）
    }

    if (b === c) c = c + 1
    ;[b, c] = reduceFraction(b, c)
    if (c === 1) c = 7
    if (e === f) f = f + 1
    ;[e, f] = reduceFraction(e, f)
    if (f === 1) f = 5

    // わり算実行
    const [rn, rd] = bunsuDivision(a, b, c, d, e, f)

    // 問題表示
    const leftHtml = a > 0
      ? (b > 0 ? mixedFracHtml(a, b, c) : `<span class="jf-whole">${a}</span>${fracHtml(b, c)}`)
      : fracHtml(b, c)
    const rightHtml = d > 0
      ? (e > 0 ? mixedFracHtml(d, e, f) : `<span class="jf-whole">${d}</span>`)
      : (e > 0 ? fracHtml(e, f) : `<span class="jf-whole">${d}</span>`)

    problems.push(`<div class="jf-row">${BANGOU[i]}　${leftHtml}　÷　${rightHtml}　＝<span class="jf-eq"></span></div>`)
    answers.push(rd !== 1 ? `${rn}/${rd}` : `${rn}`)
  }

  return { problems, answers }
}

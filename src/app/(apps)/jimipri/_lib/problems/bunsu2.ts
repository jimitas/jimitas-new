// 分数（２）
// 元: 34_bunsu2.js
// 20問: 商を分数で表す、分数→小数、小数→分数

import { CustomResult } from "../types"
import { fracHtml, reduceFraction } from "../bunsuu"
import { BANGOU } from "../constants"

export function generateBunsu2(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // ☆問題1: 商を分数で表す（6問）
  problems.push(`☆商を分数で表しましょう。`)
  for (let i = 0; i < 6; i++) {
    const a = Math.floor(Math.random() * 7 + 2)
    const b = Math.floor(Math.random() * 7 + 2)
    const [c, d] = reduceFraction(a, b)

    problems.push(`<div class="jf-row">${BANGOU[i]}　${a}÷${b}　＝<span class="jf-eq"></span></div>`)
    answers.push(d !== 1 ? `${c}/${d}` : `${c}`)
  }

  // ☆問題2: 分数を小数で表す（8問）
  problems.push(`\n☆分数を小数で表しましょう。`)
  const nums = [2, 4, 5]
  for (let i = 0; i < 8; i++) {
    const idx = Math.floor(Math.random() * 3)
    const a = Math.floor(Math.random() * 20 + 2)
    let b = nums[idx]
    let [c, d] = reduceFraction(a, b)
    if (d === 1) d = 2

    problems.push(`<div class="jf-row">${BANGOU[i + 6]}　${fracHtml(c, d)}　＝<span class="jf-eq"></span></div>`)
    answers.push(`${c / d}`)
  }

  // ☆問題3: 小数を分数で表す（6問）
  problems.push(`\n☆小数を分数で表しましょう。`)
  for (let i = 0; i < 6; i++) {
    const a = Math.floor(Math.random() * 99 + 2)
    const [c, d] = reduceFraction(a, 100)

    problems.push(`<div class="jf-row">${BANGOU[i + 14]}　${a / 100}　＝<span class="jf-eq"></span></div>`)
    answers.push(`${c}/${d}`)
  }

  return { problems, answers }
}

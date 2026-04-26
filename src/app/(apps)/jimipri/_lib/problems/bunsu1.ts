// 分数（１）
// 元: 32_bunsu1.js
// 18問: 約分、通分比較、異分母の加減

import { CustomResult } from "../types"
import { fracHtml, reduceFraction, bunsuAdd, bunsuMinus } from "../bunsuu"
import { BANGOU } from "../constants"

export function generateBunsu1(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // ☆問題1: 約分（4問）
  problems.push(`☆次の分数を約分しましょう。`)
  for (let i = 0; i < 4; i++) {
    const koubaisu = Math.floor(Math.random() * 4 + 2)
    let bunshi = Math.floor(Math.random() * 7 + 2) * koubaisu
    const bunbo = Math.floor(Math.random() * 7 + 2) * koubaisu
    if (bunshi === bunbo) bunshi = koubaisu

    const [rn, rd] = reduceFraction(bunshi, bunbo)
    problems.push(`<div class="jf-row">${BANGOU[i]}　${fracHtml(bunshi, bunbo)}　＝<span class="jf-eq"></span></div>`)
    answers.push(rd !== 1 ? `${rn}/${rd}` : `${rn}`)
  }

  // ☆問題2: 通分して比較（6問）
  problems.push(`\n☆次の分数を通分して比べ、等号や不等号を使って\n　表しましょう。`)
  for (let i = 0; i < 6; i++) {
    const koubaisu = Math.floor(Math.random() * 2 + 2)
    const bunshi = Math.floor(Math.random() * 14 + 2)
    const bunshi2 = Math.floor(Math.random() * 14 + 2)
    const bunbo = Math.floor(Math.random() * 7 + 2) * koubaisu
    let bunbo2 = Math.floor(Math.random() * 7 + 2) * koubaisu
    if (bunbo === bunbo2) bunbo2 = koubaisu

    let sign: string
    const val1 = bunshi / bunbo
    const val2 = bunshi2 / bunbo2
    if (val1 > val2) sign = ">"
    else if (val1 < val2) sign = "<"
    else sign = "="

    problems.push(`<div class="jf-row">${BANGOU[i + 4]}　${fracHtml(bunshi, bunbo)}　□　${fracHtml(bunshi2, bunbo2)}　　</div>`)
    answers.push(sign)
  }

  // ☆問題3: 異分母の加減（8問: 前半足し算、後半引き算）
  problems.push(`\n☆次の計算をしましょう。`)
  for (let i = 0; i < 8; i++) {
    const koubaisu = Math.floor(Math.random() * 2 + 2)
    let bunshi = Math.floor(Math.random() * 8 + 2)
    let bunbo = Math.floor(Math.random() * 7 + 2) * koubaisu
    let bunshi2 = Math.floor(Math.random() * 8 + 2)
    let bunbo2 = Math.floor(Math.random() * 7 + 2) * koubaisu

    if (bunshi === bunbo) bunbo = koubaisu
    if (bunshi2 === bunbo2) bunbo2 = koubaisu
    if (bunbo === bunbo2) bunbo2 = koubaisu

    // 約分しておく
    ;[bunshi, bunbo] = reduceFraction(bunshi, bunbo)
    ;[bunshi2, bunbo2] = reduceFraction(bunshi2, bunbo2)
    if (bunbo === 1) { bunbo = 4; bunshi = 7 }
    if (bunbo2 === 1) { bunbo2 = 8; bunshi2 = 3 }

    // 引き算では前の数を大きくする
    if (bunshi / bunbo < bunshi2 / bunbo2) {
      ;[bunshi, bunshi2] = [bunshi2, bunshi]
      ;[bunbo, bunbo2] = [bunbo2, bunbo]
    }

    let resultN: number, resultD: number
    const kigo = i < 4 ? "+" : "-"

    if (i < 4) {
      ;[resultN, resultD] = bunsuAdd(bunshi, bunbo, bunshi2, bunbo2)
    } else {
      ;[resultN, resultD] = bunsuMinus(bunshi, bunbo, bunshi2, bunbo2)
    }
    ;[resultN, resultD] = reduceFraction(resultN, resultD)

    problems.push(`<div class="jf-row">${BANGOU[i + 10]}　${fracHtml(bunshi, bunbo)}　${kigo}　${fracHtml(bunshi2, bunbo2)}　＝<span class="jf-eq"></span></div>`)
    answers.push(resultD !== 1 ? `${resultN}/${resultD}` : `${resultN}`)
  }

  return { problems, answers }
}

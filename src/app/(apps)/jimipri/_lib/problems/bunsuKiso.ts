// 分数（基礎）
// 元: 28_bunsu_kiso.js
// 17問: 真分数/仮分数の分類、帯分数→仮分数、大小比較、同分母の加減

import { CustomResult } from "../types"
import { fracHtml, mixedFracHtml, reduceFraction } from "../bunsuu"
import { BANGOU } from "../constants"
const FUGOU = ["ア", "イ", "ウ", "エ"]

export function generateBunsuKiso(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // ☆問題1: 真分数と仮分数に分ける（4つの分数からア〜エで分類）
  const shinbunsu: string[] = []
  const kabunsu: string[] = []
  let fracDisplay = ""
  for (let i = 0; i < 4; i++) {
    const bunshi = Math.floor(Math.random() * 8 + 2)
    const bunbo = Math.floor(Math.random() * 7 + 3)
    fracDisplay += `${FUGOU[i]}${fracHtml(bunshi, bunbo)}　`
    if (bunshi < bunbo) shinbunsu.push(FUGOU[i])
    else kabunsu.push(FUGOU[i])
  }
  problems.push(`☆次の分数を真分数と仮分数に分けましょう。`)
  problems.push(`<div class="jf-row" style="font-size:6mm;">${fracDisplay}</div>`)
  problems.push(`${BANGOU[0]}真分数は（　　　　）　${BANGOU[1]}仮分数は（　　　　）`)
  answers.push(shinbunsu.join(","))
  answers.push(kabunsu.join(","))

  // ☆問題2: 帯分数→仮分数に直す（4問）
  problems.push(`\n☆次の帯分数を仮分数になおしましょう。`)
  for (let i = 0; i < 4; i++) {
    const bunbo = Math.floor(Math.random() * 7 + 3)
    const bunshi = Math.floor(Math.random() * (bunbo - 1) + 1)
    const tai = Math.floor(Math.random() * 3 + 1)
    const karibunshi = tai * bunbo + bunshi
    problems.push(`<div class="jf-row">${BANGOU[i + 2]}　${mixedFracHtml(tai, bunshi, bunbo)}　＝　　　</div>`)
    answers.push(`${karibunshi}/${bunbo}`)
  }

  // ☆問題3: 大小比較（3問: 帯分数 vs 仮分数）
  problems.push(`\n☆次の数の大きさをくらべ、等号や不等号を使って\n　式に表しましょう。`)
  for (let i = 0; i < 3; i++) {
    const bunbo = Math.floor(Math.random() * 8 + 2)
    let bunshi: number
    if (i === 2) bunshi = 0
    else bunshi = Math.floor(Math.random() * (bunbo - 1) + 1)
    const tai = Math.floor(Math.random() * 3 + 1)
    const mixedVal = tai * bunbo + bunshi
    const bunshi2 = Math.floor(Math.random() * mixedVal + bunbo)

    let sign: string
    if (mixedVal > bunshi2) sign = ">"
    else if (mixedVal < bunshi2) sign = "<"
    else sign = "="

    const leftHtml = bunshi > 0
      ? `${mixedFracHtml(tai, bunshi, bunbo)}`
      : `<span class="jf-whole">${tai}</span>`
    problems.push(`<div class="jf-row">${BANGOU[i + 6]}　${leftHtml}　□　${fracHtml(bunshi2, bunbo)}　　</div>`)
    answers.push(sign)
  }

  // ☆問題4: 同分母の加減（8問: 前半足し算、後半引き算）
  problems.push(`\n☆次の計算をしましょう。`)
  const KIGO = ["+", "+", "+", "+", "-", "-", "-", "-"]

  for (let i = 0; i < 8; i++) {
    let bunshi: number, bunshi2: number, bunbo: number, tai = 0, result: number

    if (i < 3) {
      // 足し算（同分母）
      bunbo = Math.floor(Math.random() * 7 + 3)
      bunshi = Math.floor(Math.random() * (bunbo - 3) + 2)
      bunshi2 = Math.floor(Math.random() * (bunbo - 2) + 1)
      result = bunshi + bunshi2
    } else if (i < 5) {
      // 引き算（同分母）
      bunbo = Math.floor(Math.random() * 5 + 5)
      bunshi = Math.floor(Math.random() * (bunbo - 4) + 3)
      bunshi2 = Math.floor(Math.random() * (bunshi - 2) + 1)
      result = bunshi - bunshi2
    } else {
      // 引き算（帯分数 - 分数）
      bunbo = Math.floor(Math.random() * 5 + 5)
      bunshi2 = Math.floor(Math.random() * (bunbo - 4) + 3)
      bunshi = Math.floor(Math.random() * (bunshi2 - 2) + 1)
      tai = 1
      result = bunbo * tai + bunshi - bunshi2
    }

    const leftHtml = tai > 0
      ? `${mixedFracHtml(tai, bunshi, bunbo)}`
      : `${fracHtml(bunshi, bunbo)}`

    problems.push(`<div class="jf-row">${BANGOU[i + 9]}　${leftHtml}　${KIGO[i]}　${fracHtml(bunshi2, bunbo)}　＝<span class="jf-eq"></span></div>`)
    answers.push(`${result}/${bunbo}`)
  }

  return { problems, answers }
}

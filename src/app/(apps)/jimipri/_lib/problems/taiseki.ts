// 体積
// 元: 29_taiseki.js
// 8つの文章題（しき + こたえ）

import { CustomResult } from "../types"

export function generateTaiseki(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  for (let i = 0; i < 8; i++) {
    const a = Math.floor(Math.random() * 8 + 2)
    const b = Math.floor(Math.random() * 8 + 2)
    const c = Math.floor(Math.random() * 8 + 2)
    const d = Math.floor(Math.random() * 8 + 2)

    let text: string, ans: string
    switch (i) {
      case 0:
      case 1:
        text = `${BANGOU[i]}　1辺の長さが${a}cmの立方体の体積は何cm³ですか？`
        ans = `${a * a * a}cm³`
        break
      case 2:
      case 3:
        text = `${BANGOU[i]}　縦${a}cm、横${b}cm、高さ${c}cmの直方体の体積は何cm³ですか？`
        ans = `${a * b * c}cm³`
        break
      case 4:
        text = `${BANGOU[i]}　底辺${a}cm、高さ${b}cmの直角三角形が底面で、\n　　高さが${c}cmの立体の体積は何cm³ですか？`
        ans = `${(a * b * c) / 2}cm³`
        break
      case 5:
        text = `${BANGOU[i]}　上底${a}cm、下底${b}cm、高さ${c}cmの台形が底面で、\n　　高さが${d}cmの立体の体積は何cm³ですか？`
        ans = `${((a + b) * c / 2) * d}cm³`
        break
      case 6:
        text = `${BANGOU[i]}　半径${a}cmの円が底面で、\n　　高さが${b}cmの円柱の体積は何cm³ですか？`
        ans = `${Math.floor(a * a * b * 314) / 100}cm³`
        break
      case 7:
      default:
        text = `${BANGOU[i]}　直方体の体積が${a * b * c}cm³で、縦${a}cm、横${b}cmのとき、\n　　高さは何cmですか？`
        ans = `${c}cm`
        break
    }

    problems.push(`${text}\n　式\n　　　　　　　　　　答え（　　　　　　　　）`)
    answers.push(ans)
  }

  return { problems, answers }
}

const BANGOU = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"]

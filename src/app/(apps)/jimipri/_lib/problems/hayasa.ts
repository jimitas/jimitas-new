// 速さ
// 元: 35_hayasa.js
// 8つの文章題（しき + こたえ）

import { CustomResult } from "../types"

export function generateHayasa(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  for (let i = 0; i < 8; i++) {
    const a = Math.floor(Math.random() * 8 + 2)
    const b = Math.floor(Math.random() * 8 + 2)
    const c = Math.floor(Math.random() * 4 + 2)

    let text: string, ans: string
    switch (i) {
      case 0:
        text = `${BANGOU[i]}　自動車が時速${a * 10}kmで${b}時間進んだとき、道のりは何kmですか。`
        ans = `${a * b * 10}km`
        break
      case 1:
        text = `${BANGOU[i]}　${a * b}mの道のりを${a}秒で進んだとき、速さは秒速何mですか。`
        ans = `秒速${b}m`
        break
      case 2:
        text = `${BANGOU[i]}　${a * b * 10}mの道のりを分速${a * 10}mで進んだとき、かかった時間は何分ですか。`
        ans = `${b}分`
        break
      case 3:
        text = `${BANGOU[i]}　時速${c * 12}kmは、分速何mですか。`
        ans = `分速${c * 200}m`
        break
      case 4:
        text = `${BANGOU[i]}　秒速${a}mは、時速何kmですか。`
        ans = `時速${(a * 3600) / 1000}km`
        break
      case 5:
        text = `${BANGOU[i]}　時速720kmの飛行機が${b}秒進んだとき、道のりは何kmですか。`
        ans = `${b / 5}km`
        break
      case 6:
        text = `${BANGOU[i]}　${a * 200}mの道のりを12分で進んだとき、速さは時速何kmですか。`
        ans = `時速${a}km`
        break
      case 7:
      default:
        text = `${BANGOU[i]}　${a * b}kmの道のりを時速${a * 10}kmで進んだとき、かかった時間は何分ですか。`
        ans = `${b * 6}分`
        break
    }

    problems.push(`${text}\n　式\n　　　　　　　　　　答え（　　　　　　　　）`)
    answers.push(ans)
  }

  return { problems, answers }
}

const BANGOU = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"]

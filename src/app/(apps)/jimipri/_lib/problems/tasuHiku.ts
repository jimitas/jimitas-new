// たすのかな　ひくのかな
// 元: 10_tasu_hiku.js
// 4つの文章題（しき + こたえ）
// 10種のテンプレートからランダムに4問選出

import { CustomResult } from "../types"

export function generateTasuHiku(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // 10種のテンプレートをシャッフルして4つ選ぶ
  const order = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4)

  for (let i = 0; i < 4; i++) {
    const a = Math.floor(Math.random() * 9 + 2)
    const b = Math.floor(Math.random() * 9 + 2)
    const idx = order[i]

    let text: string, ans: string
    switch (idx) {
      case 0:
        text = `りんごが ${a}こ あります。\n${b}こ もらいました。\nぜんぶで なんこに なりますか。`
        ans = `しき ${a}+${b}=${a + b}　こたえ ${a + b}こ`
        break
      case 1:
        text = `えんぴつが ${a + b}本 あります。\n${b}本 つかいました。\nのこりは なん本ですか。`
        ans = `しき ${a + b}-${b}=${a}　こたえ ${a}本`
        break
      case 2:
        text = `あめが ${a}こ あります。\nおかあさんが ${b}こ くれました。\nぜんぶで なんこですか。`
        ans = `しき ${a}+${b}=${a + b}　こたえ ${a + b}こ`
        break
      case 3:
        text = `おはじきが ${a + b}こ あります。\nおともだちに ${a}こ あげました。\nのこりは なんこですか。`
        ans = `しき ${a + b}-${a}=${b}　こたえ ${b}こ`
        break
      case 4:
        text = `こうえんに こどもが ${a}人 いました。\nあとから ${b}人 きました。\nぜんぶで なん人ですか。`
        ans = `しき ${a}+${b}=${a + b}　こたえ ${a + b}人`
        break
      case 5:
        text = `バスに ${a + b}人 のっていました。\n${b}人 おりました。\nのこりは なん人ですか。`
        ans = `しき ${a + b}-${b}=${a}　こたえ ${a}人`
        break
      case 6:
        text = `はなが ${a}本 さいています。\n${b}本 さきました。\nぜんぶで なん本ですか。`
        ans = `しき ${a}+${b}=${a + b}　こたえ ${a + b}本`
        break
      case 7:
        text = `クッキーが ${a + b}まい あります。\n${a}まい たべました。\nのこりは なんまいですか。`
        ans = `しき ${a + b}-${a}=${b}　こたえ ${b}まい`
        break
      case 8:
        text = `にわに とりが ${a}わ います。\n${b}わ とんできました。\nぜんぶで なんわですか。`
        ans = `しき ${a}+${b}=${a + b}　こたえ ${a + b}わ`
        break
      case 9:
      default:
        text = `おりがみが ${a + b}まい あります。\nおともだちに ${b}まい あげました。\nのこりは なんまいですか。`
        ans = `しき ${a + b}-${b}=${a}　こたえ ${a}まい`
        break
    }

    problems.push(`${BANGOU[i]}　${text}\n　　（しき）\n　　　　　　　　　　　　（こたえ）＿＿＿＿＿`)
    answers.push(ans)
  }

  // 元: answerCreate()を使わず area.innerHTML に直接流し込み（②の後で改行）
  const answerHtml = `
    ①　${answers[0]}
    ②　${answers[1]}<br/>
    ③　${answers[2]}
    ④　${answers[3]}
  `

  return { problems, answers, answerHtml }
}

const BANGOU = ["①", "②", "③", "④"]

function shuffleArray(arr: number[]): number[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

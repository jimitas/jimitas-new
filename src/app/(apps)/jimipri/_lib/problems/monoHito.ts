// ものとひとのかず
// 元: 08_mono_hito.js
// 4つの文章題（しき + こたえ）

import { CustomResult } from "../types"
import { BANGOU } from "../constants"
import { shuffled } from "@/lib/utils"

export function generateMonoHito(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // 4種の問題テンプレートをシャッフル
  const order = shuffled([0, 1, 2, 3])
  const kigoArray = ["-", "+", "+", "-"]
  const taniArray = ["まい", "人", "人", "人"]
  const leftArray: number[] = []
  const rightArray: number[] = []
  const ansArray: string[] = []

  for (let i = 0; i < 4; i++) {
    let a: number, b: number, ans: number
    if (kigoArray[i] === "+") {
      a = Math.floor(Math.random() * 9 + 2)
      b = Math.floor(Math.random() * 9 + 2)
      ans = a + b
    } else {
      a = Math.floor(Math.random() * 9 + 5)
      b = Math.floor(Math.random() * (a - 1) + 2)
      ans = a - b
    }
    leftArray.push(a)
    rightArray.push(b)
    ansArray.push(`しき　${a}${kigoArray[i]}${b}=${ans}　こたえ　${ans}${taniArray[i]}`)
  }

  const texts = [
    `のりものの　けんが　${leftArray[0]}まい　あります。\n${rightArray[0]}人の　こどもに　１まいずつ\nわたすと、なんまい　のこりますか。`,
    `しゃしんを　とります。\n${leftArray[1]}つの　いすに，ひとりずつ　すわり、\nうしろに　${rightArray[1]}人　たちます。\nなん人で　しゃしんを　とりますか。`,
    `ひかるさんは　まえから　${leftArray[2]}ばんめに　ならんでいます。\nひかるさんの　うしろには　${rightArray[2]}人　います。\nみんなで　なん人　ならんで　いますか。`,
    `${leftArray[3]}人　ならんで　います。\nかおるさんは　まえから　${rightArray[3]}ばんめに　います。\nかおるさんの　うしろには　なんにん　いますか。`,
  ]

  for (let i = 0; i < 4; i++) {
    const idx = order[i]
    problems.push(`${BANGOU[i]}　${texts[idx]}\n　　（しき）\n　　　　　　　　　　　　（こたえ）＿＿＿＿＿`)
    answers.push(ansArray[idx])
  }

  // 元: answerCreate()を使わず area.innerHTML に直接流し込み（②の後で改行）
  const answerHtml =
    `①　${ansArray[order[0]]}　　` +
    `②　${ansArray[order[1]]}<br/>` +
    `③　${ansArray[order[2]]}　　` +
    `④　${ansArray[order[3]]}`

  return { problems, answers, answerHtml }
}

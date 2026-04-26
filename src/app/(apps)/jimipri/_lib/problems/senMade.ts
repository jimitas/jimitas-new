// 1000までの数
// 元: 14_1000made.js
// 10問のテキスト穴埋め問題

import { CustomResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateSenMade(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []
  const checkArray: number[] = []

  const ans: number[] = []
  const ans100: number[] = []
  const ans10: number[] = []
  const ans1: number[] = []

  while (checkArray.length < 10) {
    const a = Math.floor(Math.random() * 9 + 1)
    const b = Math.floor(Math.random() * 9 + 1)
    const c = Math.floor(Math.random() * 9 + 1)
    const answer = a * 100 + b * 10 + c

    if (duplicationCheck(answer, checkArray)) {
      checkArray.push(answer)
      ans100.push(a)
      ans10.push(b)
      ans1.push(c)
      ans.push(answer)
    }
  }

  // 問題文を生成
  problems.push(`①　100を${ans100[0]}こ、10を${ans10[0]}こ、1を${ans1[0]}こ\nあわせた　数は　（　　　　）です。`)
  answers.push(ans[0])

  problems.push(`②　100を${ans100[1]}こ、10を${ans10[1]}こ、1を${ans1[1]}こ\nあわせた　数は　（　　　　）です。`)
  answers.push(ans[1])

  problems.push(`③　${ans[2]}は、100を（　　）こ、10を（　　）こ\n１を（　　）こ　あわせた　数です。`)
  answers.push(`100を${ans100[2]}こ,10を${ans10[2]}こ,1を${ans1[2]}こ`)

  problems.push(`④　${ans[3]}は、100を（　　）こ、10を（　　）こ\n１を（　　）こ　あわせた　数です。`)
  answers.push(`100を${ans100[3]}こ,10を${ans10[3]}こ,1を${ans1[3]}こ`)

  problems.push(`⑤　${ans[4] - ans10[4] * 10}は、100を（　　）こ、\n１を（　　）こ　あわせた　数です。`)
  answers.push(`100を${ans100[4]}こ,1を${ans1[4]}こ`)

  problems.push(`⑥　${ans[5] - ans10[5] * 10}は、100を（　　）こ、\n１を（　　）こ　あわせた　数です。`)
  answers.push(`100を${ans100[5]}こ,1を${ans1[5]}こ`)

  problems.push(`⑦　10を　${ans100[6] * 10 + ans10[6]}こ　あつめた　数は、\n（　　　　）です。`)
  answers.push(ans100[6] * 100 + ans10[6] * 10)

  problems.push(`⑧　10を　${ans100[7] * 10 + ans10[7]}こ　あつめた　数は、\n（　　　　）です。`)
  answers.push(ans100[7] * 100 + ans10[7] * 10)

  problems.push(`⑨　${ans100[8] * 100 + ans10[8] * 10}は　10を（　　　）こあつめた数です。`)
  answers.push(`${ans100[8] * 10 + ans10[8]}こ`)

  problems.push(`⑩　${ans100[9] * 100 + ans10[9] * 10}は　10を（　　　）こあつめた数です。`)
  answers.push(`${ans100[9] * 10 + ans10[9]}こ`)

  // 元: answerCreate()を使わず area.innerHTML に直接流し込み
  const answerHtml =
    `①　${ans[0]}　　` +
    `②　${ans[1]}　　` +
    `③　100を${ans100[2]}こ,10を${ans10[2]}こ,1を${ans1[2]}こ　　` +
    `<br/>` +
    `④　100を${ans100[3]}こ,10を${ans10[3]}こ,1を${ans1[3]}こ　　` +
    `⑤　100を${ans100[4]}こ,1を${ans1[4]}こ　` +
    `⑥　100を${ans100[5]}こ,1を${ans1[5]}こ` +
    `<br/>` +
    `⑦　${ans100[6] * 100 + ans10[6] * 10}　　` +
    `⑧　${ans100[7] * 100 + ans10[7] * 10}　　` +
    `⑨　${ans100[8] * 10 + ans10[8]}こ　　` +
    `⑩　${ans100[9] * 10 + ans10[9]}こ`

  return { problems, answers, answerHtml }
}

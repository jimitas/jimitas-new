// 10000までの数
// 元: 18_10000made.js
// 10問のテキスト穴埋め問題

import { CustomResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateManMade(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []
  const checkArray: number[] = []

  const ans: number[] = []
  const ans1000: number[] = []
  const ans100: number[] = []
  const ans10: number[] = []
  const ans1: number[] = []

  while (checkArray.length < 10) {
    const a = Math.floor(Math.random() * 9 + 1)
    const b = Math.floor(Math.random() * 9 + 1)
    const c = Math.floor(Math.random() * 9 + 1)
    const d = Math.floor(Math.random() * 9 + 1)
    const answer = a * 1000 + b * 100 + c * 10 + d

    if (duplicationCheck(answer, checkArray)) {
      checkArray.push(answer)
      ans1000.push(a)
      ans100.push(b)
      ans10.push(c)
      ans1.push(d)
      ans.push(answer)
    }
  }

  problems.push(`①　1000を${ans1000[0]}こ、100を${ans100[0]}こ、10を${ans10[0]}こ、1を${ans1[0]}こ\nあわせた　数は　（　　　　）です。`)
  answers.push(ans[0])

  problems.push(`②　1000を${ans1000[1]}こ、100を${ans100[1]}こ、10を${ans10[1]}こ、1を${ans1[1]}こ\nあわせた　数は　（　　　　）です。`)
  answers.push(ans[1])

  problems.push(`③　${ans[2]}は、1000を（　　）こ、100を（　　）こ、\n10を（　　）こ　１を（　　）こ　あわせた　数です。`)
  answers.push(`${ans1000[2]}こ,${ans100[2]}こ,${ans10[2]}こ,${ans1[2]}こ`)

  problems.push(`④　${ans[3]}は、1000を（　　）こ、100を（　　）こ、\n10を（　　）こ　１を（　　）こ　あわせた　数です。`)
  answers.push(`${ans1000[3]}こ,${ans100[3]}こ,${ans10[3]}こ,${ans1[3]}こ`)

  problems.push(`⑤　${ans[4] - ans100[4] * 100}は、1000を（　　）こ、\n10を（　　）こ、　１を（　　）こ　あわせた　数です。`)
  answers.push(`1000を${ans1000[4]}こ,10を${ans10[4]}こ,1を${ans1[4]}こ`)

  problems.push(`⑥　${ans[5] - ans10[5] * 10}は、1000を（　　）こ、　100を（　　）こ、\n１を（　　）こ　あわせた　数です。`)
  answers.push(`1000を${ans1000[5]}こ,100を${ans100[5]}こ,1を${ans1[5]}こ`)

  problems.push(`⑦　100を　${ans1000[6] * 10 + ans100[6]}こ　あつめた　数は、\n（　　　　）です。`)
  answers.push(ans1000[6] * 1000 + ans100[6] * 100)

  problems.push(`⑧　100を　${ans1000[7] * 10 + ans100[7]}こ　あつめた　数は、\n（　　　　）です。`)
  answers.push(ans1000[7] * 1000 + ans100[7] * 100)

  problems.push(`⑨　${ans1000[8] * 1000 + ans100[8] * 100}は　100を（　　　）こあつめた数です。\nまた、10を（　　　）こあつめた数です。`)
  answers.push(`${ans1000[8] * 10 + ans100[8]}こ、${ans1000[8] * 100 + ans100[8] * 10}こ`)

  problems.push(`⑩　${ans1000[9] * 1000 + ans100[9] * 100}は　100を（　　　）こあつめた数です。\nまた、10を（　　　）こあつめた数です。`)
  answers.push(`${ans1000[9] * 10 + ans100[9]}こ、${ans1000[9] * 100 + ans100[9] * 10}こ`)

  // 元: answerCreate()を使わず area.innerHTML に直接流し込み
  const answerHtml = `
    ①　${ans[0]}
    ②　${ans[1]}
    ③　${ans1000[2]}こ,${ans100[2]}こ,${ans10[2]}こ,${ans1[2]}こ
    ④　${ans1000[3]}こ,${ans100[3]}こ,${ans10[3]}こ,${ans1[3]}こ
    <br/>
    ⑤　1000を${ans1000[4]}こ,10を${ans10[4]}こ,1を${ans1[4]}こ
    ⑥　1000を${ans1000[5]}こ,100を${ans100[5]}こ,1を${ans1[5]}こ
    <br/>
    ⑦　${ans1000[6] * 1000 + ans100[6] * 100}
    ⑧　${ans1000[7] * 1000 + ans100[7] * 100}
    ⑨　${ans1000[8] * 10 + ans100[8]}こ、　${ans1000[8] * 100 + ans100[8] * 10}こ
    ⑩　${ans1000[9] * 10 + ans100[9]}こ、　${ans1000[9] * 100 + ans100[9] * 10}こ
  `

  return { problems, answers, answerHtml }
}

// かさ・長さのたんい
// 元: 19_kasa_nagasa.js
// 15問のテキスト穴埋め問題（単位変換 + 計算）

import { CustomResult } from "../types"

export function generateKasaNagasa(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  const ans: (number | string)[] = []
  const leftVal: number[] = []
  const rightVal: number[] = []

  ans[0] = Math.floor(Math.random() * 9 + 1) * 10
  ans[1] = Math.floor(Math.random() * 9 + 1)
  ans[2] = Math.floor(Math.random() * 9 + 1) * 10 + Math.floor(Math.random() * 9 + 1)
  ans[3] = Math.floor(Math.random() * 9 + 1) * 10 + Math.floor(Math.random() * 9 + 1)
  ans[4] = 100 + Math.floor(Math.random() * 19 + 1)
  ans[5] = 100 + Math.floor(Math.random() * 19 + 1)
  ans[6] = Math.floor(Math.random() * 9 + 1) * 10
  ans[7] = Math.floor(Math.random() * 9 + 1)
  ans[8] = Math.floor(Math.random() * 9 + 1) * 100
  ans[9] = Math.floor(Math.random() * 9 + 1) * 1000

  // 計算問題用の値
  for (let i = 0; i < 5; i++) {
    if (i === 0 || i === 2) {
      leftVal[i] = Math.floor(Math.random() * 9 + 1) * 10 + Math.floor(Math.random() * 8 + 1)
      rightVal[i] = Math.floor(Math.random() * (8 - (leftVal[i] % 10)) + 1)
      ans[10 + i] = leftVal[i] + rightVal[i]
    } else if (i === 1 || i === 3) {
      leftVal[i] = Math.floor(Math.random() * 9 + 1) * 10 + Math.floor(Math.random() * 4 + 5)
      rightVal[i] = Math.floor(Math.random() * ((leftVal[i] % 10) - 1) + 1)
      ans[10 + i] = leftVal[i] - rightVal[i]
    } else {
      leftVal[i] = Math.floor(Math.random() * 8 + 1) * 10 + Math.floor(Math.random() * 9 + 1)
      rightVal[i] = Math.floor(Math.random() * (8 - Math.floor(leftVal[i] / 10)) + 1)
      ans[10 + i] = leftVal[i] + rightVal[i] * 10
    }
  }

  // 問題文
  problems.push(`（　　）に　あてはまる　数を　かきましょう。`)

  problems.push(`①　${(ans[0] as number) / 10}cm=（　　）mm`)
  answers.push(`${ans[0]}mm`)

  problems.push(`②　${(ans[1] as number) * 10}mm=（　　）cm`)
  answers.push(`${ans[1]}cm`)

  problems.push(`③　${Math.floor((ans[2] as number) / 10)}cm${(ans[2] as number) % 10}mm=（　　）mm`)
  answers.push(`${ans[2]}mm`)

  problems.push(`④　${ans[3]}mm=（　　）cm（　　）mm`)
  answers.push(`${Math.floor((ans[3] as number) / 10)}cm${(ans[3] as number) % 10}mm`)

  problems.push(`⑤　${ans[4]}cm=（　　）m（　　）cm`)
  answers.push(`${Math.floor((ans[4] as number) / 100)}m${(ans[4] as number) % 100}cm`)

  problems.push(`⑥　${Math.floor((ans[5] as number) / 100)}m${(ans[5] as number) % 100}cm=（　　）cm`)
  answers.push(`${ans[5]}cm`)

  problems.push(`⑦　${(ans[6] as number) / 10}L=（　　）dL`)
  answers.push(`${ans[6]}dL`)

  problems.push(`⑧　${(ans[7] as number) * 10}dL=（　　）L`)
  answers.push(`${ans[7]}L`)

  problems.push(`⑨　${(ans[8] as number) / 100}dL=（　　）mL`)
  answers.push(`${ans[8]}mL`)

  problems.push(`⑩　${(ans[9] as number) / 1000}L=（　　）mL`)
  answers.push(`${ans[9]}mL`)

  problems.push(`計算を　しましょう。`)

  problems.push(`⑪　${Math.floor(leftVal[0] / 10)}cm${leftVal[0] % 10}mm + ${rightVal[0]}mm`)
  answers.push(`${Math.floor((ans[10] as number) / 10)}cm${(ans[10] as number) % 10}mm`)

  problems.push(`⑫　${Math.floor(leftVal[1] / 10)}cm${leftVal[1] % 10}mm - ${rightVal[1]}mm`)
  answers.push(`${Math.floor((ans[11] as number) / 10)}cm${(ans[11] as number) % 10}mm`)

  problems.push(`⑬　${Math.floor(leftVal[2] / 10)}L${leftVal[2] % 10}dL + ${rightVal[2]}dL`)
  answers.push(`${Math.floor((ans[12] as number) / 10)}L${(ans[12] as number) % 10}dL`)

  problems.push(`⑭　${Math.floor(leftVal[3] / 10)}L${leftVal[3] % 10}dL - ${rightVal[3]}dL`)
  answers.push(`${Math.floor((ans[13] as number) / 10)}L${(ans[13] as number) % 10}dL`)

  problems.push(`⑮　${Math.floor(leftVal[4] / 10)}L${leftVal[4] % 10}dL + ${rightVal[4]}L`)
  answers.push(`${Math.floor((ans[14] as number) / 10)}L${(ans[14] as number) % 10}dL`)

  return { problems, answers }
}

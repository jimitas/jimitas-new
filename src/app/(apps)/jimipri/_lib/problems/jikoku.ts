// 時こくと時間
// 元: 21_jikoku.js
// 10問のテキスト問題

import { CustomResult } from "../types"

export function generateJikoku(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  const lVal: number[] = []
  const rVal: (number | string)[] = []

  for (let i = 0; i < 10; i++) {
    lVal[i] = Math.floor(Math.random() * 9 + 2) * 100 + Math.floor(Math.random() * 5 + 1) * 10
    rVal[i] = Math.floor(Math.random() * 11 + 1) * 5
    const minutes = Math.floor(lVal[i] / 100) * 60 + (lVal[i] % 100)

    switch (i) {
      case 0:
      case 1: { // N分前の時こく
        const tmp = minutes - (rVal[i] as number)
        answers.push(`${Math.floor(tmp / 60)}時${tmp % 60}分`)
        break
      }
      case 2:
      case 3: { // N分あとの時こく
        const tmp = minutes + (rVal[i] as number)
        answers.push(`${Math.floor(tmp / 60)}時${tmp % 60}分`)
        break
      }
      case 4:
      case 5: { // ～から～まで何分
        const tmp = minutes + (rVal[i] as number)
        answers.push(`${rVal[i]}分`)
        rVal[i] = `${Math.floor(tmp / 60)}時${tmp % 60}分`
        break
      }
      case 6: // 1時間N分＝（）分
        answers.push(`${60 + (rVal[i] as number)}分`)
        break
      case 7: // 1分N秒＝（）秒
        answers.push(`${60 + (rVal[i] as number)}秒`)
        break
      case 8: // N秒＝（）分（）秒
        answers.push(`１分${rVal[i]}秒`)
        break
      case 9: { // 午前〜から午後〜まで
        lVal[i] = Math.floor(Math.random() * 2 + 9) * 100 + Math.floor(Math.random() * 5 + 1) * 10
        const min1 = Math.floor(lVal[i] / 100) * 60 + (lVal[i] % 100)
        rVal[i] = Math.floor(Math.random() * 3 + 14) * 100 + Math.floor(Math.random() * 5 + 1) * 10
        const min2 = Math.floor((rVal[i] as number) / 100) * 60 + ((rVal[i] as number) % 100)
        const tmp = min2 - min1
        answers.push(`${Math.floor(tmp / 60)}時間${tmp % 60}分`)
        break
      }
    }
  }

  problems.push(`次の　時こくを　もとめましょう。`)

  problems.push(`①　${Math.floor(lVal[0] / 100)}時${lVal[0] % 100}分の${rVal[0]}分前の時こく（　時　　分）`)
  problems.push(`②　${Math.floor(lVal[1] / 100)}時${lVal[1] % 100}分の${rVal[1]}分前の時こく（　時　　分）`)
  problems.push(`③　${Math.floor(lVal[2] / 100)}時${lVal[2] % 100}分から${rVal[2]}分あとの時こく（　時　　分）`)
  problems.push(`④　${Math.floor(lVal[3] / 100)}時${lVal[3] % 100}分から${rVal[3]}分あとの時こく（　時　　分）`)
  problems.push(`⑤　${Math.floor(lVal[4] / 100)}時${lVal[4] % 100}分から${rVal[4]}まで（　　分）`)
  problems.push(`⑥　${Math.floor(lVal[5] / 100)}時${lVal[5] % 100}分から${rVal[5]}まで（　　分）`)
  problems.push(`⑦　１時間${rVal[6]}分＝（　　分）`)
  problems.push(`⑧　１分${rVal[7]}秒＝（　　秒）`)
  problems.push(`⑨　${(rVal[8] as number) + 60}秒＝（　分　　秒）`)
  problems.push(`⑩　午前${Math.floor(lVal[9] / 100)}時${lVal[9] % 100}分から午後${Math.floor((rVal[9] as number) / 100) - 12}時${(rVal[9] as number) % 100}分まで\n（　　時間　　分）`)

  return { problems, answers }
}

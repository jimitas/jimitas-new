// 単位量あたりの大きさ
// 元: 33_taniryouatari.js
// 5つの文章題（しき + こたえ）

import { CustomResult } from "../types"

export function generateTaniryou(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  const a = Math.floor(Math.random() * 4 + 5)
  let b = Math.floor(Math.random() * 4 + 4)
  if (a === b) b = b + 1
  const c = Math.floor(Math.random() * 4 + 5)
  let d = Math.floor(Math.random() * 4 + 4)
  if (c === d) d = d + 1
  const f = Math.floor(Math.random() * 20 + 11)
  const g = Math.floor(Math.random() * 20 + 11)

  // ①みかんの比較
  const perA = 480 / a
  const perB = 360 / b
  let ans1: string
  if (perA > perB) ans1 = "Aのみかん"
  else if (perA < perB) ans1 = "Bのみかん"
  else ans1 = "同じ"

  problems.push(`①　Aのみかんは${a}こで480円、Bのみかんは${b}こで360円です。\n　１こあたりのねだんが高いのはどちらのみかんですか。\n　しき\n　　　　　　　　　　こたえ（　　　　　　　　　　）`)
  answers.push(ans1)

  // ②読書の比較
  const perC = 240 / c
  const perD = 200 / d
  let ans2: string
  if (perC > perD) ans2 = "Cさん"
  else if (perC < perD) ans2 = "Dさん"
  else ans2 = "同じ"

  problems.push(`②　Cさんは240ページの本を${c}日で読み、\n　Dさんは200ページの本を${d}日で読みました。\n　１日あたりの読んだページ数が多いのはどちらですか。\n　しき\n　　　　　　　　　　こたえ（　　　　　　　　　　）`)
  answers.push(ans2)

  // ③人口密度
  const e = Math.floor(Math.random() * 20 + 11)
  const perE = Math.floor((e * 1200) / 120)
  problems.push(`③　E町の面積は 120 ㎢で、人口は ${e * 1200}人います。\n　この町の人口密度を（四捨五入して、整数で）求めなさい。\n　しき\n　　　　　　　　　　こたえ（　　　　　　　　　　）`)
  answers.push(`${perE}人`)

  // ④球根
  problems.push(`④　花だんに、１㎡あたり12個の球根を植えます。\n　${f}㎡の花だんでは、球根は何個植えられますか。\n　しき\n　　　　　　　　　　こたえ（　　　　　　　　　　）`)
  answers.push(`${f * 12}個`)

  // ⑤ガソリン
  problems.push(`⑤　１Lのガソリンで18km走る車があります。\n　この車が${18 * g}km走るには、何Lのガソリンが必要ですか。\n　しき\n　　　　　　　　　　こたえ（　　　　　　　　　　）`)
  answers.push(`${g}L`)

  return { problems, answers }
}

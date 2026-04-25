// ひょう・グラフ
// 元: 12_hyou_graph.js
// 10問: どうぶつの数をかぞえて表・グラフにする（テキスト版）
// 元は画像でどうぶつを表示していたが、プリント版はテキストで出題

import { CustomResult } from "../types"

const ANIMALS = ["いぬ", "かえる", "うま", "さる"]

export function generateHyouGraph(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // 各動物の数をランダムに決定（2〜8、重複なし）
  const order = shuffleArray([2, 3, 4, 5, 6, 7, 8])
  const counts = [order[0], order[1], order[2], order[3]]

  const maxCount = Math.max(...counts)
  const maxIdx = counts.indexOf(maxCount)
  const minCount = Math.min(...counts)
  const minIdx = counts.indexOf(minCount)

  // どうぶつの数をテキストで表示（ひらがなの名前をランダムに並べる）
  problems.push(`どうぶつの　かずを　しらべます。`)

  // 動物をランダムに並べた文字列を生成
  const allAnimals: string[] = []
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < counts[i]; j++) {
      allAnimals.push(ANIMALS[i])
    }
  }
  // シャッフル
  const shuffled = shuffleStringArray(allAnimals)
  // 1行10匹ずつ表示
  const lines: string[] = []
  for (let i = 0; i < shuffled.length; i += 8) {
    lines.push(shuffled.slice(i, i + 8).join("　"))
  }
  problems.push(lines.join("\n"))

  // 表に記入する問題
  problems.push(`☆　どうぶつの　かずを　ひょうに　かきましょう。`)
  problems.push(`┌────┬───┬───┬───┬───┐\n│どうぶつ│いぬ　│かえる│うま　│さる　│\n├────┼───┼───┼───┼───┤\n│かず　　│①　　│②　　│③　　│④　　│\n└────┴───┴───┴───┴───┘`)

  answers.push(`${counts[0]}`)
  answers.push(`${counts[1]}`)
  answers.push(`${counts[2]}`)
  answers.push(`${counts[3]}`)

  // グラフに記入する問題
  problems.push(`☆　どうぶつの　かずを　●をつかって、\n　グラフに　かきましょう。`)

  // テキストでグラフ枠を表示
  let graphLines = ""
  for (let row = 8; row >= 1; row--) {
    const line = ANIMALS.map((_, idx) => counts[idx] >= row ? "●" : "　").join("│")
    graphLines += `│${line}│\n`
  }
  graphLines += `├──┼──┼──┼──┤\n│⑤　│⑥　│⑦　│⑧　│\n│いぬ│かえる│うま│さる│`
  problems.push(graphLines)

  // ⑤〜⑧はグラフの確認（採点不要）
  answers.push("グラフを確認してください")
  answers.push("グラフを確認してください")
  answers.push("グラフを確認してください")
  answers.push("グラフを確認してください")

  // ⑨いちばん多い動物
  problems.push(`⑨　いちばん　おおい　どうぶつは　なんですか。\n　　　　　　　　（　　　　　　　）`)
  answers.push(ANIMALS[maxIdx])

  // ⑩差の問題
  problems.push(`⑩　${ANIMALS[maxIdx]}は　${ANIMALS[minIdx]}より　なんびき　おおいですか。\n　　　　　　　　（　　　　　ひき）`)
  answers.push(`${maxCount - minCount}ひき`)

  return { problems, answers }
}

function shuffleArray(arr: number[]): number[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function shuffleStringArray(arr: string[]): string[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

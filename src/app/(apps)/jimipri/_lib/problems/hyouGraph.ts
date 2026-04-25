// ひょう・グラフ
// 元: 12_hyou_graph.js
// どうぶつの数をかぞえて表・グラフにする
// 元は画像+HTMLテーブルで表示 → HTML文字列で忠実に再現

import { CustomResult } from "../types"

const ANIMAL_NAMES = ["いぬ", "かえる", "うま", "さる"]
const ANIMAL_FILES = ["dog", "frog", "horse", "monkey"]

export function generateHyouGraph(): CustomResult {
  const problems: string[] = []
  const answers: (number | string)[] = []

  // 各動物の数をランダムに決定（2〜8、重複なし）
  const pool = [2, 3, 4, 5, 6, 7, 8]
  const shuffled = shuffleArray(pool)
  const counts = [shuffled[0], shuffled[1], shuffled[2], shuffled[3]]

  const maxCount = Math.max(...counts)
  const maxIdx = counts.indexOf(maxCount)
  const minCount = Math.min(...counts)
  const minIdx = counts.indexOf(minCount)

  // --- 動物画像エリア（元: #animal_field） ---
  let animalImgs = ""
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < counts[i]; j++) {
      animalImgs += `<img src="/images/${ANIMAL_FILES[i]}.png" style="display:inline-block;width:50px;height:50px;margin:2px;" />`
    }
  }
  problems.push(
    `<h3>　どうぶつの　かずを　しらべます。</h3>` +
    `<div style="width:100%;height:200px;border:solid 1px gray;padding:20px;">${animalImgs}</div>` +
    `<br/>`
  )

  // --- 表の問題（元: animal_TBL） ---
  // 元: td.classList.add("animal_td"), 行1 height:30px, 行2 height:50px
  const tableItems = [
    "どうぶつ", "いぬ", "かえる", "うま", "さる",
    "かず", "①　　　　　", "②　　　　　", "③　　　　　", "④　　　　　",
  ]
  let tableHtml = `<h4>☆　どうぶつの　かずを　下の　ひょうに　かきましょう。</h4>`
  tableHtml += `<h5 style="text-align:center;">どうぶつの　かずしらべ</h5>`
  tableHtml += `<table>`
  for (let i = 0; i < 2; i++) {
    tableHtml += `<tr>`
    for (let j = 0; j < 5; j++) {
      const h = i === 0 ? 30 : 50
      tableHtml += `<td class="animal_td" style="height:${h}px;">${tableItems[i * 5 + j]}</td>`
    }
    tableHtml += `</tr>`
  }
  tableHtml += `</table><br/>`
  problems.push(tableHtml)

  answers.push(counts[0])
  answers.push(counts[1])
  answers.push(counts[2])
  answers.push(counts[3])

  // --- グラフの問題 + テキスト問題（元: flex レイアウト） ---
  // 元: 左60%にテキスト問題、右にグラフテーブル
  // グラフテーブル: 9行×4列、最終行は高さ80px+縦書き
  let graphTable = `<table>`
  const bangou = ["⑤", "⑥", "⑦", "⑧"]
  for (let i = 0; i < 9; i++) {
    graphTable += `<tr>`
    for (let j = 0; j < 4; j++) {
      if (i === 8) {
        graphTable += `<td style="width:60px;height:80px;border:solid 1px black;padding-top:5px;writing-mode:vertical-rl;">${bangou[j]}${ANIMAL_NAMES[j]}</td>`
      } else {
        graphTable += `<td style="width:60px;height:40px;border:solid 1px black;"></td>`
      }
    }
    graphTable += `</tr>`
  }
  graphTable += `</table>`

  const flexHtml =
    `<div style="display:flex;">` +
      `<div style="width:60%;margin-right:20px;">` +
        `<h4>☆　どうぶつの　かずを<br/>　●を　つかって、右のグラフに　<br/>　かきましょう。</h4>` +
        `<br/>` +
        `<h4>⑨　いちばん　おおい<br/>　どうぶつは　なんですか。</h4>` +
        `<h3 style="text-align:right;">(　　　　　　　)</h3>` +
        `<br/>` +
        `<h4>⑩　${ANIMAL_NAMES[maxIdx]}は　${ANIMAL_NAMES[minIdx]}より<br/>　なんびき　おおいですか。</h4>` +
        `<h3 style="text-align:right;">(　　　　　ひき)</h3>` +
      `</div>` +
      `<div style="margin-left:auto;">${graphTable}</div>` +
    `</div>`
  problems.push(flexHtml)

  // ⑤〜⑧はグラフの確認
  answers.push("グラフを確認")
  answers.push("グラフを確認")
  answers.push("グラフを確認")
  answers.push("グラフを確認")
  // ⑨⑩
  answers.push(ANIMAL_NAMES[maxIdx])
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

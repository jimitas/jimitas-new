// ======================================================
// コード例の型とタグ索引
//
// 行番号はどこにも書かない。
// コードを1行足しただけで全部ずれ、しかも「無言で間違った行が光る」ため。
// かわりに各行に意味ラベル（CodeTag）を付け、
// ステップの codeTag と一致した行を光らせる。
//
// これで「言語ごとに行数がちがう」問題が消える。
// タグは結合キーであって1対1対応ではないので、
//   Python  : data[i], data[saisho] = data[saisho], data[i]   … 1行が swap
//   疑似言語: tmp = Data[i] / Data[i] = ... / Data[saisho]=tmp … 3行が swap
// のように行数がちがっても、同じタグでまとめて光らせられる。
// ======================================================

import type { AlgoId, CodeTag, LangId } from "../types"

/** コード1行ぶん。text には行頭の空白（インデント）もそのまま入れる */
export type CodeLine = {
  text: string
  /** この行が担う処理。省略した行は光らない（閉じ括弧・空行など） */
  tag?: CodeTag
}

export type CodeSample = readonly CodeLine[]

/** アルゴリズム × 言語 → コード。Record なので追加忘れが型エラーになる */
export type CodeBook = Record<AlgoId, Record<LangId, CodeSample>>

/** codeTag → その言語で光らせる行番号（0始まり）の一覧 */
export type TagIndex = Partial<Record<CodeTag, readonly number[]>>

/** コード例から索引を作る。言語ごとに1回だけ作れば足りる */
export function buildTagIndex(sample: CodeSample): TagIndex {
  const index: Partial<Record<CodeTag, number[]>> = {}
  sample.forEach((line, i) => {
    if (!line.tag) return
    ;(index[line.tag] ??= []).push(i)
  })
  return index
}

/** コード例に出てくるタグの一覧（テストで使う） */
export function tagsOf(sample: CodeSample): Set<CodeTag> {
  const set = new Set<CodeTag>()
  for (const line of sample) if (line.tag) set.add(line.tag)
  return set
}

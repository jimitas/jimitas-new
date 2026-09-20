// ======================================================
// コード例の登録表
//
// CodeBook は Record<AlgoId, ...> なので、AlgoId にアルゴリズムを
// 1つ足すとここが型エラーになる。コード例の書き忘れが起きない。
// ======================================================

import { binaryCode } from "./binary"
import { bubbleCode } from "./bubble"
import { exchangeCode } from "./exchange"
import { insertionCode } from "./insertion"
import { linearCode } from "./linear"
import { mergeCode } from "./merge"
import { quickCode } from "./quick"
import { selectionCode } from "./selection"
import type { CodeBook } from "./types"

export const CODE_BOOK: CodeBook = {
  selection: selectionCode,
  bubble: bubbleCode,
  insertion: insertionCode,
  exchange: exchangeCode,
  linear: linearCode,
  binary: binaryCode,
  quick: quickCode,
  merge: mergeCode,
}

export { buildTagIndex, tagsOf } from "./types"
export type { CodeLine, CodeSample, TagIndex } from "./types"

/** 言語タブの表示名 */
export const LANG_LABEL = {
  python: "Python",
  javascript: "JavaScript",
  kyotsu: "共通テスト表記",
} as const

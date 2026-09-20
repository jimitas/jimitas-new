// ======================================================
// アルゴリズムシミュレーターのテスト用ヘルパー
//
// 「テストが通っている ≠ テストが機能している」ので、
// ここには“壊したら必ず落ちる”不変条件だけを置く。
// 各不変条件がどんな壊し方を検出するかはコメントに書いてある。
//
// このファイル名は *.test.ts ではないので jest の対象にならない。
// ======================================================

import { makeRng } from "@/app/(apps)/algorithm/_lib/random"
import type { AlgoId, CodeTag, Step } from "@/app/(apps)/algorithm/_lib/types"
import { ALGOS, generateSteps } from "@/app/(apps)/algorithm/_lib/algorithms"

/** テストに使う入力の一覧。名前つきで出すと、失敗時にどの並びかが分かる */
export function sortCases(): { name: string; input: number[] }[] {
  const cases: { name: string; input: number[] }[] = [
    { name: "空", input: [] },
    { name: "1要素", input: [7] },
    { name: "2要素（逆順）", input: [2, 1] },
    { name: "固定6要素", input: [5, 3, 8, 1, 9, 2] },
    { name: "全部同じ", input: [4, 4, 4, 4, 4] },
    { name: "ソート済み", input: [1, 2, 3, 4, 5, 6, 7, 8] },
    { name: "逆順", input: [8, 7, 6, 5, 4, 3, 2, 1] },
    { name: "重複あり", input: [3, 1, 3, 2, 1, 2] },
  ]

  // シード固定の乱数を30本。Math.random() を使わないので毎回同じ入力になる
  const rng = makeRng(20260920)
  for (let t = 0; t < 30; t++) {
    const n = 1 + Math.floor(rng() * 20)
    const input = Array.from({ length: n }, () => 1 + Math.floor(rng() * 99))
    cases.push({ name: `乱数#${t}(n=${n})`, input })
  }
  return cases
}

/** 多重集合（要素の出現回数）が同じか */
export function sameMultiset(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  const x = [...a].sort((p, q) => p - q)
  const y = [...b].sort((p, q) => p - q)
  return x.every((v, i) => v === y[i])
}

export function isAscending(a: readonly number[]): boolean {
  for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false
  return true
}

/**
 * 「本当の中身」を取り出す。
 *
 * 挿入ソートは値を tmp に取り出してからずらすので、その途中は
 * 配列の中に同じ値が2つ見える（あいた場所にまだ古い値が残っている）。
 * あいた場所（gap）に 手に持っている値（held）を戻せば、
 * どの瞬間でも中身は元の配列と同じになる。
 *
 * この形なら「取り出している最中は検査しない」と逃げずに、
 * **全ステップで**多重集合不変を要求できる。
 */
export function effectiveArray(s: Step): number[] {
  const a = [...s.array]
  if (s.held !== undefined && s.gap !== undefined) a[s.gap] = s.held
  return a
}

/**
 * ソート生成器の不変条件をまとめて確認する。
 *
 * 1. 最後のステップの配列が昇順          … 交換処理を消すと落ちる
 * 2. 全ステップで多重集合が変わらない    … 片側代入だけの swap で落ちる
 * 3. カウンタが実際の操作回数と一致      … カウントの数え漏れ・二重計上で落ちる
 * 4. 添字がすべて範囲内                  … j <= n のような境界ミスで落ちる
 * 5. 最後に全要素が確定している          … mark の忘れで落ちる
 */
export function expectSortInvariants(algoId: AlgoId, input: readonly number[]): Step[] {
  const steps = generateSteps(algoId, input)
  const n = input.length

  expect(steps.length).toBeGreaterThan(0)

  // 1. 昇順で終わる
  const last = steps[steps.length - 1]
  expect(last.kind).toBe("done")
  expect(isAscending(last.array)).toBe(true)

  // 2. 多重集合不変（in-place 族。マージソートは段階4で条件を分ける）
  //    取り出している最中は gap に held を戻してから見る
  for (const [k, s] of steps.entries()) {
    if (!sameMultiset(effectiveArray(s), input)) {
      throw new Error(`ステップ ${k}（${s.kind}）で要素が変わった: ${JSON.stringify(s.array)}`)
    }
  }

  // 2b. 手の後始末。取り出したまま終わる／持っていないのに穴がある、を防ぐ
  for (const [k, s] of steps.entries()) {
    if ((s.held === undefined) !== (s.gap === undefined)) {
      throw new Error(`ステップ ${k}（${s.kind}）で held と gap がちぐはぐ`)
    }
  }
  expect(last.held).toBeUndefined()
  expect(last.gap).toBeUndefined()

  // 3. カウンタ整合＋単調非減少
  let compares = 0
  let swaps = 0
  for (const [k, s] of steps.entries()) {
    if (s.kind === "compare") compares++
    if (s.kind === "swap" || s.kind === "shift" || s.kind === "write") swaps++
    expect([k, s.compares, s.swaps]).toEqual([k, compares, swaps])
    if (k > 0) {
      expect(s.compares).toBeGreaterThanOrEqual(steps[k - 1].compares)
      expect(s.swaps).toBeGreaterThanOrEqual(steps[k - 1].swaps)
    }
  }

  // 4. 添字が範囲内
  for (const [k, s] of steps.entries()) {
    const indices: number[] = []
    if (s.compared) indices.push(...s.compared)
    if (s.swapped) indices.push(...s.swapped)
    if (s.wrote !== undefined) indices.push(s.wrote)
    if (s.marked !== undefined) indices.push(s.marked)
    indices.push(...Object.values(s.pointers))
    if (s.range) indices.push(s.range.lo, s.range.hi)
    for (const idx of indices) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= n) {
        throw new Error(`ステップ ${k}（${s.kind}）の添字 ${idx} が 0..${n - 1} の外`)
      }
    }
  }

  // 5. 最後に全部確定している
  expect(last.sorted.length).toBe(n)

  return steps
}

/** 探索テスト用のならんだ配列。二分探索にもそのまま渡せる */
export function searchCases(): number[][] {
  return sortCases().map(({ input }) => [...input].sort((a, b) => a - b))
}

/**
 * そのアルゴリズムが実際に出したタグの集合。
 *
 * 探索は「ある値」と「ない値」の両方を試さないと
 * found と notfound がそろわない。
 * また二分探索はならんでいる配列しか受けつけないので、入力も分ける。
 */
export function emittedTags(algoId: AlgoId): Set<CodeTag> {
  const tags = new Set<CodeTag>()
  const isSearch = ALGOS[algoId].category === "search"

  if (!isSearch) {
    for (const { input } of sortCases()) {
      for (const s of generateSteps(algoId, input)) tags.add(s.codeTag)
    }
    return tags
  }

  for (const input of searchCases()) {
    const targets =
      input.length > 0
        ? [input[0], input[input.length - 1], input[Math.floor(input.length / 2)], 1000]
        : [1000]
    for (const target of targets) {
      for (const s of generateSteps(algoId, input, { target })) tags.add(s.codeTag)
    }
  }
  return tags
}

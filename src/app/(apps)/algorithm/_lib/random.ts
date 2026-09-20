// ======================================================
// アルゴリズムシミュレーター — 配列のデータ生成
//
// なぜシード固定の擬似乱数を使うか:
//   1. page.tsx は "use client" でも SSR される。初期 state に
//      Math.random() を書くとサーバとクライアントで配列が食い違う
//   2. 段階3の計算量グラフは、毎回ギザギザが変わると読めないし
//      テストもできない
//   3. 単体テストで「同じ入力なら同じステップ列」を固定できる
//
// 「シャッフル」ボタンのように利用者が明示的に振り直すときだけ、
// 呼び出し側が seed を変える。ここでは Math.random() を使わない。
// ======================================================

import type { DataKind } from "./types"

/** mulberry32。短いのに分布が素直で、シード固定の用途に十分 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates。渡された配列は書きかえない */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** バーの高さに使う値の上限。1〜99 の中から重複なしで選ぶ */
const MAX_VALUE = 99

/**
 * 表示用のデータを作る。
 *
 * 値は 1〜99 から重複なしで選ぶ（"same" を除く）。
 * 同じ高さのバーが並ぶと「どちらが動いたか」が読めなくなるため。
 */
export function makeData(n: number, kind: DataKind, seed: number): number[] {
  if (n <= 0) return []

  if (kind === "same") {
    // 全部同じ値。比較はするが交換が起きないことを見せるための並び
    return Array<number>(n).fill(50)
  }

  const rng = makeRng(seed)
  const pool = Array.from({ length: MAX_VALUE }, (_, i) => i + 1)
  const picked = shuffle(pool, rng).slice(0, Math.min(n, MAX_VALUE))

  // n が 99 を超える場合はここで足りなくなるが、UI 側の上限が 50 なので届かない。
  // 万一届いたときに黙って短い配列を返さないよう、足りない分は詰めておく。
  while (picked.length < n) picked.push(picked[picked.length % MAX_VALUE])

  switch (kind) {
    case "random":
      return picked

    case "reverse":
      return [...picked].sort((a, b) => b - a)

    case "nearly": {
      // ほぼ整列済み。隣どうしの入れかえを少しだけ混ぜる
      const arr = [...picked].sort((a, b) => a - b)
      const swaps = Math.max(1, Math.floor(n / 10))
      for (let s = 0; s < swaps; s++) {
        const i = Math.floor(rng() * (arr.length - 1))
        ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
      }
      return arr
    }
  }
}

/** 二分探索のようにソート済みが前提のアルゴリズム用 */
export function sortedCopy(items: readonly number[]): number[] {
  return [...items].sort((a, b) => a - b)
}

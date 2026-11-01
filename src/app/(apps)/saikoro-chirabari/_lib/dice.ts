// ======================================================
// さいころの散らばり — さいころをふる部分
//
//   A方式：さいころ2個の「合計」（2〜12。7 が出やすい山の形）
//   B方式：さいころ1個の目を「2倍」（2,4,6,8,10,12 が同じ確率）
//
// 乱数は引数で受け取る（Rng）。
//   画面では Math.random を渡し、テストではシード固定の makeRng を渡す。
//   シードは画面には出さない（2026-11-01 オーナー決定）。
// ======================================================

export type Method = "A" | "B"
export type Rng = () => number

/** mulberry32（algorithm アプリと同じもの）。テストで結果を固定するために使う */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** さいころ1個（1〜6） */
export function rollDie(rng: Rng): number {
  // rng() が万一 1 を返しても 7 にならないよう上限で止める
  return Math.min(6, Math.floor(rng() * 6) + 1)
}

/** 1回ぶんの得点（どちらの方式も 2〜12） */
export function rollScore(method: Method, rng: Rng): number {
  return method === "A" ? rollDie(rng) + rollDie(rng) : rollDie(rng) * 2
}

/** n回ぶんの得点 */
export function rollMany(method: Method, n: number, rng: Rng): number[] {
  const out: number[] = new Array(n)
  for (let i = 0; i < n; i++) out[i] = rollScore(method, rng)
  return out
}

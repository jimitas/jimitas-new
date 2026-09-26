// ガチャ確率シミュレーターの計算部分のテスト
// 移植元リポジトリの test.js（node test.js・66件）を jest に書き換えたもの。
// 期待値・許容誤差は原本のまま。
import * as M from "@/app/(apps)/gacha-kakuritu/_lib/gachaMath"

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol

function sum(arr: ArrayLike<number>): number {
  let s = 0
  for (let i = 0; i < arr.length; i++) s += arr[i]
  return s
}

/** 配列の値を順に返す rng（テスト用）。尽きたら 0.999 */
function seq(values: number[]): M.Rng {
  let i = 0
  return () => (i < values.length ? values[i++] : 0.999)
}

describe("1回以上当たる確率", () => {
  test("pAtLeastOne(0.01,100) ≈ 0.634", () => expect(near(M.pAtLeastOne(0.01, 100), 0.634, 1e-4)).toBe(true))
  test("pAtLeastOne(0.05,20) ≈ 0.642", () => expect(near(M.pAtLeastOne(0.05, 20), 0.6415, 1e-4)).toBe(true))
  test("pAtLeastOne(1,N) === 1", () => expect(M.pAtLeastOne(1, 5)).toBe(1))
  test("pAtLeastOne(1e-5,1) ≈ 1e-5（log1p 精度）", () => expect(near(M.pAtLeastOne(1e-5, 1), 1e-5, 1e-12)).toBe(true))
  test("pNone + pAtLeastOne = 1", () =>
    expect(near(M.pNone(0.01, 100) + M.pAtLeastOne(0.01, 100), 1, 1e-12)).toBe(true))
  test("pNone(1,N) === 0", () => expect(M.pNone(1, 3)).toBe(0))
})

describe("二項分布", () => {
  describe.each([[0.01, 100], [0.5, 10000], [1e-5, 10000], [0.3, 1], [0.999, 500]])("binomialPmf(%p, %p)", (p, N) => {
    const pmf = M.binomialPmf(p, N)
    test("合計が 1", () => expect(near(sum(pmf), 1, 1e-9)).toBe(true))
    test("[0] === pNone", () => expect(near(pmf[0], M.pNone(p, N), 1e-12)).toBe(true))
    test("NaN を含まない", () => expect(Array.from(pmf).some((v) => Number.isNaN(v))).toBe(false))
  })
  test("binomialPmf(p=1)[N] === 1", () => {
    const pmf = M.binomialPmf(1, 50)
    expect(pmf[50]).toBe(1)
    expect(sum(pmf)).toBe(1)
  })
  test("binomialPmf(0.01,100)[1] ≈ 0.3697", () => expect(near(M.binomialPmf(0.01, 100)[1], 0.36973, 1e-4)).toBe(true))
})

describe("幾何分布・バケット", () => {
  const edges = M.bucketEdges(100)
  test("bucketEdges(100) は 10 区間", () => {
    expect(edges.length).toBe(10)
    expect(edges[0][0]).toBe(1)
    expect(edges[9][1]).toBe(100)
  })
  test("bucketEdges(1) は [[1,1]]", () => expect(M.bucketEdges(1)).toEqual([[1, 1]]))
  test("bucketEdges(7) は幅1で7区間", () => expect(M.bucketEdges(7).length).toBe(7))
  test("bucketEdges(95) の最終区間は 91..95", () => expect(M.bucketEdges(95).at(-1)).toEqual([91, 95]))
  test.each([0.01, 0.5, 1, 1e-5])("geometricBucketMass(%p) + 出ず = 1", (p) =>
    expect(near(sum(M.geometricBucketMass(p, edges)) + M.pNone(p, 100), 1, 1e-12)).toBe(true))
  test("geometricBucketMass(1) は先頭区間に全部", () => expect(M.geometricBucketMass(1, edges)[0]).toBe(1))
  test("geometricCdf(0.01,69) >= 0.5 かつ (68) < 0.5", () => {
    expect(M.geometricCdf(0.01, 69)).toBeGreaterThanOrEqual(0.5)
    expect(M.geometricCdf(0.01, 68)).toBeLessThan(0.5)
  })
  test("medianFirstHit(0.01) === 69", () => expect(M.medianFirstHit(0.01)).toBe(69))
  test("medianFirstHit(0.5) === 1", () => expect(M.medianFirstHit(0.5)).toBe(1))
  test("medianFirstHit(1) === 1", () => expect(M.medianFirstHit(1)).toBe(1))
  test("medianFirstHit(0.03) === 23", () => expect(M.medianFirstHit(0.03)).toBe(23))
  test("meanFirstHit(0.01) === 100", () => expect(M.meanFirstHit(0.01)).toBe(100))
})

describe("runSession（決定的 rng）", () => {
  test("rng=()=>0 → 全当たり, 初当たり1", () => expect(M.runSession(0.01, 5, () => 0)).toEqual({ hits: 5, firstHit: 1 }))
  test("rng=()=>0.999 → 当たりなし", () => expect(M.runSession(0.01, 5, () => 0.999)).toEqual({ hits: 0, firstHit: 0 }))
  test("決まった列 → hits 2, firstHit 2", () =>
    expect(M.runSession(0.1, 6, seq([0.5, 0.05, 0.9, 0.01, 0.5, 0.5]))).toEqual({ hits: 2, firstHit: 2 }))
  test("p=1 なら rng=0.999 でも全当たり", () => expect(M.runSession(1, 3, () => 0.999).hits).toBe(3))
})

describe("集計器の不変条件", () => {
  const st = M.createStats(0.01, 10)
  M.addSession(st, { hits: 0, firstHit: 0 })
  M.addSession(st, { hits: 2, firstHit: 3 })
  M.addSession(st, { hits: 1, firstHit: 10 })
  test("sessions === 3", () => expect(st.sessions).toBe(3))
  test("sessionsWithHit === 2", () => expect(st.sessionsWithHit).toBe(2))
  test("totalHits === 3", () => expect(st.totalHits).toBe(3))
  test("hitsHist[0] === sessions - sessionsWithHit", () => expect(st.hitsHist[0]).toBe(st.sessions - st.sessionsWithHit))
  test("sum(firstHitHist) === sessions", () => expect(sum(st.firstHitHist)).toBe(st.sessions))
  test("sum(hitsHist) === sessions", () => expect(sum(st.hitsHist)).toBe(st.sessions))
  test("firstHitHist[0] === hitsHist[0]（出ず = 0回）", () => expect(st.firstHitHist[0]).toBe(st.hitsHist[0]))
  test("observedMedianFirstHit → 10（3回目・10回目・出ず の中央）", () => expect(M.observedMedianFirstHit(st)).toBe(10))
  test("observedMedianFirstHit(空) → 0", () => expect(M.observedMedianFirstHit(M.createStats(0.01, 10))).toBe(0))
  test("bucketize → [1,1]", () => expect(M.bucketize(st.firstHitHist, M.bucketEdges(10, 2))).toEqual([1, 1]))
})

describe("統計スモーク（ランダム。約4σの許容）", () => {
  const p = 0.01, N = 100, S = 20000
  const st = M.createStats(p, N)
  for (let i = 0; i < S; i++) M.addSession(st, M.runSession(p, N))
  test("1回以上の割合 ≈ 0.634", () => expect(near(st.sessionsWithHit / st.sessions, 0.634, 0.015)).toBe(true))
  test("1回ごとの当たり率 ≈ 0.01", () => expect(near(st.totalHits / (st.sessions * N), 0.01, 0.0005)).toBe(true))
  test("hitsHist[0] === sessions - sessionsWithHit（ランダム）", () =>
    expect(st.hitsHist[0]).toBe(st.sessions - st.sessionsWithHit))
})

describe("整形", () => {
  test.each([
    [0.634, "63.4%"],
    [0.01, "1.0%"],
    [0.0102, "1.02%"],
    [0.00001, "0.001%"],
    [1, "100.0%"],
    [0, "0%"],
    [NaN, "―"],
  ])("formatPercent(%p) → %s", (x, s) => expect(M.formatPercent(x)).toBe(s))
  test.each([
    [0.01, "1/100"],
    [0.03, "約1/33.3"],
    [1, "1/1"],
    [0.005, "1/200"],
  ])("fractionLabel(%p) → %s", (p, s) => expect(M.fractionLabel(p)).toBe(s))
})

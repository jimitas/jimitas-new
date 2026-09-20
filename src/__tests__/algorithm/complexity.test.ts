import { ALGOS, ALGO_ORDER, generateSteps } from "@/app/(apps)/algorithm/_lib/algorithms"
import {
  CHART_N_MAX,
  CHART_N_MIN,
  chartSizes,
  maxCompares,
  measure,
  theoryPoints,
  toPolyline,
  toXY,
  yTicks,
  type Box,
  type Series,
} from "@/app/(apps)/algorithm/_lib/complexity"
import { makeData, pickTarget, sortedCopy } from "@/app/(apps)/algorithm/_lib/random"
import type { AlgoId, DataKind } from "@/app/(apps)/algorithm/_lib/types"

const BOX: Box = {
  width: 640,
  height: 260,
  padLeft: 48,
  padRight: 12,
  padTop: 12,
  padBottom: 34,
}

const SEED = 20260920
const KINDS: DataKind[] = ["random", "nearly", "reverse", "same"]

// =======================================================
// グラフの数値は、画面のカウンタと同じものでなければならない。
//
// 別々に数えると「グラフでは 66 回なのに画面では 65 回」という
// **どちらが正しいのか分からない**状態になる。
// 生成器は1本しかないので本来ずれないが、その前提をここで固定する。
// =======================================================
describe.each(ALGO_ORDER)("グラフの実測 = アニメの最終カウンタ: %s", (algoId: AlgoId) => {
  test.each(KINDS)("ならび %s", (dataKind) => {
    const algo = ALGOS[algoId]
    for (const { n, compares } of measure(algoId, dataKind, SEED)) {
      const base = makeData(n, dataKind, SEED)
      const input = algo.requiresSorted ? sortedCopy(base) : base
      const options =
        algo.category === "search" ? { target: pickTarget(input, false, SEED) } : {}
      const steps = generateSteps(algoId, input, options)
      expect({ n, compares }).toEqual({ n, compares: steps[steps.length - 1].compares })
    }
  })
})

describe("実測の再現性", () => {
  test("同じシードなら毎回おなじグラフになる", () => {
    expect(measure("selection", "random", SEED)).toEqual(measure("selection", "random", SEED))
  })

  test("選択ソートの実測は すべての n で n(n-1)/2 に一致する", () => {
    for (const { n, compares } of measure("selection", "random", SEED)) {
      expect({ n, compares }).toEqual({ n, compares: (n * (n - 1)) / 2 })
    }
  })

  // グラフで見せたい一点。n が増えるほど差が開く。
  test("二分探索は線形探索よりずっと少なく、n=50 で10倍以上の差がつく", () => {
    const linear = measure("linear", "random", SEED)
    const binary = measure("binary", "random", SEED)
    for (const [i, p] of linear.entries()) {
      expect(binary[i].compares).toBeLessThan(p.compares)
    }
    const lastLinear = linear[linear.length - 1]
    const lastBinary = binary[binary.length - 1]
    // 無い値をさがすので、線形探索は必ず n 回。二分探索は log2(50)+1 = 6 回以下
    expect(lastLinear.compares).toBe(CHART_N_MAX)
    expect(lastBinary.compares).toBeLessThanOrEqual(6)
    expect(lastLinear.compares / lastBinary.compares).toBeGreaterThanOrEqual(10)
  })

  test("n の刻みは 5 から 50 まで 5 ずつ", () => {
    expect(chartSizes()).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 45, 50])
  })
})

// =======================================================
// 座標計算。
// スケーリングはバグの温床で、しかも「グラフが少しずれている」は
// 画面を見ても気づきにくい。端の場合まで固定する。
// =======================================================
describe("座標の計算", () => {
  test("左下が原点、右上がいちばん大きい値", () => {
    const maxY = 100
    const bottomLeft = toXY({ n: CHART_N_MIN, compares: 0 }, BOX, maxY)
    const topRight = toXY({ n: CHART_N_MAX, compares: maxY }, BOX, maxY)
    expect(bottomLeft).toEqual({ x: BOX.padLeft, y: BOX.height - BOX.padBottom })
    expect(topRight).toEqual({ x: BOX.width - BOX.padRight, y: BOX.padTop })
  })

  test("枠からはみ出さない", () => {
    for (const p of measure("bubble", "reverse", SEED)) {
      const { x, y } = toXY(p, BOX, maxCompares([{ id: "a", label: "a", points: measure("bubble", "reverse", SEED), theoretical: false }]))
      expect(x).toBeGreaterThanOrEqual(BOX.padLeft)
      expect(x).toBeLessThanOrEqual(BOX.width - BOX.padRight)
      expect(y).toBeGreaterThanOrEqual(BOX.padTop)
      expect(y).toBeLessThanOrEqual(BOX.height - BOX.padBottom)
    }
  })

  test("空・1点・全部同じ値でも NaN を出さない", () => {
    const empty: Series[] = [{ id: "x", label: "x", points: [], theoretical: false }]
    expect(maxCompares(empty)).toBe(1)
    expect(toPolyline([], BOX, 1)).toBe("")

    const one = [{ n: CHART_N_MIN, compares: 0 }]
    expect(toPolyline(one, BOX, 1)).not.toMatch(/NaN/)

    const flat = chartSizes().map((n) => ({ n, compares: 7 }))
    expect(toPolyline(flat, BOX, 7)).not.toMatch(/NaN/)

    // maxY に 0 が渡らないことも確かめる（0除算よけ）
    expect(maxCompares([{ id: "z", label: "z", points: flat.map((p) => ({ ...p, compares: 0 })), theoretical: false }])).toBe(1)
  })

  test("座標の文字列は桁が固定されている（SSR とクライアントで一致する）", () => {
    const line = toPolyline(measure("selection", "random", SEED), BOX, 1225)
    for (const pair of line.split(" ")) {
      for (const v of pair.split(",")) {
        expect(v).toMatch(/^-?\d+(\.\d{1,2})?$/)
      }
    }
  })

  test("目盛りは 0 から最大値まで等分される", () => {
    expect(yTicks(100, 4)).toEqual([0, 25, 50, 75, 100])
    expect(yTicks(1, 4)).toEqual([0, 0, 1, 1, 1])
  })
})

describe("理論の線", () => {
  test.each(ALGO_ORDER)("%s の理論値は 0 以上で NaN を出さない", (algoId: AlgoId) => {
    for (const p of theoryPoints(algoId)) {
      expect(Number.isFinite(p.compares)).toBe(true)
      expect(p.compares).toBeGreaterThanOrEqual(0)
    }
  })

  // 理論の線が実測とかけ離れていたら、並べて見せる意味がない
  test.each(["selection", "exchange", "bubble", "linear", "binary"] as AlgoId[])(
    "%s は理論値と実測が同じくらいになる",
    (algoId) => {
      const actual = measure(algoId, "random", SEED)
      const theory = theoryPoints(algoId)
      const lastActual = actual[actual.length - 1].compares
      const lastTheory = theory[theory.length - 1].compares
      expect(lastActual).toBeLessThanOrEqual(lastTheory * 1.2 + 1)
      expect(lastActual).toBeGreaterThanOrEqual(lastTheory * 0.5)
    },
  )
})

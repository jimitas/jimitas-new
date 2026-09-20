import { ALGOS, ALGO_ORDER, generateSteps, countOperations } from "@/app/(apps)/algorithm/_lib/algorithms"
import { NotSortedError } from "@/app/(apps)/algorithm/_lib/searches"
import type { AlgoId, Step } from "@/app/(apps)/algorithm/_lib/types"
import { makeRng } from "@/app/(apps)/algorithm/_lib/random"

const SEARCHES = ALGO_ORDER.filter((id) => ALGOS[id].category === "search")

const ascending = (n: number) => Array.from({ length: n }, (_, i) => (i + 1) * 3)

/** シード固定のならんだ配列。二分探索にもそのまま渡せる */
function sortedCases(): { name: string; input: number[] }[] {
  const cases = [
    { name: "空", input: [] as number[] },
    { name: "1要素", input: [5] },
    { name: "2要素", input: [5, 9] },
    { name: "8要素", input: ascending(8) },
    { name: "同じ値をふくむ", input: [1, 3, 3, 3, 7, 9] },
  ]
  const rng = makeRng(730613)
  for (let t = 0; t < 20; t++) {
    const n = 1 + Math.floor(rng() * 25)
    const arr = Array.from({ length: n }, () => 1 + Math.floor(rng() * 99)).sort((a, b) => a - b)
    cases.push({ name: `乱数#${t}(n=${n})`, input: arr })
  }
  return cases
}

const last = (steps: Step[]) => steps[steps.length - 1]

// =======================================================
// 共通：探索としての最低限の約束
// =======================================================
describe.each(SEARCHES)("探索の不変条件: %s", (algoId: AlgoId) => {
  test.each(sortedCases())("$name", ({ input }) => {
    // 配列にある値ぜんぶと、無い値をひととおり試す
    const targets = [...new Set(input)]
    targets.push(0, 1000)

    for (const target of targets) {
      const steps = generateSteps(algoId, input, { target })
      const end = last(steps)
      expect(end.kind).toBe("done")

      // 添字は必ず配列の中
      for (const [k, s] of steps.entries()) {
        const indices = [
          ...(s.compared ?? []),
          ...Object.values(s.pointers),
          ...(s.range ? [s.range.lo, s.range.hi] : []),
        ]
        for (const idx of indices) {
          if (!Number.isInteger(idx) || idx < 0 || idx >= input.length) {
            throw new Error(`ステップ ${k}（${s.kind}）の添字 ${idx} が範囲外（n=${input.length}）`)
          }
        }
      }

      // 探索は配列を書きかえない
      for (const s of steps) expect([...s.array]).toEqual(input)

      // カウンタは compare の出現数と一致し、単調非減少
      let compares = 0
      for (const [k, s] of steps.entries()) {
        if (s.kind === "compare") compares++
        expect([k, s.compares]).toEqual([k, compares])
      }
      expect(end.swaps).toBe(0)

      // 見つかったかどうかの結論が正しい
      const hit = steps.find((s) => s.kind === "found")
      if (input.includes(target)) {
        expect(hit).toBeDefined()
        // 指した場所に本当にその値がある
        expect(input[hit!.pointers.i!]).toBe(target)
      } else {
        expect(hit).toBeUndefined()
        expect(steps.some((s) => s.kind === "notfound")).toBe(true)
      }
    }
  })
})

describe.each(SEARCHES)("決定性: %s", (algoId: AlgoId) => {
  test("同じ入力なら同じステップ列になる", () => {
    const input = ascending(10)
    expect(generateSteps(algoId, input, { target: 12 })).toEqual(
      generateSteps(algoId, input, { target: 12 }),
    )
  })

  test("countOperations がステップ列の最終カウンタと一致する", () => {
    const input = ascending(10)
    for (const target of [3, 12, 30, 999]) {
      const end = last(generateSteps(algoId, input, { target }))
      expect(countOperations(algoId, input, { target })).toEqual({
        compares: end.compares,
        swaps: end.swaps,
      })
    }
  })
})

// =======================================================
// 線形探索の性質
// =======================================================
describe("線形探索の性質", () => {
  test.each([1, 2, 5, 12, 30])("無い値をさがすと ちょうど n 回くらべる（n=%i）", (n) => {
    expect(last(generateSteps("linear", ascending(n), { target: 1 })).compares).toBe(n)
  })

  test("先頭にある値は1回でみつかる", () => {
    const input = ascending(20)
    expect(last(generateSteps("linear", input, { target: input[0] })).compares).toBe(1)
  })

  test("k 番目にある値は k+1 回でみつかる", () => {
    const input = ascending(20)
    for (const k of [0, 1, 7, 19]) {
      expect(last(generateSteps("linear", input, { target: input[k] })).compares).toBe(k + 1)
    }
  })

  test("ならんでいない配列でも使える", () => {
    const input = [9, 2, 7, 4]
    const end = last(generateSteps("linear", input, { target: 7 }))
    expect(end.compares).toBe(3)
  })
})

// =======================================================
// 二分探索の性質
// =======================================================
describe("二分探索の性質", () => {
  test.each(sortedCases())("くらべる回数は log2(n)+1 以下: $name", ({ input }) => {
    const n = input.length
    const limit = n === 0 ? 0 : Math.floor(Math.log2(n)) + 1
    for (const target of [...new Set(input)]) {
      expect(last(generateSteps("binary", input, { target })).compares).toBeLessThanOrEqual(limit)
    }
    expect(last(generateSteps("binary", input, { target: 1000 })).compares).toBeLessThanOrEqual(limit)
  })

  // 線形探索との差。これが授業で見せたい一点。
  test("n=50 で無い値をさがすと、線形探索より圧倒的に少ない", () => {
    const input = ascending(50)
    const linear = last(generateSteps("linear", input, { target: 1 })).compares
    const binary = last(generateSteps("binary", input, { target: 1 })).compares
    expect(linear).toBe(50)
    expect(binary).toBeLessThanOrEqual(6)
  })

  // ならんでいない配列に使うと「動いているのに答えが間違う」のがいちばん困る。
  // 画面側でも自動でならべているが、_lib 側でも必ず止める。
  test("ならんでいない配列をわたすと例外になる", () => {
    expect(() => generateSteps("binary", [3, 1, 2], { target: 2 })).toThrow(NotSortedError)
  })

  /**
   * まん中の決め方をコード例と一致させる。
   *
   * コード例は「(hidari+migi)÷2」＝商の整数値（切り捨て）。
   * ここを切り上げに変えても二分探索としては正しく動いてしまうが、
   * 画面の動きとコード例で aida がちがう値になり、
   * 生徒が手で追うと合わなくなる。**動くのに教材として間違っている**状態なので、
   * 結果ではなく計算規則そのものを固定する。
   */
  test("まん中は必ず (左+右)÷2 の商（切り捨て）", () => {
    for (const { input } of sortedCases()) {
      const targets = input.length > 0 ? [input[0], input[input.length - 1], 1000] : [1000]
      for (const target of targets) {
        for (const s of generateSteps("binary", input, { target })) {
          if (s.pointers.mid === undefined) continue
          expect(s.pointers.mid).toBe(Math.floor((s.pointers.left! + s.pointers.right!) / 2))
        }
      }
    }
  })

  test("しらべる範囲は毎回せまくなる", () => {
    const steps = generateSteps("binary", ascending(30), { target: 1000 })
    const widths = steps
      .filter((s) => s.range !== undefined)
      .map((s) => s.range!.hi - s.range!.lo)
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeLessThanOrEqual(widths[i - 1])
    }
    // 最後は必ず範囲が無くなっている
    expect(last(steps).range).toBeUndefined()
  })
})

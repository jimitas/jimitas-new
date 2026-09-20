import {
  ALGOS,
  ALGO_ORDER,
  generateSteps,
  countOperations,
} from "@/app/(apps)/algorithm/_lib/algorithms"
import { makeRng } from "@/app/(apps)/algorithm/_lib/random"
import type { AlgoId } from "@/app/(apps)/algorithm/_lib/types"
import { expectMergeInvariants, expectSortInvariants, sortCases } from "./helpers"

// category で選ぶ。段階2で探索を足しても、ここを直さなくて済む
const SORTS = ALGO_ORDER.filter((id) => ALGOS[id].category === "sort")

/** n 個から2個えらぶ組み合わせの数。n<2 は 0（式のままだと -0 になる） */
const pairs = (n: number) => (n < 2 ? 0 : (n * (n - 1)) / 2)

const ascending = (n: number) => Array.from({ length: n }, (_, i) => i + 1)
const descending = (n: number) => ascending(n).reverse()
const allSame = (n: number) => Array<number>(n).fill(7)
const SIZES = [0, 1, 2, 5, 12, 20]

// =======================================================
// 共通の不変条件（全ソート）
// =======================================================
describe.each(SORTS)("ソートの不変条件: %s", (algoId: AlgoId) => {
  test.each(sortCases())("$name", ({ input }) => {
    expectSortInvariants(algoId, input)
  })
})

describe.each(SORTS)("決定性と非破壊: %s", (algoId: AlgoId) => {
  test("同じ入力なら同じステップ列になる（乱数が混ざっていない）", () => {
    const input = [5, 3, 8, 1, 9, 2]
    expect(generateSteps(algoId, input)).toEqual(generateSteps(algoId, input))
  })

  test("入力の配列は書きかえられない", () => {
    const input = [5, 3, 8, 1, 9, 2]
    const copy = [...input]
    generateSteps(algoId, input)
    expect(input).toEqual(copy)
  })
})

// =======================================================
// CountRecorder（段階3のグラフ用）と StepRecorder の一致。
// ここがずれると「グラフの数値とアニメのカウンタが食いちがう」。
// =======================================================
describe.each(SORTS)("回数だけ数える経路: %s", (algoId: AlgoId) => {
  test.each(sortCases())("ステップ列の最終カウンタと一致する: $name", ({ input }) => {
    const steps = generateSteps(algoId, input)
    const last = steps[steps.length - 1]
    expect(countOperations(algoId, input)).toEqual({
      compares: last.compares,
      swaps: last.swaps,
    })
  })
})

/** 最終ステップの回数を取り出す小道具 */
function counts(algoId: AlgoId, input: readonly number[]) {
  const steps = generateSteps(algoId, input)
  const last = steps[steps.length - 1]
  return { compares: last.compares, swaps: last.swaps }
}

// =======================================================
// アルゴリズムごとの「性質そのもの」。
// これが授業で説明する中身なので、等式で固定する。
// =======================================================
describe("選択ソートの性質", () => {
  test.each(SIZES)("くらべる回数は並びによらず n(n-1)/2（n=%i）", (n) => {
    for (const input of [ascending(n), descending(n), allSame(n)]) {
      expect(counts("selection", input).compares).toBe(pairs(n))
    }
  })

  // 入れかえを i === saisho のときも省略しないので、ちょうど n-1 回。
  // 「不要なら飛ばす」最適化を入れるとコード例と動きがずれるので、ここで止める。
  test.each(SIZES)("入れかえはちょうど n-1 回（n=%i）", (n) => {
    for (const input of [ascending(n), descending(n), allSame(n)]) {
      expect(counts("selection", input).swaps).toBe(Math.max(0, n - 1))
    }
  })
})

describe("交換ソートの性質", () => {
  test.each(SIZES)("くらべる回数は並びによらず n(n-1)/2（n=%i）", (n) => {
    for (const input of [ascending(n), descending(n), allSame(n)]) {
      expect(counts("exchange", input).compares).toBe(pairs(n))
    }
  })

  test.each(SIZES)("ならんだ入力では1回も入れかえない（n=%i）", (n) => {
    expect(counts("exchange", ascending(n)).swaps).toBe(0)
  })

  // 選択ソートとの決定的なちがい。
  // 交換ソートは小さい値を見つけるたびに入れかえるので、逆順では n-1 回を大きく超える。
  test("逆順では選択ソートより入れかえが多い", () => {
    const input = descending(12)
    expect(counts("exchange", input).swaps).toBeGreaterThan(counts("selection", input).swaps)
  })
})

describe("バブルソートの性質", () => {
  // 早期終了があることの証明。これを消すと落ちる。
  test.each(SIZES)("ならんだ入力は1巡（n-1回）で終わる（n=%i）", (n) => {
    for (const input of [ascending(n), allSame(n)]) {
      expect(counts("bubble", input)).toEqual({ compares: Math.max(0, n - 1), swaps: 0 })
    }
  })

  test.each(SIZES)("逆順ではくらべる回数も入れかえも n(n-1)/2（n=%i）", (n) => {
    expect(counts("bubble", descending(n))).toEqual({ compares: pairs(n), swaps: pairs(n) })
  })

  // となりどうししか くらべないので、値は1マスずつしか動けない。
  test("くらべるのは必ずとなりどうし", () => {
    for (const step of generateSteps("bubble", [5, 3, 8, 1, 9, 2])) {
      if (step.compared) expect(Math.abs(step.compared[0] - step.compared[1])).toBe(1)
      if (step.swapped) expect(Math.abs(step.swapped[0] - step.swapped[1])).toBe(1)
    }
  })
})

describe("挿入ソートの性質", () => {
  test.each(SIZES)("ならんだ入力は n-1 回くらべるだけ・1回もずらさない（n=%i）", (n) => {
    for (const input of [ascending(n), allSame(n)]) {
      expect(counts("insertion", input)).toEqual({ compares: Math.max(0, n - 1), swaps: 0 })
    }
  })

  test.each(SIZES)("逆順ではくらべる回数も ずらす回数も n(n-1)/2（n=%i）", (n) => {
    expect(counts("insertion", descending(n))).toEqual({ compares: pairs(n), swaps: pairs(n) })
  })

  // ── 共通テスト方式（取り出す → ずらす → さしこむ）の手順そのものを固定する ──

  test.each(SIZES)("取り出しとさしこみは n-1 回ずつ、必ず対になる（n=%i）", (n) => {
    for (const input of [ascending(n), descending(n), allSame(n)]) {
      const steps = generateSteps("insertion", input)
      const takes = steps.filter((s) => s.kind === "take").length
      const places = steps.filter((s) => s.kind === "place").length
      expect({ takes, places }).toEqual({
        takes: Math.max(0, n - 1),
        places: Math.max(0, n - 1),
      })
    }
  })

  test("取り出したあと、さしこむまでは ずっと手に持っている", () => {
    const steps = generateSteps("insertion", [5, 3, 8, 1, 9, 2])
    let holding = false
    for (const s of steps) {
      // さしこんだステップでは、もう手は空になっている
      if (s.kind === "take") holding = true
      if (s.kind === "place") holding = false
      expect({ kind: s.kind, holding, has: s.held !== undefined }).toEqual({
        kind: s.kind,
        holding,
        has: holding,
      })
    }
    expect(holding).toBe(false)
  })

  // 穴は取り出した場所から始まり、ずらしたときだけ1つ左へ動く。
  // ここが崩れると、画面の点線わくが値とずれて見える。
  test("穴が動くのは ずらしたときだけ。1回に1マスずつ左へ", () => {
    const steps = generateSteps("insertion", [5, 3, 8, 1, 9, 2])
    let prev: number | undefined
    for (const s of steps) {
      if (s.gap === undefined) {
        prev = undefined
        continue
      }
      if (s.kind === "take") expect(s.gap).toBe(s.pointers.i)
      else if (prev !== undefined) expect(s.gap).toBe(s.kind === "shift" ? prev - 1 : prev)
      prev = s.gap
    }
  })

  // ずらした先には、必ず「穴の右どなり」だった値が入る
  test("ずらすのは 穴の左どなりの値を 穴へ、の1マスだけ", () => {
    for (const input of [descending(12), [5, 3, 8, 1, 9, 2]]) {
      const steps = generateSteps("insertion", input)
      for (const [k, s] of steps.entries()) {
        if (s.kind !== "shift") continue
        const before = steps[k - 1]
        expect(s.wrote).toBe(before.gap)
        expect(s.array[s.wrote!]).toBe(before.array[s.wrote! - 1])
      }
    }
  })

  // 「ほぼ順番」が得意、という説明の裏づけ。
  test("ほぼ順番の入力は、ばらばらの入力よりずっと少ない回数で終わる", () => {
    const n = 20
    const nearly = ascending(n)
    ;[nearly[3], nearly[4]] = [nearly[4], nearly[3]]
    expect(counts("insertion", nearly).compares).toBeLessThan(
      counts("insertion", descending(n)).compares / 2,
    )
  })
})

// =======================================================
// 分割統治の2本（段階4）
// =======================================================
describe("クイックソートの性質", () => {
  // 1回の仕分けで くらべる回数は「範囲の長さ-1」ちょうど。
  // 仕分けのループ範囲を変えるとここが崩れる。
  test.each(SIZES)("くらべる回数は n-1 以上 n(n-1)/2 以下（n=%i）", (n) => {
    for (const input of [ascending(n), descending(n), allSame(n)]) {
      const c = counts("quick", input).compares
      expect(c).toBeGreaterThanOrEqual(Math.max(0, n - 1))
      expect(c).toBeLessThanOrEqual(pairs(n))
    }
  })

  // 右はしを基準にしているので、ならんだ入力がいちばん苦手。
  // これは解説パネルに書いている内容そのものなので、等式で固定する。
  test.each([5, 12, 20])("ならんだ入力は最悪で n(n-1)/2 回になる（n=%i）", (n) => {
    expect(counts("quick", ascending(n)).compares).toBe(pairs(n))
  })

  // ばらばらの入力なら O(n log n) の範囲におさまる
  test("ばらばらの入力では n log2 n の3倍を超えない", () => {
    const n = 50
    const rng = makeRng(424242)
    const input = Array.from({ length: n }, () => 1 + Math.floor(rng() * 99))
    expect(counts("quick", input).compares).toBeLessThan(3 * n * Math.log2(n))
  })

  // 基準の場所は、仕分けのあと必ず確定する（もう動かない）
  test("確定した基準の位置は そのあと二度と動かない", () => {
    const steps = generateSteps("quick", [5, 3, 8, 1, 9, 2, 7])
    for (const [k, s] of steps.entries()) {
      for (const idx of s.sorted) {
        expect({ k, idx, v: s.array[idx] }).toEqual({
          k,
          idx,
          v: steps[steps.length - 1].array[idx],
        })
      }
    }
  })
})

describe("マージソートの性質", () => {
  test.each(sortCases())("合体1回ごとに 中身が変わらず 並ぶ: $name", ({ input }) => {
    expectMergeInvariants(input)
  })

  // 分かれかたが はじめから決まっているので、並びかたで回数がほとんど変わらない。
  // これがクイックソートとの決定的なちがい。
  test("どんな並びでも くらべる回数がほぼ同じ", () => {
    const n = 32
    const got = [ascending(n), descending(n), allSame(n)].map(
      (input) => counts("merge", input).compares,
    )
    const min = Math.min(...got)
    const max = Math.max(...got)
    expect(max - min).toBeLessThanOrEqual(n / 2)
  })

  test.each([2, 5, 12, 20])("くらべる回数は n log2 n 以下（n=%i）", (n) => {
    for (const input of [ascending(n), descending(n)]) {
      expect(counts("merge", input).compares).toBeLessThanOrEqual(Math.ceil(n * Math.log2(n)))
    }
  })

  // ならんだ入力でクイックソートが n(n-1)/2 になるのに対し、マージは崩れない
  test("ならんだ入力では クイックソートより ずっと少ない", () => {
    const n = 50
    expect(counts("merge", ascending(n)).compares).toBeLessThan(
      counts("quick", ascending(n)).compares / 5,
    )
  })

  test("作業用の入れものは 使い終わったら必ず片づける", () => {
    const steps = generateSteps("merge", [5, 3, 8, 1, 9, 2, 7])
    expect(steps[steps.length - 1].aux).toBeUndefined()
    // 使っているあいだは、写した範囲の外が必ず空である
    for (const s of steps) {
      if (!s.aux) continue
      s.aux.values.forEach((v, i) => {
        const inside = i >= s.aux!.source.lo && i <= s.aux!.source.hi
        expect({ i, empty: v === null }).toEqual({ i, empty: !inside })
      })
    }
  })
})

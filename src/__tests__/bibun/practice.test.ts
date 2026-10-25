// 微分の意味がわかる — _lib/practice.ts（練習問題・自動採点・正解数）のテスト
// 受け入れ基準9：自動採点で正答・誤答が正しく判定される。
import * as Pr from "@/app/(apps)/bibun/_lib/practice"
import { derivative, evaluate } from "@/app/(apps)/bibun/_lib/polynomial"
import type { Poly } from "@/app/(apps)/bibun/_lib/polynomial"

/** 決まった並びを返す乱数（テスト用） */
const seq = (...xs: number[]): Pr.Rng => {
  let i = 0
  return () => xs[i++ % xs.length]
}
/** 再現できる擬似乱数（テスト用） */
const lcg = (seed: number): Pr.Rng => {
  let s = seed
  return () => (s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31
}

describe("randomPoly", () => {
  test("いちばん上の次数の係数は 0 にならない・係数は −5〜5 の整数", () => {
    const rng = lcg(1)
    for (let i = 0; i < 500; i++) {
      for (const d of [2, 3] as Pr.MaxDegree[]) {
        const p = Pr.randomPoly(d, rng)
        expect(p[d]).not.toBe(0)
        for (const c of p) {
          expect(Number.isInteger(c)).toBe(true)
          expect(c).toBeGreaterThanOrEqual(-5)
          expect(c).toBeLessThanOrEqual(5)
        }
        if (d === 2) expect(p[3]).toBe(0)
      }
    }
  })
  test("2次までのときは 3次の項がない", () => expect(Pr.randomPoly(2, seq(0.5))[3]).toBe(0))
  test("−5 も 5 も出る（端まで届く）", () => {
    const rng = lcg(7)
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) Pr.randomPoly(3, rng).forEach((c) => seen.add(c))
    expect(seen.has(-5) && seen.has(5) && seen.has(0)).toBe(true)
  })
})

describe("newProblem", () => {
  test("前と同じ問題は出さない（引き直す）", () => {
    // 1回目と同じ並び → 2回目は引き直しになるよう、同じ乱数を2回分くり返してから別の値
    const first = Pr.newProblem("derivative", 2, seq(0.5, 0.5, 0.5), null)
    const rng = seq(0.5, 0.5, 0.5, 0.1, 0.9, 0.3)
    const second = Pr.newProblem("derivative", 2, rng, first)
    expect(second.poly).not.toEqual(first.poly)
  })
  test("続けて100問出しても、となりどうしが同じになることはない", () => {
    const rng = lcg(3)
    let prev: Pr.Problem | null = null
    for (let i = 0; i < 100; i++) {
      const p: Pr.Problem = Pr.newProblem("coefficient", 2, rng, prev)
      if (prev && prev.kind === "coefficient" && p.kind === "coefficient") {
        expect(p.poly.join() === prev.poly.join() && p.a === prev.a).toBe(false)
      }
      prev = p
    }
  })
  test("微分係数の問題の a は −3〜3 の整数", () => {
    const rng = lcg(5)
    for (let i = 0; i < 200; i++) {
      const p = Pr.newProblem("coefficient", 3, rng, null)
      if (p.kind !== "coefficient") throw new Error()
      expect(Number.isInteger(p.a) && p.a >= -3 && p.a <= 3).toBe(true)
    }
  })
})

describe("readNumber（タブレットの入力を受けつける）", () => {
  test.each([
    ["3", 3], ["-3", -3], ["−3", -3], ["－３", -3], ["ー3", -3], ["+2", 2], [" 12 ", 12], ["0", 0], ["1.5", 1.5],
    ["＋３", 3], ["–3", -3], ["‐3", -3], ["—3", -3],
  ])("%p → %p", (s, v) => expect(Pr.readNumber(s)).toBe(v))
  test("空欄は null", () => expect(Pr.readNumber("  ")).toBeNull())
  test.each(["x", "3x", "--3", "2/3", "1e3"])("読めないものは NaN（%p）", (s) => expect(Pr.readNumber(s)).toBeNaN())
})

describe("gradeDerivative（導関数の採点）", () => {
  const P: Poly = [1, -3, 0, 2] // 2x³ − 3x + 1 → f'(x) = 6x² − 3
  test("正解", () => {
    const g = Pr.gradeDerivative(P, 3, ["6", "0", "-3"])
    expect(g).toMatchObject({ status: "graded", correct: true })
  })
  test("0 の項は空欄でも正解", () =>
    expect(Pr.gradeDerivative(P, 3, ["6", "", "−3"])).toMatchObject({ status: "graded", correct: true }))
  test("まちがえた項を指摘する", () => {
    const g = Pr.gradeDerivative(P, 3, ["6", "0", "3"])
    if (g.status !== "graded") throw new Error()
    expect(g.correct).toBe(false)
    expect(g.terms.filter((t) => !t.correct).map((t) => t.deg)).toEqual([0])
    expect(g.terms.find((t) => t.deg === 0)).toMatchObject({ expected: -3, given: 3 })
  })
  test("ありがちなまちがい：定数を残す・係数をかけ忘れる", () => {
    const g1 = Pr.gradeDerivative([5, 0, 1, 0], 2, ["2", "5"]) // x² + 5 → 2x（定数は 0）
    if (g1.status !== "graded") throw new Error()
    expect(g1.terms.filter((t) => !t.correct).map((t) => t.deg)).toEqual([0])
    const g2 = Pr.gradeDerivative([0, 0, 3, 0], 2, ["2", ""]) // 3x² → 6x（3 をかけ忘れて 2x）
    if (g2.status !== "graded") throw new Error()
    expect(g2.terms.filter((t) => !t.correct).map((t) => t.deg)).toEqual([1])
  })
  test("全部空欄は「入力してね」（採点しない）", () =>
    expect(Pr.gradeDerivative(P, 3, ["", "", ""]).status).toBe("invalid"))
  test("読めない入力は採点しない", () =>
    expect(Pr.gradeDerivative(P, 3, ["6x", "", ""]).status).toBe("invalid"))
  test("2次までは欄が2つ（x と 定数）", () => expect(Pr.answerDegrees(2)).toEqual([1, 0]))

  // どんな問題でも、正しい係数を入れれば正解・1つずらせば不正解になる
  test("ランダムな問題500問：正しい答えは正解、1つずらすと不正解", () => {
    const rng = lcg(11)
    for (let i = 0; i < 500; i++) {
      const maxDeg = (i % 2 ? 3 : 2) as Pr.MaxDegree
      const p = Pr.randomPoly(maxDeg, rng)
      const d = derivative(p)
      const right = Pr.answerDegrees(maxDeg).map((k) => String(d[k]))
      expect(Pr.gradeDerivative(p, maxDeg, right)).toMatchObject({ correct: true })
      const wrong = [...right]
      wrong[0] = String(Number(wrong[0]) + 1)
      expect(Pr.gradeDerivative(p, maxDeg, wrong)).toMatchObject({ correct: false })
    }
  })
})

describe("gradeCoefficient（微分係数の採点）", () => {
  test("x³ − 3x の x = 1 は 0", () => {
    expect(Pr.gradeCoefficient([0, -3, 0, 1], 1, "0")).toMatchObject({ correct: true })
    expect(Pr.gradeCoefficient([0, -3, 0, 1], 1, "−3")).toMatchObject({ correct: false })
  })
  test("x² の x = 2 は 4（スライドの例）", () =>
    expect(Pr.gradeCoefficient([0, 0, 1, 0], 2, "４")).toMatchObject({ correct: true }))
  test("空欄・読めない入力は採点しない", () => {
    expect(Pr.gradeCoefficient([0, 0, 1, 0], 2, "").status).toBe("invalid")
    expect(Pr.gradeCoefficient([0, 0, 1, 0], 2, "4x").status).toBe("invalid")
  })
  test("ランダムな問題：f'(a) が正解", () => {
    const rng = lcg(13)
    for (let i = 0; i < 300; i++) {
      const p = Pr.newProblem("coefficient", 3, rng, null)
      if (p.kind !== "coefficient") throw new Error()
      const v = evaluate(derivative(p.poly), p.a)
      expect(Pr.gradeCoefficient(p.poly, p.a, String(v))).toMatchObject({ correct: true })
      expect(Pr.gradeCoefficient(p.poly, p.a, String(v + 1))).toMatchObject({ correct: false })
    }
  })
})

describe("scoreReducer（正解数・連続正解）", () => {
  const run = (...es: Pr.ScoreEvent[]) => es.reduce(Pr.scoreReducer, Pr.INITIAL_SCORE)
  test("正解で +1、連続正解も +1", () => expect(run("new", "correct", "new", "correct")).toMatchObject({ correct: 2, streak: 2 }))
  test("同じ問題で何度こたえあわせしても1回だけ数える", () =>
    expect(run("new", "correct", "correct", "correct")).toMatchObject({ correct: 1, streak: 1 }))
  test("まちがえると連続正解は 0。そのあと正解すれば正解数には入る", () =>
    expect(run("new", "correct", "new", "wrong", "correct")).toMatchObject({ correct: 2, streak: 1 }))
  test("答えを見た問題は正解にしない。連続正解は 0", () =>
    expect(run("new", "correct", "new", "peek", "correct")).toMatchObject({ correct: 1, streak: 0 }))
  test("正解しないまま次の問題へ進むと、連続正解は 0", () =>
    expect(run("new", "correct", "new", "correct", "new", "new")).toMatchObject({ correct: 2, streak: 0 }))
  test("まちがえてから次へ進んでも 0 のまま（正解数は変わらない）", () =>
    expect(run("new", "correct", "new", "wrong", "new")).toMatchObject({ correct: 1, streak: 0 }))
  test("正解したあとに答えを見ても、連続正解は消えない", () =>
    expect(run("new", "correct", "peek", "new", "correct")).toMatchObject({ correct: 2, streak: 2 }))
})

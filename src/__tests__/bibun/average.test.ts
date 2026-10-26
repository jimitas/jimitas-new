// 微分の意味がわかる — _lib/average.ts（ステップ① 平均変化率）のテスト
import * as AV from "@/app/(apps)/bibun/_lib/average"
import { PRESETS, evaluate } from "@/app/(apps)/bibun/_lib/polynomial"
import type { Poly } from "@/app/(apps)/bibun/_lib/polynomial"

const X2: Poly = [0, 0, 1, 0]

describe("averageExpr（途中式 F1-4）", () => {
  test("x², 2→3 はスライド10と同じ 5", () => expect(AV.averageExpr(X2, 2, 3)).toBe("(9 − 4) ÷ (3 − 2) = 5 ÷ 1 = 5"))
  test("x², 2→2.5 は 4.5", () => expect(AV.averageExpr(X2, 2, 2.5)).toBe("(6.25 − 4) ÷ (2.5 − 2) = 2.25 ÷ 0.5 = 4.5"))
  test("B が A より左でも同じ式の形（負の数は（ ）でくるむ）", () =>
    expect(AV.averageExpr(X2, 2, 1)).toBe("(1 − 4) ÷ (1 − 2) = −3 ÷ (−1) = 3"))
  test("f(a) や a が負", () =>
    expect(AV.averageExpr([0, -3, 0, 1], -1, 1)).toBe("(−2 − 2) ÷ (1 − (−1)) = −4 ÷ 2 = −2"))
  test("浮動小数の誤差が出ない（2.3 − 2 = 0.3）", () =>
    expect(AV.averageExpr(X2, 2, 2.3)).toBe("(5.29 − 4) ÷ (2.3 − 2) = 1.29 ÷ 0.3 = 4.3"))
})

describe("formatRate", () => {
  test.each([[5, "5"], [4.5, "4.5"], [1 / 3, "≒ 0.333"], [-2 / 3, "≒ −0.667"], [4.001, "4.001"], [0, "0"]])(
    "%p → %s", (v, want) => expect(AV.formatRate(v)).toBe(want))
})

describe("average", () => {
  test.each(PRESETS.map((p) => [p.id, p.poly] as [string, Poly]))("%s：Δy = f(b) − f(a)、rate = Δy ÷ Δx", (_, p) => {
    for (const [a, b] of [[2, 3], [-1, 0.5], [1.3, -2.2]]) {
      const r = AV.average(p, a, b)
      expect(r.dy).toBeCloseTo(evaluate(p, b) - evaluate(p, a), 9)
      expect(r.rate).toBeCloseTo(r.dy / r.dx, 9)
    }
  })
  test("直線 2x + 1 はどの2点でも 2", () => {
    for (const [a, b] of [[0, 1], [-3, 5], [2, 2.1]]) expect(AV.average([1, 2, 0, 0], a, b).rate).toBeCloseTo(2, 12)
  })
})

describe("twoPointView", () => {
  test.each(PRESETS.flatMap((p) => [[2, 3], [-3, 5], [4.9, -2.7], [0, 0.1]].map(([a, b]) => [p.id, p.poly, a, b] as [string, Poly, number, number])))(
    "%s・a = %p・b = %p：2点とも入る", (_, p, a, b) => {
      const v = AV.twoPointView(p, a, b)
      for (const x of [a, b]) {
        expect(x).toBeGreaterThan(v.xMin)
        expect(x).toBeLessThan(v.xMax)
        // y = 0 の点は下端（0）にちょうど乗る（曲線が 0 以上なら下端を 0 にそろえるため）。乗っていれば見える
        expect(evaluate(p, x)).toBeGreaterThanOrEqual(v.yMin)
        expect(evaluate(p, x)).toBeLessThan(v.yMax)
      }
    })
  // 2026-10-26 オーナー依頼：a = 1・b = 2 で横 0〜2.4・縦 0〜4.8（② の最初の表示とそろう）
  test("x²・a = 1・b = 2 は 横 0〜2.4・縦 0〜4.8", () => {
    const v = AV.twoPointView(X2, 1, 2)
    expect(v.xMin).toBeCloseTo(0, 12)
    expect(v.xMax).toBeCloseTo(2.4, 12)
    expect(v.yMin).toBe(0)
    expect(v.yMax).toBeCloseTo(4.8, 9)
  })
})

// ---- 2026-10-25 レビュー指摘への対応 ----------------------------------------------

describe("movePoint（2点を重ねない）", () => {
  test("重なるときは null（動かさない）", () => {
    expect(AV.movePoint(2, 3, "a", 3)).toBeNull()
    expect(AV.movePoint(2, 3, "b", 2.04)).toBeNull() // 0.1 にそろえると 2 で重なる
  })
  test("0.1 刻みにそろえ、範囲に収める", () => {
    expect(AV.movePoint(2, 3, "a", 1.26)).toEqual({ a: 1.3, b: 3 })
    expect(AV.movePoint(2, 3, "b", 99)).toEqual({ a: 2, b: 5 })
    expect(AV.movePoint(2, 3, "b", -99)).toEqual({ a: 2, b: -3 })
  })
  test("B が A の左へ行ってもよい", () => expect(AV.movePoint(2, 3, "b", 1)).toEqual({ a: 2, b: 1 }))
})

describe("stepPoint（キー操作）", () => {
  test("ふつうは 0.1 ずつ", () => expect(AV.stepPoint(2, 3, "a", 1)).toEqual({ a: 2.1, b: 3 }))
  test("隣にもう一方の点があれば、その向こうへ跳ぶ（越えられなくならない）", () => {
    expect(AV.stepPoint(2.9, 3, "a", 1)).toEqual({ a: 3.1, b: 3 })
    expect(AV.stepPoint(2, 2.1, "b", -1)).toEqual({ a: 2, b: 1.9 })
  })
  test("端では動けない（null）", () => {
    expect(AV.stepPoint(5, 3, "a", 1)).toBeNull()
    expect(AV.stepPoint(4.9, 5, "a", 1)).toBeNull() // 跳ぶ先が範囲の外
  })
})

describe("separate（② から a を受け取ったとき）", () => {
  test("重なっていなければそのまま", () => expect(AV.separate(2, 3)).toBe(3))
  test("重なったら b を右へ1つ", () => expect(AV.separate(3, 3)).toBe(3.1))
  test("右端なら左へ", () => expect(AV.separate(5, 5)).toBe(4.9))
})

describe("averageExpr は Δx = 0 では作らない", () => {
  test("a = b でエラー（「0 ÷ 0 = 4」のような式を出さない）", () =>
    expect(() => AV.averageExpr(X2, 2, 2)).toThrow())
})

describe("近似値の「≒」", () => {
  test("割り切れるときは「=」", () => expect(AV.eqRate(5)).toBe("= 5"))
  test("割り切れないときは「≒」だけ（「= ≒」と並べない）", () => {
    expect(AV.eqRate(1 / 3)).toBe("≒ 0.333")
    // 3.1525 は浮動小数では 3.15249… なので 3.152（近似の表示なので、どちらでも差し支えない）
    expect(AV.averageExpr([0, 0, 0, 0.25], 2, 2.1)).toMatch(/÷ 0\.1 ≒ 3\.152$/)
    expect(AV.averageExpr([0, 0, 0, 0.25], 2, 2.1)).not.toMatch(/= ≒/)
  })
})

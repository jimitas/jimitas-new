// 微分の意味がわかる — _lib/polynomial.ts のテスト
// 受け入れ基準（要件 §8）の 1, 2, 6, 8 の数値をここで固定する。
import * as P from "@/app/(apps)/bibun/_lib/polynomial"
import type { Poly } from "@/app/(apps)/bibun/_lib/polynomial"

const X2: Poly = [0, 0, 1, 0]
const show = (p: Poly, a: number, h: number) => P.formatNumber(P.diffQuotient(p, a, h))

describe("diffQuotient（平均変化率）— スライド10–11 と同じ値", () => {
  test.each([
    [1, "5"], [0.5, "4.5"], [0.1, "4.1"], [0.01, "4.01"], [0.001, "4.001"],
  ])("x², a = 2, 右から h = %p → %s（基準1）", (h, want) => expect(show(X2, 2, h)).toBe(want))

  test.each([
    [-1, "3"], [-0.5, "3.5"], [-0.1, "3.9"], [-0.01, "3.99"], [-0.001, "3.999"],
  ])("x², a = 2, 左から h = %p → %s（基準2）", (h, want) => expect(show(X2, 2, h)).toBe(want))

  test.each([1, 0.5, 0.1, 0.01, 0.001, -1, -0.001, 1.7])("直線 2x + 1 は h = %p でも 2（基準8）", (h) =>
    expect(show([1, 2, 0, 0], 0.3, h)).toBe("2"))

  test("定数関数は 0", () => expect(show([5, 0, 0, 0], 2, 0.1)).toBe("0"))

  test.each([
    [[0, 0, 0, 1] as Poly, 2, 1],
    [[0, 4, -1, 0] as Poly, 1, 0.5],
    [[1, -3, 2, 0] as Poly, -1.3, 0.7],
    [[0.5, -3, 0, 1] as Poly, 0, -0.25],
  ])("ふつうの h では (f(a+h) − f(a)) / h と一致（%p, a = %p, h = %p）", (p, a, h) => {
    const naive = (P.evaluate(p, a + h) - P.evaluate(p, a)) / h
    expect(P.diffQuotient(p, a, h)).toBeCloseTo(naive, 10)
  })

  // ■ 桁落ち対策の番人
  //   f(a+h) − f(a) を浮動小数で引く実装に書きかえると、ここが落ちる。
  //   （a = 10⁶ では f(a) ≈ 10¹² で、double の刻みが約 1.2×10⁻⁴。引き算では小数点以下が消える）
  test("a = 10⁶, h = 0.001 でも 2000000.001（引き算だと 2000000.12… になる）", () =>
    expect(show(X2, 1e6, 0.001)).toBe("2000000.001"))
  test("h = 10⁻¹² でも 4.000000000（引き算だと大きくずれる）", () =>
    expect(Math.abs(P.diffQuotient(X2, 2, 1e-12) - 4)).toBeLessThan(1e-11))
})

describe("deltaY（f(a + h) − f(a) の欄）", () => {
  test.each([
    [1, "5"], [0.5, "2.25"], [0.1, "0.41"], [0.01, "0.0401"], [0.001, "0.004001"],
  ])("x², a = 2, h = %p → %s", (h, want) => expect(P.formatNumber(P.deltaY(X2, 2, h))).toBe(want))
  test("左からは負", () => expect(P.formatNumber(P.deltaY(X2, 2, -0.1))).toBe("−0.39"))
})

describe("derivative", () => {
  test.each([
    ["x2", "2x"],
    ["x3", "3x²"],
    ["-x2+4x", "−2x + 4"],
    ["x3-3x", "3x² − 3"],
    ["2x2-3x+1", "4x − 3"],
  ])("プリセット %s → %s（基準6）", (id, want) => {
    const p = P.PRESETS.find((x) => x.id === id)!.poly
    expect(P.formatPoly(P.derivative(p))).toBe(want)
  })
  test("x³ − 3x は x = 1 で傾き 0（接線が水平）", () =>
    expect(P.evaluate(P.derivative([0, -3, 0, 1]), 1)).toBe(0))
})

describe("formatPoly（式の書式 §5）", () => {
  test.each([
    [[0, 0, 1, 0], "x²"],
    [[0, 0, 0, 1], "x³"],
    [[0, 4, -1, 0], "−x² + 4x"],
    [[0, -3, 0, 1], "x³ − 3x"],
    [[1, -3, 2, 0], "2x² − 3x + 1"],
    [[1, 2, 0, 0], "2x + 1"],
    [[-1, 0, 0, 0], "−1"],
    [[0, 0, 0, 0], "0"],
    [[0.5, -1, 0, -2.5], "−2.5x³ − x + 0.5"],
  ] as [Poly, string][])("%p → %s", (p, want) => expect(P.formatPoly(p)).toBe(want))
  test("変数を (a + h) にできる", () =>
    expect(P.formatPoly([1, -3, 2, 0], "(a + h)")).toBe("2(a + h)² − 3(a + h) + 1"))
  test("プリセットの先頭（初期値）は x²", () => expect(P.formatPoly(P.PRESETS[0].poly)).toBe("x²"))
})

describe("formatNumber", () => {
  test.each([
    [4.01, "4.01"],
    [4.1000000000000005, "4.1"],
    [3.9999999999999996, "4"],
    [-0.5, "−0.5"],
    [-0, "0"],
    [1e-7, "0.0000001"],
    [2.1, "2.1"],
    [12.006001, "12.006001"],
  ])("%p → %s", (v, want) => expect(P.formatNumber(v)).toBe(want))
})

describe("formatFixed（アニメ中の値）", () => {
  test.each([
    [4.00123456, 3, "4.001"], [0.0234567, 4, "0.0235"], [1, 4, "1"], [-0.00104, 4, "−0.001"], [0.00004, 4, "0"],
  ])("formatFixed(%p, %p) → %s", (v, d, want) => expect(P.formatFixed(v, d)).toBe(want))
})

describe("parseCoefs（自分で作る関数）", () => {
  test("c3, c2, c1, c0 の順の入力 → [c0, c1, c2, c3]", () =>
    expect(P.parseCoefs(["0", "0", "2", "1"])).toEqual([1, 2, 0, 0]))
  test("小数・負の数", () => expect(P.parseCoefs(["-1.5", "0", "3", "-10"])).toEqual([-10, 3, 0, -1.5]))
  test.each([[["", "0", "2", "1"]], [["a", "0", "0", "0"]], [["11", "0", "0", "0"]], [["0", "0", "-10.5", "0"]]])(
    "空・数でない・範囲外は null（%p）", (t) => expect(P.parseCoefs(t as P.CoefText)).toBeNull())
})

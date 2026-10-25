// 数値の表示用の書式（@/lib/graph/format）のテスト
// 微分の意味がわかる（bibun）の polynomial.test.ts から移した（2026-10-25）。
import * as F from "@/lib/graph/format"

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
  ])("%p → %s", (v, want) => expect(F.formatNumber(v)).toBe(want))
})

describe("formatFixed（アニメ中の値）", () => {
  test.each([
    [4.00123456, 3, "4.001"], [0.0234567, 4, "0.0235"], [1, 4, "1"], [-0.00104, 4, "−0.001"], [0.00004, 4, "0"],
  ])("formatFixed(%p, %p) → %s", (v, d, want) => expect(F.formatFixed(v, d)).toBe(want))
})

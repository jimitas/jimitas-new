// 「1段ずつ」の段となめらかな動き（@/lib/graph/steps）のテスト
// 微分の意味がわかる（bibun）の approach.test.ts から移した（2026-10-25）。
// nextStep は微分の意味がわかるの受け入れ基準（5 → 4.5 → …）を固定しているので bibun/approach.test.ts に残した。
import * as S from "@/lib/graph/steps"

describe("stepH（1段ずつ）", () => {
  test("はじめと終わりは段の値ちょうど", () => {
    expect(S.stepH(1, 0.5, 0)).toBeCloseTo(1, 12)
    expect(S.stepH(1, 0.5, 1)).toBeCloseTo(0.5, 12)
    expect(S.stepH(-0.01, -0.001, 1)).toBeCloseTo(-0.001, 12)
  })
  test("途中も from と to のあいだ", () => {
    for (let u = 0; u <= 1; u += 0.1) {
      const h = S.stepH(0.1, 0.01, u)
      expect(h).toBeLessThanOrEqual(0.1 + 1e-12)
      expect(h).toBeGreaterThanOrEqual(0.01 - 1e-12)
    }
  })
})

describe("H_STEPS（段の値）", () => {
  // 授業スライドの数値例。微分（平均変化率）と積分アプリ（増えた面積 ÷ のばした量）の両方がこの値に頼る
  test("1, 0.5, 0.1, 0.01, 0.001", () => expect([...S.H_STEPS]).toEqual([1, 0.5, 0.1, 0.01, 0.001]))
})

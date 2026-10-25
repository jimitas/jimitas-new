// 微分の意味がわかる — _lib/expand.ts のテスト
// F2-10（文字式での確認）と F3-5（項ごとの微分）がプリセット全5種で正しいこと（受け入れ基準6）。
import { derivativeTermSteps, expandSteps, limitExpr } from "@/app/(apps)/bibun/_lib/expand"
import { PRESETS, derivative, diffQuotient, evaluate } from "@/app/(apps)/bibun/_lib/polynomial"
import type { Poly } from "@/app/(apps)/bibun/_lib/polynomial"

const preset = (id: string) => PRESETS.find((p) => p.id === id)!.poly

describe("expandSteps（F2-10）", () => {
  test.each([
    ["x2", "(a + h)² − a²", "2ah + h²", "2a + h", "2a"],
    ["x3", "(a + h)³ − a³", "3a²h + 3ah² + h³", "3a² + 3ah + h²", "3a²"],
    ["-x2+4x", "{−(a + h)² + 4(a + h)} − (−a² + 4a)", "−2ah + 4h − h²", "−2a + 4 − h", "−2a + 4"],
    ["x3-3x", "{(a + h)³ − 3(a + h)} − (a³ − 3a)", "3a²h − 3h + 3ah² + h³", "3a² − 3 + 3ah + h²", "3a² − 3"],
    ["2x2-3x+1", "{2(a + h)² − 3(a + h) + 1} − (2a² − 3a + 1)", "4ah − 3h + 2h²", "4a − 3 + 2h", "4a − 3"],
  ])("%s", (id, sub, num, quot, lim) => {
    const s = expandSteps(preset(id))
    expect(s).toEqual([
      { num: "f(a + h) − f(a)", den: "h" },
      { num: sub, den: "h" },
      { num, den: "h" },
      { num: quot },
    ])
    expect(limitExpr(preset(id))).toBe(lim)
  })

  test("直線 2x + 1 は h が消えて 2", () => {
    const s = expandSteps([1, 2, 0, 0])
    expect(s[2].num).toBe("2h")
    expect(s[3].num).toBe("2")
    expect(limitExpr([1, 2, 0, 0])).toBe("2")
  })

  test("1項で負の関数は f(a) を（ ）で囲む", () =>
    expect(expandSteps([0, 0, -1, 0])[1].num).toBe("−(a + h)² − (−a²)"))

  // 文字列の比較だけだと「式は整っているが値が違う」を見逃すので、
  // 生成した h の式の係数が数値計算と一致することも、いくつかの a, h で確かめる。
  test.each(PRESETS.map((p) => [p.id, p.poly] as [string, Poly]))("%s：h の式の値 = 差分商", (_, p) => {
    for (const [a, h] of [[2, 0.1], [-1.5, 0.7], [0.3, -0.01]]) {
      const quot = evalAH(expandSteps(p)[3].num, a, h)
      expect(quot).toBeCloseTo(diffQuotient(p, a, h), 9)
    }
  })
})

describe("derivativeTermSteps（F3-5）", () => {
  test("x³ − 3x", () =>
    expect(derivativeTermSteps(preset("x3-3x"))).toEqual([
      { term: "x³", chain: ["3x²"] },
      { term: "−3x", chain: ["−3 × (x)'", "−3 × 1", "−3"] },
    ]))
  test("2x² − 3x + 1（定数の微分は 0）", () =>
    expect(derivativeTermSteps(preset("2x2-3x+1"))).toEqual([
      { term: "2x²", chain: ["2 × (x²)'", "2 × 2x", "4x"] },
      { term: "−3x", chain: ["−3 × (x)'", "−3 × 1", "−3"] },
      { term: "1", chain: ["0"] },
    ]))
  test("−x² + 4x（係数 −1 は「−1 ×」と書かない）", () =>
    expect(derivativeTermSteps(preset("-x2+4x"))).toEqual([
      { term: "−x²", chain: ["−(x²)'", "−2x"] },
      { term: "4x", chain: ["4 × (x)'", "4 × 1", "4"] },
    ]))
  test("−x の微分は −1", () =>
    expect(derivativeTermSteps([0, -1, 0, 0])).toEqual([{ term: "−x", chain: ["−(x)'", "−1"] }]))
  test.each(PRESETS.map((p) => [p.id, p.poly] as [string, Poly]))("%s：各項の結果の和 = f'(x)", (_, p) => {
    const sum = derivativeTermSteps(p).map((s) => s.chain[s.chain.length - 1])
    for (const x of [-2, 0.5, 3]) {
      const v = sum.reduce((acc, t) => acc + evalAH(t.replace(/x/g, "a"), x, 0), 0)
      expect(v).toBeCloseTo(evaluate(derivative(p), x), 9)
    }
  })
})

/** テスト用：「3a² − 3 + 3ah + h²」のような a, h の式に値を入れる */
function evalAH(expr: string, a: number, h: number): number {
  const js = expr
    .replace(/−/g, "-")
    .replace(/²/g, "**2")
    .replace(/³/g, "**3")
    .replace(/(\d)([ah])/g, "$1*$2")
    .replace(/ah/g, "a*h")
    .replace(/(\*\*\d)([ah])/g, "$1*$2")
  return new Function("a", "h", `return ${js}`)(a, h)
}

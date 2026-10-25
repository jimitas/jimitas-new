// 微分の意味がわかる — _lib/derivativeStep.ts（ステップ③ 導関数）のテスト
import * as fs from "fs"
import * as path from "path"
import * as D from "@/app/(apps)/bibun/_lib/derivativeStep"
import { PRESETS, derivative, evaluate, formatPoly } from "@/app/(apps)/bibun/_lib/polynomial"
import { formatNumber } from "@/lib/graph/format"
import type { Poly } from "@/app/(apps)/bibun/_lib/polynomial"
import { derivativeExample } from "@/app/(apps)/bibun/_lib/text"

describe("sweepX（なぞる）", () => {
  test("左端から右端まで", () => {
    expect(D.sweepX(0, -2, 4)).toBe(-2)
    expect(D.sweepX(0.5, -2, 4)).toBe(1)
    expect(D.sweepX(1, -2, 4)).toBe(4)
    expect(D.sweepX(1.3, -2, 4)).toBe(4)
  })
})

// 受け入れ基準7：なぞった軌跡が f'(x) のグラフと一致する
describe("tracePoint（軌跡）", () => {
  test.each(PRESETS.map((p) => [p.id, p.poly] as [string, Poly]))("%s：軌跡の点は y = f'(x) の上", (_, p) => {
    for (let t = 0; t <= 1; t += 0.05) {
      const [x, y] = D.tracePoint(p, D.sweepX(t, D.X3_MIN, D.X3_MAX))
      // 差分商（h → 0）の行き先と同じ値（「接線の傾き」と「導関数の値」が一致する）
      const h = 1e-6
      const numeric = (evaluate(p, x + h) - evaluate(p, x - h)) / (2 * h)
      expect(y).toBeCloseTo(numeric, 4)
    }
  })
})

describe("stepThreeViews", () => {
  test.each(PRESETS.map((p) => [p.id, p.poly] as [string, Poly]))("%s：上下とも横の範囲が同じで、曲線が縦に収まる", (_, p) => {
    const { top, bottom } = D.stepThreeViews(p)
    expect([top.xMin, top.xMax]).toEqual([D.X3_MIN, D.X3_MAX])
    expect([bottom.xMin, bottom.xMax]).toEqual([D.X3_MIN, D.X3_MAX])
    for (let x = D.X3_MIN; x <= D.X3_MAX; x += 0.5) {
      expect(evaluate(p, x)).toBeLessThanOrEqual(top.yMax)
      expect(evaluate(p, x)).toBeGreaterThanOrEqual(top.yMin)
      expect(evaluate(derivative(p), x)).toBeLessThanOrEqual(bottom.yMax)
      expect(evaluate(derivative(p), x)).toBeGreaterThanOrEqual(bottom.yMin)
    }
  })
  test("withXRange は横だけそろえる", () =>
    expect(D.withXRange({ xMin: 0, xMax: 1, yMin: 5, yMax: 9 }, { xMin: -3, xMax: 3, yMin: 0, yMax: 1 }))
      .toEqual({ xMin: -3, xMax: 3, yMin: 5, yMax: 9 }))
  test("なぞる範囲は点A を動かせる範囲の中", () =>
    expect(D.sweepRange({ xMin: -10, xMax: 10, yMin: 0, yMax: 1 })).toEqual([-3, 5]))
})

describe("F3-4 の説明", () => {
  test("x² なら 2x（1なら2、2なら4、3なら6）", () => {
    const p: Poly = [0, 0, 1, 0]
    const pairs = D.EXAMPLE_XS.map((x) => [String(x), formatNumber(evaluate(derivative(p), x))] as [string, string])
    expect(derivativeExample(formatPoly(p), formatPoly(derivative(p)), pairs))
      .toBe("y = x² なら f'(x) = 2x（x = 1 なら 2、x = 2 なら 4、x = 3 なら 6）")
  })
})

describe("sweepRange は端から少し内側、点A を動かせる範囲の中", () => {
  const v = (xMin: number, xMax: number) => ({ xMin, xMax, yMin: 0, yMax: 1 })
  test("表示 −2〜4 なら −1.82〜3.82", () => {
    const [lo, hi] = D.sweepRange(v(-2, 4))!
    expect(lo).toBeCloseTo(-1.82, 9)
    expect(hi).toBeCloseTo(3.82, 9)
  })
  test("表示が範囲の外までパンされていても、−3〜5 の中で左から右へ", () => {
    const [lo, hi] = D.sweepRange(v(3, 9))!
    expect(lo).toBeCloseTo(3.18, 9)
    expect(hi).toBe(5)
  })
  test("範囲とほとんど重ならないときは null（全体表示に戻してからなぞる）", () => {
    expect(D.sweepRange(v(6, 10))).toBeNull()
    expect(D.sweepRange(v(-10, -3.5))).toBeNull()
    expect(D.sweepRange(v(1.99, 2.01))).toBeNull() // 拡大しすぎ
  })
})

describe("viewsWithPoint（点A が入る全体表示）", () => {
  test("既定の範囲の中なら stepThreeViews と同じ", () =>
    expect(D.viewsWithPoint(PRESETS[0].poly, 2)).toEqual(D.stepThreeViews(PRESETS[0].poly)))
  test.each(PRESETS.flatMap((p) => [-3, 4.5, 5].map((a) => [p.id, p.poly, a] as [string, Poly, number])))(
    "%s・a = %p：点A と (a, f'(a)) が上下の画面に入る", (_, p, a) => {
      const { top, bottom } = D.viewsWithPoint(p, a)
      expect(a).toBeGreaterThan(top.xMin)
      expect(a).toBeLessThan(top.xMax)
      expect(evaluate(p, a)).toBeLessThanOrEqual(top.yMax)
      expect(evaluate(p, a)).toBeGreaterThanOrEqual(top.yMin)
      expect(evaluate(derivative(p), a)).toBeLessThanOrEqual(bottom.yMax)
      expect(evaluate(derivative(p), a)).toBeGreaterThanOrEqual(bottom.yMin)
      expect([bottom.xMin, bottom.xMax]).toEqual([top.xMin, top.xMax])
    })
})

describe("addTracePoint（軌跡に同じ点をためない）", () => {
  test("同じ x の点は足さない", () => {
    let tr: [number, number][] = []
    for (const x of [1, 1, 1.1, 1, 1.1, 1.2]) tr = D.addTracePoint(tr, [x, 2 * x])
    expect(tr.map(([x]) => x)).toEqual([1, 1.1, 1.2])
  })
  test("足さないときは同じ配列を返す（再描画のきっかけを作らない）", () => {
    const tr: [number, number][] = [[1, 2]]
    expect(D.addTracePoint(tr, [1, 2])).toBe(tr)
  })
})

// 答えを先に見せない（なぞり終えるまで、f'(x) の式・緑のグラフ・導関数の説明を出さない）。
// コンポーネントは jest（node 環境）で描画できないので、ソースの書き方で固定する：
// それぞれを書いた行の直前（5行以内）に `done &&` か `done ?` がある。条件を外すとここで落ちる。
describe("ステップ③：答えは、なぞり終えるまで出さない", () => {
  const src = fs.readFileSync(path.join(__dirname, "../../app/(apps)/bibun/_components/StepDerivative.tsx"), "utf8").split("\n")
  test.each([
    ["緑のグラフ", "stroke-brand-600"],
    ["f'(x) の式（凡例）", "y = f&apos;(x) = {formatPoly(df)}"],
    ["導関数の説明", "{DERIVATIVE_DEFINITION}"],
    ["例（1なら2、…）", "derivativeExample("],
  ])("%s", (_, token) => {
    const i = src.findIndex((l) => l.includes(token))
    expect(i).toBeGreaterThanOrEqual(0)
    const around = src.slice(Math.max(0, i - 5), i + 1).join("\n")
    expect(around).toMatch(/\bdone\s*(&&|\?)/)
  })
})

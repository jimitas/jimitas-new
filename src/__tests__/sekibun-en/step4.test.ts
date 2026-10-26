// 円の面積と円周のひみつ — ステップ④ 速さと距離とくらべる（_lib/compare.ts）のテスト
// 受け入れ基準（要件 §8）の 6「x = r = 2 のとき左 4、右 12.57（＝ 4π）」をここで固定する。
import * as C from "@/app/(apps)/sekibun-en/_lib/compare"
import { ringFacts } from "@/app/(apps)/sekibun-en/_lib/cut"
import * as T from "@/app/(apps)/sekibun-en/_lib/text"
import { formatFixed } from "@/lib/graph/format"

describe("受け入れ基準6：x = r = 2 で左 4、右 12.57", () => {
  test("三角形の面積：速さ 2x の下は x²、円周 2πr の下は πr²", () => {
    expect(C.triangleArea(C.K_SPEED, 2)).toBe(4)
    expect(C.triangleArea(C.K_CIRCLE, 2)).toBeCloseTo(4 * Math.PI, 12)
    expect(formatFixed(C.triangleArea(C.K_SPEED, 2), 2)).toBe("4")
    expect(formatFixed(C.triangleArea(C.K_CIRCLE, 2), 2)).toBe("12.57")
  })
  test("スライダーの初期値は 2、範囲は 0〜4（2026-10-25 オーナー決定）", () => {
    expect(C.X_INIT).toBe(2)
    expect(C.X_MAX).toBe(4)
  })
  test.each([0, 1, 2.5, 4])("x = %p：左は x²、右は πx²（どの x でも）", (x) => {
    expect(C.triangleArea(C.K_SPEED, x)).toBeCloseTo(x * x, 12)
    expect(C.triangleArea(C.K_CIRCLE, x)).toBeCloseTo(Math.PI * x * x, 12)
  })
  test("面積の式の文言（式の部分は改行しない空白でつなぐ）", () => {
    expect(T.distanceText("2")).toBe("距離 ＝ 三角形の面積 ＝ ½ × 2 × (2 × 2)")
    expect(T.distanceResult("4")).toBe("x² ＝ 4")
    // 丸めた円周（12.57）を式に出さない（検算と答えが合わなくなるため）
    expect(T.circleAreaText("3")).toBe("円の面積 ＝ 三角形の面積 ＝ ½ × 3 × (2π × 3)")
    expect(T.circleAreaResult("12.57")).toBe("πr² ＝ 12.57")
  })
})

describe("細い長方形（F4-3）", () => {
  test.each(C.RECT_COUNTS)("%p 本：幅の合計は x、すき間も重なりもない", (n) => {
    const rs = C.midRects(2, 3, n)
    expect(rs).toHaveLength(n)
    expect(rs[0].x0).toBe(0)
    expect(rs[n - 1].x1).toBeCloseTo(3, 12)
    for (let j = 1; j < n; j++) expect(rs[j].x0).toBeCloseTo(rs[j - 1].x1, 12)
  })
  test.each(C.RECT_COUNTS)("%p 本：高さは幅のまん中での直線の高さ", (n) => {
    for (const r of C.midRects(C.K_CIRCLE, 2, n)) expect(r.height).toBeCloseTo(C.K_CIRCLE * (r.x0 + r.x1) / 2, 12)
  })
  test.each(C.RECT_COUNTS)("%p 本：合計は、本数によらず三角形の面積とちょうど等しい（要件 §5.2 と同じ性質）", (n) => {
    expect(C.rectsArea(C.midRects(C.K_SPEED, 2, n))).toBeCloseTo(4, 12)
    expect(C.rectsArea(C.midRects(C.K_CIRCLE, 2, n))).toBeCloseTo(4 * Math.PI, 12)
  })
  // 右の長方形1本 ＝ ③（②）の帯1本、を数値で結びつける（F4-3 のラベルの根拠）
  test("右のグラフの長方形1本は、② の帯1本と同じ（高さ ＝ 帯の長さ、幅 ＝ 帯の太さ）", () => {
    const rs = C.midRects(C.K_CIRCLE, 2, 8)
    rs.forEach((r, j) => {
      const f = ringFacts(j + 1) // 半径 2・8 本
      expect(r.height).toBeCloseTo(f.length, 12)
      expect(r.x1 - r.x0).toBeCloseTo(f.width, 12)
    })
  })
  test("初期の本数は選択肢の中にある", () => expect(C.RECT_COUNTS).toContain(C.DEFAULT_RECTS))
})

describe("グラフの表示範囲", () => {
  test.each([C.K_SPEED, C.K_CIRCLE])("k = %p：スライダーの右はし（x = 4）の点も、直線の先も表示の中", (k) => {
    const v = C.compareView(k)
    expect(v.xMin).toBeLessThan(0)
    // 横軸の名前（右はし）が x = 4 までの長方形に隠れないよう、x = 5 まで見せる
    expect(v.xMax).toBeGreaterThanOrEqual(C.X_MAX * 1.25)
    expect(v.yMin).toBeLessThan(0)
    expect(v.yMax).toBeGreaterThan(k * C.X_MAX)
  })
})

describe("まとめ表（F4-4）", () => {
  test("行は微分（取り出す）・積分（積み上げる）、列は運動・円", () => {
    expect(T.SUMMARY.cols).toEqual(["運動", "円"])
    expect(T.SUMMARY.rows.map((r) => r.head)).toEqual(["微分（取り出す）", "積分（積み上げる）"])
  })
  test("積分の行：速さ → 距離、円周 → 面積", () => {
    expect(T.SUMMARY.rows[1].cells).toEqual(["速さ 2x → 距離 x²", "円周 2πr → 面積 πr²"])
  })
})

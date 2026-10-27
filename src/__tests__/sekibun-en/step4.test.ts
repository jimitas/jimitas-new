// 円の面積と円周のひみつ — ステップ④ 速さと距離とくらべる（_lib/compare.ts）のテスト
// 受け入れ基準（要件 §8）の 6「x = r = 2 のとき左 4、右 12.57（＝ 4π）」をここで固定する。
import * as C from "@/app/(apps)/sekibun-en/_lib/compare"
import { ringFacts } from "@/app/(apps)/sekibun-en/_lib/cut"
import * as T from "@/app/(apps)/sekibun-en/_lib/text"
import { formatFixed } from "@/lib/graph/format"
import { makeTransform } from "@/lib/graph/viewport"

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

describe("③ の帯を右のグラフへ重ねる（F4-5）", () => {
  /** 箱の4つの角 */
  const corners = (b: C.PxBox) => [
    [b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h],
  ]
  /** 角の集まりを並べかえて比べられる形に */
  const sorted = (pts: number[][]) => pts.map(([a, b]) => [Math.round(a * 1e6) / 1e6, Math.round(b * 1e6) / 1e6]).sort((p, q) => p[0] - q[0] || p[1] - q[1])

  // 縦横の縮尺がちがうグラフでも、px の箱どうしなら回して重なる（高さ・幅は適当な px）
  test.each([[8, 12, [10, 30, 50, 70, 90, 110, 130, 150]], [4, 30, [20, 60, 100, 140]]] as const)(
    "%p 本・幅 %p px：横向きの帯を原点のまわりに −90° 回して右へ n·w ずらすと、縦の長方形にぴったり重なる",
    (n, w, heights) => {
      const [ox, oy] = [40, 300]
      const hs = [...heights]
      const lying = C.lyingStrips(ox, oy, w, hs)
      const standing = C.standingStrips(ox, oy, w, hs)
      const m = C.stripsMotion(ox, oy, w, n, 1)
      lying.forEach((b, j) => {
        const turned = corners(b).map(([x, y]) => { const q = C.rotateAbout(x, y, m.cx, m.cy, m.deg); return [q.x + m.dx, q.y] })
        expect(sorted(turned)).toEqual(sorted(corners(standing[j])))
      })
    })

  // 途中で帯の束が横軸より下に出ない（1点のまわりに回すと、途中で横軸の下へ大きくはみ出して切れて見えた）
  test("動かしている途中でも、帯は横軸（原点の高さ）より下に出ない", () => {
    const [ox, oy, w, n] = [40, 300, 12, 8]
    const hs = [10, 30, 50, 70, 90, 110, 130, 150]
    const lying = C.lyingStrips(ox, oy, w, hs)
    for (let s = 0; s <= 1.0001; s += 0.05) {
      const m = C.stripsMotion(ox, oy, w, n, s)
      for (const b of lying) {
        for (const [x, y] of corners(b)) {
          const q = C.rotateAbout(x, y, m.cx, m.cy, m.deg)
          expect(q.y).toBeLessThanOrEqual(oy + 1e-9)
        }
      }
    }
  })
  test("s = 0 では動かさない（横向きのまま）", () => expect(C.stripsMotion(40, 300, 12, 8, 0)).toEqual({ dx: 0, deg: -0, cx: 40, cy: 300, scale: 1 }))

  test("回す前の帯は ③ と同じ並び：いちばん長い帯（いちばん右の長方形）がいちばん下で、原点から右へのびる", () => {
    const lying = C.lyingStrips(40, 300, 10, [10, 20, 30])
    expect(lying.map((b) => b.x)).toEqual([40, 40, 40])
    expect(lying[2].y + lying[2].h).toBe(300) // いちばん長い帯の下はしは横軸
    expect(lying[0].y).toBeLessThan(lying[2].y) // 短い帯ほど上
  })

  test("縦の長方形はグラフの細い長方形と同じ場所（左から順に、下はしは横軸）", () => {
    const s = C.standingStrips(40, 300, 10, [10, 20])
    expect(s).toEqual([{ x: 40, y: 290, w: 10, h: 10 }, { x: 50, y: 280, w: 10, h: 20 }])
  })
})

// 実際の ④ のグラフ（右：円周 2πr、縦横比 COMPARE_ASPECT）の px で確かめる（2026-10-27 レビュー指摘）
describe("帯を重ねる動き：実際のグラフの大きさで", () => {
  const W = 500
  const plane = makeTransform(C.compareView(C.K_CIRCLE), W, W * C.COMPARE_ASPECT)
  const corners = (b: C.PxBox) => [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]]

  test.each([[1, 4], [2, 8], [2, 64], [3.5, 4], [4, 4], [4, 8], [4, 64]] as const)(
    "x = %p・%p 本：動きのどの途中でも、帯はグラフの枠の中（縦軸より右・右はしより左・横軸より上・上はしより下）",
    (x, n) => {
      const g = C.stripsGeometry(plane, C.K_CIRCLE, x, n)
      for (let s = 0; s <= 1.0001; s += 0.005) {
        const m = C.stripsMotion(g.ox, g.oy, g.w, n, s, g.lying, W)
        for (const b of g.lying) {
          for (const [px, py] of corners(b)) {
            const q = C.applyStripsMotion(px, py, m)
            expect(q.x).toBeGreaterThanOrEqual(g.ox - 1e-6)
            expect(q.x).toBeLessThanOrEqual(W + 1e-6)
            expect(q.y).toBeLessThanOrEqual(g.oy + 1e-6)
            expect(q.y).toBeGreaterThanOrEqual(0)
          }
        }
      }
    })

  test.each([[2, 8], [4, 64]] as const)("x = %p・%p 本：動き始めと終わりは縮めない（最後にぴったり重なる）", (x, n) => {
    const g = C.stripsGeometry(plane, C.K_CIRCLE, x, n)
    expect(C.stripsMotion(g.ox, g.oy, g.w, n, 0, g.lying, W).scale).toBe(1)
    expect(C.stripsMotion(g.ox, g.oy, g.w, n, 1, g.lying, W).scale).toBeCloseTo(1, 9)
  })

  test("x = 2 では途中も縮めない（はみ出さないので）、x = 4 では途中だけ縮める", () => {
    const g2 = C.stripsGeometry(plane, C.K_CIRCLE, 2, 8)
    const g4 = C.stripsGeometry(plane, C.K_CIRCLE, 4, 8)
    expect(C.stripsMotion(g2.ox, g2.oy, g2.w, 8, 0.5, g2.lying, W).scale).toBe(1)
    expect(C.stripsMotion(g4.ox, g4.oy, g4.w, 8, 0.5, g4.lying, W).scale).toBeLessThan(1)
  })

  test.each([[2, 8], [4, 64]] as const)("x = %p・%p 本：回し終えた帯は、座標平面に描く長方形と同じ px", (x, n) => {
    const g = C.stripsGeometry(plane, C.K_CIRCLE, x, n)
    C.midRects(C.K_CIRCLE, x, n).forEach((r, j) => {
      const b = g.standing[j]
      expect(b.x).toBeCloseTo(plane.toPx(r.x0), 6)
      expect(b.x + b.w).toBeCloseTo(plane.toPx(r.x1), 6)
      expect(b.y).toBeCloseTo(plane.toPy(r.height), 6)
      expect(b.y + b.h).toBeCloseTo(plane.toPy(0), 6)
    })
  })

  test("SVG の transform は 回す → 原点を中心に縮める → 右へずらす の順にかかる並び", () => {
    expect(C.stripsTransform({ dx: 12, deg: -45, cx: 3, cy: 4, scale: 0.8 }))
      .toBe("translate(12 0) translate(3 4) scale(0.8) translate(-3 -4) rotate(-45 3 4)")
  })

  test("ずらす量は回した分に合わせる（s = 0 で 0、s = 1 で n·w）", () => {
    expect(C.stripsMotion(0, 0, 10, 8, 0).dx).toBe(0)
    expect(C.stripsMotion(0, 0, 10, 8, 1).dx).toBeCloseTo(80, 9)
  })
})


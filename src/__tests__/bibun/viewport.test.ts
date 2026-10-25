// 微分の意味がわかる — _lib/viewport.ts のテスト（座標変換・目盛り・スナップ）
import * as V from "@/app/(apps)/bibun/_lib/viewport"
import type { View } from "@/app/(apps)/bibun/_lib/viewport"

const view: View = { xMin: -2, xMax: 6, yMin: -1, yMax: 11 }
const t = V.makeTransform(view, 800, 600)

describe("makeTransform", () => {
  test("左上が (xMin, yMax)、右下が (xMax, yMin)", () => {
    expect([t.toPx(-2), t.toPy(11)]).toEqual([0, 0])
    expect([t.toPx(6), t.toPy(-1)]).toEqual([800, 600])
  })
  test("行って戻ると元の値", () => {
    expect(t.fromPx(t.toPx(2.3))).toBeCloseTo(2.3, 12)
    expect(t.fromPy(t.toPy(-0.7))).toBeCloseTo(-0.7, 12)
  })
})

describe("zoomAbout / pan", () => {
  test("中心の点は画面上の同じ位置にとどまる", () => {
    const z = V.zoomAbout(view, 1, 4, 0.5)
    const tz = V.makeTransform(z, 800, 600)
    expect(tz.toPx(1)).toBeCloseTo(t.toPx(1), 9)
    expect(tz.toPy(4)).toBeCloseTo(t.toPy(4), 9)
    expect(z.xMax - z.xMin).toBeCloseTo(4, 12)
  })
  test("pan は幅を変えない", () => expect(V.pan(view, 1, -2)).toEqual({ xMin: -1, xMax: 7, yMin: -3, yMax: 9 }))
})

describe("ticks", () => {
  test("1刻み", () => expect(V.ticks(-2, 6, 8)).toEqual([-2, -1, 0, 1, 2, 3, 4, 5, 6]))
  test("0.1 刻みでも誤差なし（0.30000000000000004 にならない）", () =>
    expect(V.ticks(0.2, 0.6, 4)).toEqual([0.2, 0.3, 0.4, 0.5, 0.6]))
  test("大きく拡大しても作れる（h = 0.001 付近）", () => {
    const tk = V.ticks(1.996, 2.004, 4)
    expect(tk).toEqual([1.996, 1.998, 2, 2.002, 2.004])
  })
  test("1・2・5 の刻み", () => {
    expect(V.niceStep(10, 10)).toBe(1)
    expect(V.niceStep(10, 5)).toBe(2)
    expect(V.niceStep(10, 2)).toBe(5)
  })
})

describe("snap（0.1 刻み）", () => {
  test.each([
    [2.34, 2.3], [2.35000001, 2.4], [-0.04, 0], [2.3000000000000003, 2.3], [-1.26, -1.3],
  ])("%p → %p", (x, want) => expect(V.snap(x, 0.1)).toBe(want))
  test("-0 にならない", () => expect(Object.is(V.snap(-0.04, 0.1), -0)).toBe(false))
})

describe("fitView（全体表示）", () => {
  test("x² を −2〜5 で：縦は 0〜25 に余白を足した範囲", () => {
    const v = V.fitView((x) => x * x, -2, 5)
    expect(v.xMin).toBe(-2)
    expect(v.xMax).toBe(5)
    expect(v.yMin).toBeCloseTo(-2.5, 1) // 200 等分の点は x = 0 をちょうど通らない
    expect(v.yMax).toBeCloseTo(27.5, 1)
  })
  test("定数関数でも縦がつぶれない", () => {
    const v = V.fitView(() => 3, 0, 1)
    expect(v.yMax - v.yMin).toBeGreaterThanOrEqual(2)
  })
})

describe("lineEnds（直線を端から端まで）", () => {
  test("水平線は左端から右端", () => expect(V.lineEnds(0, 5, 0, t)).toEqual([0, t.toPy(5), 800, t.toPy(5)]))
  test("急な直線は画面の近くまで縮めるが、傾きは変わらない", () => {
    const [x1, y1, x2, y2] = V.lineEnds(2, 4, 1000, t)
    expect(Math.abs(y1)).toBeLessThanOrEqual(1200)
    expect(Math.abs(y2)).toBeLessThanOrEqual(1200)
    // 画面上の傾きから世界座標の傾きに戻すと 1000
    const s = (t.fromPy(y2) - t.fromPy(y1)) / (t.fromPx(x2) - t.fromPx(x1))
    expect(s).toBeCloseTo(1000, 6)
    // (2, 4) を通る
    expect(t.fromPy(y1) + 1000 * (2 - t.fromPx(x1))).toBeCloseTo(4, 6)
  })
  test("画面の外を通る水平線でも NaN にならない", () =>
    expect(V.lineEnds(0, 1000, 0, t).every(Number.isFinite)).toBe(true))
})

describe("curvePoints", () => {
  test("横幅を 2px ごとに区切る", () => expect(V.curvePoints((x) => x, t)).toHaveLength(401))
  test("画面から大きく外れた値は縮める（SVG に巨大な座標を渡さない）", () => {
    const pts = V.curvePoints((x) => x ** 3 * 1e6, t)
    for (const [, y] of pts) expect(Math.abs(y)).toBeLessThanOrEqual(600 * 11)
  })
})

// ---- 2026-10-25 レビュー指摘への対応 ----------------------------------------------

describe("zoomLimited（拡大・縮小の限度）", () => {
  const span = (v: View) => [v.xMax - v.xMin, v.yMax - v.yMin]
  test("拡大を続けても幅が MIN_SPAN を下回らず、座標変換が NaN にならない", () => {
    let v: View = { xMin: 1.9, xMax: 2.1, yMin: 3.9, yMax: 4.1 }
    for (let i = 0; i < 1000; i++) v = V.zoomLimited(v, 2, 4, 0.86)
    for (const s of span(v)) expect(s).toBeGreaterThanOrEqual(V.MIN_SPAN * (1 - 1e-9))
    const tz = V.makeTransform(v, 800, 600)
    expect(Number.isFinite(tz.toPx(2))).toBe(true)
    // 限度に達したあとも、縮小すれば戻れる
    expect(span(V.zoomLimited(v, 2, 4, 2))[0]).toBeGreaterThan(span(v)[0])
  })
  test("縮小を続けても幅が MAX_SPAN を超えない", () => {
    let v = view
    for (let i = 0; i < 1000; i++) v = V.zoomLimited(v, 0, 0, 1.5)
    for (const s of span(v)) expect(s).toBeLessThanOrEqual(V.MAX_SPAN * (1 + 1e-9))
    expect(V.ticks(v.xMin, v.xMax, 8).length).toBeGreaterThan(0)
  })
  test("範囲内なら zoomAbout と同じ", () =>
    expect(V.zoomLimited(view, 1, 4, 0.5)).toEqual(V.zoomAbout(view, 1, 4, 0.5)))
})

describe("panView（パン）", () => {
  test("指の下にあった点が、動かしたあとも指の下にある", () => {
    const p0 = { x: 100, y: 100 }
    const p1 = { x: 250, y: 160 }
    const after = V.makeTransform(V.panView(view, p0, p1, 800, 600), 800, 600)
    expect(after.fromPx(p1.x)).toBeCloseTo(t.fromPx(p0.x), 9)
    expect(after.fromPy(p1.y)).toBeCloseTo(t.fromPy(p0.y), 9)
  })
})

describe("pinchView（ピンチ）", () => {
  const a0 = { x: 300, y: 300 }
  const b0 = { x: 500, y: 300 }
  test("指を広げると拡大（範囲が狭まる）、すぼめると縮小", () => {
    const wide = V.pinchView(view, a0, b0, { x: 200, y: 300 }, { x: 600, y: 300 }, 800, 600)
    expect(wide.xMax - wide.xMin).toBeCloseTo(4, 9) // 間隔 2 倍 → 幅 1/2
    const narrow = V.pinchView(view, a0, b0, { x: 350, y: 300 }, { x: 450, y: 300 }, 800, 600)
    expect(narrow.xMax - narrow.xMin).toBeCloseTo(16, 9)
  })
  test("指のあいだにあった点が、ピンチ後の指のあいだに来る（指ごと動かしても）", () => {
    const a1 = { x: 150, y: 420 }
    const b1 = { x: 450, y: 380 }
    const after = V.makeTransform(V.pinchView(view, a0, b0, a1, b1, 800, 600), 800, 600)
    expect(after.fromPx((a1.x + b1.x) / 2)).toBeCloseTo(t.fromPx(400), 9)
    expect(after.fromPy((a1.y + b1.y) / 2)).toBeCloseTo(t.fromPy(300), 9)
  })
  test("指が重なっているときは表示を変えない", () =>
    expect(V.pinchView(view, a0, a0, a0, b0, 800, 600)).toBe(view))
})

describe("snap（10ⁿ でない刻み）", () => {
  test.each([
    [0.25, 0.25, 0.25], [0.75, 0.25, 0.75], [1.3, 0.25, 1.25], [0.3, 0.25, 0.25], [2.6, 0.5, 2.5], [7, 5, 5],
  ])("snap(%p, %p) → %p", (x, step, want) => expect(V.snap(x, step)).toBe(want))
  test.each([[0.25, 2], [0.1, 1], [5, 0], [1e-7, 7], [0.001, 3], [1000, 0]])("decimalsOf(%p) = %p", (s, d) =>
    expect(V.decimalsOf(s)).toBe(d))
})

describe("yLabelPlacement（y の目盛りの数字の位置）", () => {
  const w = V.textWidth("4.002", V.TICK_FONT)
  test("y 軸の左に収まるなら軸の左に右寄せ", () => expect(V.yLabelPlacement(200, 800, w)).toEqual({ x: 195, anchor: "end" }))
  test("y 軸が左の外なら、グラフの内側に左寄せ（数字の頭が切れない）", () => {
    const p = V.yLabelPlacement(-500, 800, w)
    expect(p.anchor).toBe("start")
    expect(p.x).toBeGreaterThanOrEqual(0)
  })
  test("y 軸が左端に近すぎて数字が入らないときも左寄せ", () => {
    const p = V.yLabelPlacement(w - 1, 800, w)
    expect(p.anchor).toBe("start")
  })
  test("y 軸が右の外なら右端に右寄せ", () => expect(V.yLabelPlacement(900, 800, w)).toEqual({ x: 795, anchor: "end" }))
  test("右寄せのとき、数字の左端が 0 以上（切れない）", () => {
    for (const ax of [0, 10, 30, 45, 60, 100]) {
      const p = V.yLabelPlacement(ax, 800, w)
      const left = p.anchor === "end" ? p.x - w : p.x
      expect(left).toBeGreaterThanOrEqual(0)
    }
  })
})

describe("要件 §6 の数値", () => {
  test("目盛りの文字は 14px 以上", () => expect(V.TICK_FONT).toBeGreaterThanOrEqual(14))
  test("点の当たり判定は半径 20px 以上", () => expect(V.HIT_RADIUS).toBeGreaterThanOrEqual(20))
})

describe("contains（点が表示の中にあるか）", () => {
  test("中央は中、外は外", () => {
    expect(V.contains(view, 2, 5)).toBe(true)
    expect(V.contains(view, 7, 5)).toBe(false)
    expect(V.contains(view, 2, 12)).toBe(false)
  })
  test("端ぎりぎり（5% 以内）は外とみなす", () => expect(V.contains(view, 5.9, 5)).toBe(false))
})

describe("loupeView（拡大ルーペ）", () => {
  test("10倍：幅と高さが 1/10、点 (cx, cy) が真ん中", () => {
    const v = V.loupeView(view, 2, 4, 10)
    expect(v.xMax - v.xMin).toBeCloseTo(0.8, 12)
    expect(v.yMax - v.yMin).toBeCloseTo(1.2, 12)
    expect((v.xMin + v.xMax) / 2).toBeCloseTo(2, 12)
    expect((v.yMin + v.yMax) / 2).toBeCloseTo(4, 12)
  })
  test("縦横比はもとの表示と同じ", () => {
    const v = V.loupeView(view, -1, 7, 10)
    expect((v.yMax - v.yMin) / (v.xMax - v.xMin)).toBeCloseTo((view.yMax - view.yMin) / (view.xMax - view.xMin), 12)
  })
})

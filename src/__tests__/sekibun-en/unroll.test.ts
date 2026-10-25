// 円の面積と円周のひみつ — _lib/unroll.ts・_lib/scene.ts のテスト（輪をほどく計算）
// 受け入れ基準（要件 §8）の 3・4・8 をここで固定する。
import * as U from "@/app/(apps)/sekibun-en/_lib/unroll"
import { BASE_Y, CY, R_PX, SCENE, VIEW_H, VIEW_W, X0, triangleGuide } from "@/app/(apps)/sekibun-en/_lib/scene"
import type { Pt } from "@/lib/graph/viewport"

/** 折れ線の長さ */
const polyLength = (pts: Pt[]) =>
  pts.slice(1).reduce((sum, p, j) => sum + Math.hypot(p.x - pts[j].x, p.y - pts[j].y), 0)

/** 0〜1 を細かく刻んだ t */
const T_GRID = Array.from({ length: 201 }, (_, j) => j / 200)

/** 外側・内側・まん中の輪の中心線の半径（輪 8 本のとき） */
const SAMPLE_RM = [1, 4, 8].map((i) => U.ringMidRadius(i, 8, R_PX))

describe("ringMidRadius（輪の中心線の半径）", () => {
  test("輪 i の中心線は (i − ½)Δr", () => {
    expect(U.ringMidRadius(1, 8, 80)).toBe(5)
    expect(U.ringMidRadius(8, 8, 80)).toBe(75)
  })
  test.each(U.RING_COUNTS)("輪 %p 本：隣りあう輪の中心線はちょうど Δr ずつ離れ、内はしは 0、外はしは r（すき間も重なりもない）", (n) => {
    const w = U.ringWidth(n, R_PX)
    expect(U.ringMidRadius(1, n, R_PX) - w / 2).toBeCloseTo(0, 12)
    expect(U.ringMidRadius(n, n, R_PX) + w / 2).toBeCloseTo(R_PX, 9)
    for (let i = 1; i < n; i++) {
      expect(U.ringMidRadius(i + 1, n, R_PX) - U.ringMidRadius(i, n, R_PX)).toBeCloseTo(w, 9)
    }
  })
  test("輪の数の初期値は選択肢の中にある", () => expect(U.RING_COUNTS).toContain(U.DEFAULT_RINGS))
  test("輪の面積 2πrm·Δr の合計は、輪の数によらず πr²（要件 §5.2）", () => {
    for (const n of U.RING_COUNTS) {
      let sum = 0
      for (let i = 1; i <= n; i++) sum += 2 * Math.PI * U.ringMidRadius(i, n, 2) * (2 / n)
      expect(sum).toBeCloseTo(Math.PI * 4, 10)
    }
  })
})

describe("ringPoints（受け入れ基準8）", () => {
  test.each(SAMPLE_RM)("t = 0：rm = %p の点はすべて中心から rm の円周上", (rm) => {
    for (const p of U.ringPoints(rm, 0, SCENE)) {
      expect(Math.hypot(p.x - X0, p.y - CY)).toBeCloseTo(rm, 9)
    }
  })

  test.each(SAMPLE_RM)("t = 1：rm = %p の点はすべて y = cy + rm の水平な線分、x は x₀〜x₀ + 2πrm", (rm) => {
    const pts = U.ringPoints(rm, 1, SCENE)
    for (const p of pts) expect(p.y).toBe(CY + rm)
    expect(pts[0].x).toBe(X0)
    expect(pts[pts.length - 1].x).toBeCloseTo(X0 + 2 * Math.PI * rm, 9)
  })

  test("長さはどの t でも 2πrm（折れ線なので 0.1% まで）", () => {
    for (const rm of SAMPLE_RM) {
      for (const t of [0, 0.1, 0.25, 0.5, 0.63, 0.9, 0.999, 1]) {
        const L = polyLength(U.ringPoints(rm, t, SCENE))
        expect(Math.abs(L / (2 * Math.PI * rm) - 1)).toBeLessThan(1e-3)
      }
    }
  })

  test("切れ目の右がわ（s = 0）は、どの t でも輪の真下の点にとどまる", () => {
    for (const rm of SAMPLE_RM) {
      for (const t of T_GRID) {
        const p = U.ringPoints(rm, t, SCENE)[0]
        expect(p.x).toBeCloseTo(X0, 9)
        expect(p.y).toBeCloseTo(CY + rm, 9)
      }
    }
  })

  // 曲率 k = (1 − t)/rm が STRAIGHT_K をまたぐところで、曲がった式と直線の式を比べる
  // （t = 1 − 1e-9 などでは両方とも直線の側になり、切りかえを検査したことにならない。2026-10-25 レビュー指摘）
  test.each(SAMPLE_RM)("rm = %p：曲がった弧から直線への切りかえで跳ばない（1px の 1/2 未満）", (rm) => {
    const curved = U.ringPoints(rm, 1 - 1.01 * U.STRAIGHT_K * rm, SCENE)
    const straight = U.ringPoints(rm, 1 - 0.99 * U.STRAIGHT_K * rm, SCENE)
    // 曲がった側は本当に曲がった式で計算されている（y が y_b からずれる）
    expect(curved[curved.length - 1].y).not.toBe(CY + rm)
    expect(straight[straight.length - 1].y).toBe(CY + rm)
    curved.forEach((p, j) => {
      expect(Math.abs(p.x - straight[j].x)).toBeLessThan(0.5)
      expect(Math.abs(p.y - straight[j].y)).toBeLessThan(0.5)
    })
  })

  test("範囲外の t は端にそろえる", () => {
    expect(U.ringPoints(10, -1, SCENE)).toEqual(U.ringPoints(10, 0, SCENE))
    expect(U.ringPoints(10, 2, SCENE)).toEqual(U.ringPoints(10, 1, SCENE))
  })
  test("t が NaN でも点は NaN にならず、もとの円（t = 0）になる", () => {
    expect(U.ringPoints(10, NaN, SCENE)).toEqual(U.ringPoints(10, 0, SCENE))
    expect(U.ringProgress(3, 8, NaN, "outer")).toBe(0)
  })
})

describe("ほどき終わると直角三角形（受け入れ基準3）", () => {
  test("三角形のガイドは直角が切れ目、底辺 2πr、高さ r", () => {
    const [right, end, top] = triangleGuide(SCENE)
    expect(right).toEqual([X0, BASE_Y])
    expect(end[0] - right[0]).toBeCloseTo(2 * Math.PI * R_PX, 9)
    expect(end[1]).toBe(BASE_Y)
    expect(right[1] - top[1]).toBe(R_PX)
    expect(top[0]).toBe(X0)
  })

  test.each(U.RING_COUNTS)("輪 %p 本：どの帯も右はしが三角形の斜辺の上（帯の長さ ＝ 2π × 高さ）", (n) => {
    for (let i = 1; i <= n; i++) {
      const pts = U.ringPoints(U.ringMidRadius(i, n, R_PX), 1, SCENE)
      const end = pts[pts.length - 1]
      // 斜辺は (x₀, cy) と (x₀ + 2πr, cy + r) を結ぶ線：x − x₀ = 2π(y − cy)
      expect(end.x - X0).toBeCloseTo(2 * Math.PI * (end.y - CY), 9)
    }
  })

  test.each(U.RING_COUNTS)("輪 %p 本：積み上げた帯の上はしは cy、下はしは底辺（すき間も重なりもない）", (n) => {
    const b = U.unrollBounds(n, 1, SCENE)
    expect(b.yMin).toBeCloseTo(CY, 9)
    expect(b.yMax).toBeCloseTo(BASE_Y, 9)
  })
})

describe("描画領域からはみ出さない（受け入れ基準3）", () => {
  /** viewBox の端から、これ以上内側に収める（px） */
  const MARGIN = 5
  const MODES: U.UnrollMode[] = ["all", "outer", "inner"]

  test.each(MODES)("ほどき方 %s：輪の数・進み具合のどれでも viewBox の内側", (mode) => {
    for (const n of U.RING_COUNTS) {
      for (const t of T_GRID) {
        const b = U.unrollBounds(n, t, SCENE, mode)
        expect(b.xMin).toBeGreaterThanOrEqual(MARGIN)
        expect(b.yMin).toBeGreaterThanOrEqual(MARGIN)
        expect(b.xMax).toBeLessThanOrEqual(VIEW_W - MARGIN)
        expect(b.yMax).toBeLessThanOrEqual(VIEW_H - MARGIN)
      }
    }
  })

  // 上の検査が、いちばん広がるところまで届いていることを確かめる（刻みが粗いと山を通りこして空回りする）。
  // 要件 §5.1 の「t ≈ 0.5 で最大 4r」ではなく、実際の山は t ≈ 0.63 の約 4.55rm（scene.ts の説明）。
  test("いちばん上まで広がるのは t ≈ 0.63 で、輪の真下の点から 4.5rm 以上上", () => {
    const n = 64
    let top = Infinity
    let at = 0
    for (const t of T_GRID) {
      const y = U.unrollBounds(n, t, SCENE).yMin
      if (y < top) [top, at] = [y, t]
    }
    expect(at).toBeGreaterThan(0.6)
    expect(at).toBeLessThan(0.66)
    const rm = U.ringMidRadius(n, n, R_PX)
    expect(CY + rm - top).toBeGreaterThan(4.5 * rm)
  })

  test("いちばん左まで広がるのは t ≈ 0.25〜0.3 で、切れ目から (4/3)rm 以上左", () => {
    const n = 64
    let left = Infinity
    let at = 0
    for (const t of T_GRID) {
      const x = U.unrollBounds(n, t, SCENE).xMin
      if (x < left) [left, at] = [x, t]
    }
    expect(at).toBeGreaterThanOrEqual(0.25)
    expect(at).toBeLessThanOrEqual(0.3)
    expect(X0 - left).toBeGreaterThan((4 / 3) * U.ringMidRadius(n, n, R_PX))
  })
})

describe("ringStepCount（点の数。要件 §6：64本でも点を増やしすぎない）", () => {
  test("短い輪でも 60 点", () => expect(U.ringStepCount(10)).toBe(60))
  test("長い輪は 3px に1点（長さに比例）", () => {
    expect(U.ringStepCount(2 * Math.PI * 80)).toBe(Math.ceil((2 * Math.PI * 80) / 3))
    expect(U.ringStepCount(600)).toBe(200)
  })
  test("輪 64 本の点の合計は 1万点未満", () => {
    let sum = 0
    for (let i = 1; i <= 64; i++) sum += U.ringStepCount(2 * Math.PI * U.ringMidRadius(i, 64, R_PX)) + 1
    expect(sum).toBeLessThan(10000)
  })
})

describe("ringProgress（ほどき方）", () => {
  test("全部いっしょ：どの輪も全体の t と同じ", () => {
    for (const t of [0, 0.3, 1]) expect(U.ringProgress(3, 8, t, "all")).toBe(t)
  })
  test.each(["outer", "inner"] as const)("%s：t = 0 で全部 0、t = 1 で全部 1、いつも 0〜1", (mode) => {
    for (let i = 1; i <= 8; i++) {
      expect(U.ringProgress(i, 8, 0, mode)).toBe(0)
      expect(U.ringProgress(i, 8, 1, mode)).toBe(1)
      for (const t of T_GRID) {
        const p = U.ringProgress(i, 8, t, mode)
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThanOrEqual(1)
      }
    }
  })
  test("外側から：外の輪がほどけ終わってから、1つ内側の輪がほどけ始める", () => {
    // t = 1/8 で輪 8（いちばん外）がほどけ終わり、輪 7 はまだ 0
    expect(U.ringProgress(8, 8, 1 / 8, "outer")).toBe(1)
    expect(U.ringProgress(7, 8, 1 / 8, "outer")).toBe(0)
    expect(U.ringProgress(7, 8, 1.5 / 8, "outer")).toBeCloseTo(0.5, 12)
    expect(U.ringProgress(1, 8, 7.5 / 8, "outer")).toBeCloseTo(0.5, 12)
  })
  test("内側から：順番が逆", () => {
    expect(U.ringProgress(1, 8, 1 / 8, "inner")).toBe(1)
    expect(U.ringProgress(2, 8, 1 / 8, "inner")).toBe(0)
    expect(U.ringProgress(8, 8, 7.5 / 8, "inner")).toBeCloseTo(0.5, 12)
  })
})

describe("ringIndexAt（タップした輪。受け入れ基準2の前提）", () => {
  test("中心はいちばん内側、ふちはいちばん外側", () => {
    expect(U.ringIndexAt(0, 8, 80)).toBe(1)
    expect(U.ringIndexAt(80, 8, 80)).toBe(8)
  })
  test("輪の中ほど", () => {
    expect(U.ringIndexAt(5, 8, 80)).toBe(1)
    expect(U.ringIndexAt(75, 8, 80)).toBe(8)
    expect(U.ringIndexAt(42, 8, 80)).toBe(5)
  })
  test("境目は外側の輪に入れる", () => {
    expect(U.ringIndexAt(10, 8, 80)).toBe(2)
    expect(U.ringIndexAt(70, 8, 80)).toBe(8)
  })
  test("円の外・負の距離・数でないときは null", () => {
    expect(U.ringIndexAt(80.01, 8, 80)).toBeNull()
    expect(U.ringIndexAt(-1, 8, 80)).toBeNull()
    expect(U.ringIndexAt(NaN, 8, 80)).toBeNull()
  })
})

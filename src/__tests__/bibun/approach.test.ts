// 微分の意味がわかる — _lib/approach.ts のテスト
import * as A from "@/app/(apps)/bibun/_lib/approach"
import { deltaY, diffQuotient, evaluate, formatNumber } from "@/app/(apps)/bibun/_lib/polynomial"
import type { Poly } from "@/app/(apps)/bibun/_lib/polynomial"
import { snap } from "@/app/(apps)/bibun/_lib/viewport"
import type { View } from "@/app/(apps)/bibun/_lib/viewport"

describe("hAt / timeOf（▶ 近づけてみる の h）", () => {
  test("はじめは 1、おわりは 0.001", () => {
    expect(A.hAt(0)).toBe(1)
    expect(A.hAt(1)).toBeCloseTo(0.001, 12)
  })
  test("範囲外の t は端にそろえる", () => {
    expect(A.hAt(-0.5)).toBe(1)
    expect(A.hAt(2)).toBeCloseTo(0.001, 12)
  })
  test.each(A.H_STEPS)("段 %p を通る時刻で h はその値", (s) => expect(A.hAt(A.timeOf(s))).toBeCloseTo(s, 12))
  test("1→0.1、0.1→0.01、0.01→0.001 は同じ時間", () => {
    expect(A.timeOf(0.1) - A.timeOf(1)).toBeCloseTo(A.timeOf(0.01) - A.timeOf(0.1), 12)
    expect(A.timeOf(0.001) - A.timeOf(0.01)).toBeCloseTo(1 / 3, 12)
  })
})

describe("stepsPassed（記録表に書く行数）", () => {
  test("押した瞬間に h = 1 の行が入る", () => expect(A.stepsPassed(0)).toBe(1))
  test("おわりで5行", () => expect(A.stepsPassed(1)).toBe(5))
  test("段の直前と直後", () => {
    const t = A.timeOf(0.1)
    expect(A.stepsPassed(t - 0.001)).toBe(2)
    expect(A.stepsPassed(t)).toBe(3)
  })
  test("時間とともに減らない", () => {
    let prev = 0
    for (let t = 0; t <= 1; t += 0.01) {
      const n = A.stepsPassed(t)
      expect(n).toBeGreaterThanOrEqual(prev)
      prev = n
    }
  })
})

describe("stepH（1段ずつ）", () => {
  test("はじめと終わりは段の値ちょうど", () => {
    expect(A.stepH(1, 0.5, 0)).toBeCloseTo(1, 12)
    expect(A.stepH(1, 0.5, 1)).toBeCloseTo(0.5, 12)
    expect(A.stepH(-0.01, -0.001, 1)).toBeCloseTo(-0.001, 12)
  })
  test("途中も from と to のあいだ", () => {
    for (let u = 0; u <= 1; u += 0.1) {
      const h = A.stepH(0.1, 0.01, u)
      expect(h).toBeLessThanOrEqual(0.1 + 1e-12)
      expect(h).toBeGreaterThanOrEqual(0.01 - 1e-12)
    }
  })
})

describe("chaseView（追いかけズーム）", () => {
  const X2: Poly = [0, 0, 1, 0]
  const X3: Poly = [0, 0, 0, 1]
  /** 関数 p・点 a で、h のときの表示範囲 */
  const viewAt = (full: View, p: Poly, a: number, h: number) =>
    A.chaseView(full, a, evaluate(p, a), h, deltaY(p, a, h))
  /** 点 (x, y) が表示範囲の中にあるか */
  const inside = (v: View, x: number, y: number) => v.xMin <= x && x <= v.xMax && v.yMin <= y && y <= v.yMax
  /** 「▶ 近づけてみる」の途中の h を細かく並べる */
  const path = Array.from({ length: 101 }, (_, i) => A.hAt(i / 100))

  const full: View = { xMin: -2, xMax: 6, yMin: -2, yMax: 10 }
  // h = 1 の点B（横 1・縦 5）が、縦横とも半分の 1/4 より内側に入るほど広い表示
  const wide: View = { xMin: -10, xMax: 10, yMin: -30, yMax: 30 }

  test("h = 1 では全体表示のまま", () => expect(viewAt(full, X2, 2, 1)).toEqual(full))
  test("全体表示が広くても h = 1 では全体表示のまま（押した瞬間に飛ばない）", () =>
    expect(viewAt(wide, X2, 2, 1)).toEqual(wide))

  test("h が小さくなるほど狭くなる（途中で広がらない）", () => {
    for (const v of [full, wide]) {
      let prev = Infinity
      for (const h of path) {
        const z = viewAt(v, X2, 2, h)
        const w = z.xMax - z.xMin
        expect(w).toBeLessThanOrEqual(prev + 1e-12)
        prev = w
      }
    }
  })

  test("h = 0.001 では十分に拡大される（横幅 1/100 以下）", () => {
    const z = viewAt(full, X2, 2, 0.001)
    expect(z.xMax - z.xMin).toBeLessThan((full.xMax - full.xMin) / 100)
  })

  test("縦横比は全体表示のまま", () => {
    const z = viewAt(full, X3, 2, 0.01)
    expect((z.yMax - z.yMin) / (z.xMax - z.xMin)).toBeCloseTo((full.yMax - full.yMin) / (full.xMax - full.xMin), 9)
  })

  // 傾きが急（x³ で a = 2、傾き 12）でも、点A が端の近く（a = 5.5）でも、点B が画面に残る。
  // 傾きが表示の縦の半分（ここでは 6）より大きいと、横だけ見て寄ると点B が上にはみ出す。
  test.each([
    ["x²・a = 2", X2, 2, full],
    ["x³・a = 2（傾き 12 ＞ 縦の半分 6）", X3, 2, full],
    ["x²・a = 5.5（全体表示の端の近く）", X2, 5.5, { xMin: -2, xMax: 6, yMin: -2, yMax: 40 }],
  ] as [string, Poly, number, View][])("%s：寄り始めたら点A・点B とも画面内", (_, p, a, v) => {
    // 追いかけズームは寄るだけで、全体表示より引くことはしない。
    // そのため「全体表示でも点B がはみ出している」h（x³ の h = 0.5 で y = 15.6 など）は対象外にし、
    // 「寄り始めたあと」と「全体表示で見えていた点B」だけを確かめる
    let zoomed = 0
    for (const h of path) {
      const z = viewAt(v, p, a, h)
      const bx = a + h
      const by = evaluate(p, a) + deltaY(p, a, h)
      const narrower = z.xMax - z.xMin < v.xMax - v.xMin
      if (!narrower && !inside(v, bx, by)) continue
      if (narrower) zoomed++
      expect(inside(z, a, evaluate(p, a))).toBe(true)
      expect(inside(z, bx, by)).toBe(true)
    }
    expect(zoomed).toBeGreaterThan(50) // 確かめた h の数（後半の半分以上は寄っている）
  })

  test("最後（h = 0.001）は点A がほぼ画面の中央（全体表示の端の近くから始めても）", () => {
    const z = viewAt({ xMin: -2, xMax: 6, yMin: -2, yMax: 40 }, X2, 5.5, 0.001)
    expect((5.5 - z.xMin) / (z.xMax - z.xMin)).toBeCloseTo(0.5, 2)
    expect((30.25 - z.yMin) / (z.yMax - z.yMin)).toBeCloseTo(0.5, 2)
  })

  // 右からと左からでは傾きが少し違う（4.01 と 3.99）ので、寄り方もわずかに違ってよい
  test("左から（h < 0）でも、右からとほぼ同じだけ寄る", () => {
    const r = viewAt(full, X2, 2, 0.01)
    const l = viewAt(full, X2, 2, -0.01)
    expect((l.xMax - l.xMin) / (r.xMax - r.xMin)).toBeCloseTo(1, 1)
  })
})

describe("initialView（ステップ②の全体表示）", () => {
  const presets = [[0, 0, 1, 0], [0, 0, 0, 1], [0, 4, -1, 0], [0, -3, 0, 1], [1, -3, 2, 0], [1, 2, 0, 0]] as Poly[]
  test.each(presets.flatMap((p) => [-2, 0, 2, 4].map((a) => [p, a] as [Poly, number])))(
    "%p・a = %p：点A と h = ±1 の点B が入る", (p, a) => {
      const v = A.initialView(p, a)
      for (const x of [a - 1, a, a + 1]) {
        const y = evaluate(p, x)
        expect(x).toBeGreaterThanOrEqual(v.xMin)
        expect(x).toBeLessThanOrEqual(v.xMax)
        expect(y).toBeGreaterThanOrEqual(v.yMin)
        expect(y).toBeLessThanOrEqual(v.yMax)
      }
    })
})

describe("hDragStep（点B をドラッグするときの刻み）", () => {
  test("全体表示（横幅 6）では 0.1", () => expect(A.hDragStep(6)).toBe(0.1))
  test("h = 0.001 まで寄った表示（横幅 0.008）では 0.001（0 に丸まらない）", () => {
    expect(A.hDragStep(0.008)).toBe(0.001)
    expect(snap(0.001, A.hDragStep(0.008))).toBe(0.001)
  })
  test("途中（横幅 0.4）では 0.01", () => expect(A.hDragStep(0.4)).toBe(0.01))
  test("どんなに広くても 0.1、どんなに狭くても 0.001", () => {
    expect(A.hDragStep(1e6)).toBe(0.1)
    expect(A.hDragStep(1e-6)).toBe(0.001)
  })
})

// 受け入れ基準1・2：押した回数と段の対応。1回目は h = ±1 のまま1行目を書き、押すたびに次の段へ進む。
describe("nextStep（1段ずつ）", () => {
  /** 初期状態から n 回押したときの h の並び（記録表に書かれる行の h） */
  const press = (side: 1 | -1, n: number) => {
    let count = 0
    let h: number = side
    const rows: number[] = []
    for (let i = 0; i < n; i++) {
      const st = A.nextStep(count, side, h)
      if (!st) break
      h = st.target
      count = st.nextCount
      rows.push(h)
    }
    return { rows, count, h }
  }
  test("右から：4回で 1, 0.5, 0.1, 0.01（平均変化率 5 → 4.5 → 4.1 → 4.01）", () => {
    const { rows } = press(1, 4)
    expect(rows).toEqual([1, 0.5, 0.1, 0.01])
    expect(rows.map((h) => formatNumber(diffQuotient([0, 0, 1, 0], 2, h)))).toEqual(["5", "4.5", "4.1", "4.01"])
  })
  test("5回目で 0.001（4.001）、6回目は押せない", () => {
    expect(press(1, 5).rows[4]).toBe(0.001)
    expect(A.nextStep(5, 1, 0.001)).toBeNull()
  })
  test("左から：−1, −0.5, −0.1, −0.01, −0.001（3 → 3.5 → 3.9 → 3.99 → 3.999）", () => {
    const { rows } = press(-1, 5)
    expect(rows).toEqual([-1, -0.5, -0.1, -0.01, -0.001])
    expect(rows.map((h) => formatNumber(diffQuotient([0, 0, 1, 0], 2, h)))).toEqual(["3", "3.5", "3.9", "3.99", "3.999"])
  })
  test("1回目は h = 1 にいるので動かさない。2回目からは動かす", () => {
    expect(A.nextStep(0, 1, 1)).toEqual({ target: 1, nextCount: 1, animate: false })
    expect(A.nextStep(1, 1, 1)).toEqual({ target: 0.5, nextCount: 2, animate: true })
  })
  test("スライダーで反対向きにしていたら、動かさずにその段へ", () =>
    expect(A.nextStep(2, -1, 0.3)).toEqual({ target: -0.1, nextCount: 3, animate: false }))
})

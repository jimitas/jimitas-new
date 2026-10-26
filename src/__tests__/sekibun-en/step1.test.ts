// 円の面積と円周のひみつ — ステップ① 面積の増え方（_lib/growth.ts・_lib/format.ts）のテスト
// 受け入れ基準（要件 §8）の 1「r = 2 で 1段ずつ → 15.71 → 14.14 → 12.88 → 12.60 → 12.57」をここで固定する。
import * as G from "@/app/(apps)/sekibun-en/_lib/growth"
import { format2, formatSig3 } from "@/app/(apps)/sekibun-en/_lib/format"
import * as T from "@/app/(apps)/sekibun-en/_lib/text"
import { H_STEPS, nextStep } from "@/lib/graph/steps"

/** 初期状態（h = 1）から n 回「1段ずつ」を押したときに記録表に書かれる h（StepGrowth.tsx と同じ使い方） */
function press(n: number): number[] {
  let count = 0
  let h = 1
  const rows: number[] = []
  for (let k = 0; k < n; k++) {
    const st = nextStep(count, 1, h)
    if (!st) break
    h = st.target
    count = st.nextCount
    rows.push(h)
  }
  return rows
}

describe("受け入れ基準1：r = 2 で「1段ずつ」", () => {
  test("5回押すと h は 1, 0.5, 0.1, 0.01, 0.001、6回目は押せない", () => {
    expect(press(6)).toEqual([1, 0.5, 0.1, 0.01, 0.001])
  })
  test("増えた面積 ÷ h は 15.71 → 14.14 → 12.88 → 12.60 → 12.57（スライド19）", () => {
    expect(press(5).map((h) => format2(G.addedPerH(G.R0, h)))).toEqual(["15.71", "14.14", "12.88", "12.60", "12.57"])
  })
  test("増えた面積は有効数字3桁で 15.7 → 7.07 → 1.29 → 0.126 → 0.0126（2026-10-25 オーナー決定）", () => {
    expect(press(5).map((h) => formatSig3(G.addedArea(G.R0, h)))).toEqual(["15.7", "7.07", "1.29", "0.126", "0.0126"])
  })
  test("目標は 半径 2 の円周 2π × 2 ＝ 12.57", () => {
    expect(T.targetText("2", format2(G.circumference(2)))).toBe("半径 2 の円周 2π × 2 ＝ 12.57")
  })
  test("記録表の段は共通の H_STEPS（微分の意味がわかると同じ段）", () => expect(press(5)).toEqual([...H_STEPS]))
})

describe("増えた面積を引き算せずに出す（要件 §5.2）", () => {
  test("増えた面積 ＝ π(r + h)² − πr²（ふつうの大きさなら引き算と一致）", () => {
    for (const [r, h] of [[2, 1], [2, 0.5], [3, 0.25], [1, 0.1]]) {
      expect(G.addedArea(r, h)).toBeCloseTo(Math.PI * (r + h) ** 2 - Math.PI * r ** 2, 10)
    }
  })
  // 引き算で出すと、ほぼ同じ大きさの数どうしの引き算になって桁落ちする。式で出していれば 2πr に近い。
  // r = 2・h = 1e-12 では引き算でも誤差 0.001 ほどしか出ず番人にならないので、微分の意味がわかると同じく
  // 大きな r と小さな h で確かめる（r = 10⁶・h = 10⁻⁶：引き算だと 2πr から 1 以上ずれる）
  test("r = 10⁶・h = 10⁻⁶ でも ÷ h は 2πr にほぼ一致（引き算の実装なら崩れる）", () => {
    const r = 1e6
    const h = 1e-6
    expect(G.addedPerH(r, h) / G.circumference(r)).toBeCloseTo(1, 9)
    expect(G.addedArea(r, h) / h / G.circumference(r)).toBeCloseTo(1, 9)
    // 参考：引き算で出すと、ここまで崩れる（この差が番人の意味）
    const subtract = (Math.PI * (r + h) ** 2 - Math.PI * r ** 2) / h
    expect(Math.abs(subtract - G.circumference(r))).toBeGreaterThan(1)
  })
  // F1-6（P1）：どの r でも 2πr に近づく。h = 0.001 での差はちょうど πh（r = 4 では 25.14 と 25.13 で、小数第2位では一致しない）
  test.each([1, 2, 3, 4])("r = %p：÷ h と円周の差はちょうど πh で、h = 0.001 では 0.01 未満", (r) => {
    expect(G.addedPerH(r, 0.001) - G.circumference(r)).toBeCloseTo(Math.PI * 0.001, 12)
    expect(G.addedPerH(r, 0.001) - G.circumference(r)).toBeLessThan(0.01)
  })
})

describe("h のスライダー（対数の目盛り。0 は選べない）", () => {
  test("左はしは 1、右はしは 0.001（0 にはならない）", () => {
    expect(G.hFromSlider(0)).toBe(1)
    expect(G.hFromSlider(1)).toBeCloseTo(0.001, 12)
    expect(G.hFromSlider(2)).toBeCloseTo(0.001, 12)
    expect(G.hFromSlider(NaN)).toBe(1)
  })
  test("1 → 0.1 → 0.01 → 0.001 を同じ幅で通る", () => {
    expect(G.hFromSlider(1 / 3)).toBeCloseTo(0.1, 12)
    expect(G.hFromSlider(2 / 3)).toBeCloseTo(0.01, 12)
  })
  test.each([1, 0.5, 0.1, 0.01, 0.001])("h = %p は、スライダーの位置に直してもどしても同じ", (h) =>
    expect(G.hFromSlider(G.sliderFromH(h))).toBeCloseTo(h, 12))
})

describe("拡大の小窓（F1-4：輪が細くなっても見える）", () => {
  test.each([1, 0.5, 0.1, 0.01, 0.001])("h = %p：輪の太さは、いつも小窓の幅の 1/5", (h) => {
    const w = G.loupeWindow(2, h)
    expect((h * G.unitFor(2)) / w.size).toBeCloseTo(1 / (2 * G.LOUPE_SPAN), 12)
    expect(1 / (2 * G.LOUPE_SPAN)).toBeCloseTo(0.2, 12)
  })
  test.each([1, 0.01])("h = %p：小窓のまん中は輪の右はし（中心線）", (h) => {
    const w = G.loupeWindow(2, h)
    expect(w.x + w.size / 2).toBeCloseTo(G.FIG_C + (2 + h / 2) * G.unitFor(2), 9)
    expect(w.y + w.size / 2).toBeCloseTo(G.FIG_C, 9)
  })
  test("h が小さいほど大きく拡大する（h = 0.001 で約 1400 倍）", () => {
    expect(G.loupeWindow(2, 0.001).mag).toBeCloseTo(1400, 6)
    expect(G.loupeWindow(2, 0.001).mag).toBeGreaterThan(G.loupeWindow(2, 0.01).mag)
  })
  test.each([1, 1.5, 2, 3, 4])("図の大きさ：r = %p で h = 1 のばしても viewBox に収まる（F1-6）", (r) => {
    expect(G.FIG_C + (r + G.H_MAX) * G.unitFor(r)).toBeLessThanOrEqual(G.FIG_SIZE)
  })
  test("r = 2 の縮尺は 1 あたり 40px（③ の円と同じ大きさ、半径 80px）", () => expect(G.unitFor(2)).toBe(40))
  test.each([1, 4])("r = %p でも、小窓の輪の太さは小窓の幅の 1/5", (r) => {
    const w = G.loupeWindow(r, 0.01)
    expect((0.01 * G.unitFor(r)) / w.size).toBeCloseTo(0.2, 12)
  })
})

describe("formatSig3（有効数字3桁）", () => {
  test.each([
    [15.70796, "15.7"],
    [7.0686, "7.07"],
    [1.30, "1.30"],
    [0.0125699, "0.0126"],
    [0.000125, "0.000125"],
    [-1.234, "−1.23"],
    [0, "0.00"],
    [NaN, "—"],
  ])("%p → %s", (v, want) => expect(formatSig3(v)).toBe(want))
})

describe("clipToFigure（拡大しているところの四角は図の中に描く）", () => {
  test("h = 1 では小窓の範囲が図の右へはみ出すので、右の辺を図の端で切る", () => {
    const w = G.loupeWindow(2, 1)
    expect(w.x + w.size).toBeGreaterThan(G.FIG_SIZE)
    const c = G.clipToFigure(w)
    expect(c.x + c.width).toBe(G.FIG_SIZE)
    expect(c.x).toBeCloseTo(w.x, 12)
  })
  test.each([1, 0.5, 0.1, 0.01, 0.001])("h = %p：切りつめた四角は図の中", (h) => {
    const c = G.clipToFigure(G.loupeWindow(2, h))
    expect(c.x).toBeGreaterThanOrEqual(0)
    expect(c.y).toBeGreaterThanOrEqual(0)
    expect(c.x + c.width).toBeLessThanOrEqual(G.FIG_SIZE)
    expect(c.y + c.height).toBeLessThanOrEqual(G.FIG_SIZE)
  })
  test("はみ出していなければ、そのまま", () => {
    const w = G.loupeWindow(2, 0.1)
    expect(G.clipToFigure(w)).toEqual({ x: w.x, y: w.y, width: w.size, height: w.size })
  })
})

describe("r を変える（F1-6）", () => {
  test("範囲は 1〜4、初期値は 2", () => {
    expect([G.R_MIN, G.R_MAX, G.R0]).toEqual([1, 4, 2])
  })
  test("r = 4 では h = 0.001 の行が 25.14、目標は 25.13（小数第2位で合わない）。そのときだけ一言を添える", () => {
    expect(format2(G.addedPerH(4, 0.001))).toBe("25.14")
    expect(format2(G.circumference(4))).toBe("25.13")
    expect(T.approachNote("25.14", "25.13")).toBe("（h = 0.001 ではまだ 25.14。h をもっと小さくすると 25.13 に近づく）")
  })
  test.each([
    [1, true], [1.5, true], [2, false], [2.5, false], [3, false], [3.5, false], [4, true],
  ])("r = %p：h = 0.001 の行と目標が小数第2位で合わず、一言を出すか → %p", (r, want) => {
    expect(G.needsApproachNote(r, format2)).toBe(want)
  })
  test("はじめの一言は r に合わせる", () => {
    expect(T.step1Guide("3")).toContain("半径 3 の円")
  })
})


// 円の面積と円周のひみつ — ステップ② 輪を切り開く（_lib/cut.ts・_lib/format.ts ほか）のテスト
// 受け入れ基準（要件 §8）の 2「選んだ輪が帯になり、帯の長さの表示がその輪の円周と一致する」をここで固定する。
import * as C from "@/app/(apps)/sekibun-en/_lib/cut"
import { format2 } from "@/app/(apps)/sekibun-en/_lib/format"
import { durationFor, playLabel, REDUCED_MS } from "@/app/(apps)/sekibun-en/_lib/playback"
import { BASE_Y, R_PX, SCENE, VIEW_H, VIEW_W, X0, CY, labelWidth } from "@/app/(apps)/sekibun-en/_lib/scene"
import { BIG_FONT } from "@/lib/graph/keys"
import * as T from "@/app/(apps)/sekibun-en/_lib/text"
import { ringAtPoint, ringMidRadius, ringPoints } from "@/app/(apps)/sekibun-en/_lib/unroll"

describe("ringFacts（輪の数値）", () => {
  test("半径 2 を 8 本に分けると太さ 0.25、いちばん外側の輪のまん中は 1.875", () => {
    const f = C.ringFacts(8)
    expect(f.width).toBe(0.25)
    expect(f.inner).toBe(1.75)
    expect(f.outer).toBe(2)
    expect(f.mid).toBe(1.875)
  })

  test.each([1, 4, 8])("輪 %p：帯の長さは、その輪のまん中の円周 2π × mid（受け入れ基準2）", (i) => {
    const f = C.ringFacts(i)
    expect(f.length).toBeCloseTo(2 * Math.PI * f.mid, 12)
  })

  test.each([1, 4, 8])("輪 %p：図でほどいた帯の長さ（px）と、表示の長さは同じ割合（半径 2 ↔ 80px）", (i) => {
    const f = C.ringFacts(i)
    const pts = ringPoints(ringMidRadius(i, C.CUT_RINGS, R_PX), 1, SCENE)
    const px = pts[pts.length - 1].x - pts[0].x
    expect(px / R_PX).toBeCloseTo(f.length / C.RADIUS, 9)
  })

  test.each([1, 4, 8])("輪 %p：円周 × 太さ は、輪の面積 π(外² − 内²) とちょうど等しい（要件 §5.2）", (i) => {
    const f = C.ringFacts(i)
    expect(f.area).toBeCloseTo(Math.PI * (f.outer ** 2 - f.inner ** 2), 12)
  })

  test("8 本の輪の面積の合計は円の面積 πr²", () => {
    let sum = 0
    for (let i = 1; i <= C.CUT_RINGS; i++) sum += C.ringFacts(i).area
    expect(sum).toBeCloseTo(Math.PI * C.RADIUS ** 2, 12)
  })

  test("表示：いちばん外側の輪は 長さ ≒ 11.78、面積 ≒ 2.95", () => {
    const f = C.ringFacts(8)
    expect(format2(f.length)).toBe("11.78")
    expect(format2(f.area)).toBe("2.95")
    // 式の部分は改行しない空白（U+00A0）でつなぐ（値だけが次の行に落ちないように）
    expect(T.stripLengthText("1.875", format2(f.length))).toBe("長さ ＝ 輪のまん中の円周 2π × 1.875 ≒ 11.78")
    expect(T.ringAreaText("11.78", "0.25", "2.95")).toBe("輪の面積 ≒ 円周 × 太さ ＝ 11.78 × 0.25 ≒ 2.95")
  })
})

describe("輪の選び方（F2-1）", () => {
  test("はじめはいちばん外側の輪", () => expect(C.INITIAL_RING).toBe(C.CUT_RINGS))
  test("clampRing は 1〜8 に収める", () => {
    expect(C.clampRing(0)).toBe(1)
    expect(C.clampRing(9)).toBe(8)
    expect(C.clampRing(5)).toBe(5)
  })
  test("ringAtPoint：中心のすぐ横はいちばん内側、円のふちはいちばん外側、円の外は null", () => {
    expect(ringAtPoint(X0 + 1, CY, 8, SCENE)).toBe(1)
    expect(ringAtPoint(X0, CY + R_PX - 1, 8, SCENE)).toBe(8)
    expect(ringAtPoint(X0 + R_PX + 5, CY, 8, SCENE)).toBeNull()
  })
  test("ringAtPoint：どの向きでも中心からの距離で決まる（斜め上の 4 本目）", () => {
    const d = ringMidRadius(4, 8, R_PX)
    expect(ringAtPoint(X0 - d / Math.SQRT2, CY - d / Math.SQRT2, 8, SCENE)).toBe(4)
  })
  test("選んでいる輪の言い方", () => {
    expect(T.pickedRingLabel(8, 8)).toBe("内側から 8 本目の輪（いちばん外側）")
    expect(T.pickedRingLabel(1, 8)).toBe("内側から 1 本目の輪（いちばん内側）")
    expect(T.pickedRingLabel(3, 8)).toBe("内側から 3 本目の輪")
  })
})

describe("切り開く動き（F2-2：約2秒）", () => {
  test("全部で 2 秒、途中からなら残りの割合", () => {
    expect(durationFor(0, 1, false, C.CUT_MS)).toBe(2000)
    expect(durationFor(0.5, 0, false, C.CUT_MS)).toBe(1000)
  })
  test("動きを減らす設定では短く（全部の長さより長くはしない）", () => {
    expect(durationFor(0, 1, true, C.CUT_MS)).toBe(REDUCED_MS)
    expect(durationFor(0, 1, true, 300)).toBe(300)
  })
  test("ボタンの文字は「切り開く」", () => {
    expect(playLabel(0, null, T.CUT_LABEL)).toBe("▶ 切り開く")
    expect(playLabel(1, null, T.CUT_LABEL)).toBe("▶ もう一度切り開く")
    expect(playLabel(0.5, 1, T.CUT_LABEL)).toBe("⏸ 止める")
  })
})

describe("format2（小数第2位。要件 §5.2）", () => {
  test.each([
    [12.598, "12.60"],
    [12.6, "12.60"],
    [2, "2.00"],
    [11.780972, "11.78"],
    [-1.5, "−1.50"],
    [-0.001, "0.00"],
    [NaN, "—"],
    // 十進数の四捨五入どおり（toFixed だと 2進数の誤差で 2.94・12.59 になる）
    [2.945, "2.95"],
    [11.78 * 0.25, "2.95"],
    [1.375, "1.38"],
    [1.005, "1.01"], // 100 倍すると 100.4999… になる（補正なしだと 1.00）
    [12.595, "12.60"],
    [12.5949, "12.59"],
    [-2.945, "−2.95"],
  ])("%p → %s", (v, want) => expect(format2(v)).toBe(want))
})

// 画面の式「11.78 × 0.25 ≒ 2.95」を、生徒が電卓で確かめても合うこと（2026-10-26 レビュー指摘）
describe("輪の面積の表示は、画面に出した長さ × 太さ を四捨五入した値", () => {
  test.each([1, 2, 3, 4, 5, 6, 7, 8])("輪 %p", (i) => {
    const f = C.ringFacts(i)
    // 整数（1/100 と 1/10000 の単位）で計算した、十進数の四捨五入の答え
    const lengthCents = Math.round(f.length * 100)
    const widthCents = Math.round(f.width * 100)
    const area10000 = lengthCents * widthCents
    const wantCents = Math.floor((area10000 + 50) / 100)
    const want = `${Math.floor(wantCents / 100)}.${String(wantCents % 100).padStart(2, "0")}`
    expect(format2(f.shownLength)).toBe(format2(lengthCents / 100))
    expect(format2(f.shownArea)).toBe(want)
  })
  test("内側から4本目：5.50 × 0.25 ≒ 1.38（丸める前の長さから出すと 1.37 になって検算と合わない）", () => {
    const f = C.ringFacts(4)
    expect(format2(f.shownLength)).toBe("5.50")
    expect(format2(f.shownArea)).toBe("1.38")
  })
})

describe("帯のそばのラベル（F2-3：長さは帯の上、太さは帯の下）", () => {
  test.each([1, BIG_FONT])("文字の倍率 %p：どの輪でも viewBox に収まり、帯に重ならない", (scale) => {
    for (let i = 1; i <= C.CUT_RINGS; i++) {
      const f = C.ringFacts(i)
      const texts = { length: T.stripTag(String(f.mid)), width: T.stripWidthTag(String(f.width)) }
      const p = C.stripLabels(i, scale, texts)
      const rm = ringMidRadius(i, C.CUT_RINGS, R_PX)
      const half = R_PX / C.CUT_RINGS / 2
      for (const [key, pos] of [["length", p.length], ["width", p.width]] as const) {
        const hw = labelWidth(texts[key], p.font) / 2
        expect(pos.x - hw).toBeGreaterThanOrEqual(0)
        expect(pos.x + hw).toBeLessThanOrEqual(VIEW_W)
        expect(pos.y + p.font * 0.25).toBeLessThanOrEqual(VIEW_H)
        expect(pos.y - p.font).toBeGreaterThanOrEqual(0)
      }
      // 長さは帯の上はしより上、太さは帯の下はしより下（文字の上はしで比べる）
      expect(p.length.y).toBeLessThan(CY + rm - half)
      expect(p.width.y - p.font).toBeGreaterThan(CY + rm + half)
    }
  })
  test("いちばん外側の輪の太さのラベルも、底辺（円の下はし）より下で viewBox の中", () => {
    const p = C.stripLabels(8, BIG_FONT, { length: "長さ ＝ 2π × 1.875", width: "太さ ＝ 0.25" })
    expect(p.width.y - p.font).toBeGreaterThan(BASE_Y - 1)
  })
  test("帯が長いときは帯のまん中に置く", () => {
    const p = C.stripLabels(8, 1, { length: "長さ ＝ 2π × 1.875", width: "太さ ＝ 0.25" })
    expect(p.length.x).toBeCloseTo(X0 + Math.PI * ringMidRadius(8, 8, R_PX), 9)
  })
})

// ハノイの塔 — ステップ④の大きな数・色（受け入れ基準5・6）
import * as B from "@/app/(apps)/hanoi/_lib/bignum"
import * as E from "@/app/(apps)/hanoi/_lib/estimate"
import * as C from "@/app/(apps)/hanoi/_lib/colors"

describe("BigInt", () => {
  test("2⁶⁴−1 を正確に", () => {
    expect(B.minMovesBig(64)).toBe(BigInt("18446744073709551615"))
    expect(B.withCommas(B.minMovesBig(64))).toBe("18,446,744,073,709,551,615")
  })
  test("日本語の単位", () => {
    expect(B.toJapaneseUnits(B.minMovesBig(64))).toBe("1844京6744兆737億955万1615")
    expect(B.toJapaneseUnits(BigInt(15))).toBe("15")
    expect(B.toJapaneseUnits(BigInt(100000000))).toBe("1億") // 0 のグループは飛ばす
    expect(B.toJapaneseUnits(BigInt(100010000))).toBe("1億1万")
    expect(B.toJapaneseUnits(BigInt(0))).toBe("0")
  })
})

describe("年数", () => {
  test("64枚・1秒で約5845億年、宇宙の年齢の約42倍", () => {
    const y = B.yearsFor(B.minMovesBig(64), 1)
    expect(B.formatYears(y)).toBe("約5845億年")
    expect(Math.round(B.timesOfUniverse(y))).toBe(42)
  })
  test("小さい年数", () => {
    expect(B.formatYears(B.yearsFor(BigInt(1023), 1))).toBe("約1020秒")
    expect(B.formatYears(3.5)).toBe("約3.5年")
  })
  test("1枚ふえるとちょうど2倍（＋1回）", () => {
    for (let n = 1; n < 64; n++) expect(B.minMovesBig(n + 1)).toBe(BigInt(2) * B.minMovesBig(n) + BigInt(1))
  })
})

describe("見積もり", () => {
  test("見積もり約5000億年は正確な値の 8〜9 割", () => {
    expect(E.ESTIMATE.years).toBeCloseTo(5e11, -9)
    expect(E.estimateRatio()).toBeGreaterThan(0.8)
    expect(E.estimateRatio()).toBeLessThan(0.9)
  })
})

describe("円盤の色", () => {
  test("番号の文字色：明るい円盤は黒、暗い円盤は白", () => {
    expect(C.labelColor("#F5D800")).toBe("#111111") // 黄
    expect(C.labelColor(C.WOOD_COLORS[0])).toBe("#111111") // ベージュ
    expect(C.labelColor(C.WOOD_COLORS[3])).toBe("#FFFFFF") // こげ茶
    expect(C.labelColor("#8A3FB8")).toBe("#FFFFFF") // 紫
  })
  test("⑦〜⑩は大きいほど暗い", () => {
    const l = C.WOOD_COLORS.map(C.luminance)
    for (let i = 1; i < l.length; i++) expect(l[i]).toBeLessThan(l[i - 1])
  })
  test("番号の文字色は、全10色で白か黒のうち見やすいほうを選び、コントラスト比 3 以上（紙粘土の色に差しかえたらここで気づく）", () => {
    for (let d = 1; d <= 10; d++) {
      const bg = C.diskColor(d)
      const fg = C.labelColor(bg)
      const l1 = C.luminance(bg)
      const l2 = C.luminance(fg)
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
      expect({ d, ok: ratio >= 3 }).toEqual({ d, ok: true })
    }
  })
  test("10 枚ぶんの色がすべて違う", () => {
    expect(new Set(Array.from({ length: 10 }, (_, i) => C.diskColor(i + 1))).size).toBe(10)
  })
})

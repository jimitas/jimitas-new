// 貯蓄と投資の積み立てシミュレーター — _lib/compound.ts のテスト
// 期待値の ¥12,331,010 / ¥7,419,430 は、移植元 script.js の漸化式で実際に画面に出る値。
// （index.html に初期表示として書かれていた ¥12,332,827 は、計算すると上書きされる古い値で、
//   script.js の結果とは一致しない。2026-10-10 確認）
import * as C from "@/app/(apps)/chokin-toushi/_lib/compound"

const last = (a: number[]) => a[a.length - 1]

describe("balances（月ごとの残高）", () => {
  test("3万円×20年×5% は移植元と同じ ¥12,331,010", () =>
    expect(C.fmtYen(last(C.balances(30000, 20, 5)))).toBe("¥12,331,010"))
  test("3万円×20年×0.3% は移植元と同じ ¥7,419,430", () =>
    expect(C.fmtYen(last(C.balances(30000, 20, 0.3)))).toBe("¥7,419,430"))
  test("長さは 月数+1、[0] は 0 円（0年から描く）", () => {
    const b = C.balances(10000, 3, 5)
    expect(b).toHaveLength(37)
    expect(b[0]).toBe(0)
    expect(b[1]).toBe(10000) // 1か月目のおわりは入れたばかりで利息なし
  })
  test("0% なら 毎月の額 × 月数", () => expect(last(C.balances(10000, 10, 0))).toBe(1200000))
  test.each([[0.1, 1], [5, 20], [15, 50], [7.3, 33]])("公式と一致（%p%%・%p年）", (pct, years) => {
    const r = C.monthlyRate(pct)
    const formula = 25000 * C.annuityFactor(r, years * 12)
    expect(Math.abs(last(C.balances(25000, years, pct)) - formula) / formula).toBeLessThan(1e-9)
  })
})

describe("annuityFactor", () => {
  test("r=0 は 0 除算せず n を返す", () => expect(C.annuityFactor(0, 240)).toBe(240))
  test("いちばん小さい利率（0.1%）では n より少しだけ大きい", () => {
    const f = C.annuityFactor(C.monthlyRate(0.1), 240)
    expect(f).toBeGreaterThan(240)
    expect(f).toBeLessThan(243)
  })
})

describe("normalizeRate", () => {
  test.each([
    [5.1000000001, 5.1],
    [0.30000000000000004, 0.3],
    [-1, 0],
    [20, 15],
    [NaN, 0],
  ])("%p → %p", (input, want) => expect(C.normalizeRate(input)).toBe(want))
})

describe("readInput", () => {
  const OK: C.InputForm = { amount: "3", years: 20, savingPct: 0.3, investPct: 5 }
  test("既定値", () =>
    expect(C.readInput(OK)).toEqual({ errors: [], params: { monthlyYen: 30000, years: 20, savingPct: 0.3, investPct: 5 } }))
  test("0.1万円は 1000 円ちょうど（小数誤差なし）", () =>
    expect(C.readInput({ ...OK, amount: "0.1" }).params?.monthlyYen).toBe(1000))
  test.each(["", " ", "abc", "0", "0.05", "101", "-3"])("金額 %p はエラー", (amount) => {
    const r = C.readInput({ ...OK, amount })
    expect(r.params).toBeNull()
    expect(r.errors).toHaveLength(1)
  })
  test.each([0, 51, 2.5])("年数 %p はエラー", (years) => expect(C.readInput({ ...OK, years }).params).toBeNull())
})

describe("表示の整形", () => {
  test("fmtPct", () => {
    expect(C.fmtPct(5)).toBe("5")
    expect(C.fmtPct(0.3)).toBe("0.3")
    expect(C.fmtPct(0.1 + 0.2)).toBe("0.3")
  })
  test("fmtRate は有効数字6桁・指数表記にならない", () => {
    expect(C.fmtRate(C.monthlyRate(5))).toBe("0.00416667")
    expect(C.fmtRate(C.monthlyRate(0.3))).toBe("0.00025")
    expect(C.fmtRate(C.monthlyRate(0.1))).toBe("0.0000833333")
    expect(C.fmtRate(0)).toBe("0")
  })
  test("fmtManOku", () => {
    expect(C.fmtManOku(0)).toBe("0円")
    expect(C.fmtManOku(5_000_000)).toBe("500万円")
    expect(C.fmtManOku(150_000_000)).toBe("1.5億円")
    expect(C.fmtManOku(150_000_000_000)).toBe("1,500億円") // 万円の目盛りと同じくカンマあり
  })
})

describe("文言（条件で切り替わる）", () => {
  test("注意書きは確定した文言のまま", () =>
    expect(C.DISCLAIMER).toBe(
      "※ このグラフは、毎年同じ割合で増えると仮定した計算です。実際の投資では、値上がりや値下がりをくり返しながら変動し、元本（積み立てた金額の合計）を下回ることもあります。",
    ))
  test("投資の方が多い", () =>
    expect(C.comparisonNote(20, 7419430, 12331010)).toMatch(/^この利率が続いたと仮定すると、同じ金額を積み立てても、20年後には投資の方が ¥4,911,580 多く/))
  test("貯蓄の方が多い（利率を入れかえたとき）", () =>
    expect(C.comparisonNote(20, 12331010, 7419430)).toMatch(/貯蓄の方が ¥4,911,580 多く/))
  test("同じ", () => expect(C.comparisonNote(10, 500, 500)).toBe("2つの利率が同じなので、10年後の資産も同じになります。"))
  test("3通りの文はすべて違う（固定文言に戻すと落ちる）", () => {
    const s = new Set([C.comparisonNote(5, 1, 2), C.comparisonNote(5, 2, 1), C.comparisonNote(5, 1, 1)])
    expect(s.size).toBe(3)
  })
  test("growthNote: 増えたとき", () =>
    expect(C.growthNote(7200000, 12331010, 5)).toBe("元本 ¥7,200,000 に対して、増えた分は ¥5,131,010（元本の 71.3%）です。"))
  test("growthNote: 0% のとき「増えた」と言わない", () => {
    const s = C.growthNote(1200000, 1200000, 0)
    expect(s).toContain("0%")
    expect(s).not.toContain("増えた")
  })
})

describe("グラフの目盛り", () => {
  test("yTicks は 0 から始まり max を覆う・刻みは等間隔", () => {
    for (const max of [1, 999, 12_332_827, 7.3e8]) {
      const t = C.yTicks(max)
      expect(t[0]).toBe(0)
      expect(t[t.length - 1]).toBeGreaterThanOrEqual(max)
      expect(t.length).toBeLessThanOrEqual(6)
      const step = t[1] - t[0]
      t.forEach((v, i) => expect(v).toBeCloseTo(i * step, 6))
    }
  })
  test("yTicks(12,332,827) は 500万円刻み", () => expect(C.yTicks(12_332_827)).toEqual([0, 5e6, 1e7, 1.5e7]))
  test("xTicks は 0 と最終年を含む", () => {
    for (let y = 1; y <= 50; y++) {
      const t = C.xTicks(y)
      expect(t[0]).toBe(0)
      expect(t[t.length - 1]).toBe(y)
    }
  })
  test("xTicks(20) は 5年ごと", () => expect(C.xTicks(20)).toEqual([0, 5, 10, 15, 20]))
  test("xTicks(32) は最後の目盛りが近すぎるとき1つ前を外す", () => expect(C.xTicks(32)).toEqual([0, 10, 20, 32]))
  test("toPoints: 両端の座標", () => expect(C.toPoints([0, 50, 100], 100, 60)).toBe("0.000,60.000 50.000,30.000 100.000,0.000"))
})

describe("レビュー対応（2026-10-10）", () => {
  test("比較の文は投資・貯蓄どちらが多くても「仮定すると」を付ける", () => {
    expect(C.comparisonNote(20, 1, 2)).toMatch(/^この利率が続いたと仮定すると、/)
    expect(C.comparisonNote(20, 2, 1)).toMatch(/^この利率が続いたと仮定すると、/)
  })
  test("growthNote は利率そのもので分ける（0%以外で「0% なので」と言わない）", () =>
    expect(C.growthNote(1000, 1000, 0.1)).not.toContain("0% なので"))
  test("diffLabel の3通り", () => {
    expect(C.diffLabel(1, 2)).toBe("投資の方が多い")
    expect(C.diffLabel(2, 1)).toBe("貯蓄の方が多い")
    expect(C.diffLabel(1, 1)).toBe("同じ")
  })
  // 代入過程の3行目「(表示値 − 1) ÷ 表示の月利」を電卓で計算したとき、
  // 4行目の係数（小数1桁）と合うこと。生徒が手で検算できる精度にする。
  test.each(
    [0.1, 0.3, 1, 5, 7.3, 15].flatMap((pct) => [1, 20, 50].map((y) => [pct, y])),
  )("代入過程の行どうしが合う（%p%%・%p年）", (pct, years) => {
    const r = C.monthlyRate(pct)
    const n = years * 12
    const byHand = (Number(C.fmtPow(r, n)) - 1) / Number(C.fmtRate(r))
    expect(Math.abs(byHand - Number(C.fmtFactor(r, n)))).toBeLessThan(0.1)
  })
})

describe("表示アニメ・税金の一文", () => {
  test("税金・手数料の一文は確定した文言のまま", () => expect(C.TAX_NOTE).toBe("※ 税金や手数料は考えていない計算です。"))
  test("revealProgress は 0〜1 に収まる", () => {
    expect(C.revealProgress(-10, 4000)).toBe(0)
    expect(C.revealProgress(2000, 4000)).toBe(0.5)
    expect(C.revealProgress(9999, 4000)).toBe(1)
    expect(C.revealProgress(5, 0)).toBe(1) // 動きを減らす設定などで時間0 → すぐ全部
  })
  test("drawnMonth は時間に比例（一定の速さ）", () => {
    const months = 240
    const at = (ms: number) => C.drawnMonth(C.revealProgress(ms, 4000), months)
    expect(at(0)).toBe(0)
    expect(at(1000)).toBe(60)
    expect(at(2000)).toBe(120)
    expect(at(4000)).toBe(240)
    expect(at(1000) - at(0)).toBe(at(4000) - at(3000))
  })
  test("再生中に年数が変わっても割合で続く", () => {
    expect(C.drawnMonth(0.5, 240)).toBe(120)
    expect(C.drawnMonth(0.5, 600)).toBe(300)
  })
  test("toPoints は totalMonths 基準で x を決める（途中までなら右端まで行かない）", () =>
    expect(C.toPoints([0, 10], 100, 60, 4)).toBe("0.000,60.000 25.000,54.000"))
  test("bandPoints は上の線→下の線（逆順）で閉じる", () =>
    expect(C.bandPoints([0, 20], [0, 10], 100, 60, 2)).toBe("0.000,60.000 50.000,48.000 50.000,54.000 0.000,60.000"))
  test("指数カーブ：後半の増え方は前半より大きい（5%・20年）", () => {
    const b = C.balances(30000, 20, 5)
    const firstHalf = b[120] - b[0]
    const secondHalf = b[240] - b[120]
    expect(secondHalf).toBeGreaterThan(firstHalf * 1.5)
  })
})

describe("fmtElapsed", () => {
  test.each([[0, "0年後"], [5, "5か月後"], [12, "1年後"], [41, "3年5か月後"], [240, "20年後"]])("%p → %p", (m, want) =>
    expect(C.fmtElapsed(m as number)).toBe(want))
})

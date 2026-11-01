// さいころの散らばりシミュレーター — 計算部分のテスト
// 要件定義書（docs/要件定義書_さいころ散らばりシミュレータ.md）§6 計算仕様・§10 受け入れ条件を固定する。
import * as fs from "fs"
import * as path from "path"
import { makeRng, rollMany, rollScore } from "@/app/(apps)/saikoro-chirabari/_lib/dice"
import {
  THEORY, addScores, countScores, deviations, emptyTally, mean, sd, tallyMean, tallySd, tallyVariance, variance,
} from "@/app/(apps)/saikoro-chirabari/_lib/stats"
import {
  SD_AXIS_MAX, SD_BIN_WIDTH, average, histogram, middleBand, quantile, shareAtOrBelow, simulateSetSds,
} from "@/app/(apps)/saikoro-chirabari/_lib/sets"
import { fmt2, fmtDev, roundHalfUp } from "@/app/(apps)/saikoro-chirabari/_lib/format"
import { checkCell, distribute, readGroup, splitPasted } from "@/app/(apps)/saikoro-chirabari/_lib/input"
import { verdictKind, verdictText } from "@/app/(apps)/saikoro-chirabari/_lib/verdict"

describe("理論値", () => {
  test("A: 平均7・分散35/6・標準偏差2.4152…", () => {
    expect(THEORY.A.mean).toBe(7)
    expect(THEORY.A.variance).toBeCloseTo(5.8333, 4)
    expect(THEORY.A.sd).toBeCloseTo(2.4152, 4)
  })
  test("B: 平均7・分散35/3・標準偏差3.4157…", () => {
    expect(THEORY.B.mean).toBe(7)
    expect(THEORY.B.variance).toBeCloseTo(11.6667, 4)
    expect(THEORY.B.sd).toBeCloseTo(3.4157, 4)
  })
  test("B の分散は A のちょうど2倍（崩れていたら実装ミス）", () => {
    expect(THEORY.B.variance / THEORY.A.variance).toBeCloseTo(2, 12)
  })
  test("理論値は得点の分布から計算した値と一致する", () => {
    // A：36通りを全部数える
    const a: number[] = []
    for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) a.push(i + j)
    expect(variance(a)).toBeCloseTo(THEORY.A.variance, 12)
    // B：6通り
    expect(variance([2, 4, 6, 8, 10, 12])).toBeCloseTo(THEORY.B.variance, 12)
  })
})

describe("分散は ÷n（n−1 では割らない）", () => {
  test("[2, 4] の分散は 1（÷(n−1) なら 2）", () => {
    expect(variance([2, 4])).toBe(1)
    expect(sd([2, 4])).toBe(1)
  })
  test("授業の例：10個の分散・標準偏差", () => {
    const xs = [7, 5, 9, 6, 8, 7, 4, 10, 7, 6]
    expect(mean(xs)).toBe(6.9)
    // Σ(偏差²) = 28.9 → ÷10 = 2.89（÷9 なら 3.21）
    expect(variance(xs)).toBeCloseTo(2.89, 12)
    expect(fmt2(sd(xs))).toBe("1.70")
  })
  test("Tally（ためていく集計）も ÷n で、直接計算と一致する", () => {
    const xs = rollMany("A", 500, makeRng(3))
    const t = addScores(emptyTally(), xs)
    expect(tallyMean(t)).toBeCloseTo(mean(xs), 12)
    expect(tallyVariance(t)).toBeCloseTo(variance(xs), 9)
    expect(t.sdHistory[t.sdHistory.length - 1]).toBeCloseTo(sd(xs), 9)
    expect(t.sdHistory[9]).toBeCloseTo(sd(xs.slice(0, 10)), 9)
  })
  test("各セットの標準偏差も ÷10", () => {
    // シードを同じにすれば、セットの中身を rollMany で再現できる
    const sds = simulateSetSds("B", 3, makeRng(5))
    const rng = makeRng(5)
    for (let s = 0; s < 3; s++) expect(sds[s]).toBeCloseTo(sd(rollMany("B", 10, rng)), 9)
  })
})

describe("受け入れ条件（§10）", () => {
  const a = addScores(emptyTally(), rollMany("A", 10000, makeRng(20261101)))
  const b = addScores(emptyTally(), rollMany("B", 10000, makeRng(20261102)))

  test("1: A方式で10,000回 → 平均 7.0±0.1、標準偏差 2.42±0.05", () => {
    expect(Math.abs(tallyMean(a) - 7)).toBeLessThanOrEqual(0.1)
    expect(Math.abs(tallySd(a) - 2.42)).toBeLessThanOrEqual(0.05)
  })
  test("2: B方式の分散が A方式の 1.9〜2.1 倍", () => {
    const ratio = tallyVariance(b) / tallyVariance(a)
    expect(ratio).toBeGreaterThanOrEqual(1.9)
    expect(ratio).toBeLessThanOrEqual(2.1)
  })
  test("2（シードを変えても）: 5通りのシードで比が 1.9〜2.1", () => {
    for (let k = 0; k < 5; k++) {
      const va = variance(rollMany("A", 10000, makeRng(100 + k)))
      const vb = variance(rollMany("B", 10000, makeRng(200 + k)))
      expect(vb / va).toBeGreaterThanOrEqual(1.9)
      expect(vb / va).toBeLessThanOrEqual(2.1)
    }
  })
  test("3: B方式の出目に奇数が1つもない", () => {
    const c = countScores(rollMany("B", 10000, makeRng(7)))
    // 3,5,7,9,11 の列
    expect([c[1], c[3], c[5], c[7], c[9]]).toEqual([0, 0, 0, 0, 0])
    expect(c.reduce((s, x) => s + x, 0)).toBe(10000)
  })
  test("A・B とも得点は 2〜12 に収まる", () => {
    const rng = makeRng(9)
    for (let i = 0; i < 5000; i++) {
      for (const m of ["A", "B"] as const) {
        const x = rollScore(m, rng)
        expect(x >= 2 && x <= 12).toBe(true)
      }
    }
  })
  test("rng() が 1 に近くても目は 6 まで", () => {
    expect(rollScore("A", () => 0.9999999999)).toBe(12)
    expect(rollScore("B", () => 0)).toBe(2)
  })
  test("6: 10回×1,000セットの標準偏差は1点に集中せず広がる", () => {
    const sds = simulateSetSds("A", 1000, makeRng(11))
    const band = middleBand(sds)
    // 真ん中80%の幅が 1 以上（理論値 2.42 のまわりに大きく散らばる）
    expect(band.hi - band.lo).toBeGreaterThan(1)
    // 6区間（1.2）以上にまたがる
    expect(histogram(sds).filter((c) => c > 0).length).toBeGreaterThanOrEqual(6)
  })
  test("10回の標準偏差の平均は理論値よりわずかに小さい（÷10 のため）", () => {
    const sds = simulateSetSds("A", 10000, makeRng(12))
    const avg = average(sds)
    expect(avg).toBeLessThan(THEORY.A.sd)
    expect(avg).toBeGreaterThan(THEORY.A.sd - 0.4)
  })
})

describe("ヒストグラム・分位点", () => {
  test("区間の境目は右の区間に入る（0.6 は 3 番目）", () => {
    const c = histogram([0, 0.2, 0.6, 0.59])
    expect(c[0]).toBe(1)
    expect(c[1]).toBe(1)
    expect(c[2]).toBe(1)
    expect(c[3]).toBe(1)
  })
  test("横軸の最大を超える値は最後の区間に入れて捨てない", () => {
    const c = histogram([SD_AXIS_MAX + 1])
    expect(c.length).toBe(Math.round(SD_AXIS_MAX / SD_BIN_WIDTH))
    expect(c[c.length - 1]).toBe(1)
  })
  test("10回の標準偏差は最大 5（半分が2・半分が12）で軸に収まる", () => {
    expect(sd([2, 2, 2, 2, 2, 12, 12, 12, 12, 12])).toBe(5)
    expect(5).toBeLessThan(SD_AXIS_MAX)
  })
  test("分位点は線形補間", () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3)
    expect(quantile([0, 10], 0.1)).toBeCloseTo(1, 12)
    const band = middleBand([0, 10])
    expect(band.lo).toBeCloseTo(1, 12)
    expect(band.hi).toBeCloseTo(9, 12)
  })
  test("shareAtOrBelow", () => {
    expect(shareAtOrBelow([1, 2, 3, 4], 2)).toBe(0.5)
  })
})

describe("表示の桁", () => {
  test("小数第2位で四捨五入（2進数の誤差で切り捨てない）", () => {
    expect(fmt2(2.675)).toBe("2.68")
    expect(fmt2(2.4152)).toBe("2.42")
    expect(fmt2(3.4157)).toBe("3.42")
    expect(fmt2(5.8333)).toBe("5.83")
    expect(fmt2(11.6667)).toBe("11.67")
    expect(fmt2(7)).toBe("7.00")
    expect(fmt2(NaN)).toBe("―")
  })
  test("偏差は小数第1位・正には +・負も絶対値で四捨五入", () => {
    expect(fmtDev(0.1)).toBe("+0.1")
    expect(fmtDev(-4.7)).toBe("-4.7")
    expect(fmtDev(-0.25)).toBe("-0.3")
    expect(fmtDev(0)).toBe("0.0")
  })
  test("−0.0 は出さない", () => {
    expect(fmtDev(-1e-15)).toBe("0.0")
    expect(roundHalfUp(-0.04, 1)).toBe(0)
    expect(Object.is(roundHalfUp(-0.04, 1), -0)).toBe(false)
  })
  test("5: 10個の得点の偏差の合計は必ず 0.0 と表示される", () => {
    const rng = makeRng(42)
    for (let k = 0; k < 2000; k++) {
      const xs = rollMany(k % 2 === 0 ? "A" : "B", 10, rng)
      const devSum = deviations(xs).reduce((s, d) => s + d, 0)
      expect(fmtDev(devSum)).toBe("0.0")
    }
  })
})

describe("班のデータの入力", () => {
  test("A方式：2〜12 の整数", () => {
    expect(checkCell("7", "A")).toEqual({ value: 7 })
    expect(checkCell("１２", "A")).toEqual({ value: 12 })
    expect(checkCell("13", "A")).toEqual({ error: "2〜12 で入れてください" })
    expect(checkCell("1", "A")).toEqual({ error: "2〜12 で入れてください" })
    expect(checkCell("6.5", "A")).toEqual({ error: "整数で入れてください" })
    expect(checkCell("", "A")).toBeNull()
  })
  test("B方式：偶数だけ", () => {
    expect(checkCell("8", "B")).toEqual({ value: 8 })
    expect(checkCell("7", "B")).toEqual({ error: "B方式は偶数だけです" })
  })
  test("10個そろったときだけ values が出る", () => {
    const ten = ["2", "4", "6", "8", "10", "12", "2", "4", "6", "8"]
    expect(readGroup(ten, "B").values).toEqual(ten.map(Number))
    const nine = [...ten.slice(0, 9), ""]
    expect(readGroup(nine, "B").values).toBeNull()
    expect(readGroup(nine, "B").filled).toBe(9)
    const bad = [...ten.slice(0, 9), "7"]
    expect(readGroup(bad, "B").values).toBeNull()
    expect(readGroup(bad, "B").errors[9]).toBe("B方式は偶数だけです")
  })
  test("貼り付けは start の欄から配り、入りきらない分を dropped で返す", () => {
    const empty = Array(10).fill("")
    const ten = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    expect(distribute(empty, 0, ten)).toEqual({ cells: ten, dropped: [] })
    const r = distribute(empty, 1, ten)
    expect(r.cells).toEqual(["", ...ten.slice(0, 9)])
    expect(r.dropped).toEqual(["10"])
    expect(distribute(empty, 0, [...ten, "11"]).dropped).toEqual(["11"])
  })
  test("区切って貼り付けた文字列を分ける", () => {
    expect(splitPasted("4,7, 9、10 ，3")).toEqual(["4", "7", "9", "10", "3"])
    expect(splitPasted("4")).toBeNull()
  })
})

describe("文言（要件定義書 §8・§9）", () => {
  // 画面に出さない用語。コメントにも書かない（文字列とコメントを見分けずに検査するため）
  const FORBIDDEN = ["標本", "母集団", "不偏", "正規分布", "中心極限", "偏差値"]
  const dir = path.join(__dirname, "../../app/(apps)/saikoro-chirabari")
  const files: string[] = []
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.tsx?$/.test(e.name)) files.push(p)
    }
  }
  walk(dir)
  test("アプリのファイルが見つかる（検査が空振りしていない）", () => {
    expect(files.length).toBeGreaterThanOrEqual(5)
  })
  test.each(FORBIDDEN)("「%s」を使っていない", (word) => {
    for (const f of files) expect([path.basename(f), fs.readFileSync(f, "utf8").includes(word)]).toEqual([path.basename(f), false])
  })
})

describe("班の位置を言う文（極端な値に「何度も出る」と言わない）", () => {
  test("1% 未満・99% 超は「かなり珍しい」", () => {
    expect(verdictKind(0, false)).toBe("rare")
    expect(verdictKind(0.009, false)).toBe("rare")
    expect(verdictKind(1, false)).toBe("rare")
    expect(verdictKind(0.995, false)).toBe("rare")
  })
  test("帯の中なら「珍しくない」、帯の外で 1〜99% なら「少し珍しい」", () => {
    expect(verdictKind(0.5, true)).toBe("inside")
    expect(verdictKind(0.05, false)).toBe("outside")
    expect(verdictKind(0.01, false)).toBe("outside")
  })
  test("かなり珍しい値には「何度も出てくる」と言わない", () => {
    expect(verdictText("rare", true)).not.toContain("何度も")
    expect(verdictText("rare", false)).not.toContain("何度も")
  })
  test("帯を描いていないとき（A・B 両方）は「範囲です」と帯を指さない", () => {
    expect(verdictText("inside", false)).not.toContain("範囲")
    expect(verdictText("inside", true)).toContain("範囲")
  })
})

// ガチャ確率シミュレーター — 移植時に script.js から _lib/ へ出した部分のテスト
//   settings.ts  … 入力欄の検証・分母⇔% の換算・S の切り詰め
//   session.ts   … アニメ中の1セッション（advanceSession）
//   chartData.ts … グラフ用の列・累積カーブ
import * as M from "@/app/(apps)/gacha-kakuritu/_lib/gachaMath"
import { HIT, MISS, TICK_CAP, UNDRAWN, advanceSession, newSession } from "@/app/(apps)/gacha-kakuritu/_lib/session"
import { WORK_CAP, capSessions, denomFromPct, pctFromDenom, readSettings } from "@/app/(apps)/gacha-kakuritu/_lib/settings"
import type { SettingsForm } from "@/app/(apps)/gacha-kakuritu/_lib/settings"
import { computeTheory, cumulativePoints, firstHitColumns, hitsColumns, MAX_COLUMNS } from "@/app/(apps)/gacha-kakuritu/_lib/chartData"

const OK: SettingsForm = { denom: "100", pct: "1", n: "100", s: "1000", pSource: "denom" }
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol

describe("readSettings", () => {
  test("既定値は p=0.01, N=100, S=1000", () => expect(readSettings(OK)).toEqual({ errors: [], p: 0.01, N: 100, S: 1000 }))
  test("pSource=pct なら % 欄が真値", () => expect(readSettings({ ...OK, pct: "3", pSource: "pct" }).p).toBeCloseTo(0.03, 12))
  test("pSource=denom なら % 欄が壊れていても通る", () => expect(readSettings({ ...OK, pct: "abc" }).errors).toEqual([]))
  test.each([
    ["分母 0.5", { denom: "0.5" }],
    ["分母 空", { denom: "" }],
    ["分母 上限超え", { denom: "10000001" }],
    ["% 0", { pct: "0", pSource: "pct" }],
    ["% 100超え", { pct: "100.1", pSource: "pct" }],
    ["N 0", { n: "0" }],
    ["N 小数", { n: "1.5" }],
    ["N 上限超え", { n: "10001" }],
    ["S 空", { s: "" }],
    ["S 上限超え", { s: "100001" }],
  ] as [string, Partial<SettingsForm>][])("%s はエラー", (_, patch) =>
    expect(readSettings({ ...OK, ...patch }).errors.length).toBe(1))
  test("100% はエラーにならない", () => expect(readSettings({ ...OK, pct: "100", pSource: "pct" }).p).toBe(1))
})

describe("分母 ⇔ %", () => {
  test("100 → 1", () => expect(pctFromDenom("100", "x")).toBe("1"))
  test("3 → 33.3333", () => expect(pctFromDenom("3", "x")).toBe("33.3333"))
  test("換算できない分母は % をそのまま", () => expect(pctFromDenom("0.5", "7")).toBe("7"))
  test("3% → 33.3333", () => expect(denomFromPct("3", "x")).toBe("33.3333"))
  test("換算できない % は分母をそのまま", () => expect(denomFromPct("0", "42")).toBe("42"))
})

describe("capSessions", () => {
  test("上限内ならそのまま", () => expect(capSessions(1000, 100)).toBe(1000))
  test("S×N が WORK_CAP を超えたら切り詰める", () => {
    const s = capSessions(100000, 10000)
    expect(s).toBe(WORK_CAP / 10000)
    expect(s * 10000).toBeLessThanOrEqual(WORK_CAP)
  })
})

describe("advanceSession", () => {
  test("決まった列で outcomes・hits・firstHit・ticks がそろう", () => {
    const seq = [0.5, 0.05, 0.9, 0.01, 0.5, 0.5]
    let i = 0
    const cur = newSession(6)
    advanceSession(cur, 0.1, 6, () => seq[i++])
    expect(Array.from(cur.outcomes)).toEqual([MISS, HIT, MISS, HIT, MISS, MISS])
    expect(cur).toMatchObject({ k: 6, hits: 2, firstHit: 2, done: true, ticks: [2, 4] })
  })
  test("少しずつ進めても一気に進めても runSession と同じ結果（同じ乱数列）", () => {
    const vals = Array.from({ length: 50 }, (_, j) => ((j * 37) % 100) / 100)
    const mk = () => { let i = 0; return () => vals[i++] }
    const cur = newSession(50)
    const rng = mk()
    for (const step of [1, 3, 7, 100]) advanceSession(cur, 0.1, step, rng)
    const r = M.runSession(0.1, 50, mk())
    expect({ hits: cur.hits, firstHit: cur.firstHit }).toEqual(r)
    expect(cur.k).toBe(50)
  })
  test("N を超えて引かない・done 後は進まない", () => {
    const cur = newSession(3)
    advanceSession(cur, 0.5, 10, () => 0.9)
    advanceSession(cur, 0.5, 10, () => 0)
    expect(cur).toMatchObject({ k: 3, hits: 0, firstHit: 0, done: true })
  })
  test("途中まではまだ引いていない枠が残る", () => {
    const cur = newSession(5)
    advanceSession(cur, 0.5, 2, () => 0.9)
    expect(Array.from(cur.outcomes)).toEqual([MISS, MISS, UNDRAWN, UNDRAWN, UNDRAWN])
    expect(cur.done).toBe(false)
  })
  test(`ticks は ${TICK_CAP} 個で打ち止め`, () => {
    const cur = newSession(1000)
    advanceSession(cur, 1, 1000)
    expect(cur.hits).toBe(1000)
    expect(cur.ticks.length).toBe(TICK_CAP)
  })
})

describe("グラフ用データ", () => {
  // 決まった集計を作る（3セッション: 0回 / 2回(初3) / 1回(初10)）
  const st = M.createStats(0.01, 10)
  M.addSession(st, { hits: 0, firstHit: 0 })
  M.addSession(st, { hits: 2, firstHit: 3 })
  M.addSession(st, { hits: 1, firstHit: 10 })
  const th = computeTheory(0.01, 10)

  test("hitsColumns: 観測の合計 = 1、理論の合計 ≦ 1", () => {
    const cols = hitsColumns(st, th)
    expect(near(cols.reduce((a, c) => a + c.obs, 0), 1, 1e-12)).toBe(true)
    expect(cols.reduce((a, c) => a + c.theory, 0)).toBeLessThanOrEqual(1 + 1e-12)
    expect(cols[0].label).toBe("0")
  })
  test("hitsColumns: 列数は MAX_COLUMNS 以下（N=10000, p=0.5）", () => {
    const big = M.createStats(0.5, 10000)
    expect(hitsColumns(big, computeTheory(0.5, 10000)).length).toBeLessThanOrEqual(MAX_COLUMNS)
  })
  test("firstHitColumns: 最後は「出ず」、観測・理論とも合計 1", () => {
    const cols = firstHitColumns(st, th)
    expect(cols.at(-1)!.label).toBe("出ず")
    expect(near(cols.reduce((a, c) => a + c.obs, 0), 1, 1e-12)).toBe(true)
    expect(near(cols.reduce((a, c) => a + c.theory, 0), 1, 1e-12)).toBe(true)
  })
  test("集計が空なら観測は全部 0・累積の観測線は空", () => {
    const empty = M.createStats(0.01, 10)
    expect(firstHitColumns(empty, th).every((c) => c.obs === 0)).toBe(true)
    expect(cumulativePoints(empty).obs).toBe("")
  })
  test("cumulativePoints: 最後の点 = k=N、観測の y は「出ず」を除いた割合", () => {
    const { theory, obs } = cumulativePoints(st)
    expect(theory.split(" ").at(-1)).toBe(`100.00,${(60 - M.pAtLeastOne(0.01, 10) * 60).toFixed(2)}`)
    expect(obs.split(" ").at(-1)).toBe(`100.00,${(60 - (2 / 3) * 60).toFixed(2)}`)
  })
  test("cumulativePoints: 点は最大 101 個（原点＋100）", () => {
    const big = M.createStats(0.01, 10000)
    expect(cumulativePoints(big).theory.split(" ").length).toBeLessThanOrEqual(101)
  })
})

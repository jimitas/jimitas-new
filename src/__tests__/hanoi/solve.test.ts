// ハノイの塔 — 計算（_lib/solve.ts・play.ts）のテスト。受け入れ基準6
import * as S from "@/app/(apps)/hanoi/_lib/solve"
import * as P from "@/app/(apps)/hanoi/_lib/play"

const NS = Array.from({ length: 10 }, (_, i) => i + 1)

describe("solve（最少手順）", () => {
  test.each(NS)("n=%i の手数は 2ⁿ−1", (n) => {
    expect(S.solveTo(n).length).toBe(2 ** n - 1)
  })
  test.each(NS)("n=%i：全部の手がルールを守り、最後に全円盤が移動先にある", (n) => {
    for (const to of ["B", "C"] as const) {
      let p = S.initialPegs(n)
      for (const m of S.solveTo(n, to)) {
        const r = P.tryMove(p, m.from, m.to)
        expect(r).not.toBeNull()
        expect(r!.move.disk).toBe(m.disk)
        p = r!.pegs
      }
      expect(P.isSolved(p, n, to)).toBe(true)
    }
  })
  test.each(NS)("n=%i：円盤 j の移動回数は 2ⁿ⁻ʲ", (n) => {
    const c = S.diskCounts(S.solveTo(n), n)
    for (let j = 1; j <= n; j++) expect(c[j]).toBe(2 ** (n - j))
  })
  test.each(NS)("n=%i：2進法のルールで求めた円盤番号が手順と一致", (n) => {
    S.solveTo(n).forEach((m, i) => expect(S.diskByBinary(i + 1)).toBe(m.disk))
  })
  test("n=3 の手順（C へ）は教科書どおり", () => {
    expect(S.solveTo(3, "C").map((m) => `${m.disk}${m.from}${m.to}`)).toEqual([
      "1AC", "2AB", "1CB", "3AC", "1BA", "2BC", "1AC",
    ])
  })
  test("n=2（B へ）は ①AC ②AB ①CB", () => {
    expect(S.solveTo(2, "B").map((m) => `${m.disk}${m.from}${m.to}`)).toEqual(["1AC", "2AB", "1CB"])
  })
})

describe("stateAt（スナップショット経由でも1手ずつと一致）", () => {
  test("n=10 の全ての k で一致する", () => {
    const n = 10
    const moves = S.solveTo(n)
    const snaps = S.buildSnapshots(moves, n)
    let p = S.initialPegs(n)
    expect(S.stateAt(moves, n, 0, snaps)).toEqual(p)
    moves.forEach((m, i) => {
      p = S.applyMoveTo(p, m)
      expect(S.stateAt(moves, n, i + 1, snaps)).toEqual(p)
    })
  })
  test("範囲外の k は 0〜最後に丸める", () => {
    const moves = S.solveTo(3)
    expect(S.stateAt(moves, 3, -5)).toEqual(S.initialPegs(3))
    expect(S.stateAt(moves, 3, 999).C).toEqual([3, 2, 1])
  })
})

describe("3つの区切り", () => {
  test("n=4：7 ＋ 1 ＋ 7 ＝ 15", () => {
    const [a, b, c] = S.splitSegments(4)
    expect([a.end - a.start + 1, b.end - b.start + 1, c.end - c.start + 1]).toEqual([7, 1, 7])
    expect(b.disk).toBe(4)
    expect(b.start).toBe(8)
  })
  test("zoneOf が区間と一致し、中央の手で動くのは最大の円盤", () => {
    const n = 5
    const moves = S.solveTo(n)
    moves.forEach((m, i) => {
      const z = S.zoneOf(i + 1, n)
      expect(z === "middle").toBe(m.disk === n)
    })
  })
  test("入れ子：前半をさらに分けると 3 ＋ 1 ＋ 3", () => {
    const [a] = S.splitSegments(4)
    const inner = S.splitSegments(a.n, a.start - 1)
    expect(inner.map((s) => s.end - s.start + 1)).toEqual([3, 1, 3])
    expect(inner[1].disk).toBe(3)
  })
})

describe("その他", () => {
  test("2進数けた", () => expect(S.binaryDigits(5, 4)).toBe("0101"))
  test("①の向き：n=3 は A→C", () => expect(S.smallestDirection(S.solveTo(3))).toEqual({ from: "A", to: "C" }))
})

describe("play", () => {
  test("小さい円盤の上に大きい円盤は置けない", () => {
    let p = S.initialPegs(3)
    p = P.tryMove(p, "A", "B")!.pegs // ①を B
    expect(P.canMove(p, "A", "B")).toEqual({ ok: false, reason: "bigOnSmall" })
    expect(P.tryMove(p, "A", "B")).toBeNull()
  })
  test("空の棒・同じ棒は動かせない", () => {
    const p = S.initialPegs(2)
    expect(P.canMove(p, "B", "C")).toEqual({ ok: false, reason: "empty" })
    expect(P.canMove(p, "A", "A")).toEqual({ ok: false, reason: "same" })
  })
  test("replay は手の履歴から状態をつくり直す", () => {
    const moves = S.solveTo(3).slice(0, 4)
    expect(P.replay(3, moves)).toEqual(S.stateAt(S.solveTo(3), 3, 4))
  })
  test("記録表は同じ枚数ならいちばん少ない回数を残す", () => {
    let r = P.upsertRecord({}, 3, 9)
    r = P.upsertRecord(r, 3, 7)
    r = P.upsertRecord(r, 3, 11)
    r = P.upsertRecord(r, 2, 3)
    expect(P.recordRows(r)).toEqual([{ n: 2, count: 3 }, { n: 3, count: 7 }])
  })
  test("評価：最少なら best、多ければ more", () => {
    expect(P.verdict(3, 7)).toBe("best")
    expect(P.verdict(3, 9)).toBe("more")
  })
  test("手のラベル", () => expect(P.moveLabel(4, { disk: 3, from: "A", to: "C" })).toBe("4手目：③を A→C"))
})

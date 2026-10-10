import {
  explainKind, divisionSteps, placeValueTerms, groupBits, expandDigits,
  canExplain, ladderRows, readRemainders,
} from "@/app/(apps)/binary/_lib/explain"
import type { Base } from "@/app/(apps)/binary/_lib/converter"

// -------------------------------------------------------
// explainKind（12通りの振り分け）
// -------------------------------------------------------
describe("explainKind", () => {
  test("12通りすべてが表のとおりに振り分けられる", () => {
    const expected: Record<string, string> = {
      "10→2": "division", "10→8": "division", "10→16": "division",
      "2→10": "placeValue", "8→10": "placeValue", "16→10": "placeValue",
      "2→8": "group", "2→16": "group",
      "8→2": "expand", "16→2": "expand",
      "8→16": "via2", "16→8": "via2",
    }
    const bases: Base[] = [2, 8, 10, 16]
    let count = 0
    for (const from of bases) for (const to of bases) {
      if (from === to) continue
      expect(`${from}→${to}:${explainKind(from, to)}`).toBe(`${from}→${to}:${expected[`${from}→${to}`]}`)
      count++
    }
    // 届いた本数を数える（ループが空回りしていないことの確認）
    expect(count).toBe(12)
  })

  test("同じ進数どうしは例外", () => {
    expect(() => explainKind(2, 2)).toThrow()
  })

  test("解説を出すのは 0〜255（境界の両側）", () => {
    expect(canExplain(0)).toBe(true)
    expect(canExplain(255)).toBe(true)
    expect(canExplain(256)).toBe(false)
    expect(canExplain(-1)).toBe(false)
    expect(canExplain(NaN)).toBe(false)
  })
})

// -------------------------------------------------------
// divisionSteps（すだれ算）
// -------------------------------------------------------
describe("divisionSteps", () => {
  test("10 ÷ 2 を商0までくり返す", () => {
    expect(divisionSteps(10, 2)).toEqual([
      { dividend: 10, quotient: 5, remainder: 0 },
      { dividend: 5, quotient: 2, remainder: 1 },
      { dividend: 2, quotient: 1, remainder: 0 },
      { dividend: 1, quotient: 0, remainder: 1 },
    ])
  })

  test("readRemainders: 0〜255 すべてで、余りを下から読むと変換結果になる", () => {
    let count = 0
    for (let n = 1; n <= 255; n++) for (const base of [2, 8, 16] as Base[]) {
      expect(readRemainders(divisionSteps(n, base))).toBe(n.toString(base).toUpperCase())
      count++
    }
    expect(count).toBe(255 * 3)
  })

  test("ladderRows: あまりは1行ずれて右に書き、最後の行は商の 0", () => {
    expect(ladderRows(divisionSteps(10, 2))).toEqual([
      { value: 10, remainder: null },
      { value: 5, remainder: 0 },
      { value: 2, remainder: 1 },
      { value: 1, remainder: 0 },
      { value: 0, remainder: 1 },
    ])
  })

  test("16進では余りが10〜15になる", () => {
    expect(divisionSteps(255, 16)).toEqual([
      { dividend: 255, quotient: 15, remainder: 15 },
      { dividend: 15, quotient: 0, remainder: 15 },
    ])
  })

  test("0 は割る段がない", () => {
    expect(divisionSteps(0, 2)).toEqual([])
  })
})

// -------------------------------------------------------
// placeValueTerms（位取り）
// -------------------------------------------------------
describe("placeValueTerms", () => {
  test("2進数 1010 は 8 + 0 + 2 + 0", () => {
    const t = placeValueTerms("1010", 2)
    expect(t.map(x => x.weight)).toEqual([8, 4, 2, 1])
    expect(t.map(x => x.exponent)).toEqual([3, 2, 1, 0])
    expect(t.map(x => x.product)).toEqual([8, 0, 2, 0])
  })

  test("16進数の A〜F を数値に読み替える（小文字も可）", () => {
    const t = placeValueTerms("ff", 16)
    expect(t.map(x => x.digit)).toEqual(["F", "F"])
    expect(t.map(x => x.value)).toEqual([15, 15])
    expect(t.reduce((s, x) => s + x.product, 0)).toBe(255)
  })

  test("8進数 377 の合計は 255", () => {
    expect(placeValueTerms("377", 8).reduce((s, x) => s + x.product, 0)).toBe(255)
  })

  test("0 は1項だけ", () => {
    expect(placeValueTerms("0", 2)).toEqual([{ digit: "0", value: 0, exponent: 0, weight: 1, product: 0 }])
  })
})

// -------------------------------------------------------
// groupBits（2 → 8/16）
// -------------------------------------------------------
describe("groupBits", () => {
  test("1010 を3つずつ：左に0を2つ補う", () => {
    expect(groupBits("1010", 3)).toEqual([
      { bits: "001", padded: 2, digit: "1" },
      { bits: "010", padded: 0, digit: "2" },
    ])
  })

  test("ちょうど割り切れる桁数なら補いなし", () => {
    expect(groupBits("11111111", 4)).toEqual([
      { bits: "1111", padded: 0, digit: "F" },
      { bits: "1111", padded: 0, digit: "F" },
    ])
  })

  test("0 は1まとまり", () => {
    expect(groupBits("0", 4)).toEqual([{ bits: "0000", padded: 3, digit: "0" }])
  })
})

// -------------------------------------------------------
// expandDigits（8/16 → 2）
// -------------------------------------------------------
describe("expandDigits", () => {
  test("8進数は1桁を3ビットに。左はしの0だけ取りのぞく", () => {
    expect(expandDigits("37", 8)).toEqual([
      { digit: "3", bits: "011", faint: 1 },
      { digit: "7", bits: "111", faint: 0 },
    ])
  })

  test("16進数は1桁を4ビットに（小文字も可）。2桁目以降の0は取らない", () => {
    expect(expandDigits("a1", 16)).toEqual([
      { digit: "A", bits: "1010", faint: 0 },
      { digit: "1", bits: "0001", faint: 0 },
    ])
  })

  test("0 は最後の1けたを残す（全部取ると答えが空になる）", () => {
    expect(expandDigits("0", 8)).toEqual([{ digit: "0", bits: "000", faint: 2 }])
    expect(expandDigits("0", 16)).toEqual([{ digit: "0", bits: "0000", faint: 3 }])
  })

  test("0〜255 すべてで、取りのぞいた残りを並べると2進数になる", () => {
    let count = 0
    for (let n = 0; n <= 255; n++) for (const base of [8, 16] as const) {
      const joined = expandDigits(n.toString(base), base).map(d => d.bits.slice(d.faint)).join("")
      expect(joined).toBe(n.toString(2))
      count++
    }
    expect(count).toBe(256 * 2)
  })
})

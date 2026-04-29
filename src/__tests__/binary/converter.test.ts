import { toBase, fromBase, isValidForBase } from "@/app/(apps)/binary/_lib/converter"

// -------------------------------------------------------
// toBase（10進数 → 指定進数）
// -------------------------------------------------------
describe("toBase", () => {
  test("2進数変換", () => {
    expect(toBase(0, 2)).toBe("0")
    expect(toBase(1, 2)).toBe("1")
    expect(toBase(10, 2)).toBe("1010")
    expect(toBase(255, 2)).toBe("11111111")
  })

  test("8進数変換", () => {
    expect(toBase(8, 8)).toBe("10")
    expect(toBase(64, 8)).toBe("100")
    expect(toBase(255, 8)).toBe("377")
  })

  test("10進数はそのまま文字列", () => {
    expect(toBase(42, 10)).toBe("42")
    expect(toBase(0, 10)).toBe("0")
  })

  test("16進数は大文字で返す", () => {
    expect(toBase(10, 16)).toBe("A")
    expect(toBase(255, 16)).toBe("FF")
    expect(toBase(256, 16)).toBe("100")
  })

  test("負数・NaN は空文字", () => {
    expect(toBase(-1, 10)).toBe("")
    expect(toBase(NaN, 10)).toBe("")
  })
})

// -------------------------------------------------------
// fromBase（指定進数 → 10進数）
// -------------------------------------------------------
describe("fromBase", () => {
  test("2進数 → 10進数", () => {
    expect(fromBase("1010", 2)).toBe(10)
    expect(fromBase("11111111", 2)).toBe(255)
    expect(fromBase("0", 2)).toBe(0)
  })

  test("8進数 → 10進数", () => {
    expect(fromBase("10", 8)).toBe(8)
    expect(fromBase("377", 8)).toBe(255)
  })

  test("16進数 → 10進数（大文字・小文字どちらも）", () => {
    expect(fromBase("FF", 16)).toBe(255)
    expect(fromBase("ff", 16)).toBe(255)
    expect(fromBase("A", 16)).toBe(10)
    expect(fromBase("1F", 16)).toBe(31)
  })

  test("不正な文字列は NaN", () => {
    expect(fromBase("XYZ", 10)).toBeNaN()
    expect(fromBase("2", 2)).toBeNaN()   // 2進数に 2 は使えない
    expect(fromBase("G", 16)).toBeNaN()  // 16進数に G は使えない
  })

  test("往復変換が一致する（toBase → fromBase）", () => {
    const cases: Array<[number, 2 | 8 | 10 | 16]> = [
      [0, 2], [255, 2], [10, 8], [255, 8], [42, 10], [255, 16],
    ]
    cases.forEach(([num, base]) => {
      expect(fromBase(toBase(num, base), base)).toBe(num)
    })
  })
})

// -------------------------------------------------------
// isValidForBase（入力文字の妥当性チェック）
// -------------------------------------------------------
describe("isValidForBase", () => {
  test("2進数: 0と1のみ有効", () => {
    expect(isValidForBase("0", 2)).toBe(true)
    expect(isValidForBase("1", 2)).toBe(true)
    expect(isValidForBase("01", 2)).toBe(true)
    expect(isValidForBase("2", 2)).toBe(false)
    expect(isValidForBase("A", 2)).toBe(false)
  })

  test("8進数: 0〜7のみ有効", () => {
    expect(isValidForBase("7", 8)).toBe(true)
    expect(isValidForBase("077", 8)).toBe(true)
    expect(isValidForBase("8", 8)).toBe(false)
    expect(isValidForBase("9", 8)).toBe(false)
  })

  test("10進数: 0〜9のみ有効", () => {
    expect(isValidForBase("0", 10)).toBe(true)
    expect(isValidForBase("9", 10)).toBe(true)
    expect(isValidForBase("42", 10)).toBe(true)
    expect(isValidForBase("A", 10)).toBe(false)
  })

  test("16進数: 0〜9・A〜F（大文字・小文字どちらも）有効", () => {
    expect(isValidForBase("0", 16)).toBe(true)
    expect(isValidForBase("F", 16)).toBe(true)
    expect(isValidForBase("f", 16)).toBe(true)
    expect(isValidForBase("FF", 16)).toBe(true)
    expect(isValidForBase("1A2B", 16)).toBe(true)
    expect(isValidForBase("G", 16)).toBe(false)
  })

  test("空文字は有効（every の仕様: 空配列は常に true）", () => {
    expect(isValidForBase("", 10)).toBe(true)
  })
})

import {
  reduceFraction,
  bunsuAdd,
  bunsuMinus,
  bunsuMultiplication,
  bunsuDivision,
  fracText,
} from "@/app/(apps)/jimipri/_lib/bunsuu"

// -------------------------------------------------------
// reduceFraction（約分）
// -------------------------------------------------------
describe("reduceFraction", () => {
  test("約分できる場合は既約分数にする", () => {
    expect(reduceFraction(6, 4)).toEqual([3, 2])
    expect(reduceFraction(10, 5)).toEqual([2, 1])
    expect(reduceFraction(9, 3)).toEqual([3, 1])
  })

  test("すでに既約の場合はそのまま", () => {
    expect(reduceFraction(3, 7)).toEqual([3, 7])
    expect(reduceFraction(1, 2)).toEqual([1, 2])
  })

  test("分子が負の場合も約分する", () => {
    expect(reduceFraction(-4, 6)).toEqual([-2, 3])
  })

  test("分子が 0 の場合は [0, 1]", () => {
    expect(reduceFraction(0, 5)).toEqual([0, 1])
  })
})

// -------------------------------------------------------
// bunsuAdd（分数の足し算）
// -------------------------------------------------------
describe("bunsuAdd", () => {
  test("1/2 + 1/3 = 5/6（約分なし）", () => {
    expect(bunsuAdd(1, 2, 1, 3)).toEqual([5, 6])
  })

  test("同分母でも常に通分公式（n1*d2 + n2*d1）を使うので [8, 16] になる", () => {
    // 数学的には 2/4 と同値だが、この関数は約分・最適化をしない
    expect(bunsuAdd(1, 4, 1, 4)).toEqual([8, 16])
  })

  test("同分母の足し算も通分公式適用", () => {
    expect(bunsuAdd(2, 5, 1, 5)).toEqual([15, 25])
  })
})

// -------------------------------------------------------
// bunsuMinus（分数の引き算）
// -------------------------------------------------------
describe("bunsuMinus", () => {
  test("同分母でも通分公式: 3/4 - 1/4 → [8, 16]", () => {
    // 3*4 - 1*4 = 8, 4*4 = 16（数学的には 1/2 と同値）
    expect(bunsuMinus(3, 4, 1, 4)).toEqual([8, 16])
  })

  test("1/2 - 1/3 = 1/6", () => {
    expect(bunsuMinus(1, 2, 1, 3)).toEqual([1, 6])
  })

  test("結果が負になる場合", () => {
    // 1*4 - 3*4 = -8, 4*4 = 16
    expect(bunsuMinus(1, 4, 3, 4)).toEqual([-8, 16])
  })
})

// -------------------------------------------------------
// bunsuMultiplication（分数のかけ算・帯分数対応・約分あり）
// -------------------------------------------------------
describe("bunsuMultiplication", () => {
  test("2/3 × 3/4 = 1/2（整数部0）", () => {
    expect(bunsuMultiplication(0, 2, 3, 0, 3, 4)).toEqual([1, 2])
  })

  test("1と1/2 × 2/3 = 1/1（帯分数）", () => {
    // 3/2 × 2/3 = 6/6 = 1/1
    expect(bunsuMultiplication(1, 1, 2, 0, 2, 3)).toEqual([1, 1])
  })

  test("2と1/3 × 3/7 = 1/1", () => {
    // 7/3 × 3/7 = 21/21 = 1/1
    expect(bunsuMultiplication(2, 1, 3, 0, 3, 7)).toEqual([1, 1])
  })
})

// -------------------------------------------------------
// bunsuDivision（分数のわり算・帯分数対応・約分あり）
// -------------------------------------------------------
describe("bunsuDivision", () => {
  test("2/3 ÷ 4/3 = 1/2（整数部0）", () => {
    expect(bunsuDivision(0, 2, 3, 0, 4, 3)).toEqual([1, 2])
  })

  test("1/2 ÷ 1/4 = 2/1", () => {
    expect(bunsuDivision(0, 1, 2, 0, 1, 4)).toEqual([2, 1])
  })

  test("帯分数: 1と1/2 ÷ 3/4 = 2/1", () => {
    // 3/2 ÷ 3/4 = 3/2 × 4/3 = 12/6 = 2/1
    expect(bunsuDivision(1, 1, 2, 0, 3, 4)).toEqual([2, 1])
  })
})

// -------------------------------------------------------
// fracText（答え用テキスト生成）
// -------------------------------------------------------
describe("fracText", () => {
  test("分母が 1 の場合は整数として返す", () => {
    expect(fracText(4, 1)).toBe("4")
    expect(fracText(1, 1)).toBe("1")
  })

  test("分母が 1 以外の場合は 分子/分母 形式", () => {
    expect(fracText(3, 4)).toBe("3/4")
    expect(fracText(7, 8)).toBe("7/8")
  })
})

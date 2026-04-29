import { calcAmari, isValidManualInput } from "@/app/(apps)/amari/_lib/amariLogic"

// -------------------------------------------------------
// calcAmari（商とあまりの計算）
// -------------------------------------------------------
describe("calcAmari", () => {
  test("割り切れない場合：商とあまりを正しく返す", () => {
    expect(calcAmari(7, 3)).toEqual({ shou: 2, amari: 1 })
    expect(calcAmari(10, 3)).toEqual({ shou: 3, amari: 1 })
    expect(calcAmari(17, 5)).toEqual({ shou: 3, amari: 2 })
  })

  test("割り切れる場合：あまりは 0", () => {
    expect(calcAmari(9, 3)).toEqual({ shou: 3, amari: 0 })
    expect(calcAmari(8, 4)).toEqual({ shou: 2, amari: 0 })
  })

  test("検証: shou × josu + amari = hijosu が常に成立", () => {
    const cases = [
      [7, 3], [10, 3], [17, 5], [99, 7], [50, 6],
    ] as const
    cases.forEach(([h, j]) => {
      const { shou, amari } = calcAmari(h, j)
      expect(shou * j + amari).toBe(h)
    })
  })

  test("あまりは常に josu 未満", () => {
    const cases = [
      [7, 3], [10, 3], [17, 5], [99, 7],
    ] as const
    cases.forEach(([h, j]) => {
      const { amari } = calcAmari(h, j)
      expect(amari).toBeGreaterThanOrEqual(0)
      expect(amari).toBeLessThan(j)
    })
  })
})

// -------------------------------------------------------
// isValidManualInput（手動入力の妥当性チェック）
// -------------------------------------------------------
describe("isValidManualInput", () => {
  test("正常な入力は true", () => {
    expect(isValidManualInput(7, 3)).toBe(true)   // 7÷3=2あまり1
    expect(isValidManualInput(10, 3)).toBe(true)  // 10÷3=3あまり1
    expect(isValidManualInput(99, 7)).toBe(true)
  })

  test("割り切れる場合は false（あまりが出ない）", () => {
    expect(isValidManualInput(9, 3)).toBe(false)
    expect(isValidManualInput(8, 4)).toBe(false)
    expect(isValidManualInput(6, 2)).toBe(false)
  })

  test("わられる数が範囲外（2〜99）は false", () => {
    expect(isValidManualInput(1, 3)).toBe(false)   // 小さすぎ
    expect(isValidManualInput(100, 3)).toBe(false) // 大きすぎ
  })

  test("わる数が範囲外（2〜9）は false", () => {
    expect(isValidManualInput(10, 1)).toBe(false)  // 小さすぎ
    expect(isValidManualInput(10, 10)).toBe(false) // 大きすぎ
  })

  test("境界値", () => {
    expect(isValidManualInput(2, 2)).toBe(false)   // 最小値だが割り切れる
    expect(isValidManualInput(3, 2)).toBe(true)    // 最小で有効
    expect(isValidManualInput(99, 9)).toBe(false)  // 最大値だが割り切れる
    expect(isValidManualInput(98, 9)).toBe(true)   // 最大付近で有効
  })
})

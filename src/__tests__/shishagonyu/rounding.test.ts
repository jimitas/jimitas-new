import { roundToDigit } from "@/app/(apps)/shishagonyu/_lib/rounding"

// targetDigit の意味:
//   targetDigit=2 → factor=10 → 十の位まで（一の位で四捨五入）
//   targetDigit=3 → factor=100 → 百の位まで（十の位で四捨五入）
//   targetDigit=4 → factor=1000 → 千の位まで（百の位で四捨五入）

describe("roundToDigit", () => {
  // targetDigit=2: 一の位で判断し十の位のがい数にする
  describe("targetDigit=2（十の位まで）", () => {
    test("一の位が 5 以上は切り上げ", () => {
      expect(roundToDigit(15, 2)).toBe(20)
      expect(roundToDigit(25, 2)).toBe(30)
      expect(roundToDigit(99, 2)).toBe(100)
    })

    test("一の位が 4 以下は切り捨て", () => {
      expect(roundToDigit(14, 2)).toBe(10)
      expect(roundToDigit(24, 2)).toBe(20)
      expect(roundToDigit(91, 2)).toBe(90)
    })

    test("ちょうど切りのよい数はそのまま", () => {
      expect(roundToDigit(20, 2)).toBe(20)
      expect(roundToDigit(100, 2)).toBe(100)
    })
  })

  // targetDigit=3: 十の位で判断し百の位のがい数にする
  describe("targetDigit=3（百の位まで）", () => {
    test("十の位が 5 以上は切り上げ", () => {
      expect(roundToDigit(150, 3)).toBe(200)
      expect(roundToDigit(250, 3)).toBe(300)
      expect(roundToDigit(999, 3)).toBe(1000)
    })

    test("十の位が 4 以下は切り捨て", () => {
      expect(roundToDigit(149, 3)).toBe(100)
      expect(roundToDigit(240, 3)).toBe(200)
    })
  })

  // targetDigit=4: 百の位で判断し千の位のがい数にする
  describe("targetDigit=4（千の位まで）", () => {
    test("百の位が 5 以上は切り上げ", () => {
      expect(roundToDigit(1500, 4)).toBe(2000)
      expect(roundToDigit(2500, 4)).toBe(3000)
    })

    test("百の位が 4 以下は切り捨て", () => {
      expect(roundToDigit(1499, 4)).toBe(1000)
      expect(roundToDigit(2400, 4)).toBe(2000)
    })
  })

  // 境界値テスト
  describe("境界値", () => {
    test("判断桁がちょうど5のときは切り上げ（Math.round の仕様）", () => {
      expect(roundToDigit(15, 2)).toBe(20)   // 一の位=5 → 切り上げ
      expect(roundToDigit(150, 3)).toBe(200) // 十の位=5 → 切り上げ
      expect(roundToDigit(1500, 4)).toBe(2000)
    })

    test("0 はそのまま 0", () => {
      expect(roundToDigit(0, 2)).toBe(0)
      expect(roundToDigit(0, 3)).toBe(0)
    })
  })
})

// 問題生成関数のテスト
// 「20問生成される」「答えが範囲内」「重複がない」「答えが式と一致する」を検証する

import { generateTasu1 } from "@/app/(apps)/jimipri/_lib/problems/tasu1"
import { generateHiku1 } from "@/app/(apps)/jimipri/_lib/problems/hiku1"
import { generateKake1 } from "@/app/(apps)/jimipri/_lib/problems/kake1"
import { generateWarizan } from "@/app/(apps)/jimipri/_lib/problems/warizan"
import { generateWariAmari } from "@/app/(apps)/jimipri/_lib/problems/wariAmari"

const RUNS = 10

// -------------------------------------------------------
// generateTasu1（10までのたしざん）
// -------------------------------------------------------
describe("generateTasu1", () => {
  test("常に20問生成される", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left, right, answers } = generateTasu1()
      expect(left).toHaveLength(20)
      expect(right).toHaveLength(20)
      expect(answers).toHaveLength(20)
    }
  })

  test("答えがすべて 2〜10 の範囲内", () => {
    for (let i = 0; i < RUNS; i++) {
      const { answers } = generateTasu1()
      answers.forEach(ans => {
        expect(ans).toBeGreaterThanOrEqual(2)
        expect(ans).toBeLessThanOrEqual(10)
      })
    }
  })

  test("left + right = answer が全問で成立する", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left, right, answers } = generateTasu1()
      answers.forEach((ans, i) => {
        expect(left[i] + right[i]).toBe(ans)
      })
    }
  })

  test("(left, right) の組み合わせに重複がない", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left, right } = generateTasu1()
      const keys = left.map((l, i) => l * 100 + right[i])
      const unique = new Set(keys)
      expect(unique.size).toBe(20)
    }
  })

  test("各数字が 1 以上（0 だけの問題が出ない）", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left, right } = generateTasu1()
      left.forEach(l => expect(l).toBeGreaterThanOrEqual(1))
      right.forEach(r => expect(r).toBeGreaterThanOrEqual(1))
    }
  })
})

// -------------------------------------------------------
// generateHiku1（10までのひきざん）
// -------------------------------------------------------
describe("generateHiku1", () => {
  test("常に20問生成される", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left, right, answers } = generateHiku1()
      expect(answers).toHaveLength(20)
      expect(left).toHaveLength(20)
      expect(right).toHaveLength(20)
    }
  })

  test("被減数が 2〜10 の範囲内", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left } = generateHiku1()
      left.forEach(l => {
        expect(l).toBeGreaterThanOrEqual(2)
        expect(l).toBeLessThanOrEqual(10)
      })
    }
  })

  test("left - right = answer が全問で成立する", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left, right, answers } = generateHiku1()
      answers.forEach((ans, i) => {
        expect(left[i] - right[i]).toBe(ans)
      })
    }
  })

  test("答えが常に 1 以上（負にならない）", () => {
    for (let i = 0; i < RUNS; i++) {
      const { answers } = generateHiku1()
      answers.forEach(ans => expect(ans).toBeGreaterThanOrEqual(1))
    }
  })
})

// -------------------------------------------------------
// generateKake1（かけ算 2〜5の段）
// -------------------------------------------------------
describe("generateKake1", () => {
  test("常に20問生成される", () => {
    for (let i = 0; i < RUNS; i++) {
      const { answers } = generateKake1()
      expect(answers).toHaveLength(20)
    }
  })

  test("左辺（乗数）が 2〜5 の範囲内", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left } = generateKake1()
      left.forEach(l => {
        expect(l).toBeGreaterThanOrEqual(2)
        expect(l).toBeLessThanOrEqual(5)
      })
    }
  })

  test("右辺（被乗数）が 1〜9 の範囲内", () => {
    for (let i = 0; i < RUNS; i++) {
      const { right } = generateKake1()
      right.forEach(r => {
        expect(r).toBeGreaterThanOrEqual(1)
        expect(r).toBeLessThanOrEqual(9)
      })
    }
  })

  test("left × right = answer が全問で成立する", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left, right, answers } = generateKake1()
      answers.forEach((ans, i) => {
        expect(left[i] * right[i]).toBe(ans)
      })
    }
  })
})

// -------------------------------------------------------
// generateWarizan（わり算）
// -------------------------------------------------------
describe("generateWarizan", () => {
  test("常に20問生成される", () => {
    for (let i = 0; i < RUNS; i++) {
      const { answers } = generateWarizan()
      expect(answers).toHaveLength(20)
    }
  })

  test("答え（商）がすべて 2〜9 の範囲内", () => {
    for (let i = 0; i < RUNS; i++) {
      const { answers } = generateWarizan()
      answers.forEach(ans => {
        expect(ans).toBeGreaterThanOrEqual(2)
        expect(ans).toBeLessThanOrEqual(9)
      })
    }
  })

  test("left ÷ right = answer が全問で割り切れる", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left, right, answers } = generateWarizan()
      answers.forEach((ans, i) => {
        expect(left[i] % right[i]).toBe(0)
        expect(left[i] / right[i]).toBe(ans)
      })
    }
  })
})

// -------------------------------------------------------
// generateWariAmari（あまりのあるわり算）
// -------------------------------------------------------
describe("generateWariAmari", () => {
  test("常に20問生成される", () => {
    for (let i = 0; i < RUNS; i++) {
      const { answers } = generateWariAmari()
      expect(answers).toHaveLength(20)
    }
  })

  test("答えが「商…あまり」形式の文字列", () => {
    for (let i = 0; i < RUNS; i++) {
      const { answers } = generateWariAmari()
      answers.forEach(ans => {
        expect(typeof ans).toBe("string")
        expect(ans as string).toMatch(/^\d+…\d+$/)
      })
    }
  })

  test("あまりが割る数より小さい（あまりの定義）", () => {
    for (let i = 0; i < RUNS; i++) {
      const { left, right, answers } = generateWariAmari()
      answers.forEach((ans, i) => {
        const [shou, amari] = (ans as string).split("…").map(Number)
        expect(amari).toBeGreaterThanOrEqual(1)       // あまり ≥ 1（割り切れない）
        expect(amari).toBeLessThan(right[i])           // あまり < 割る数
        expect(shou * right[i] + amari).toBe(left[i]) // 検算
      })
    }
  })
})

import { duplicationCheck } from "@/app/(apps)/jimipri/_lib/duplicationCheck"

describe("duplicationCheck", () => {
  test("配列に含まれていない値は true を返す", () => {
    expect(duplicationCheck(100, [])).toBe(true)
    expect(duplicationCheck(100, [200, 300])).toBe(true)
  })

  test("配列に含まれている値は false を返す", () => {
    expect(duplicationCheck(100, [100, 200])).toBe(false)
    expect(duplicationCheck(200, [100, 200, 300])).toBe(false)
  })

  test("空配列に対しては常に true", () => {
    expect(duplicationCheck(0, [])).toBe(true)
  })
})

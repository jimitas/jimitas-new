import {
  CountRecorder,
  MAX_STEPS,
  StepLimitExceededError,
  StepRecorder,
} from "@/app/(apps)/algorithm/_lib/recorder"

// -------------------------------------------------------
// カウントは StepKind から自動集計する。
// 生成器が手で数えないので「数え忘れ」が起きない、という前提を固定する。
// -------------------------------------------------------
describe("カウントの自動集計", () => {
  test("compare だけが比較回数に、swap/shift/write が交換回数になる", () => {
    const rec = new StepRecorder([3, 1, 2])
    rec.push({ kind: "init", codeTag: "init" })
    rec.push({ kind: "focus", codeTag: "outerLoop" })
    rec.lessThan(0, 1, "compare")
    rec.swap(0, 1, "swap")
    rec.push({ kind: "shift", codeTag: "shift", wrote: 2 })
    rec.push({ kind: "write", codeTag: "mergeBack", wrote: 2 })
    rec.mark(0, "swap")
    rec.push({ kind: "done", codeTag: "finish" })

    const last = rec.steps[rec.steps.length - 1]
    expect(last.compares).toBe(1)
    expect(last.swaps).toBe(3)
  })

  test("focus と mark は回数に数えない", () => {
    const rec = new StepRecorder([1, 2])
    rec.push({ kind: "focus", codeTag: "outerLoop" })
    rec.mark(0, "swap")
    const last = rec.steps[rec.steps.length - 1]
    expect(last.compares).toBe(0)
    expect(last.swaps).toBe(0)
  })

  test("CountRecorder は StepRecorder と同じ数え方をする", () => {
    const run = (rec: StepRecorder | CountRecorder) => {
      rec.lessThan(0, 1, "compare")
      rec.lessThan(1, 2, "compare")
      rec.swap(0, 2, "swap")
    }
    const step = new StepRecorder([3, 1, 2])
    const count = new CountRecorder([3, 1, 2])
    run(step)
    run(count)
    const last = step.steps[step.steps.length - 1]
    expect(count.counts).toEqual({ compares: last.compares, swaps: last.swaps })
  })
})

// -------------------------------------------------------
// 打ち切りガード。
// 生成器のループ変数の更新忘れでブラウザが固まるのを防ぐ安全機構なので、
// 実際に止まらない生成器を食わせて落ちることを確認しておく。
// -------------------------------------------------------
describe("打ち切りガード", () => {
  test("止まらない生成器は StepLimitExceededError になる", () => {
    const rec = new StepRecorder([1, 2, 3])
    expect(() => {
      // わざと終わらないループ
      for (;;) rec.push({ kind: "focus", codeTag: "outerLoop" })
    }).toThrow(StepLimitExceededError)
  })

  test("CountRecorder でも同じように止まる", () => {
    const rec = new CountRecorder([1, 2, 3])
    expect(() => {
      for (;;) rec.push({ kind: "focus", codeTag: "outerLoop" })
    }).toThrow(StepLimitExceededError)
  })

  test("上限ちょうどまでは通る", () => {
    const rec = new CountRecorder([1])
    expect(() => {
      for (let k = 0; k < MAX_STEPS; k++) rec.push({ kind: "focus", codeTag: "outerLoop" })
    }).not.toThrow()
  })
})

// -------------------------------------------------------
// 構造共有：配列が変わらないステップは1つ前の配列を使いまわす。
// n=50 で数千ステップぶんの配列を作らないための仕組み。
// -------------------------------------------------------
describe("配列スナップショットの構造共有", () => {
  test("比較だけのステップは前の配列と同じ参照になる", () => {
    const rec = new StepRecorder([3, 1, 2])
    rec.push({ kind: "init", codeTag: "init" })
    rec.lessThan(0, 1, "compare")
    const [a, b] = rec.steps
    expect(a.array).toBe(b.array)
  })

  test("入れかえたステップは新しい配列になる", () => {
    const rec = new StepRecorder([3, 1, 2])
    rec.push({ kind: "init", codeTag: "init" })
    rec.swap(0, 1, "swap")
    const [a, b] = rec.steps
    expect(a.array).not.toBe(b.array)
    expect(a.array).toEqual([3, 1, 2])
    expect(b.array).toEqual([1, 3, 2])
  })
})

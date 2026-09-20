// ======================================================
// 終わりの合図（音を鳴らす位置）の検査
//
// 音そのものは画面側で鳴らすが、**どこで鳴らすか**は純粋な計算なので
// ここで固定する。音は自動では聞けないぶん、位置だけでも機械に見張らせる。
//
// いちばん warning したいのは「2回続けて鳴る」。
// 探索は found（notfound）の直後に done を置いているので、
// kind を素直に見て鳴らすと見つけた瞬間と終了で2回鳴ってしまう。
// ======================================================

import {
  ALGOS,
  ALGO_ORDER,
  finishCue,
  generateSteps,
} from "@/app/(apps)/algorithm/_lib/algorithms"
import { makeRng } from "@/app/(apps)/algorithm/_lib/random"
import type { AlgoId, Step } from "@/app/(apps)/algorithm/_lib/types"

const SORTS = ALGO_ORDER.filter((id) => ALGOS[id].category === "sort")
const SEARCHES = ALGO_ORDER.filter((id) => ALGOS[id].category === "search")

/** シード固定の配列。毎回同じ入力になる */
function randomArray(n: number, seed: number): number[] {
  const rng = makeRng(seed)
  return Array.from({ length: n }, () => 1 + Math.floor(rng() * 99))
}

const ascending = (n: number) => Array.from({ length: n }, (_, i) => (i + 1) * 3)

describe("finishCue — 終わりの合図は1か所だけ", () => {
  // ── 鳴る位置が1つに決まること ───────────────────
  //
  // 壊し方の例: finishCue が found を見ずに done だけを返すようにする
  //   → 探索の期待 kind が done になって落ちる
  describe("ソート", () => {
    for (const id of SORTS) {
      it(`[${id}] 最後のステップで done の合図が1回`, () => {
        const steps = generateSteps(id, randomArray(12, 4242))
        const cue = finishCue(steps)
        expect(cue).not.toBeNull()
        expect(cue!.kind).toBe("done")
        // ソートは done が最後にしか無いので、合図も最後に来る
        expect(cue!.index).toBe(steps.length - 1)
      })
    }
  })

  describe("探索", () => {
    for (const id of SEARCHES) {
      it(`[${id}] 見つかったら found の瞬間（done ではない）`, () => {
        const input = ascending(12)
        const steps = generateSteps(id, input, { target: input[7] })
        const cue = finishCue(steps)
        expect(cue).not.toBeNull()
        expect(cue!.kind).toBe("found")
        expect(steps[cue!.index].kind).toBe("found")

        // ここが本題。found のうしろに done があっても、合図はこの1回だけ。
        // 「2回鳴る」を防いでいるのがこの性質。
        expect(cue!.index).toBeLessThan(steps.length - 1)
        expect(steps[steps.length - 1].kind).toBe("done")
      })

      it(`[${id}] 見つからなければ notfound の瞬間`, () => {
        const input = ascending(12) // すべて3の倍数
        const steps = generateSteps(id, input, { target: 1 })
        const cue = finishCue(steps)
        expect(cue).not.toBeNull()
        expect(cue!.kind).toBe("notfound")
        expect(steps[cue!.index].kind).toBe("notfound")
      })
    }
  })

  // ── 合図は必ず1つ（0でも2つでもない） ──────────────
  //
  // 壊し方の例: 探索の生成器から notfound を消す
  //   → 合図が done になり、下の「kind が一致する」で落ちる
  it("全アルゴリズム × n=5..20 で、合図はちょうど1つ", () => {
    for (const id of ALGO_ORDER) {
      for (let n = 5; n <= 20; n++) {
        const base = randomArray(n, 1000 + n)
        const input = ALGOS[id as AlgoId].requiresSorted
          ? [...base].sort((a, b) => a - b)
          : base
        const steps = generateSteps(id, input)
        const cue = finishCue(steps)

        expect(cue).not.toBeNull()
        // 返した位置のステップは、返した kind と一致していること
        expect(steps[cue!.index].kind).toBe(cue!.kind)
        // 先頭では鳴らさない（画面側もここは鳴らさない約束）
        expect(cue!.index).toBeGreaterThan(0)
      }
    }
  })

  // ── 端ケース ────────────────────────────────
  it("終わりのステップが無ければ null", () => {
    const steps: Step[] = []
    expect(finishCue(steps)).toBeNull()
  })

  it("空の配列でも例外にならない", () => {
    for (const id of SORTS) {
      // 空だと done だけが出る。合図は「先頭」になるので、
      // 画面側は index===0 を鳴らさない約束で守っている。
      expect(() => finishCue(generateSteps(id, []))).not.toThrow()
    }
  })
})

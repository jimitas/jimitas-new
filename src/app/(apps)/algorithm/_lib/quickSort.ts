// ======================================================
// クイックソート
//
// 仕分け（partition）は Lomuto 方式。
// 範囲のいちばん右を基準（kijun）にして、それより小さい値を左へ集める。
// 集め終わった場所が基準の最終位置になる。
//
// くらべる回数は「範囲の長さ-1」ちょうど。基準の選び方が悪いと
// 範囲が1ずつしか減らず、n(n-1)/2 回まで悪化する（ならんだ入力が最悪）。
// そこも画面で確かめられるよう、基準は右はし固定のまま変えていない。
// ======================================================

import type { Recorder } from "./recorder"
import type { Range } from "./types"

export function quickSort(rec: Recorder): void {
  const n = rec.length
  rec.push({ kind: "init", codeTag: "init" })

  // これから処理する範囲の控え。画面の「あとで並べかえる範囲」に出す
  const pending: Range[] = []

  const sort = (lo: number, hi: number): void => {
    if (lo > hi) return

    if (lo === hi) {
      rec.mark(lo, "partition", { i: lo }, `A[${lo}] は 1個だけなので ここで決まりです`)
      return
    }

    rec.push({
      kind: "focus",
      codeTag: "pivotSelect",
      range: { lo, hi },
      pointers: { left: lo, right: hi, pivot: hi },
      message: `${lo} 番目から ${hi} 番目を 並べかえます。右はしの A[${hi}] (=${rec.array[hi]}) を 基準にします`,
    })

    // ── 仕分け ──
    let i = lo - 1
    for (let j = lo; j < hi; j++) {
      // 基準は hi の位置にあり、仕分け中は動かさないのでそのままくらべられる
      if (rec.lessThan(j, hi, "compare", { left: lo, right: hi, pivot: hi, i: Math.max(lo, i), j })) {
        i++
        rec.swap(i, j, "swap", { left: lo, right: hi, pivot: hi, i, j })
      }
    }
    const p = i + 1
    rec.swap(p, hi, "swap", { left: lo, right: hi, pivot: hi, i: p })
    rec.mark(p, "partition", { i: p }, `基準は A[${p}] が 正しい場所でした。ここは もう動きません`)

    // ── 左右に分けて、同じことをくり返す ──
    const left: Range = { lo, hi: p - 1 }
    const right: Range = { lo: p + 1, hi }

    if (right.lo <= right.hi) pending.push(right)
    rec.setPending(pending)

    if (left.lo <= left.hi) {
      rec.push({
        kind: "focus",
        codeTag: "recurseLeft",
        range: left,
        pointers: { left: left.lo, right: left.hi },
        message: `基準より左（${left.lo}〜${left.hi}）を 同じやり方で 並べかえます`,
      })
      sort(left.lo, left.hi)
    }

    if (right.lo <= right.hi) {
      const at = pending.lastIndexOf(right)
      if (at >= 0) pending.splice(at, 1)
      rec.setPending(pending)
      rec.push({
        kind: "focus",
        codeTag: "recurseRight",
        range: right,
        pointers: { left: right.lo, right: right.hi },
        message: `基準より右（${right.lo}〜${right.hi}）を 同じやり方で 並べかえます`,
      })
      sort(right.lo, right.hi)
    }
  }

  sort(0, n - 1)

  rec.setPending([])
  rec.push({ kind: "done", codeTag: "finish" })
}

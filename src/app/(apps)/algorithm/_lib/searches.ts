// ======================================================
// アルゴリズムシミュレーター — 探索の生成器
//
// ソートと同じく Recorder に対してだけ書く。
// ちがうのは「Data[i] と さがす値」をくらべるところで、
// rec.compareWith を使う（くらべた回数は1回として数える）。
// ======================================================

import type { Recorder } from "./recorder"
import type { Range } from "./types"

/** 二分探索に並んでいない配列が渡されたとき */
export class NotSortedError extends Error {
  constructor() {
    super("二分探索は ならんでいる配列にしか使えません")
    this.name = "NotSortedError"
  }
}

/** lo > hi（しらべる範囲が無くなった）のときは範囲を出さない */
function rangeOf(lo: number, hi: number): Range | undefined {
  return lo <= hi ? { lo, hi } : undefined
}

/**
 * 線形探索。
 *
 * 左から1つずつ見ていくだけ。ならんでいなくても使える。
 * 見つからない場合は n 回くらべることになる（O(n)）。
 */
export function linearSearch(rec: Recorder, target: number): void {
  const n = rec.length

  rec.push({
    kind: "init",
    codeTag: "init",
    target,
    message: `${target} を 左から じゅんに さがします`,
  })

  for (let i = 0; i < n; i++) {
    if (rec.compareWith(i, target, "compare", { i }) === 0) {
      rec.push({ kind: "found", codeTag: "found", pointers: { i }, target })
      rec.push({
        kind: "done",
        codeTag: "found",
        pointers: { i },
        target,
        message: `${target} は ${i} 番目に ありました。${i + 1} 回 くらべました`,
      })
      return
    }
    rec.push({
      kind: "focus",
      codeTag: "searchLoop",
      pointers: { i },
      target,
      message: "ちがったので、つぎへ すすみます",
    })
  }

  rec.push({ kind: "notfound", codeTag: "notfound", target })
  rec.push({
    kind: "done",
    codeTag: "notfound",
    target,
    message: `${target} は ありませんでした。${n} 回 くらべました`,
  })
}

/**
 * 二分探索。
 *
 * ならんでいる配列のまん中を見て、さがす値がどちら側にあるかを決め、
 * しらべる範囲を半分に減らしていく。
 *
 * ならんでいない配列を渡されたら例外にする。
 * 画面側でも自動でならべているが、そのガードが外れたときに
 * 「動いているように見えるのに答えが間違っている」のがいちばん困るため。
 */
export function binarySearch(rec: Recorder, target: number): void {
  const n = rec.length

  for (let i = 1; i < n; i++) {
    if (rec.array[i - 1] > rec.array[i]) throw new NotSortedError()
  }

  let hidari = 0
  let migi = n - 1

  rec.push({
    kind: "init",
    codeTag: "init",
    target,
    range: rangeOf(hidari, migi),
    pointers: n > 0 ? { left: hidari, right: migi } : {},
    message: `${target} を さがします。しらべる範囲は ぜんぶです`,
  })

  while (hidari <= migi) {
    rec.push({
      kind: "focus",
      codeTag: "searchLoop",
      range: rangeOf(hidari, migi),
      pointers: { left: hidari, right: migi },
      target,
      message: `しらべる範囲は ${hidari} 番目から ${migi} 番目（${migi - hidari + 1} 個）です`,
    })

    // ÷ は商の整数値（共通テスト用プログラム表記）。Python の // と同じ
    const aida = Math.floor((hidari + migi) / 2)

    rec.push({
      kind: "focus",
      codeTag: "midCalc",
      range: rangeOf(hidari, migi),
      pointers: { left: hidari, right: migi, mid: aida },
      target,
      message: `${hidari} 番目から ${migi} 番目の まん中は ${aida} 番目です`,
    })

    const cmp = rec.compareWith(aida, target, "compare", {
      left: hidari,
      right: migi,
      mid: aida,
    })

    if (cmp === 0) {
      rec.push({
        kind: "found",
        codeTag: "found",
        range: rangeOf(hidari, migi),
        pointers: { left: hidari, right: migi, mid: aida, i: aida },
        target,
      })
      rec.push({
        kind: "done",
        codeTag: "found",
        pointers: { i: aida },
        target,
        message: `${target} は ${aida} 番目に ありました`,
      })
      return
    }

    if (cmp < 0) {
      // まん中のほうが小さい＝さがす値は右半分にある
      hidari = aida + 1
      rec.push({
        kind: "focus",
        codeTag: "narrowRight",
        range: rangeOf(hidari, migi),
        pointers: rangeOf(hidari, migi) ? { left: hidari, right: migi } : {},
        target,
        message: `さがす値のほうが 大きいので、右半分だけを しらべます`,
      })
    } else {
      migi = aida - 1
      rec.push({
        kind: "focus",
        codeTag: "narrowLeft",
        range: rangeOf(hidari, migi),
        pointers: rangeOf(hidari, migi) ? { left: hidari, right: migi } : {},
        target,
        message: `さがす値のほうが 小さいので、左半分だけを しらべます`,
      })
    }
  }

  rec.push({ kind: "notfound", codeTag: "notfound", target })
  rec.push({
    kind: "done",
    codeTag: "notfound",
    target,
    message: `しらべる範囲が なくなりました。${target} は ありません`,
  })
}

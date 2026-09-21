// ======================================================
// マージソート（ボトムアップ）
//
// 「1個ずつのかたまりを2つ合体 → 2個ずつを合体 → 4個ずつ…」と
// 幅を倍にしながら下から積み上げる書き方。
//
// 再帰で書くほうが有名だが、ここでは再帰を使わない形にした。
//   - 共通テスト用プログラム表記の例示には関数定義の書き方が無いので、
//     繰り返しと分岐だけで書けるほうが表記としても素直
//   - 画面でも「2個ずつ → 4個ずつ → 8個ずつ」と そろっていく様子が見え、
//     再帰の行き帰りを追うより分かりやすい
//
// 合体するときは、対象の範囲をいったん作業用の入れものに写してから
// 小さいほうを順に書きもどす。この「別の入れものが要る」ところが
// マージソートの特徴（つかうメモリ O(n)）なので、画面にも出している。
// ======================================================

import type { Recorder } from "./recorder"
import type { Pointers } from "./types"

/** Data[lo..mid] と Data[mid+1..hi] を合体する */
function merge(rec: Recorder, lo: number, mid: number, hi: number): void {
  rec.copyToAux(lo, hi, "mergeCopy", { left: lo, mid, right: hi })

  let p = lo // 左がわの読み位置
  let q = mid + 1 // 右がわの読み位置

  // 読み位置が そのかたまりの端を越えたら矢印を出さない。
  // 越えた値（mid+1 や hi+1）は配列の外を指すことがあり、
  // そのまま矢印にすると画面の外や となりのかたまりを指してしまう。
  const at = (k: number): Pointers => {
    const out: Pointers = { k }
    if (p <= mid) out.left = p
    if (q <= hi) out.right = q
    return out
  }

  for (let k = lo; k <= hi; k++) {
    if (p > mid) {
      // 左がわが尽きた。右がわの残りをそのままもどす
      rec.writeBack(k, q, "mergeRest", at(k), "左がわは 出しきったので、右がわの残りを もどします")
      q++
    } else if (q > hi) {
      rec.writeBack(k, p, "mergeRest", at(k), "右がわは 出しきったので、左がわの残りを もどします")
      p++
    } else if (rec.auxLessThan(p, q, "compare", at(k))) {
      rec.writeBack(k, p, "mergeBack", at(k))
      p++
    } else {
      rec.writeBack(k, q, "mergeBack", at(k))
      q++
    }
  }

  rec.clearAux()
}

export function mergeSort(rec: Recorder): void {
  const n = rec.length
  rec.push({ kind: "init", codeTag: "init" })

  for (let haba = 1; haba < n; haba *= 2) {
    rec.push({
      kind: "focus",
      codeTag: "split",
      message: `${haba} 個ずつの かたまりを 2つずつ 合体させていきます`,
    })

    for (let lo = 0; lo + haba < n; lo += haba * 2) {
      const mid = lo + haba - 1
      const hi = Math.min(lo + haba * 2 - 1, n - 1)
      merge(rec, lo, mid, hi)
    }
  }

  // 全部ならび終わり
  for (let i = 0; i < n; i++) rec.mark(i, "finish", {})
  rec.push({ kind: "done", codeTag: "finish" })
}

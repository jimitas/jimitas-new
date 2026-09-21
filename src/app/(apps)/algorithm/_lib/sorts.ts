// ======================================================
// アルゴリズムシミュレーター — ソートの生成器
//
// ここに書くのはアルゴリズムの論理だけ。
// 数える・記録する・説明文を作るのは Recorder の仕事なので、
// 生成器の中にカウンタも文字列もほとんど出てこない。
//
// codeTag は _lib/codeSamples/ のコード例の行に付けたラベルと対応する。
// 対応が壊れていないことは単体テスト（タグ網羅・双方向）で固定する。
// ======================================================

import type { Recorder } from "./recorder"

/**
 * 選択ソート。
 *
 * まだ並んでいない範囲から最小値をさがし、その範囲の先頭と入れかえる。
 * 比較回数は入力の並びによらず常に n(n-1)/2 回になるのが特徴。
 *
 * 入れかえは i === saisho のときも省略せずに行う。
 * コード例に「もし ちがえば」の分岐が無いので、そこを省くと
 * 画面の動きとコードが食い違ってしまうため。
 * このおかげで交換回数はちょうど n-1 回になる。
 */
export function selectionSort(rec: Recorder): void {
  const n = rec.length
  rec.push({ kind: "init", codeTag: "init" })

  for (let i = 0; i < n - 1; i++) {
    let saisho = i

    rec.push({
      kind: "focus",
      codeTag: "outerLoop",
      pointers: { i, min: saisho },
      message: `Data[${i}] より うしろで いちばん 小さい 値を さがします`,
    })
    rec.push({
      kind: "focus",
      codeTag: "innerLoop",
      pointers: { i, j: i + 1, min: saisho },
      message: `Data[${i + 1}] から じゅんに くらべていきます`,
    })

    for (let j = i + 1; j < n; j++) {
      if (rec.lessThan(j, saisho, "compare", { i, j, min: saisho })) {
        saisho = j
        rec.push({
          kind: "focus",
          codeTag: "updateMin",
          pointers: { i, j, min: saisho },
          message: `いまのところ いちばん 小さいのは Data[${saisho}] です`,
        })
      }
    }

    rec.swap(i, saisho, "swap", { i, j: saisho, min: saisho })
    rec.mark(i, "swap", { i, min: saisho })
  }

  // いちばんうしろの1個は、残りものとして自動的に確定する
  if (n > 0) rec.mark(n - 1, "finish", { i: n - 1 })

  rec.push({ kind: "done", codeTag: "finish" })
}

/**
 * バブルソート。
 *
 * となりどうしをくらべて、大きいほうを右へ送る。
 * 1巡するごとに、いちばん右に最大値が確定する。
 *
 * 1巡のあいだ1回も入れかえが起きなければ、もう並んでいるので途中でやめる。
 * この「早期終了」があるおかげで、ならんでいる入力では比較 n-1 回で終わる
 * （＝最良 O(n)）。挿入ソートとならぶバブルソートの長所なので、省略しない。
 */
export function bubbleSort(rec: Recorder): void {
  const n = rec.length
  rec.push({ kind: "init", codeTag: "init" })

  let koukan = true
  let i = 0
  while (koukan && i < n - 1) {
    koukan = false

    rec.push({
      kind: "focus",
      codeTag: "outerLoop",
      pointers: { j: 0 },
      message: `${i + 1} 巡目です`,
    })
    rec.push({
      kind: "focus",
      codeTag: "innerLoop",
      pointers: { j: 0 },
      message: "左はしから となりどうしを くらべていきます",
    })

    for (let j = 0; j < n - 1 - i; j++) {
      if (rec.lessThan(j + 1, j, "compare", { j })) {
        rec.swap(j, j + 1, "swap", { j })
        koukan = true
      }
    }

    // この巡で いちばん大きい値が右はしに来た
    rec.mark(n - 1 - i, "markSorted", {})
    i++
  }

  // 1回も入れかえが起きなかった＝残りはもう並んでいる
  for (let k = n - 1 - i; k >= 0; k--) rec.mark(k, "finish", {})

  rec.push({ kind: "done", codeTag: "finish" })
}

/**
 * 挿入ソート。
 *
 * 「もう並んでいる範囲」に、次の1つを正しい位置までもっていく。
 *
 * 書き方は共通テスト方式（作業用の変数に取り出して、うしろへ1つずつ「ずらす」）。
 *   tmp = Data[i]        … 取り出して手に持つ。その場所が穴になる
 *   Data[j+1] = Data[j]  … 穴へ向けて1つずつ右へずらす
 *   Data[j+1] = tmp      … 穴にさしこむ
 *
 * ずらしている途中は、配列の中に同じ値が2つ並んで見える。
 * そのままだと「値が増えた」と誤解されるので、取り出した値（held）と
 * あいた場所（gap）を Recorder が持ち、画面では穴として描く。
 *
 * 「ずらした回数」は Data[j+1] = Data[j] が動いた回数だけを数える。
 * 取り出しとさしこみは必ず n-1 回ずつ起きるので、数えても情報にならない。
 */
export function insertionSort(rec: Recorder): void {
  const n = rec.length
  rec.push({ kind: "init", codeTag: "init" })

  // 先頭の1個は、それだけで「並んでいる」とみなせる
  if (n > 0) {
    rec.mark(0, "init", { i: 0 }, "Data[0] は 1個だけなので、もう ならんでいます")
  }

  for (let i = 1; i < n; i++) {
    rec.push({
      kind: "focus",
      codeTag: "outerLoop",
      pointers: { i },
      message: `Data[${i}] (=${rec.array[i]}) を ならんでいる範囲に さしこみます`,
    })

    rec.takeOut(i, "takeOut", { i })

    let j = i - 1
    while (j >= 0 && rec.greaterThanHeld(j, "compare", { i, j })) {
      rec.shiftRight(j, "shift", { i, j })
      j--
    }

    rec.putDown("insert", { i, j: j + 1 })
    rec.mark(i, "outerLoop", { i }, `Data[0] から Data[${i}] までが ならびました`)
  }

  rec.push({ kind: "done", codeTag: "finish" })
}

/**
 * 交換ソート（単純交換ソート）。
 *
 * バブルソートと混同されやすいが、くらべる相手がちがう。
 *   バブル : となりどうしだけをくらべる
 *   交換   : Data[i] を、そのうしろ全部と1つずつくらべる
 * 見つけるたびに入れかえるので、選択ソートより入れかえの回数が多くなる。
 */
export function exchangeSort(rec: Recorder): void {
  const n = rec.length
  rec.push({ kind: "init", codeTag: "init" })

  for (let i = 0; i < n - 1; i++) {
    rec.push({
      kind: "focus",
      codeTag: "outerLoop",
      pointers: { i, j: i + 1 },
      message: `Data[${i}] を、そのうしろ全部と くらべていきます`,
    })
    rec.push({
      kind: "focus",
      codeTag: "innerLoop",
      pointers: { i, j: i + 1 },
      message: `Data[${i + 1}] から じゅんに くらべます`,
    })

    for (let j = i + 1; j < n; j++) {
      if (rec.lessThan(j, i, "compare", { i, j })) {
        rec.swap(i, j, "swap", { i, j })
      }
    }

    rec.mark(i, "swap", { i })
  }

  if (n > 0) rec.mark(n - 1, "finish", {})

  rec.push({ kind: "done", codeTag: "finish" })
}

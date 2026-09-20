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
      message: `A[${i}] より うしろで いちばん 小さい 値を さがします`,
    })
    rec.push({
      kind: "focus",
      codeTag: "innerLoop",
      pointers: { i, j: i + 1, min: saisho },
      message: `A[${i + 1}] から じゅんに くらべていきます`,
    })

    for (let j = i + 1; j < n; j++) {
      if (rec.lessThan(j, saisho, "compare", { i, j, min: saisho })) {
        saisho = j
        rec.push({
          kind: "focus",
          codeTag: "updateMin",
          pointers: { i, j, min: saisho },
          message: `いまのところ いちばん 小さいのは A[${saisho}] です`,
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
 * 教科書では作業用の変数に値を取り出して、うしろへ1つずつ「ずらす」書き方が
 * 多いが、ここでは**となりと入れかえながら左へ歩かせる書き方**を採っている。
 * 理由は2つ:
 *   - 取り出している途中は配列の中に同じ値が2つ見える状態になり、
 *     画面で見たときに「値が増えた」ように誤解される
 *   - くらべる回数はどちらの書き方でも同じなので、計算量の話は変わらない
 */
export function insertionSort(rec: Recorder): void {
  const n = rec.length
  rec.push({ kind: "init", codeTag: "init" })

  // 先頭の1個は、それだけで「並んでいる」とみなせる
  if (n > 0) {
    rec.mark(0, "init", { i: 0 }, "A[0] は 1個だけなので、もう ならんでいます")
  }

  for (let i = 1; i < n; i++) {
    rec.push({
      kind: "focus",
      codeTag: "outerLoop",
      pointers: { i, j: i },
      message: `A[${i}] (=${rec.array[i]}) を ならんでいる範囲に さしこみます`,
    })

    let j = i
    while (j > 0 && rec.lessThan(j, j - 1, "compare", { i, j })) {
      rec.swap(j - 1, j, "swap", { i, j })
      j--
    }

    // 1つぶん さしこみ終わり。対応するのは外側の繰り返しの行（つぎの i へ進む）
    rec.mark(i, "outerLoop", { i, j }, `A[0] から A[${i}] までが ならびました`)
  }

  rec.push({ kind: "done", codeTag: "finish" })
}

/**
 * 交換ソート（単純交換ソート）。
 *
 * バブルソートと混同されやすいが、くらべる相手がちがう。
 *   バブル : となりどうしだけをくらべる
 *   交換   : A[i] を、そのうしろ全部と1つずつくらべる
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
      message: `A[${i}] を、そのうしろ全部と くらべていきます`,
    })
    rec.push({
      kind: "focus",
      codeTag: "innerLoop",
      pointers: { i, j: i + 1 },
      message: `A[${i + 1}] から じゅんに くらべます`,
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

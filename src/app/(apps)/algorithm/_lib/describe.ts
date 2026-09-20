// ======================================================
// アルゴリズムシミュレーター — 説明文の生成
//
// 説明文をここに集約する理由:
//   - 生成器の中に文字列を散らかさない（生成器はアルゴリズムの論理だけに集中）
//   - UI では作らない。UI を「Step を描くだけ」にしておくと、
//     単体テストで説明文まで固定できる
//
// 添字の表示は 0 始まり。
// 共通テスト用プログラム表記の既定（添字は 0 から始まる）と、
// Python / JavaScript の3言語をそろえるため。
// 出典は docs/共通テスト用プログラム表記.md を参照。
// ======================================================

import type { StepInput } from "./types"

/** A[3] (=48) のような表示。値が取れないときは添字だけ */
function cell(array: readonly number[], index: number): string {
  const v = array[index]
  return v === undefined ? `A[${index}]` : `A[${index}] (=${v})`
}

/**
 * ステップの定型説明文を作る。
 *
 * 生成器が message を明示した場合はそちらが優先されるので、
 * ここで表しきれないもの（「左半分をしらべます」など）は生成器側で書く。
 */
export function describeStep(input: StepInput, array: readonly number[]): string {
  switch (input.kind) {
    case "init":
      return "はじめの ならびです"

    case "compare": {
      if (!input.compared || input.compared.length === 0) return "くらべています"
      // 探索は「A[i] と さがす値」。ソートは「A[i] と A[j]」
      if (input.target !== undefined) {
        return `${cell(array, input.compared[0])} と さがす値 ${input.target} を くらべています`
      }
      const [a, b] = input.compared
      return `${cell(array, a)} と ${cell(array, b)} を くらべています`
    }

    case "swap": {
      if (!input.swapped) return "入れかえました"
      const [a, b] = input.swapped
      // 選択ソートは i === saisho のときも入れかえを省略しない（コード例と
      // 動きを一致させるため）。同じ場所どうしの入れかえは、そう説明する。
      if (a === b) return `A[${a}] は もう その場所で よいので 動きません`
      return `A[${a}] と A[${b}] を 入れかえました`
    }

    case "shift": {
      if (input.wrote === undefined) return "ずらしました"
      return `A[${input.wrote}] に となりの 値を ずらしました`
    }

    case "write": {
      if (input.wrote === undefined) return "書きこみました"
      return `${cell(array, input.wrote)} を 書きこみました`
    }

    case "mark": {
      if (input.marked === undefined) return "位置が 決まりました"
      return `A[${input.marked}] の 位置が 決まりました`
    }

    case "focus":
      return "つぎを しらべます"

    case "found": {
      const i = input.pointers?.i
      return i === undefined
        ? "見つかりました！"
        : `見つかりました！ A[${i}] です`
    }

    case "notfound":
      return "さいごまで しらべましたが 見つかりませんでした"

    case "done":
      return "ぜんぶ ならびました！"
  }
}

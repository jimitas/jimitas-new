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

import type { PointerName, StepInput } from "./types"

/**
 * 矢印の凡例に出す説明。
 *
 * ここは「どのアルゴリズムでも通じる言い方」だけを置く。
 * 意味がちがうアルゴリズム（マージソートの L / R は範囲の端ではなく
 * 読んでいる場所）は AlgoDef.pointerHelp で差しかえる。
 * ここに但し書きを足すと、合体をしないクイックソートや二分探索でも
 * 「（合体のときは…）」と出てしまう。
 */
export const POINTER_HELP: Record<PointerName, string> = {
  i: "いま決める場所",
  j: "しらべている場所",
  k: "書きもどす場所",
  min: "いまのところ いちばん小さい場所",
  left: "範囲の左はし",
  right: "範囲の右はし",
  mid: "範囲の まん中",
  pivot: "基準にえらんだ場所",
  key: "取り出して 手に持っている値",
}

/**
 * 解説パネルの「どうやって〜？」の見出し。
 *
 * 探索は並べかえをしないので、固定文にすると
 * 線形探索・二分探索でも「どうやって並べる？」と出てしまう。
 * 画面ではなくここに置くのは、jest で固定できるようにするため。
 */
export function howTitle(category: "sort" | "search"): string {
  return category === "search" ? "どうやって さがす？" : "どうやって並べる？"
}

/** Data[3] (=48) のような表示。値が取れないときは添字だけ */
function cell(array: readonly number[], index: number): string {
  const v = array[index]
  return v === undefined ? `Data[${index}]` : `Data[${index}] (=${v})`
}

// ── 挿入ソートの「手に持つ」操作の説明文 ──────────────
// Recorder からしか値が分からないので、ここに関数だけ置いて呼んでもらう。
// 文面の置き場所をこのファイルに1本化しておく。

export function describeTakeOut(index: number, value: number): string {
  return `Data[${index}] (=${value}) を いったん 取り出します。ここが あきます`
}

export function describeHeldCompare(j: number, atJ: number, held: number | undefined): string {
  if (held === undefined) return `Data[${j}] を くらべています`
  return `Data[${j}] (=${atJ}) は 取り出した ${held} より 大きい？`
}

export function describePutDown(index: number, value: number): string {
  return `あいた Data[${index}] に ${value} を さしこみました`
}

// ── マージソートの作業用配列の説明文 ──────────────────

export function describeCopyToAux(lo: number, hi: number): string {
  return `Data[${lo}] から Data[${hi}] までを 作業用の入れものに 写しました`
}

export function describeAuxCompare(
  p: number,
  a: number | null | undefined,
  q: number,
  b: number | null | undefined,
): string {
  if (a === null || a === undefined) return `右がわの ${b} を もどします`
  if (b === null || b === undefined) return `左がわの ${a} を もどします`
  return `作業用の ${a} と ${b} を くらべています。小さいほうを 先に もどします`
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
      // 探索は「Data[i] と さがす値」。ソートは「Data[i] と Data[j]」
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
      if (a === b) return `Data[${a}] は もう その場所で よいので 動きません`
      return `Data[${a}] と Data[${b}] を 入れかえました`
    }

    case "shift": {
      if (input.wrote === undefined) return "ずらしました"
      return `大きいので、Data[${input.wrote - 1}] を Data[${input.wrote}] へ 1つ 右に ずらします`
    }

    case "take":
      return "取り出しました"

    case "place":
      return "さしこみました"

    case "write": {
      if (input.wrote === undefined) return "書きこみました"
      return `${cell(array, input.wrote)} を 書きこみました`
    }

    case "mark": {
      if (input.marked === undefined) return "位置が 決まりました"
      return `Data[${input.marked}] の 位置が 決まりました`
    }

    case "focus":
      return "つぎを しらべます"

    case "found": {
      const i = input.pointers?.i
      return i === undefined
        ? "見つかりました！"
        : `見つかりました！ Data[${i}] です`
    }

    // 二分探索は さいごまで見ない（範囲を半分ずつ捨てる）ので、
    // 「さいごまで しらべましたが」とは書けない。
    // どちらで終わったかは、直後の done のメッセージが言う。
    case "notfound":
      return "見つかりませんでした"

    case "done":
      return "ぜんぶ ならびました！"
  }
}

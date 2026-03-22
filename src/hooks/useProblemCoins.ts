// ======================================================
// useProblemCoins フック
//
// useCoins をラップして「同じ問題で重複してコインが増えない」
// 仕組みを追加したカスタムフック。
//
// 使い方:
//   const { coins, tryAddCoins, resetProblem } = useProblemCoins()
//
//   // 新しい問題をセットするとき（もんだい・セットボタンなど）
//   resetProblem()
//
//   // 正解したとき（重複チェック付き）
//   if (tryAddCoins(1)) {
//     se.playSe(se.seikai1)  // 初回正解のときだけ音を鳴らす
//   }
//
// ポイント:
//   - tryAddCoins は同じ問題で2回目以降は何もせず false を返す
//   - resetProblem を呼ぶと「未回答」状態に戻る
//   - 音は呼び出し側で制御（アプリごとに異なる可能性があるため）
//   - coins・resetCoins はそのまま useCoins から引き継ぐ
// ======================================================

"use client"

import { useRef } from "react"
import { useCoins } from "./useCoins"

export function useProblemCoins() {
  const { coins, addCoins, resetCoins } = useCoins()

  // addCoins は毎レンダーで再生成されるため ref 経由で参照する
  const addCoinsRef = useRef(addCoins)
  addCoinsRef.current = addCoins

  // 現在の問題で正解済みかどうか
  const isAnswered = useRef(false)

  // 正解時に呼ぶ。
  // 同じ問題で初めての正解なら コインを追加して true を返す。
  // 2回目以降は何もせず false を返す。
  function tryAddCoins(amount: number): boolean {
    if (isAnswered.current) return false
    isAnswered.current = true
    addCoinsRef.current(amount)
    return true
  }

  // 新しい問題をセットするときに呼ぶ。未回答状態にリセットする。
  function resetProblem() {
    isAnswered.current = false
  }

  return { coins, tryAddCoins, resetProblem, resetCoins }
}

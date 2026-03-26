// ======================================================
// useKeyboardInput フック
//
// テンキー（NumPad）と組み合わせて使う、キーボード入力フック。
// 数字入力アプリ共通の「キーボードでも答えを入力できる」機能を提供する。
//
// 対応キー:
//   0〜9       → onDigit(n)
//   Backspace  → onDelete()
//   Delete / Escape → onClear()
//   Enter      → onEnter()  ※省略可
//
// 注意:
//   - input / textarea にフォーカスがあるときは無視する
//     （設定欄のチェックボックスなどへの誤反応を防ぐ）
//   - enabled が false のときは全キーを無視する
//     （問題が出ていないときなど）
//
// 使い方:
//   useKeyboardInput({
//     onDigit:  handleDigit,
//     onDelete: handleDelete,
//     onClear:  handleClear,
//     onEnter:  checkAnswer,  // 省略可
//     enabled:  hasProblem,
//   })
// ======================================================

"use client"

import { useEffect } from "react"

interface UseKeyboardInputOptions {
  /** 数字キー（0〜9）を押したとき */
  onDigit: (n: number) => void
  /** Backspace を押したとき（1桁消す） */
  onDelete: () => void
  /** Delete / Escape を押したとき（全消し） */
  onClear: () => void
  /** Enter を押したとき（省略可） */
  onEnter?: () => void
  /** false のとき全キーを無視する */
  enabled: boolean
}

export function useKeyboardInput({
  onDigit,
  onDelete,
  onClear,
  onEnter,
  enabled,
}: UseKeyboardInputOptions) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // input / textarea にフォーカス中は無視
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return

      if (e.key >= "0" && e.key <= "9") {
        onDigit(parseInt(e.key, 10))
      } else if (e.key === "Backspace") {
        onDelete()
      } else if (e.key === "Delete" || e.key === "Escape") {
        onClear()
      } else if (e.key === "Enter") {
        onEnter?.()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onDigit, onDelete, onClear, onEnter, enabled])
}

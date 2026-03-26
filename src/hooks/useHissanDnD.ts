// ======================================================
// useHissanDnD フック
//
// 筆算アプリ共通のタッチ DnD ロジック。
// tashi-hissan / hiki-hissan / kake-hissan-1 で使用。
//
// 提供するイベントハンドラ:
//   touchStartEvent  — タッチ開始（スクロール禁止）
//   touchMoveEvent   — タッチ移動中（要素を指に追従）
//   touchEndEvent    — タッチ終了: 数字パレット用
//   touchEndEvent2   — タッチ終了: 硬貨用（onDropCoin を渡したときのみ使う）
//
// 使い方:
//   const { touchStartEvent, touchMoveEvent, touchEndEvent, touchEndEvent2 }
//     = useHissanDnD({
//         numPalRef,
//         onDropDigit: (_elem, _target) => { numSet(); kotaeInput() },
//         onDropCoin:  ()               => { imgKuriagari() },
//       })
// ======================================================

"use client"

import { RefObject, useCallback } from "react"
import * as se from "@/lib/se"

interface UseHissanDnDOptions {
  /** 数字パレットの DOM ref */
  numPalRef: RefObject<HTMLDivElement | null>
  /**
   * 数字を droppable-elem へドロップした後のコールバック。
   * パレットのクリアはフック内で行うため、このコールバックでは
   * numSet() / kotaeInput() / resizeDroppedNumber() などを呼ぶだけでよい。
   */
  onDropDigit: (elem: HTMLElement, target: HTMLElement) => void
  /**
   * 硬貨を droppable-elem-2 へドロップした後のコールバック（省略可）。
   * imgKuriagari() / imgKurisagari() などを呼ぶ。
   */
  onDropCoin?: (elem: HTMLElement, target: HTMLElement) => void
}

export function useHissanDnD({ numPalRef, onDropDigit, onDropCoin }: UseHissanDnDOptions) {

  // ── タッチ開始（スクロール禁止） ──────────────────
  const touchStartEvent = useCallback((event: TouchEvent) => {
    event.preventDefault()
  }, [])

  // ── タッチ移動中（要素を指に追従） ────────────────
  const touchMoveEvent = useCallback((event: TouchEvent) => {
    event.preventDefault()
    const elem  = event.target as HTMLElement
    const touch = event.changedTouches[0]
    elem.style.position = "fixed"
    elem.style.zIndex   = "9999"
    elem.style.top  = touch.pageY - window.scrollY - elem.offsetHeight / 2 + "px"
    elem.style.left = touch.pageX - window.scrollX - elem.offsetWidth  / 2 + "px"
  }, [])

  // ── タッチ終了: 数字パレット用 ────────────────────
  // ドロップ先が droppable-elem ならそこへ移動し、パレットをクリアしてコールバックを呼ぶ
  const touchEndEvent = useCallback((event: TouchEvent) => {
    event.preventDefault()
    const elem  = event.target as HTMLElement
    elem.style.position = ""
    elem.style.zIndex   = ""
    elem.style.top      = ""
    elem.style.left     = ""

    const touch     = event.changedTouches[0]
    const newParent = document.elementFromPoint(
      touch.pageX - window.scrollX,
      touch.pageY - window.scrollY,
    ) as HTMLElement | null

    if (newParent?.className === "droppable-elem") {
      newParent.appendChild(elem)
      // 数字パレットを一旦クリア（numSet でアプリ側が再生成する）
      const pal = numPalRef.current
      if (pal) {
        while (pal.firstChild) pal.removeChild(pal.firstChild)
      }
      onDropDigit(elem, newParent)
      // ゴミ箱（img タグ）へドロップしたときは cancel 音、それ以外は pi 音
      se.playSe(newParent.tagName === "IMG" ? se.cancel : se.pi)
    }
  }, [numPalRef, onDropDigit])

  // ── タッチ終了: 硬貨用 ────────────────────────────
  // ドロップ先が droppable-elem-2 ならそこへ移動してコールバックを呼ぶ
  const touchEndEvent2 = useCallback((event: TouchEvent) => {
    event.preventDefault()
    const elem  = event.target as HTMLElement
    elem.style.position = ""
    elem.style.zIndex   = ""
    elem.style.top      = ""
    elem.style.left     = ""
    // Tailwind preflight が display をリセットするため明示指定
    elem.style.display  = "inline-block"

    const touch     = event.changedTouches[0]
    const newParent = document.elementFromPoint(
      touch.pageX - window.scrollX,
      touch.pageY - window.scrollY,
    ) as HTMLElement | null

    if (newParent?.className === "droppable-elem-2") {
      newParent.appendChild(elem)
    }
    se.playSe(se.pi)
    if (newParent) onDropCoin?.(elem, newParent)
  }, [onDropCoin])

  return { touchStartEvent, touchMoveEvent, touchEndEvent, touchEndEvent2 }
}

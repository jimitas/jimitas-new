// ======================================================
// useDragDrop フック
//
// ドラッグ＆ドロップ（マウス）とタッチ操作の両方に対応した
// カスタムフック。ブロックを画面上で移動させるために使う。
//
// block_1 からそのまま移植（HTML5 DnD API + Touch Events）。
// react-draggable は不採用（パフォーマンスとCSS競合の問題）。
// ======================================================

import { useCallback } from "react"

// ドラッグ中の要素をグローバルに保持する（複数コンポーネント間で共有しない）
let globalDragged: HTMLElement | null = null

export const useDragDrop = (onDropCallback?: () => void) => {

  // ── マウスドラッグ ──────────────────────────────────

  // ドラッグ開始：ドラッグされた要素を記憶する
  const dragStart = useCallback(function dragStart(e: DragEvent) {
    const target = e.target as HTMLElement
    if (target.draggable === true) {
      globalDragged = target
    }
  }, [])

  // ドラッグ中：ドロップを受け付けるためにデフォルト動作をキャンセル
  const dragOver = useCallback(function dragOver(e: DragEvent) {
    e.preventDefault()
  }, [])

  // ドロップ：droppable-elem クラスを持つ要素の上にドロップされたら移動させる
  const dropEnd = useCallback(function dropEnd(e: DragEvent) {
    e.preventDefault()
    const target = e.target as HTMLElement

    // バブリング対応：親要素をたどって droppable-elem を探す（最大5階層）
    let dropTarget = target
    let attempts = 0
    while (dropTarget && attempts < 5) {
      if (dropTarget.className && dropTarget.className.match(/droppable-elem/)) {
        break
      }
      dropTarget = dropTarget.parentElement as HTMLElement
      attempts++
    }

    if (dropTarget && dropTarget.className.match(/droppable-elem/) && globalDragged) {
      // 元の親から取り外して新しい親に追加（cloneNode だとイベントリスナーが消えるため使わない）
      if (globalDragged.parentNode) {
        globalDragged.parentNode.removeChild(globalDragged)
      }
      dropTarget.appendChild(globalDragged)
      globalDragged = null

      // ドロップ後の処理（カウント更新など）をコールバックで呼び出す
      if (onDropCallback) {
        onDropCallback()
      }
    }
  }, [onDropCallback])

  // ── タッチ操作 ──────────────────────────────────────

  // タッチ開始：スクロール等のデフォルト動作をキャンセル
  const touchStart = useCallback(function touchStart(e: TouchEvent) {
    e.preventDefault()
  }, [])

  // タッチ移動：要素を指の位置に追従させる（fixed で追従）
  const touchMove = useCallback(function touchMove(e: TouchEvent) {
    e.preventDefault()
    const draggedElem = e.target as HTMLElement
    const touch = e.changedTouches[0]
    draggedElem.style.position = "fixed"
    draggedElem.style.top =
      touch.pageY - window.pageYOffset - draggedElem.offsetHeight / 2 + "px"
    draggedElem.style.left =
      touch.pageX - window.pageXOffset - draggedElem.offsetWidth / 2 + "px"
  }, [])

  // タッチ終了：指を離した位置にある droppable-elem に要素を移動させる
  const touchEnd = useCallback(function touchEnd(e: TouchEvent) {
    e.preventDefault()
    const droppedElem = e.target as HTMLElement

    // fixed を解除して通常フローに戻す
    droppedElem.style.position = ""
    droppedElem.style.top = ""
    droppedElem.style.left = ""

    const touch = e.changedTouches[0]
    const newParentElem = document.elementFromPoint(
      touch.pageX - window.pageXOffset,
      touch.pageY - window.pageYOffset
    ) as HTMLElement | null

    if (newParentElem && newParentElem.className.match(/droppable-elem/)) {
      newParentElem.appendChild(droppedElem)
      globalDragged = null
      if (onDropCallback) {
        onDropCallback()
      }
    }
  }, [onDropCallback])

  return { dragStart, dragOver, dropEnd, touchStart, touchMove, touchEnd }
}

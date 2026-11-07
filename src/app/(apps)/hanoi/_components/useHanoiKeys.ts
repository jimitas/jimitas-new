// ======================================================
// ハノイのキー操作（要件 §6 P1）
//   ② Space＝再生／一時停止、←→＝1手もどる／すすむ　① 1／2／3＝A／B／C を選ぶ
//
// 共通の usePageKeys は play・step（→）しか持たないので、同じ作法（ownsKey で横取りしない要素を守る・
// ボタンを選んだままのスペースで二重に動かさない）をここに持つ。共有ファイルは変更しない。
// ======================================================

"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { isPressable, ownsKey } from "@/lib/graph/keys"

/** キー → 動作。キーは " "・"ArrowLeft"・"ArrowRight"・"1"・"2"・"3" */
export type KeyMap = Partial<Record<string, () => void>>

export function useHanoiKeys(map: KeyMap, enabled = true) {
  const ref = useRef(map)
  useLayoutEffect(() => {
    ref.current = map
  })
  useEffect(() => {
    if (!enabled) return
    let swallowSpaceUp = false
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " ") swallowSpaceUp = false
      if (e.ctrlKey || e.altKey || e.metaKey) return
      const fn = ref.current[e.key]
      if (!fn) return
      const kind = e.key === " " ? "space" : e.key.startsWith("Arrow") ? "arrow" : "space"
      const t = e.target as Element | null
      if (ownsKey(t, kind)) return
      e.preventDefault()
      if (e.key === " " && isPressable(t)) swallowSpaceUp = true
      if (e.repeat && e.key === " ") return
      fn()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== " " || !swallowSpaceUp) return
      swallowSpaceUp = false
      e.preventDefault()
    }
    const onBlur = () => {
      swallowSpaceUp = false
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [enabled])
}

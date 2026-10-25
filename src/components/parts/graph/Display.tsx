// ======================================================
// 表示の設定（大きく表示）と、ページ全体のキー操作のフック
//
// 大きく表示はページで1つの設定なので、props で配らず context で渡す。
// 座標平面の部品（線・点・文字）とステップの数値表示が useBig() で読む。
// Provider を置かなければ倍率 1 のまま（大きく表示を持たないアプリで使っても影響しない）。
//
// 微分の意味がわかる（bibun）から移した（2026-10-25、積分アプリと共有するため）。
// 文脈ラベル（時間・距離で表す）は微分専用なので bibun/_components/Motion.tsx に残した。
// ======================================================

"use client"

import { createContext, useContext, useEffect, useLayoutEffect, useRef } from "react"
import { BIG_FONT, BIG_LINE, isPressable, keyAction } from "@/lib/graph/keys"
import type { KeyAction } from "@/lib/graph/keys"

const BigContext = createContext(false)

export const BigProvider = BigContext.Provider

/** 大きく表示か */
export function useBig(): boolean {
  return useContext(BigContext)
}

/** 線の太さ・点の大きさの倍率と、文字の倍率 */
export function useScale(): { line: number; font: number } {
  const big = useBig()
  return big ? { line: BIG_LINE, font: BIG_FONT } : { line: 1, font: 1 }
}

/**
 * ページ全体のキー操作（スペース・→・PageDown）。handlers に無いキーは何もしない。
 * 最新の handlers を ref で読む（毎回リスナーを付け直さない）。
 */
export function usePageKeys(handlers: Partial<Record<Exclude<KeyAction, null>, () => void>>) {
  const ref = useRef(handlers)
  useLayoutEffect(() => {
    ref.current = handlers
  })
  useEffect(() => {
    /**
     * ボタンを選んだままスペースで再生したとき、離したときにブラウザがそのボタンを押すのを止める。
     * Chrome は keydown を止めた時点で押さないので、ここは Safari・Firefox 向けの守り。
     * （Chrome の画面テストでは、この処理を外しても落ちない。効き目は確かめられていない。2026-10-25）
     */
    let swallowSpaceUp = false
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " ") swallowSpaceUp = false // 目印が残ったままにならないように
      const act = keyAction(e, e.target as Element | null)
      const fn = act && ref.current[act]
      if (!fn) return
      e.preventDefault() // スペースでページがスクロールしないように
      if (e.key === " " && isPressable(e.target as Element | null)) swallowSpaceUp = true
      if (e.repeat) return // 押しっぱなしで何度も再生・停止しない
      fn()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== " " || !swallowSpaceUp) return
      swallowSpaceUp = false
      e.preventDefault() // ボタンはスペースを離したときに押される
    }
    // スペースを離す前にウィンドウから選択が外れると keyup が来ないので、そのときも目印を消す
    const onBlur = () => { swallowSpaceUp = false }
    window.addEventListener("keydown", onKey)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [])
}

/**
 * マウス・タッチで触り終えたら選択（フォーカス）を外す。点・スライダーの onPointerUp に付ける。
 * 選択が残ると、そのあとのスペース・→・PageDown（リモコン）が点やスライダーに取られるため
 * （微分の意味がわかるでは、→ で点A が動いて記録表が消える、PageDown でスライダーが大きく動く）。Tab で選んだときは残る。
 */
export function blurAfterPointer(e: { currentTarget: Element }) {
  const el = e.currentTarget as HTMLElement | SVGElement
  if (typeof el.blur === "function") el.blur()
}

/**
 * 大きく表示のときの文字の大きさ（HTML 側）。Tailwind は文字列のまま書く必要があるので、ここに並べる。
 *   legend   グラフ上のラベル（凡例）
 *   readout  投影で読ませる数値（微分の意味がわかるの「h = 0.1　平均変化率 = 4.1」など）
 *   table    記録表
 */
export const TEXT = {
  legend: { normal: "text-sm md:text-base", big: "text-lg md:text-xl" },
  readout: { normal: "text-xl md:text-2xl", big: "text-2xl md:text-4xl" },
  table: { normal: "text-base", big: "text-xl" },
} as const

/** いまの表示での文字の大きさのクラス */
export function useText(kind: keyof typeof TEXT): string {
  return TEXT[kind][useBig() ? "big" : "normal"]
}

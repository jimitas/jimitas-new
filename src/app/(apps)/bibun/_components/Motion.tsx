// ======================================================
// 文脈ラベル（「x, y」⇔「時間（秒）, 距離（m）」）の設定
//
// ページで1つの設定なので、props で配らず context で渡す。
// 大きく表示・キー操作は積分アプリと共有するため @/components/parts/graph/Display に移した（2026-10-25）。
// ======================================================

"use client"

import { createContext, useContext } from "react"

const MotionContext = createContext(false)

/** 文脈ラベル（「x, y」ではなく「時間（秒）, 距離（m）」で表す）。軸と主要な値の名前を言いかえる */
export const MotionProvider = MotionContext.Provider

/** 時間・距離で表すか */
export function useMotion(): boolean {
  return useContext(MotionContext)
}

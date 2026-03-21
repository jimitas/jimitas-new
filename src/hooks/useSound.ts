// ======================================================
// useSound フック
//
// UI 効果音を再生するための共通フック。
// howler.js を使って音声を再生する。
//
// 特徴：
//   - ミュート状態（jimitas_mute）を再生時に参照する
//   - 一度作った Howl インスタンスはキャッシュして使い回す
//   - SSR（サーバー側）では動作しないため window チェックあり
//
// 使い方：
//   const { play } = useSound()
//   play("/sounds/pi.mp3")          // デフォルト音量（0.4）
//   play("/sounds/open1.mp3", 0.3)  // 音量指定
//
// 定数（UI_SOUNDS）を使うと打ち間違いを防げる：
//   play(UI_SOUNDS.nav)
// ======================================================

"use client"

import { useCallback } from "react"
import { Howl } from "howler"

// ── UI 効果音の定義 ──────────────────────────────────
// 各操作に使う音声ファイルをここで一元管理する。
// 音を変えたいときはここだけ修正すれば OK。

export const UI_SOUNDS = {
  /** ダークモード切り替え */
  darkMode:  "/sounds/kirikae_1.mp3",
  /** フォント切り替え */
  fontToggle: "/sounds/kirikae_2.mp3",
  /** ヘッダー学年ナビのクリック */
  nav:       "/sounds/pi.mp3",
  /** アプリカードのクリック */
  card:      "/sounds/open1.mp3",
  /** ミュート切り替え */
  mute:      "/sounds/piron.mp3",
  /** jimitasについて ページへ移動 */
  about:     "/sounds/seikai2.mp3",
  /** メニューへもどる */
  back:      "/sounds/kako.mp3",
}

// ── Howl インスタンスのキャッシュ ────────────────────
// 同じファイルを何度も new Howl() しないようにキャッシュする
const soundCache: Record<string, Howl> = {}

function getHowl(src: string, volume: number): Howl {
  if (!soundCache[src]) {
    soundCache[src] = new Howl({ src: [src], volume })
  }
  return soundCache[src]
}

// ── プリロード ───────────────────────────────────────
// アプリ起動時に呼ぶと、UI_SOUNDS の全ファイルを事前にロードする。
// これにより初回再生時のラグをなくす。
export function preloadUISounds() {
  if (typeof window === "undefined") return
  for (const src of Object.values(UI_SOUNDS)) {
    getHowl(src, 0.4)  // Howl 生成時点でファイルのロードが始まる
  }
}

// ── フック本体 ───────────────────────────────────────

export function useSound() {
  /**
   * 効果音を再生する。
   * ミュート中（jimitas_mute === "true"）の場合は何もしない。
   *
   * @param src     音声ファイルのパス（例: "/sounds/pi.mp3"）
   * @param volume  音量（0.0〜1.0、デフォルト 0.4）
   */
  const play = useCallback((src: string, volume: number = 0.4) => {
    // SSR 環境では動作しない
    if (typeof window === "undefined") return

    // ミュート中はスキップ
    if (localStorage.getItem("jimitas_mute") === "true") return

    // キャッシュから Howl を取得して再生
    getHowl(src, volume).play()
  }, [])

  return { play }
}

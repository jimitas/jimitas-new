// ======================================================
// 効果音モジュール（howler.js）
//
// 全アプリ共通の効果音をまとめて管理する。
// public/sounds/ 配下の音声ファイルを参照する。
//
// 使い方:
//   import * as se from "@/lib/se"
//   se.playSe(se.right)
//
// 注意: howler.js はブラウザ専用のため、
//       このファイルを使うコンポーネントは "use client" が必要。
// ======================================================

import { Howl } from "howler"

// ── ミュートチェック付き再生関数 ──────────────────────
// se.xxx.play() の代わりにこれを使う。
// ミュート中（jimitas_mute === "true"）は何もしない。
//
// NOTE: localStorage は SSR で使えないため typeof window チェックが必須。
//       howler.js の Howl.mute(true) はグローバルミュートだが、
//       このアプリでは localStorage ベースの per-play チェックを採用している。
//       将来 Howler.volume(0) に切り替える場合は playSe の削除で対応できる。
export function playSe(howl: Howl) {
  if (typeof window === "undefined") return
  if (localStorage.getItem("jimitas_mute") === "true") return
  howl.play()
}

// ブロックを置いたとき・移動したとき
export const pi = new Howl({ src: ["/sounds/pi.mp3"] })

// モード切り替え・設定変更のとき
export const set = new Howl({ src: ["/sounds/set.mp3"] })

// 正解音①（シンプル）
export const seikai1 = new Howl({ src: ["/sounds/seikai.mp3"] })

// 正解音②（少し華やか）
export const seikai2 = new Howl({ src: ["/sounds/seikai2.mp3"] })

// リセットのとき
export const reset = new Howl({ src: ["/sounds/reset.mp3"] })

// 正解のとき（右）
export const right = new Howl({ src: ["/sounds/right.mp3"] })

// 移動音①
export const move1 = new Howl({ src: ["/sounds/move1.mp3"] })

// 移動音②
export const move2 = new Howl({ src: ["/sounds/move2.mp3"] })

// 警告・不正解のとき
export const alertSound = new Howl({ src: ["/sounds/alert.mp3"] })

// その他の効果音
export const kako   = new Howl({ src: ["/sounds/kako.mp3"] })
export const piron  = new Howl({ src: ["/sounds/piron.mp3"] })

// ゴミ箱に捨てる・財布にしまう動作のとき
export const cancel = new Howl({ src: ["/sounds/cancel.mp3"] })

// ── 一括プリロード ─────────────────────────────────────
// SoundPreloader から呼ぶ。
// Howl はデフォルトで preload:true だが、このファイルが
// import されていないページでは Howl インスタンス自体が
// 作られないため、明示的に .load() を呼ぶことで確実にキャッシュする。
export function preloadAll() {
  if (typeof window === "undefined") return
  ;[pi, set, seikai1, seikai2, reset, right, move1, move2, alertSound, kako, piron, cancel]
    .forEach(h => h.load())
}

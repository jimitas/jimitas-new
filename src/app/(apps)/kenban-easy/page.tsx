"use client"

// ======================================================
// けんばんハーモニカ（かんたん）
//
// ドレミファソラシドの8つの鍵盤だけのシンプル版。
// 1年生の鍵盤ハーモニカ入門として使う。
//
// 【操作】
//   - マウス/タッチ: 鍵盤をおしている間だけ音が鳴る
//   - キーボード: A S D F G H J K = ドレミファソラシド
// ======================================================

import { useEffect, useCallback, useRef } from "react"
import { Howl, Howler } from "howler"

// ── 8鍵盤のデータ ─────────────────────────────────────
// index  : ke-*.mp3 のファイル番号（全版と共通の音源）
// key    : 主キーのラベル
// key2   : 兼用キーのラベル（ド・ファは親指マタギの練習のために2キー割り当て）
// keyCode / keyCode2 : 対応する KeyboardEvent.code

const KEYS = [
  { index: 8,  note: "ド",   key: "D", keyCode: "KeyD", key2: "C", keyCode2: "KeyC" },
  { index: 10, note: "レ",   key: "F", keyCode: "KeyF" },
  { index: 12, note: "ミ",   key: "G", keyCode: "KeyG" },
  { index: 13, note: "ﾌｧ", key: "H", keyCode: "KeyH", key2: "N", keyCode2: "KeyN" },
  { index: 15, note: "ソ",   key: "J", keyCode: "KeyJ" },
  { index: 17, note: "ラ",   key: "K", keyCode: "KeyK" },
  { index: 19, note: "シ",   key: "L", keyCode: "KeyL" },
  { index: 20, note: "ド",   key: ";", keyCode: "Semicolon" },
]

// KeyCode → KEYS配列のインデックス（0〜7）のマップ
// key2 がある場合はそのキーコードも同じインデックスに対応させる
const KEY_MAP: Record<string, number> = Object.fromEntries([
  ...KEYS.map((k, i) => [k.keyCode, i]),
  ...KEYS.flatMap((k, i) => k.keyCode2 ? [[k.keyCode2, i]] : []),
])

// キー押下中のハイライト色
const PRESSED_BG = "rgba(252, 165, 165)"

// ── ページコンポーネント ──────────────────────────────

export default function KenbanEasyPage() {
  // 音源インスタンス（KEYS配列のインデックスに対応）
  const soundsRef = useRef<(Howl | null)[]>([])

  // キーが押されているかどうかのフラグ（繰り返し再生防止用）
  const keyDownFlagsRef = useRef<boolean[]>(new Array(8).fill(false))

  // ── AudioContext の事前起動 ────────────────────────
  // 最初のクリック or タッチで AudioContext を起こして、最初の音の遅延を防ぐ
  useEffect(() => {
    const unlock = () => {
      Howler.ctx?.resume()
      document.removeEventListener("click", unlock)
      document.removeEventListener("touchstart", unlock)
    }
    document.addEventListener("click", unlock)
    document.addEventListener("touchstart", unlock)
    return () => {
      document.removeEventListener("click", unlock)
      document.removeEventListener("touchstart", unlock)
    }
  }, [])

  // ── 音源のロード ──────────────────────────────────
  useEffect(() => {
    const newSounds = KEYS.map((k) =>
      new Howl({
        src: [`/sounds/kenban/ke-${k.index}.mp3`],
        preload: true,
        volume: 1.0,
      })
    )
    soundsRef.current = newSounds
  }, [])

  // ── 音の再生・停止 ────────────────────────────────

  const playSound = useCallback((i: number) => {
    soundsRef.current[i]?.play()
  }, [])

  const stopSound = useCallback((i: number) => {
    const s = soundsRef.current[i]
    if (s) { s.pause(); s.seek(0) }
  }, [])

  // ── マウス・タッチイベント ──────────────────────────
  // data-idx 属性に KEYS 配列のインデックスをセットして音を特定する

  const handlePressDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const i = Number((e.currentTarget as HTMLElement).dataset.idx)
    playSound(i)
  }, [playSound])

  const handlePressUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const i = Number((e.currentTarget as HTMLElement).dataset.idx)
    stopSound(i)
  }, [stopSound])

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    const i = Number((e.currentTarget as HTMLElement).dataset.idx)
    stopSound(i)
  }, [stopSound])

  // ── キーボードイベント ──────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const i = KEY_MAP[e.code]
      if (i === undefined) return
      if (keyDownFlagsRef.current[i]) return  // 繰り返しは無視
      keyDownFlagsRef.current[i] = true
      playSound(i)
      // 視覚フィードバック
      const elem = document.querySelector(`[data-idx="${i}"]`) as HTMLElement | null
      if (elem) elem.style.backgroundColor = PRESSED_BG
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const i = KEY_MAP[e.code]
      if (i === undefined) return
      keyDownFlagsRef.current[i] = false
      stopSound(i)
      const elem = document.querySelector(`[data-idx="${i}"]`) as HTMLElement | null
      if (elem) elem.style.backgroundColor = ""
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [playSound, stopSound])

  // ── JSX ──────────────────────────────────────────────

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-1">けんばんハーモニカ</h1>
      <p className="text-center text-sm text-gray-500 mb-8">
        おしている間だけ音がなるよ
      </p>

      {/* 鍵盤エリア */}
      <div className="flex justify-center gap-1 md:gap-2">
        {KEYS.map((k, i) => (
          <div
            key={k.index}
            data-idx={String(i)}
            className="
              select-none cursor-pointer
              flex flex-col items-center justify-end
              pb-4 md:pb-6
              w-10 h-48
              md:w-16 md:h-72
              bg-white text-gray-900
              border-2 border-gray-500
              rounded-b-lg
              hover:bg-red-200
              active:translate-y-1
              transition-colors
            "
            onMouseDown={handlePressDown}
            onMouseUp={handlePressUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handlePressDown}
            onTouchEnd={handlePressUp}
          >
            {/* 音名（ドレミ） */}
            <span className="font-bold text-base md:text-xl text-gray-800 leading-tight">
              {k.note}
            </span>
            {/*
              キーボードのキーラベル。
              全キーで高さを揃えるために固定高さのコンテナに入れる。
              1行キーも2行キーも同じ高さ → 音名の位置が揃う。
            */}
            <div className="h-9 md:h-11 flex items-center justify-center mt-1">
              {k.key2 ? (
                <span className="font-bold text-sm md:text-base text-blue-600 leading-tight text-center">
                  {k.key}<br/>{k.key2}
                </span>
              ) : (
                <span className="font-bold text-sm md:text-base text-blue-600 text-center">
                  {k.key}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* キーボードガイド */}
      <div className="mt-8 text-center text-xs text-gray-400 leading-relaxed">
        <p>キーボード: D(C) F G H(N) J K L ; = ドレミﾌｧソラシド</p>
        <p className="mt-1">※ ドとﾌｧは2つのキーで弾けます（指マタギの練習用）</p>
      </div>
    </main>
  )
}

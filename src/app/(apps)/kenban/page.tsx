"use client"

// ======================================================
// けんばんハーモニカ（音色切り替え対応）
//
// 34鍵の鍵盤を演奏できる。4種類の音色から選べる。
//
// 【楽器】
//   けんばんハーモニカ / リコーダー / もっきん / てっきん
//
// 【操作】
//   - マウス: 白鍵・黒鍵をクリックしている間だけ発音
//   - タッチ: スマホ・タブレットでも演奏できる
//   - キーボード: トグルボタンでONにすると PC キーで演奏できる
//     （複数のキーを同時に押せる）
// ======================================================

import { useState, useEffect, useCallback, useRef } from "react"
import { Howl } from "howler"

// ── 楽器の定義 ────────────────────────────────────────
// prefix: 音声ファイルのプレフィックス（例: ke-1.mp3, mo_1.mp3）

const INSTRUMENTS = [
  { id: "ke", name: "けんばんハーモニカ", prefix: "ke-" },
  { id: "re", name: "リコーダー",         prefix: "re_" },
  { id: "mo", name: "もっきん",           prefix: "mo_" },
  { id: "te", name: "てっきん",           prefix: "te_" },
] as const

// ── 鍵盤データ ─────────────────────────────────────────
// 音源インデックスは 1〜34。index が 90番台のものはスペーサー（音なし）

const WH_KEYS = [
  { index: 1,  note: "ファ", label: "Z" },
  { index: 3,  note: "ソ",   label: "C" },
  { index: 5,  note: "ラ",   label: "B" },
  { index: 7,  note: "シ",   label: "M" },
  { index: 8,  note: "ド",   label: "A" },
  { index: 10, note: "レ",   label: "S" },
  { index: 12, note: "ミ",   label: "D" },
  { index: 13, note: "ファ", label: "F" },
  { index: 15, note: "ソ",   label: "G" },
  { index: 17, note: "ラ",   label: "H" },
  { index: 19, note: "シ",   label: "J" },
  { index: 20, note: "ド",   label: "K" },
  { index: 22, note: "レ",   label: "L" },
  { index: 24, note: "ミ",   label: ";" },
  { index: 25, note: "ファ", label: ":" },
  { index: 27, note: "ソ",   label: "]" },
  { index: 29, note: "ラ",   label: "7" },
  { index: 31, note: "シ",   label: "9" },
  { index: 32, note: "ド",   label: "0" },
  { index: 34, note: "レ",   label: "^" },
]

// 黒鍵。index 91〜95 はスペーサー（ミとシの間の隙間）
const BK_KEYS = [
  { index: 2,  note: "#ファ/♭ソ", label: "X" },
  { index: 4,  note: "#ソ/♭ラ",   label: "V" },
  { index: 6,  note: "#ラ/♭シ",   label: "N" },
  { index: 91, note: "",           label: "" },  // スペーサー
  { index: 9,  note: "#ド/♭レ",   label: "W" },
  { index: 11, note: "#レ/♭ミ",   label: "E" },
  { index: 92, note: "",           label: "" },  // スペーサー
  { index: 14, note: "#ファ/♭ソ", label: "T" },
  { index: 16, note: "#ソ/♭ラ",   label: "Y" },
  { index: 18, note: "#ラ/♭シ",   label: "U" },
  { index: 93, note: "",           label: "" },  // スペーサー
  { index: 21, note: "#ド/♭レ",   label: "O" },
  { index: 23, note: "#レ/♭ミ",   label: "P" },
  { index: 94, note: "",           label: "" },  // スペーサー
  { index: 26, note: "#ファ/♭ソ", label: "[" },
  { index: 28, note: "#ソ/♭ラ",   label: "6" },
  { index: 30, note: "#ラ/♭シ",   label: "8" },
  { index: 95, note: "",           label: "" },  // スペーサー
  { index: 33, note: "#ド/♭レ",   label: "-" },
]

// ── キーボードマッピング ───────────────────────────────
// KEY_CODE[n] のキーを押すと、音源インデックス n の音が鳴る（n=1〜34）

const KEY_CODE: string[] = [
  "",             // 0（未使用）
  "KeyZ",         // 1  低ファ
  "KeyX",         // 2  低#ファ
  "KeyC",         // 3  低ソ
  "KeyV",         // 4  低#ソ
  "KeyB",         // 5  低ラ
  "KeyN",         // 6  低#ラ
  "KeyM",         // 7  低シ
  "KeyA",         // 8  中ド
  "KeyW",         // 9  中#ド
  "KeyS",         // 10 中レ
  "KeyE",         // 11 中#レ
  "KeyD",         // 12 中ミ
  "KeyF",         // 13 中ファ
  "KeyT",         // 14 中#ファ
  "KeyG",         // 15 中ソ
  "KeyY",         // 16 中#ソ
  "KeyH",         // 17 中ラ
  "KeyU",         // 18 中#ラ
  "KeyJ",         // 19 中シ
  "KeyK",         // 20 高ド
  "KeyO",         // 21 高#ド
  "KeyL",         // 22 高レ
  "KeyP",         // 23 高#レ
  "Semicolon",    // 24 高ミ
  "Quote",        // 25 高ファ
  "BracketRight", // 26 高#ファ
  "Backslash",    // 27 高ソ
  "Digit6",       // 28 高#ソ
  "Digit7",       // 29 高ラ
  "Digit8",       // 30 高#ラ
  "Digit9",       // 31 高シ
  "Digit0",       // 32 最高ド
  "Minus",        // 33 最高#ド
  "Equal",        // 34 最高レ
]

// キー押下中のハイライト色
const PRESSED_BG = "rgba(252, 165, 165)"

// ── ページコンポーネント ──────────────────────────────

export default function KenbanPage() {
  // 現在選んでいる楽器のインデックス（0=けんばんハーモニカ, 1=リコーダー…）
  const [instrumentIdx, setInstrumentIdx] = useState(0)

  // キーボード入力ON/OFF
  const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(false)

  // 音源インスタンスをrefで管理（state にすると毎回再レンダーが走るため ref を使う）
  // soundsRef.current[1〜34] に各鍵盤の Howl インスタンスが入る
  const soundsRef = useRef<(Howl | null)[]>([])

  // キーが押されているかどうかのフラグ（パフォーマンスのため ref）
  const keyDownFlagsRef = useRef<boolean[]>(new Array(35).fill(false))

  // isKeyboardEnabled の最新値をイベントハンドラーから参照するための ref
  // （handleKeyDown は useCallback でキャッシュされているため、最新値を ref 経由で取得する）
  const isKeyboardEnabledRef = useRef(false)
  useEffect(() => {
    isKeyboardEnabledRef.current = isKeyboardEnabled
  }, [isKeyboardEnabled])

  // ── 楽器切り替え時に音源を再生成 ──────────────────
  useEffect(() => {
    // 既存の音源を停止・破棄
    soundsRef.current.forEach(s => s?.stop())

    const prefix = INSTRUMENTS[instrumentIdx].prefix

    // index 0 は使わないので null を置いておく
    const newSounds: (Howl | null)[] = [null]
    for (let i = 1; i <= 34; i++) {
      newSounds[i] = new Howl({
        src: [`/sounds/kenban/${prefix}${i}.mp3`],
        preload: true,
        volume: 1.0,
      })
    }
    soundsRef.current = newSounds
  }, [instrumentIdx])

  // ── 音の再生・停止ヘルパー ──────────────────────────

  // 音を鳴らす
  const playSound = useCallback((index: number) => {
    if (index < 1 || index > 34) return
    soundsRef.current[index]?.play()
  }, [])

  // 音を止める（先頭に巻き戻す）
  const stopSound = useCallback((index: number) => {
    if (index < 1 || index > 34) return
    const s = soundsRef.current[index]
    if (s) {
      s.pause()
      s.seek(0)
    }
  }, [])

  // ── マウス・タッチイベント ──────────────────────────
  // div の id 属性に音源インデックスをセットしてあるので、それを読んで音を鳴らす

  const handlePressDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const id = Number((e.currentTarget as HTMLElement).id)
    if (id >= 1 && id <= 34) playSound(id)
  }, [playSound])

  const handlePressUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const id = Number((e.currentTarget as HTMLElement).id)
    if (id >= 1 && id <= 34) stopSound(id)
  }, [stopSound])

  // マウスが鍵から外れたときも音を止める
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    const id = Number((e.currentTarget as HTMLElement).id)
    if (id >= 1 && id <= 34) stopSound(id)
  }, [stopSound])

  // ── キーボードイベント ──────────────────────────────

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isKeyboardEnabledRef.current) return
    const idx = KEY_CODE.indexOf(e.code)
    // 既に押されているキーの繰り返しイベントは無視
    if (idx > 0 && !keyDownFlagsRef.current[idx]) {
      keyDownFlagsRef.current[idx] = true
      playSound(idx)
      // 視覚フィードバック: 対応する鍵盤の色を変える
      const elem = document.getElementById(String(idx))
      if (elem) elem.style.backgroundColor = PRESSED_BG
    }
  }, [playSound])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isKeyboardEnabledRef.current) return
    const idx = KEY_CODE.indexOf(e.code)
    if (idx > 0 && keyDownFlagsRef.current[idx]) {
      keyDownFlagsRef.current[idx] = false
      stopSound(idx)
      // 視覚フィードバックを元に戻す
      const elem = document.getElementById(String(idx))
      if (elem) elem.style.backgroundColor = ""
    }
  }, [stopSound])

  // キーボード入力 ON/OFF に合わせてイベントリスナーを登録・解除
  useEffect(() => {
    if (isKeyboardEnabled) {
      document.addEventListener("keydown", handleKeyDown)
      document.addEventListener("keyup", handleKeyUp)
    }
    // クリーンアップ（OFFになったとき・コンポーネント破棄時に必ず解除）
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [isKeyboardEnabled, handleKeyDown, handleKeyUp])

  // キーボードをOFFにするとき: 押しっぱなしになっている音もすべてリセット
  const handleToggleKeyboard = useCallback(() => {
    setIsKeyboardEnabled(prev => {
      if (prev) {
        // OFFにする: 全キーの音と色をリセット
        keyDownFlagsRef.current.fill(false)
        for (let i = 1; i <= 34; i++) {
          stopSound(i)
          const elem = document.getElementById(String(i))
          if (elem) elem.style.backgroundColor = ""
        }
      }
      return !prev
    })
  }, [stopSound])

  // 楽器切り替え: 演奏中の音を止めてから切り替える
  const handleChangeInstrument = useCallback((idx: number) => {
    // 現在鳴っている音をすべて止める
    for (let i = 1; i <= 34; i++) stopSound(i)
    keyDownFlagsRef.current.fill(false)
    setInstrumentIdx(idx)
  }, [stopSound])

  // ── JSX ──────────────────────────────────────────────

  return (
    <main className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-2">けんばんハーモニカ</h1>
      <p className="text-center text-sm text-gray-500 mb-6">
        音色をえらんで演奏しよう
      </p>

      {/* 楽器セレクター */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {INSTRUMENTS.map((inst, i) => (
          <button
            key={inst.id}
            onClick={() => handleChangeInstrument(i)}
            className={`px-4 py-2 rounded-full font-bold border-2 transition-colors text-sm md:text-base
              ${i === instrumentIdx
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white text-brand-600 border-brand-300 hover:bg-brand-50"
              }`}
          >
            {inst.name}
          </button>
        ))}
      </div>

      {/* キーボード入力トグル */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleToggleKeyboard}
          className={`px-6 py-2 rounded-lg font-bold border-2 transition-colors text-sm
            ${isKeyboardEnabled
              ? "bg-green-500 text-white border-green-500"
              : "bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300"
            }`}
        >
          ⌨️ キーボード入力 {isKeyboardEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* スマホ向け注意書き */}
      <p className="text-center text-xs text-gray-400 mb-4">
        ※ うまく表示されない場合は「PC版で表示」にしてお試しください
      </p>

      {/* 鍵盤エリア: 横スクロール対応 */}
      <div className="overflow-x-auto pb-4">
        {/*
          鍵盤コンテナ。
          白鍵 20 本 × (24px mobile / 40px desktop) = 480px / 800px
          高さ: 白鍵高さ（160px / 320px）
          白鍵・黒鍵は absolute で重ねて配置する
        */}
        <div
          className="relative mx-auto w-[480px] h-40 md:w-[800px] md:h-80"
        >
          {/* 黒鍵行: 白鍵の半分だけ右にずらして白鍵の間に入るようにする */}
          <div className="absolute top-0 left-3 md:left-5 flex">
            {BK_KEYS.map((key) => {
              const isSpacer = key.index > 90
              if (isSpacer) {
                // スペーサー: ミとシの間に入る透明な隙間
                return (
                  <div
                    key={key.index}
                    className="w-5 h-24 md:w-9 md:h-48 mx-0.5"
                  />
                )
              }
              return (
                <div
                  key={key.index}
                  id={String(key.index)}
                  // 黒鍵: z-20 で白鍵の上に重なる
                  className="select-none text-[0.55rem] leading-tight w-5 h-24 md:w-9 md:h-48 bg-gray-800 text-white flex flex-col items-center justify-end pb-6 md:pb-8 mx-0.5 border border-gray-600 rounded-b cursor-pointer z-20 hover:bg-red-300 active:translate-y-1"
                  onMouseDown={handlePressDown}
                  onMouseUp={handlePressUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handlePressDown}
                  onTouchEnd={handlePressUp}
                >
                  <span>{key.note}</span>
                  <span className="text-gray-400">{key.label}</span>
                </div>
              )
            })}
          </div>

          {/* 白鍵行: z-10 で黒鍵の下に入る */}
          <div className="absolute top-0 flex">
            {WH_KEYS.map((key) => (
              <div
                key={key.index}
                id={String(key.index)}
                className="select-none text-xs leading-tight w-6 h-40 md:w-10 md:h-80 bg-white text-gray-800 flex flex-col items-center justify-end pb-6 md:pb-8 border border-gray-600 rounded-b cursor-pointer z-10 hover:bg-red-300 active:translate-y-1"
                onMouseDown={handlePressDown}
                onMouseUp={handlePressUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handlePressDown}
                onTouchEnd={handlePressUp}
              >
                <span>{key.note}</span>
                <span className="text-gray-400">{key.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* キーボードガイド */}
      {isKeyboardEnabled && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-gray-600 max-w-xl mx-auto">
          <p className="font-bold text-green-700 mb-1">⌨️ キーボード演奏ガイド</p>
          <p>白鍵（低音）: <kbd className="bg-gray-100 px-1 rounded">Z</kbd> <kbd className="bg-gray-100 px-1 rounded">C</kbd> <kbd className="bg-gray-100 px-1 rounded">B</kbd> <kbd className="bg-gray-100 px-1 rounded">M</kbd> <kbd className="bg-gray-100 px-1 rounded">A</kbd> <kbd className="bg-gray-100 px-1 rounded">S</kbd> <kbd className="bg-gray-100 px-1 rounded">D</kbd> ...</p>
          <p className="mt-1">黒鍵: <kbd className="bg-gray-100 px-1 rounded">X</kbd> <kbd className="bg-gray-100 px-1 rounded">V</kbd> <kbd className="bg-gray-100 px-1 rounded">N</kbd> <kbd className="bg-gray-100 px-1 rounded">W</kbd> <kbd className="bg-gray-100 px-1 rounded">E</kbd> ...</p>
          <p className="mt-1 text-xs text-gray-400">複数キーを同時に押して和音も弾けます</p>
        </div>
      )}
    </main>
  )
}

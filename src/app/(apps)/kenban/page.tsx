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
//
// 【キーボード配置】
//   下段（左手エリア）: Shift Z X C V B N M , . / _
//   上段（右手エリア）: 数字行 Q W E R T Y U I O P [ ]
//   14〜20番の音は両エリアのキーどちらでも演奏できる（兼用）
// ======================================================

import { useState, useEffect, useCallback, useRef } from "react"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { useInstrumentSounds } from "@/hooks/useInstrumentSounds"

// ── 楽器の定義 ────────────────────────────────────────
// prefix: 音声ファイルのプレフィックス（例: ke-1.mp3, mo_1.mp3）

const INSTRUMENTS = [
  { id: "ke", name: "けんばんハーモニカ", prefix: "ke-" },
  { id: "re", name: "リコーダー",         prefix: "re_" },
  { id: "mo", name: "もっきん",           prefix: "mo_" },
  { id: "te", name: "てっきん",           prefix: "te_" },
] as const

// ── 鍵盤データの型 ────────────────────────────────────
// label2 がある場合は2つのキーで同じ音を鳴らせる（兼用キー）

type KeyData = {
  index: number   // 音源インデックス（1〜34）。90番台はスペーサー
  note: string    // ドレミ表記
  label: string   // 主キーのラベル（表示用）
  label2?: string // 兼用キーのラベル（14〜20番のみ）
}

// ── 白鍵データ ─────────────────────────────────────────
// 音域: ファ(F3) 〜 レ(D6)

const WH_KEYS: KeyData[] = [
  { index: 1,  note: "ﾌｧ", label: "Sh" },       // ShiftLeft
  { index: 3,  note: "ソ",   label: "Z" },
  { index: 5,  note: "ラ",   label: "X" },
  { index: 7,  note: "シ",   label: "C" },
  { index: 8,  note: "ド",   label: "V" },
  { index: 10, note: "レ",   label: "B" },
  { index: 12, note: "ミ",   label: "N" },
  { index: 13, note: "ﾌｧ", label: "M" },
  { index: 15, note: "ソ",   label: ",", label2: "Q" },   // 兼用
  { index: 17, note: "ラ",   label: ".", label2: "W" },   // 兼用
  { index: 19, note: "シ",   label: "/", label2: "E" },   // 兼用
  { index: 20, note: "ド",   label: "_", label2: "R" },   // 兼用（IntlRo）
  { index: 22, note: "レ",   label: "T" },
  { index: 24, note: "ミ",   label: "Y" },
  { index: 25, note: "ﾌｧ", label: "U" },
  { index: 27, note: "ソ",   label: "I" },
  { index: 29, note: "ラ",   label: "O" },
  { index: 31, note: "シ",   label: "P" },
  { index: 32, note: "ド",   label: "[" },
  { index: 34, note: "レ",   label: "]" },
]

// ── 黒鍵データ ─────────────────────────────────────────
// index 91〜95 はスペーサー（ミ→ファ、シ→ドの間に黒鍵がない隙間）

const BK_KEYS: KeyData[] = [
  { index: 2,  note: "#ﾌｧ", label: "A" },
  { index: 4,  note: "#ソ",   label: "S" },
  { index: 6,  note: "#ラ",   label: "D" },
  { index: 91, note: "",       label: "" },             // スペーサー
  { index: 9,  note: "#ド",   label: "G" },
  { index: 11, note: "#レ",   label: "H" },
  { index: 92, note: "",       label: "" },             // スペーサー
  { index: 14, note: "#ﾌｧ", label: "K", label2: "1" }, // 兼用
  { index: 16, note: "#ソ",   label: "L", label2: "2" }, // 兼用
  { index: 18, note: "#ラ",   label: ";", label2: "3" }, // 兼用
  { index: 93, note: "",       label: "" },             // スペーサー
  { index: 21, note: "#ド",   label: "5" },
  { index: 23, note: "#レ",   label: "6" },
  { index: 94, note: "",       label: "" },             // スペーサー
  { index: 26, note: "#ﾌｧ", label: "8" },
  { index: 28, note: "#ソ",   label: "9" },
  { index: 30, note: "#ラ",   label: "0" },
  { index: 95, note: "",       label: "" },             // スペーサー
  { index: 33, note: "#ド",   label: "=" },
]

// ── キーボードマッピング ───────────────────────────────
// KEY_MAP[キーコード] → 音源インデックス（1〜34）
//
// 14〜20番は2つのキーコードが同じ音に対応している（左右どちらでも届く）:
//   K（ホーム行）と 1（数字行）が同じ音 → 左手でも右手でも演奏できる

const KEY_MAP: Record<string, number> = {
  // 下段エリア（左手で自然に届く）
  "ShiftLeft": 1,
  "KeyA":      2,
  "KeyZ":      3,
  "KeyS":      4,
  "KeyX":      5,
  "KeyD":      6,
  "KeyC":      7,
  "KeyV":      8,
  "KeyG":      9,
  "KeyB":      10,
  "KeyH":      11,
  "KeyN":      12,
  "KeyM":      13,
  // 兼用キー（14〜20）: ホーム行 or 数字/QWERTYキーのどちらでも演奏できる
  "KeyK":      14,  "Digit1":      14,
  "Comma":     15,  "KeyQ":        15,
  "KeyL":      16,  "Digit2":      16,
  "Period":    17,  "KeyW":        17,
  "Semicolon": 18,  "Digit3":      18,
  "Slash":     19,  "KeyE":        19,
  "IntlRo":    20,  "KeyR":        20,  // IntlRo = 日本語キーボードの _ キー
  // 上段エリア（右手で自然に届く）
  "Digit5":       21,
  "KeyT":         22,
  "Digit6":       23,
  "KeyY":         24,
  "KeyU":         25,
  "Digit8":       26,
  "KeyI":         27,
  "Digit9":       28,
  "KeyO":         29,
  "Digit0":       30,
  "KeyP":         31,
  "BracketLeft":  32,
  "Equal":        33,
  "BracketRight": 34,
}

// キー押下中のハイライト色
const PRESSED_BG = "rgba(252, 165, 165)"

// ── ページコンポーネント ──────────────────────────────

export default function KenbanPage() {
  // 現在選んでいる楽器のインデックス（0=けんばんハーモニカ, 1=リコーダー…）
  const [instrumentIdx, setInstrumentIdx] = useState(0)

  // キーボード入力ON/OFF
  const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(false)

  // キーが押されているかどうかのフラグ（パフォーマンスのため ref）
  // 同じ鍵盤に2つのキーが割り当てられているので、音の重複再生を防ぐ
  const keyDownFlagsRef = useRef<boolean[]>(new Array(35).fill(false))

  // ── AudioContext の事前起動 ────────────────────────
  useAudioUnlock()

  // isKeyboardEnabled の最新値をイベントハンドラーから参照するための ref
  // （handleKeyDown は useCallback でキャッシュされているため、最新値を ref 経由で取得する）
  const isKeyboardEnabledRef = useRef(false)
  useEffect(() => {
    isKeyboardEnabledRef.current = isKeyboardEnabled
  }, [isKeyboardEnabled])

  // ── 音源の管理（楽器切り替えで prefix が変わると自動再ロード） ──
  const { playSound, stopSound } = useInstrumentSounds(
    INSTRUMENTS[instrumentIdx].prefix,
    34,
    { stopMethod: "pause" },
  )

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
    // KEY_MAP でキーコードから音源インデックスを取得
    const idx = KEY_MAP[e.code] ?? 0
    // 既に押されているキー（繰り返しイベント）は無視
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
    const idx = KEY_MAP[e.code] ?? 0
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
              ? "bg-brand-500 text-white border-brand-500"
              : "bg-white text-brand-600 border-brand-300 hover:bg-brand-100 dark:bg-gray-800 dark:text-brand-300 dark:border-brand-700 dark:hover:bg-brand-900"
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
        <div className="relative mx-auto w-[480px] h-40 md:w-[800px] md:h-80">

          {/* 黒鍵行: 白鍵の半分だけ右にずらして白鍵の間に入るようにする */}
          <div className="absolute top-0 left-3 md:left-5 flex">
            {BK_KEYS.map((key) => {
              const isSpacer = key.index > 90
              if (isSpacer) {
                return (
                  <div key={key.index} className="w-5 h-24 md:w-9 md:h-48 mx-0.5" />
                )
              }
              return (
                <div
                  key={key.index}
                  id={String(key.index)}
                  className="select-none w-5 h-24 md:w-9 md:h-48 bg-gray-800 text-white flex flex-col items-center justify-end pb-4 md:pb-6 mx-0.5 border border-gray-500 rounded-b cursor-pointer z-20 hover:bg-red-400 active:translate-y-1"
                  onMouseDown={handlePressDown}
                  onMouseUp={handlePressUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handlePressDown}
                  onTouchEnd={handlePressUp}
                >
                  {/* 黒鍵: 音名 */}
                  <span className="font-bold text-[0.55rem] md:text-xs text-gray-100 leading-tight">
                    {key.note}
                  </span>
                  {/* 黒鍵: キーラベル（固定高さで音名の位置を揃える） */}
                  <div className="h-5 md:h-7 flex items-center justify-center mt-0.5">
                    {key.label2 ? (
                      <span className="font-bold text-[0.6rem] md:text-xs text-yellow-300 leading-none text-center">
                        {key.label}<br/>{key.label2}
                      </span>
                    ) : (
                      <span className="font-bold text-[0.6rem] md:text-xs text-yellow-300 leading-tight text-center">
                        {key.label}
                      </span>
                    )}
                  </div>
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
                className="select-none w-6 h-40 md:w-10 md:h-80 bg-white text-gray-900 flex flex-col items-center justify-end pb-4 md:pb-6 border border-gray-500 rounded-b cursor-pointer z-10 hover:bg-red-200 active:translate-y-1"
                onMouseDown={handlePressDown}
                onMouseUp={handlePressUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handlePressDown}
                onTouchEnd={handlePressUp}
              >
                {/* 白鍵: 音名（ドレミ） */}
                <span className="font-bold text-[0.7rem] md:text-sm text-gray-800 leading-tight">
                  {key.note}
                </span>
                {/* 白鍵: キーラベル（固定高さで音名の位置を揃える） */}
                <div className="h-6 md:h-8 flex items-center justify-center mt-0.5">
                  {key.label2 ? (
                    <span className="font-bold text-[0.6rem] md:text-xs text-blue-600 leading-none text-center">
                      {key.label}<br/>{key.label2}
                    </span>
                  ) : (
                    <span className="font-bold text-[0.65rem] md:text-xs text-blue-600 leading-tight text-center">
                      {key.label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* キーボードガイド（ON時のみ表示） */}
      {isKeyboardEnabled && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-gray-700 max-w-2xl mx-auto">
          <p className="font-bold text-green-700 mb-2">⌨️ キーボード演奏ガイド</p>
          <div className="space-y-1 text-xs">
            <p>
              <span className="font-semibold">左手エリア（低音）: </span>
              <kbd className="bg-white border px-1 rounded">Sh</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">Z</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">X</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">C</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">V</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">B</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">N</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">M</kbd>
            </p>
            <p>
              <span className="font-semibold">右手エリア（高音）: </span>
              <kbd className="bg-white border px-1 rounded">Q</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">W</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">E</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">R</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">T</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">Y</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">U</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">I</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">O</kbd>
              <kbd className="bg-white border px-1 rounded mx-0.5">P</kbd>
            </p>
            <p className="text-gray-500">
              ※ 兼用キー（黄色で2段表示）はどちらのキーでも同じ音が鳴ります。複数キー同時押しで和音も弾けます。
            </p>
          </div>
        </div>
      )}
    </main>
  )
}

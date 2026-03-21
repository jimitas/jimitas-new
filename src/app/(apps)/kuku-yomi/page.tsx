// ======================================================
// 九九の読み上げ練習 ページ
//
// URL: /kuku-yomi
// 対象: 小学2〜4年生
//
// 流れ:
//   段(1〜9) と モード(上がり/下がり/バラバラ) を選択
//   → スタート → つぎ × 18回（9問 × 問題/答え の2ステップ）
//   → 完走でコイン1枚
//
// コイン付与条件:
//   段・モードが変わったら hasCompletedRef をリセット。
//   同じ段・モードの2周目はコインを付与しない。
// ======================================================

"use client"

import { useState, useRef } from "react"
import * as se from "@/lib/se"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { ArrayDots } from "@/app/(apps)/kuku-array/page"

// ── 九九の読み方データ ──────────────────────────────────
//
// KUKU_MONDAI[dan-1][mult-1] : 問題の読み方
//   例: KUKU_MONDAI[2][3] = "さんし" （3×4 の問題読み）
//
// KUKU_KOTAE[dan-1][mult-1] : 答えの読み方
//   例: KUKU_KOTAE[2][3] = "じゅうに" （12 の読み）
//
// ※ 伝統的な九九読みに従う（さざん・しざん・さんぱ などの音変化を含む）

const KUKU_MONDAI: string[][] = [
  // 1の段（いんいちが〜いんくが）
  ["いんいちが", "いんにが", "いんさんが", "いんしが", "いんごが", "いんろくが", "いんしちが", "いんはちが", "いんくが"],
  // 2の段
  ["にいちが", "ににんが", "にさんが", "にしが", "にご", "にろく", "にしち", "にはち", "にく"],
  // 3の段（さざん・さんぱ に注意）
  ["さんいちが", "さんにが", "さざんが", "さんし", "さんご", "さんろく", "さんしち", "さんぱ", "さんく"],
  // 4の段（しざん に注意）
  ["しいちが", "しにが", "しざん", "しし", "しご", "しろく", "ししち", "しはち", "しく"],
  // 5の段
  ["ごいちが", "ごに", "ごさん", "ごし", "ごご", "ごろく", "ごしち", "ごはち", "ごく"],
  // 6の段
  ["ろくいちが", "ろくに", "ろくさん", "ろくし", "ろくご", "ろくろく", "ろくしち", "ろくはち", "ろくく"],
  // 7の段
  ["しちいちが", "しちに", "しちさん", "しちし", "しちご", "しちろく", "しちしち", "しちはち", "しちく"],
  // 8の段
  ["はちいちが", "はちに", "はちさん", "はちし", "はちご", "はちろく", "はちしち", "はちはち", "はちく"],
  // 9の段
  ["くいちが", "くに", "くさん", "くし", "くご", "くろく", "くしち", "くはち", "くく"],
]

const KUKU_KOTAE: string[][] = [
  // 1の段
  ["いち", "に", "さん", "し", "ご", "ろく", "しち", "はち", "く"],
  // 2の段
  ["に", "し", "ろく", "はち", "じゅう", "じゅうに", "じゅうし", "じゅうろく", "じゅうはち"],
  // 3の段
  ["さん", "ろく", "く", "じゅうに", "じゅうご", "じゅうはち", "にじゅういち", "にじゅうし", "にじゅうしち"],
  // 4の段
  ["し", "はち", "じゅうに", "じゅうろく", "にじゅう", "にじゅうし", "にじゅうはち", "さんじゅうに", "さんじゅうろく"],
  // 5の段
  ["ご", "じゅう", "じゅうご", "にじゅう", "にじゅうご", "さんじゅう", "さんじゅうご", "しじゅう", "しじゅうご"],
  // 6の段
  ["ろく", "じゅうに", "じゅうはち", "にじゅうし", "さんじゅう", "さんじゅうろく", "しじゅうに", "しじゅうはち", "ごじゅうし"],
  // 7の段
  ["しち", "じゅうし", "にじゅういち", "にじゅうはち", "さんじゅうご", "しじゅうに", "しじゅうく", "ごじゅうろく", "ろくじゅうさん"],
  // 8の段
  ["はち", "じゅうろく", "にじゅうし", "さんじゅうに", "しじゅう", "しじゅうはち", "ごじゅうろく", "ろくじゅうし", "しちじゅうに"],
  // 9の段
  ["く", "じゅうはち", "にじゅうしち", "さんじゅうろく", "しじゅうご", "ごじゅうし", "ろくじゅうさん", "しちじゅうに", "はちじゅういち"],
]

// ── 型定義 ──────────────────────────────────────────────
type Mode  = "up" | "down" | "random"
type Phase = "ready" | "practice" | "done"

// ── モード定義（表示名付き） ─────────────────────────────
const MODES: { value: Mode; label: string }[] = [
  { value: "up",     label: "上がり九九" },
  { value: "down",   label: "下がり九九" },
  { value: "random", label: "バラバラ" },
]

// ── Fisher-Yates シャッフル ─────────────────────────────
function shuffled(arr: number[]): number[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── モードに応じた問題順序を生成（0〜8: かける数インデックス） ──
function generateOrder(mode: Mode): number[] {
  const base = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  if (mode === "down")   return [...base].reverse()
  if (mode === "random") return shuffled(base)
  return base
}

// ── ページ本体 ────────────────────────────────────────────
export default function KukuYomiPage() {

  // ── コインシステム ──────────────────────────────────────
  const { coins, addCoins } = useCoins()

  // ── 段・モード ──────────────────────────────────────────
  const [dan,  setDan]  = useState(2)           // 初期: 2の段
  const [mode, setMode] = useState<Mode>("up")  // 初期: 上がり九九

  // ── 練習の進行状態 ──────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("ready")
  const [step,  setStep]  = useState(0)      // 0〜17（偶数=問題, 奇数=答え）
  const [order, setOrder] = useState<number[]>([])  // かける数インデックスの順序

  // ── アレイ図の表示/非表示 ────────────────────────────────
  const [showArray, setShowArray] = useState(true)

  // ── コイン付与フラグ（段・モードが変わったらリセット） ───────
  const hasCompletedRef = useRef(false)

  // ── 段変更（練習中は無効） ────────────────────────────
  const handleDanChange = (n: number) => {
    if (phase === "practice") return
    se.playSe(se.set)
    setDan(n)
    hasCompletedRef.current = false
    setPhase("ready")
  }

  // ── モード変更（練習中は無効） ─────────────────────────
  const handleModeChange = (m: Mode) => {
    if (phase === "practice") return
    se.playSe(se.set)
    setMode(m)
    hasCompletedRef.current = false
    setPhase("ready")
  }

  // ── スタート ────────────────────────────────────────────
  const handleStart = () => {
    se.playSe(se.pi)
    setOrder(generateOrder(mode))
    setStep(0)
    setPhase("practice")
  }

  // ── つぎ ────────────────────────────────────────────────
  const handleNext = () => {
    se.playSe(se.pi)
    const nextStep = step + 1

    if (nextStep >= 18) {
      // 9問すべて完走
      se.playSe(se.seikai1)
      if (!hasCompletedRef.current) {
        addCoins(1)
        hasCompletedRef.current = true
      }
      setPhase("done")
    } else {
      setStep(nextStep)
    }
  }

  // ── もういちど（ready に戻る） ────────────────────────
  const handleReset = () => {
    se.playSe(se.set)
    setPhase("ready")
  }

  // ── 現在の問題情報（practice フェーズ用） ─────────────
  const qIdx     = phase === "practice" ? (order[Math.floor(step / 2)] ?? 0) : 0
  const mult     = qIdx + 1                      // かける数（1〜9）
  const isAnswer = step % 2 === 1                // 答えフェーズかどうか
  const mondai   = KUKU_MONDAI[dan - 1][qIdx]   // 問題の読み方（例: "さんし"）
  const kotae    = KUKU_KOTAE[dan - 1][qIdx]    // 答えの読み方（例: "じゅうに"）
  const product  = dan * mult                    // 積
  const progress = Math.floor(step / 2) + 1     // 現在の問題番号（1〜9）

  // ── ボタンクラスのヘルパー ─────────────────────────────
  const activeBtnCls   = "bg-brand-500 text-white"
  const inactiveBtnCls = "bg-white border border-brand-300 text-brand-600 hover:bg-brand-100"

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800">
        九九の読み上げ練習
      </h1>

      {/* ── 段選択（練習中は押せない） ──────────────────── */}
      <div className="space-y-1">
        <p className="text-sm text-gray-500">だんをえらぶ</p>
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => handleDanChange(n)}
              disabled={phase === "practice"}
              className={`w-10 h-10 rounded text-sm font-bold transition-all active:scale-95
                ${dan === n ? activeBtnCls : inactiveBtnCls}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ── モード選択（練習中は押せない） ──────────────── */}
      <div className="space-y-1">
        <p className="text-sm text-gray-500">れんしゅうのしかた</p>
        <div className="flex flex-wrap gap-2">
          {MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleModeChange(value)}
              disabled={phase === "practice"}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95
                ${mode === value ? activeBtnCls : inactiveBtnCls}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ready フェーズ ─────────────────────────────── */}
      {phase === "ready" && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleStart}
            className="px-10 py-3 bg-accent-500 text-white font-bold text-xl
                       rounded-xl hover:bg-accent-600 active:scale-95 transition-all shadow-md"
          >
            スタート
          </button>
        </div>
      )}

      {/* ── practice フェーズ ───────────────────────────── */}
      {phase === "practice" && (
        <div className="space-y-4">

          {/* 進捗表示 */}
          <p className="text-sm text-gray-400 text-right">
            {progress} / 9もん
          </p>

          {/* 読み方テキスト（大きく表示。声に出して読む） */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl
                          px-4 py-4 text-center text-3xl font-bold text-gray-800
                          tracking-widest min-h-[5rem] flex items-center justify-center gap-3">
            <span>{mondai}</span>
            {isAnswer
              ? <span className="text-accent-600">{kotae}</span>
              : <span className="text-gray-300">？？</span>
            }
          </div>

          {/* 計算式 */}
          <div className="text-center text-5xl font-bold text-gray-800 tracking-wide">
            {dan}
            <span className="mx-2 text-gray-400">×</span>
            {mult}
            <span className="mx-2 text-gray-400">=</span>
            <span className={isAnswer ? "text-accent-600" : "text-gray-200"}>
              {isAnswer ? product : "？"}
            </span>
          </div>

          {/* つぎボタン */}
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              className="px-10 py-3 bg-brand-500 text-white font-bold text-xl
                         rounded-xl hover:bg-brand-600 active:scale-95 transition-all shadow-md"
            >
              つぎ
            </button>
          </div>

          {/* アレイ図トグルボタン */}
          <div className="flex justify-center">
            <button
              onClick={() => { se.playSe(se.pi); setShowArray(prev => !prev) }}
              className={`px-5 py-2 text-sm font-bold rounded-lg border-2 transition-all ${
                showArray
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "bg-white border-brand-300 text-brand-600 hover:bg-brand-100"
              }`}
            >
              {showArray ? "アレイ図をかくす" : "アレイ図をみせる"}
            </button>
          </div>

          {/* アレイ図（kuku-array/page.tsx の ArrayDots を再利用） */}
          {showArray && (
            <div className="overflow-x-auto">
              <div className="w-fit mx-auto">
                {/* dan 行 × mult 列 のドットを点灯 */}
                <ArrayDots rows={dan} cols={mult} />
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── done フェーズ ───────────────────────────────── */}
      {phase === "done" && (
        <div className="text-center space-y-4 py-6">
          <p className="text-4xl font-bold text-accent-600">
            おつかれさまでした！
          </p>
          <p className="text-lg text-gray-600">
            {dan}のだん　{MODES.find(m => m.value === mode)?.label}　おわり！
          </p>
          <button
            onClick={handleReset}
            className="px-10 py-3 bg-accent-500 text-white font-bold text-xl
                       rounded-xl hover:bg-accent-600 active:scale-95 transition-all shadow-md"
          >
            もういちど
          </button>
        </div>
      )}

      {/* コイン表示 */}
      <CoinDisplay coins={coins} />

    </div>
  )
}

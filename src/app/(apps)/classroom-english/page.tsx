"use client"

// ======================================================
// Classroom English
//
// 教室で使える英語表現 37フレーズを音声付きで学習する。
//
// 【学習モード】
//   4カテゴリのタブを切り替えて表現ボタンをタッチ → 音声再生
//
// 【クイズモード（3パターン）】
//   🔊→英+日: 音声を聞いて、英語+日本語カードから選ぶ
//   🔊→英語:  音声を聞いて、英語のみから選ぶ（上級）
//   日→英語:  日本語を見て、英語から選ぶ
// ======================================================

import { useState, useCallback, useRef, useMemo } from "react"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { useCategoryAudio } from "@/hooks/useCategoryAudio"
import { useSound } from "@/hooks/useSound"
import { useProblemCoins } from "@/hooks/useProblemCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { CLASSROOM_ENGLISH, ALL_CREN_PHRASES, type CrenPhrase } from "@/data/classroomEnglish"

// ── ユーティリティ ────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeChoices(correct: CrenPhrase, pool: CrenPhrase[]): CrenPhrase[] {
  const others = shuffled(pool.filter(p => p.audioIndex !== correct.audioIndex)).slice(0, 3)
  return shuffled([correct, ...others])
}

// ── クイズパターン定義 ────────────────────────────────

type QuizPattern = "audio-both" | "audio-en" | "ja-en"

type QuizPatternDef = { id: QuizPattern; label: string; desc: string }

const QUIZ_PATTERNS: QuizPatternDef[] = [
  { id: "audio-both", label: "🔊 → 英+日",  desc: "音声を聞いて 英語+日本語 カードから選ぶ" },
  { id: "audio-en",   label: "🔊 → 英語",   desc: "音声を聞いて 英語のみ から選ぶ（上級）" },
  { id: "ja-en",      label: "日本語 → 英語", desc: "日本語を見て 英語 から選ぶ" },
]

// ── ページコンポーネント ──────────────────────────────

type Mode = "learn" | "quiz"

export default function ClassroomEnglishPage() {
  useAudioUnlock()
  const { play: playSe } = useSound()
  const { coins, tryAddCoins, resetProblem } = useProblemCoins()

  // ── 学習モード状態 ────────────────────────────────
  const [activeCategory, setActiveCategory] = useState(0)

  // ── クイズ状態 ────────────────────────────────────
  const [mode, setMode]           = useState<Mode>("learn")
  const [quizPattern, setQuizPattern] = useState<QuizPattern>("audio-both")
  const [quizOrder, setQuizOrder] = useState<CrenPhrase[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [choices, setChoices]     = useState<CrenPhrase[]>([])
  const [selected, setSelected]   = useState<number | null>(null) // audioIndex
  const [audioPlayed, setAudioPlayed] = useState(false)

  // ── 音声ロード（37ファイル一括） ──────────────────
  const audioFiles = useMemo(
    () => ALL_CREN_PHRASES.map(p => `/sounds/english/classroom/vo_${p.audioIndex}.mp3`),
    []
  )
  const { isLoading, play: playAudio } = useCategoryAudio(audioFiles)

  // 正解演出
  const seikaiRef = useRef<HTMLDivElement>(null)
  function showSeikai() {
    const el = seikaiRef.current
    if (!el) return
    el.style.display = "block"
    setTimeout(() => { el.style.display = "none" }, 1000)
  }

  // ── クイズ開始（パターンを指定） ─────────────────
  const startQuiz = useCallback((pattern: QuizPattern) => {
    playSe("/sounds/reset.mp3", 0.5)
    const order = shuffled(ALL_CREN_PHRASES)
    setQuizOrder(order)
    setQuizIndex(0)
    setChoices(makeChoices(order[0], ALL_CREN_PHRASES))
    setSelected(null)
    setAudioPlayed(pattern === "ja-en") // 日→英語は音声不要なので最初からtrue
    resetProblem()
    setQuizPattern(pattern)
    setMode("quiz")
  }, [playSe, resetProblem])

  // ── 次の問題へ ────────────────────────────────────
  const nextQuestion = useCallback((nextIdx: number, order: CrenPhrase[]) => {
    resetProblem()
    setQuizIndex(nextIdx)
    setChoices(makeChoices(order[nextIdx], ALL_CREN_PHRASES))
    setSelected(null)
    setAudioPlayed(quizPattern === "ja-en")
  }, [quizPattern, resetProblem])

  // ── クイズの音声再生ボタン ────────────────────────
  const handlePlayQuizAudio = useCallback(() => {
    const phrase = quizOrder[quizIndex]
    if (!phrase) return
    const idx = ALL_CREN_PHRASES.findIndex(p => p.audioIndex === phrase.audioIndex)
    if (idx !== -1) {
      playAudio(idx)
      setAudioPlayed(true)
    }
  }, [quizOrder, quizIndex, playAudio])

  // ── 選択肢を選んだとき ────────────────────────────
  const handleSelect = useCallback((choice: CrenPhrase) => {
    if (selected !== null) return
    const correct = quizOrder[quizIndex]
    setSelected(choice.audioIndex)

    if (choice.audioIndex === correct.audioIndex) {
      playSe("/sounds/seikai.mp3", 0.8)
      showSeikai()
      tryAddCoins(1)
      // 正解した表現の音声を再生して確認させる
      const idx = ALL_CREN_PHRASES.findIndex(p => p.audioIndex === correct.audioIndex)
      if (idx !== -1) playAudio(idx)
      setTimeout(() => {
        nextQuestion((quizIndex + 1) % quizOrder.length, quizOrder)
      }, 1500)
    } else {
      playSe("/sounds/cancel.mp3", 0.5)
    }
  }, [selected, quizOrder, quizIndex, playSe, playAudio, tryAddCoins, nextQuestion])

  // ── 学習モード：音声再生 ──────────────────────────
  const handleLearnPlay = useCallback((phrase: CrenPhrase) => {
    const idx = ALL_CREN_PHRASES.findIndex(p => p.audioIndex === phrase.audioIndex)
    if (idx !== -1) playAudio(idx)
  }, [playAudio])

  // ── 選択肢ボタンのスタイル計算 ───────────────────
  function choiceBtnClass(choice: CrenPhrase, correct: CrenPhrase): string {
    const isSelected = selected === choice.audioIndex
    const isCorrect  = choice.audioIndex === correct.audioIndex
    const base = "w-full text-left px-4 py-3 rounded-xl border-2 font-bold transition-all"
    if (selected === null) {
      const blocked = quizPattern !== "ja-en" && !audioPlayed
      return `${base} bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 active:scale-98 ${blocked ? "opacity-40 pointer-events-none" : ""}`
    }
    if (isSelected && isCorrect)  return `${base} bg-green-100 border-green-500`
    if (isSelected && !isCorrect) return `${base} bg-red-100 border-red-500`
    if (!isSelected && isCorrect) return `${base} bg-green-50 border-green-400`
    return `${base} bg-gray-50 border-gray-200 opacity-50`
  }

  const currentPhrase = quizOrder[quizIndex]

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-1">Classroom English</h1>
      <p className="text-center text-sm text-gray-500 mb-4">
        教室で使える英語表現を学ぼう
      </p>

      {/* 正解演出 */}
      <div
        ref={seikaiRef}
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        style={{ display: "none" }}
      >
        <span className="text-6xl font-black text-green-500 drop-shadow-lg animate-bounce">
          せいかい！🎉
        </span>
      </div>

      {/* 学習ボタン */}
      <div className="flex justify-center mb-3">
        <button
          onClick={() => { playSe("/sounds/pi.mp3", 0.4); setMode("learn") }}
          className={`px-5 py-2 rounded-lg font-bold border-2 text-sm transition-colors
            ${mode === "learn"
              ? "bg-brand-500 text-white border-brand-500"
              : "bg-white text-brand-600 border-brand-300 hover:bg-brand-50"}`}
        >
          学習モード
        </button>
      </div>

      {/* クイズパターン選択（3ボタン） */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {QUIZ_PATTERNS.map(p => (
          <button
            key={p.id}
            onClick={() => startQuiz(p.id)}
            disabled={isLoading}
            title={p.desc}
            className={`px-2 py-2 rounded-lg border-2 text-xs font-bold transition-colors disabled:opacity-40
              ${mode === "quiz" && quizPattern === p.id
                ? "bg-accent-500 text-white border-accent-500"
                : "bg-white text-accent-700 border-accent-200 hover:bg-accent-50"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-center text-sm text-gray-400 my-4">音声を読み込み中...</p>
      )}

      {/* ─── 学習モード ───────────────────────────── */}
      {mode === "learn" && (
        <div>
          {/* カテゴリタブ */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CLASSROOM_ENGLISH.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors
                  ${activeCategory === i
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white text-brand-700 border-brand-200 hover:bg-brand-50"}`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* フレーズボタン一覧 */}
          <div className="flex flex-col gap-2">
            {CLASSROOM_ENGLISH[activeCategory].phrases.map((phrase) => (
              <button
                key={phrase.audioIndex}
                onClick={() => handleLearnPlay(phrase)}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 bg-white border-2 border-blue-200 rounded-xl
                  hover:bg-blue-50 active:bg-blue-100 transition-colors disabled:opacity-40
                  flex items-start gap-3"
              >
                <span className="text-blue-500 mt-0.5 flex-shrink-0">🔊</span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-bold text-gray-800 text-sm md:text-base">{phrase.en}</span>
                  <span className="text-xs text-gray-500">{phrase.ja}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── クイズモード ─────────────────────────── */}
      {mode === "quiz" && currentPhrase && (
        <div className="flex flex-col items-center gap-5">

          <p className="text-sm text-gray-500 text-center">
            問題 {quizIndex + 1} / {quizOrder.length}
            <br />
            <span className="text-xs text-gray-400">
              {QUIZ_PATTERNS.find(p => p.id === quizPattern)?.desc}
            </span>
          </p>

          {/* 問題エリア */}
          <div className="flex flex-col items-center gap-3 p-6 bg-blue-50 border-2 border-blue-200
            rounded-2xl w-full max-w-md min-h-[130px] justify-center">

            {quizPattern !== "ja-en" ? (
              /* 音声パターン */
              <>
                <button
                  onClick={handlePlayQuizAudio}
                  disabled={isLoading}
                  className="w-20 h-20 bg-blue-500 hover:bg-blue-600 active:bg-blue-700
                    text-white text-4xl rounded-full shadow-lg transition-all active:scale-95
                    disabled:opacity-40"
                >
                  🔊
                </button>
                {!audioPlayed && (
                  <p className="text-xs text-blue-600 font-bold animate-pulse">
                    ↑ まず音声を聞いてね
                  </p>
                )}
              </>
            ) : (
              /* 日→英語パターン: 日本語テキスト表示 */
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-2">この表現の英語は？</p>
                <p className="text-lg font-bold text-gray-800">{currentPhrase.ja}</p>
              </div>
            )}
          </div>

          {/* 選択肢（1列） */}
          <div className="flex flex-col gap-2 w-full max-w-md">
            {choices.map((choice) => (
              <button
                key={choice.audioIndex}
                onClick={() => handleSelect(choice)}
                disabled={selected !== null || (quizPattern !== "ja-en" && !audioPlayed)}
                className={choiceBtnClass(choice, currentPhrase)}
              >
                {/* 英語表現（常に表示） */}
                <span className="block font-bold text-sm md:text-base">{choice.en}</span>

                {/* 日本語訳（audio-both パターンのみ、または回答後に全パターンで表示） */}
                {(quizPattern === "audio-both" || selected !== null) && (
                  <span className="block text-xs font-normal text-gray-500 mt-0.5">
                    {choice.ja}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 不正解後の「つぎへ」 */}
          {selected !== null && selected !== currentPhrase.audioIndex && (
            <button
              onClick={() => nextQuestion((quizIndex + 1) % quizOrder.length, quizOrder)}
              className="px-6 py-2 bg-gray-500 text-white rounded-full font-bold text-sm
                hover:bg-gray-600 transition-colors"
            >
              つぎへ →
            </button>
          )}
        </div>
      )}
      {/* コイン表示（クイズモードのみ・最下部） */}
      {mode === "quiz" && <div className="mt-6"><CoinDisplay coins={coins} /></div>}
    </main>
  )
}

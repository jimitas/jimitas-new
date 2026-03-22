"use client"

// ======================================================
// Classroom English
//
// 旧版 01cren.js の移植。
// 教室で使える英語表現 37フレーズを音声つきで学習する。
//
// 【学習モード】
//   4カテゴリのタブを切り替えて、表現ボタンをタッチ→音声再生
//
// 【クイズモード】
//   音声を再生 → 4択の英語表現から正解を選ぶ
//   正解でコイン獲得（useProblemCoins）
// ======================================================

import { useState, useCallback, useRef, useMemo } from "react"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { useCategoryAudio } from "@/hooks/useCategoryAudio"
import { useSound } from "@/hooks/useSound"
import { useProblemCoins } from "@/hooks/useProblemCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { CLASSROOM_ENGLISH, ALL_CREN_PHRASES, type CrenPhrase } from "@/data/classroomEnglish"

// ── Fisher-Yates シャッフル ───────────────────────────
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 正解を含む4択選択肢を生成
function makeChoices(correct: CrenPhrase, all: CrenPhrase[]): CrenPhrase[] {
  const others = shuffled(all.filter(p => p.audioIndex !== correct.audioIndex)).slice(0, 3)
  return shuffled([correct, ...others])
}

type Mode = "learn" | "quiz"

// ── ページコンポーネント ──────────────────────────────
export default function ClassroomEnglishPage() {
  useAudioUnlock()
  const { play: playSe } = useSound()
  const { coins, tryAddCoins, resetProblem } = useProblemCoins()

  // 37個の音声ファイルパスをまとめてロード（小さいので全件一括）
  // audioIndex は 1〜37。配列インデックスと合わせるため index-1 で格納
  const audioFiles = useMemo(
    () => ALL_CREN_PHRASES.map(p => `/sounds/english/classroom/vo_${p.audioIndex}.mp3`),
    []
  )
  const { isLoading, play: playAudio } = useCategoryAudio(audioFiles)

  // ── 学習モード状態 ──────────────────────────────────
  const [activeCategory, setActiveCategory] = useState(0)

  // ── クイズモード状態 ────────────────────────────────
  const [mode, setMode] = useState<Mode>("learn")
  const [quizOrder, setQuizOrder]     = useState<CrenPhrase[]>([])
  const [quizIndex, setQuizIndex]     = useState(0)
  const [choices, setChoices]         = useState<CrenPhrase[]>([])
  const [selected, setSelected]       = useState<number | null>(null) // 選択した audioIndex
  const [audioPlayed, setAudioPlayed] = useState(false) // 音声を1度再生したか

  // 正解演出
  const seikaiRef = useRef<HTMLDivElement>(null)
  function showSeikai() {
    const el = seikaiRef.current
    if (!el) return
    el.style.display = "block"
    setTimeout(() => { el.style.display = "none" }, 1000)
  }

  // ── クイズ開始 ────────────────────────────────────
  const startQuiz = useCallback(() => {
    playSe("/sounds/reset.mp3", 0.5)
    const order = shuffled(ALL_CREN_PHRASES)
    setQuizOrder(order)
    setQuizIndex(0)
    setChoices(makeChoices(order[0], ALL_CREN_PHRASES))
    setSelected(null)
    setAudioPlayed(false)
    resetProblem()
    setMode("quiz")
  }, [playSe, resetProblem])

  // ── クイズ：次の問題へ ────────────────────────────
  const nextQuestion = useCallback((nextIdx: number, order: CrenPhrase[]) => {
    resetProblem()
    setQuizIndex(nextIdx)
    setChoices(makeChoices(order[nextIdx], ALL_CREN_PHRASES))
    setSelected(null)
    setAudioPlayed(false)
  }, [resetProblem])

  // ── クイズ：音声再生ボタン ────────────────────────
  const handlePlayQuizAudio = useCallback(() => {
    const phrase = quizOrder[quizIndex]
    if (!phrase) return
    const idx = ALL_CREN_PHRASES.findIndex(p => p.audioIndex === phrase.audioIndex)
    if (idx !== -1) {
      playAudio(idx)
      setAudioPlayed(true)
    }
  }, [quizOrder, quizIndex, playAudio])

  // ── クイズ：選択肢を選んだとき ───────────────────
  const handleSelect = useCallback((choice: CrenPhrase) => {
    if (selected !== null) return // 既に回答済み
    const correct = quizOrder[quizIndex]
    setSelected(choice.audioIndex)

    if (choice.audioIndex === correct.audioIndex) {
      // 正解
      playSe("/sounds/seikai.mp3", 0.8)
      showSeikai()
      tryAddCoins(1)
      // 少し待ってから次の問題へ
      setTimeout(() => {
        const nextIdx = (quizIndex + 1) % quizOrder.length
        nextQuestion(nextIdx, quizOrder)
      }, 1200)
    } else {
      // 不正解
      playSe("/sounds/cancel.mp3", 0.5)
    }
  }, [selected, quizOrder, quizIndex, playSe, tryAddCoins, nextQuestion])

  // ── 学習モード：音声再生 ──────────────────────────
  const handleLearnPlay = useCallback((phrase: CrenPhrase) => {
    const idx = ALL_CREN_PHRASES.findIndex(p => p.audioIndex === phrase.audioIndex)
    if (idx !== -1) playAudio(idx)
  }, [playAudio])

  // ── JSX ──────────────────────────────────────────

  const currentQuizPhrase = quizOrder[quizIndex]

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-1">Classroom English</h1>
      <p className="text-center text-sm text-gray-500 mb-4">
        教室で使える英語表現を学ぼう
      </p>

      {/* コイン表示（クイズモードのみ） */}
      {mode === "quiz" && <CoinDisplay coins={coins} />}

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

      {/* ローディング表示 */}
      {isLoading && (
        <p className="text-center text-sm text-gray-400 my-4">
          音声ファイルを読み込み中...
        </p>
      )}

      {/* モード切り替えボタン */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => { playSe("/sounds/pi.mp3", 0.4); setMode("learn") }}
          className={`px-5 py-2 rounded-full font-bold border-2 text-sm transition-colors
            ${mode === "learn"
              ? "bg-brand-500 text-white border-brand-500"
              : "bg-white text-brand-600 border-brand-300 hover:bg-brand-50"}`}
        >
          学習モード
        </button>
        <button
          onClick={startQuiz}
          disabled={isLoading}
          className={`px-5 py-2 rounded-full font-bold border-2 text-sm transition-colors
            ${mode === "quiz"
              ? "bg-accent-500 text-white border-accent-500"
              : "bg-white text-accent-600 border-accent-300 hover:bg-accent-50"}
            disabled:opacity-40`}
        >
          クイズモード
        </button>
      </div>

      {/* ─── 学習モード ─────────────────────────────── */}
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
                {/* スピーカーアイコン */}
                <span className="text-blue-500 mt-0.5 flex-shrink-0">🔊</span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-bold text-gray-800 text-sm md:text-base">
                    {phrase.en}
                  </span>
                  <span className="text-xs text-gray-500">{phrase.ja}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── クイズモード ────────────────────────────── */}
      {mode === "quiz" && currentQuizPhrase && (
        <div className="flex flex-col items-center gap-6">

          {/* 問題番号 */}
          <p className="text-sm text-gray-500">
            問題 {quizIndex + 1} / {quizOrder.length}
          </p>

          {/* 音声再生エリア */}
          <div className="flex flex-col items-center gap-3 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl w-full max-w-sm">
            <p className="text-sm text-gray-500">英語の音声を聞いて、正しい表現を選ぼう</p>
            <button
              onClick={handlePlayQuizAudio}
              disabled={isLoading}
              className="w-20 h-20 bg-blue-500 hover:bg-blue-600 active:bg-blue-700
                text-white text-4xl rounded-full shadow-lg transition-all
                active:scale-95 disabled:opacity-40"
            >
              🔊
            </button>
            {!audioPlayed && (
              <p className="text-xs text-blue-600 font-bold animate-pulse">
                ↑ まず音声を聞いてね
              </p>
            )}
          </div>

          {/* 4択選択肢 */}
          <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
            {choices.map((choice) => {
              const isSelected = selected === choice.audioIndex
              const isCorrect  = choice.audioIndex === currentQuizPhrase.audioIndex
              let btnClass = "w-full px-4 py-3 rounded-xl border-2 font-bold text-left transition-all text-sm"
              if (selected === null) {
                btnClass += " bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 active:scale-98"
              } else if (isSelected && isCorrect) {
                btnClass += " bg-green-100 border-green-500 text-green-800"
              } else if (isSelected && !isCorrect) {
                btnClass += " bg-red-100 border-red-500 text-red-800"
              } else if (!isSelected && isCorrect && selected !== null) {
                btnClass += " bg-green-50 border-green-400 text-green-700"
              } else {
                btnClass += " bg-gray-50 border-gray-200 text-gray-400"
              }
              return (
                <button
                  key={choice.audioIndex}
                  onClick={() => handleSelect(choice)}
                  disabled={selected !== null || !audioPlayed}
                  className={btnClass}
                >
                  <span className="block">{choice.en}</span>
                  {(selected !== null) && (
                    <span className="block text-xs font-normal mt-0.5 text-gray-500">
                      {choice.ja}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 音声未再生の注意 */}
          {!audioPlayed && selected === null && (
            <p className="text-xs text-gray-400">※ 音声を聞いてから選択できます</p>
          )}

          {/* 不正解後の「次へ」ボタン */}
          {selected !== null && selected !== currentQuizPhrase.audioIndex && (
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
    </main>
  )
}

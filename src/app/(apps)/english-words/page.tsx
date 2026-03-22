"use client"

// ======================================================
// English Words
//
// 旧版 02enwo.js の移植。
// 15カテゴリ・227語の英単語を画像と音声で学習する。
//
// 【学習モード】
//   セレクトボックスでカテゴリを選択し、単語カードを表示。
//   カードをタッチ→音声再生。画像つきカテゴリは画像も表示。
//
// 【クイズモード】
//   カテゴリを選択 → 画像（または単語）を見て4択の英語から正解を選ぶ。
//   正解でコイン獲得。
//
// 【音声読み込み】
//   カテゴリ切り替え時にそのカテゴリの音声のみを遅延ロード（useCategoryAudio）。
// ======================================================

import { useState, useCallback, useRef, useMemo } from "react"
import Image from "next/image"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { useCategoryAudio } from "@/hooks/useCategoryAudio"
import { useSound } from "@/hooks/useSound"
import { useProblemCoins } from "@/hooks/useProblemCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { ENGLISH_WORDS, type WordEntry, type WordCategory } from "@/data/englishWords"

// ── ユーティリティ ───────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 正解を含む4択選択肢を生成（同カテゴリ内から）
function makeChoices(correct: WordEntry, pool: WordEntry[]): WordEntry[] {
  const others = shuffled(pool.filter(w => w.audioFile !== correct.audioFile)).slice(0, 3)
  return shuffled([correct, ...others])
}

type Mode = "learn" | "quiz"

// ── ページコンポーネント ──────────────────────────────
export default function EnglishWordsPage() {
  useAudioUnlock()
  const { play: playSe } = useSound()
  const { coins, tryAddCoins, resetProblem } = useProblemCoins()

  // ── カテゴリ選択 ──────────────────────────────────
  const [categoryIdx, setCategoryIdx]   = useState(0)
  const [mode, setMode]                 = useState<Mode>("learn")

  const category: WordCategory = ENGLISH_WORDS[categoryIdx]

  // ── 音声遅延ロード（カテゴリ単位） ───────────────
  const audioFiles = useMemo(
    () => category.words.map(w => `/sounds/english/words/${w.audioFile}.mp3`),
    [category.id] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const { isLoading, play: playAudio } = useCategoryAudio(audioFiles)

  // ── クイズ状態 ────────────────────────────────────
  const [quizOrder, setQuizOrder]   = useState<WordEntry[]>([])
  const [quizIndex, setQuizIndex]   = useState(0)
  const [choices, setChoices]       = useState<WordEntry[]>([])
  const [selected, setSelected]     = useState<string | null>(null) // 選択した audioFile

  // 正解演出
  const seikaiRef = useRef<HTMLDivElement>(null)
  function showSeikai() {
    const el = seikaiRef.current
    if (!el) return
    el.style.display = "block"
    setTimeout(() => { el.style.display = "none" }, 1000)
  }

  // ── カテゴリ変更 ──────────────────────────────────
  const handleCategoryChange = useCallback((idx: number) => {
    setCategoryIdx(idx)
    setMode("learn")
    setSelected(null)
  }, [])

  // ── クイズ開始 ────────────────────────────────────
  const startQuiz = useCallback(() => {
    if (category.words.length < 4) return // 4択には最低4語必要
    playSe("/sounds/reset.mp3", 0.5)
    const order = shuffled(category.words)
    setQuizOrder(order)
    setQuizIndex(0)
    setChoices(makeChoices(order[0], category.words))
    setSelected(null)
    resetProblem()
    setMode("quiz")
  }, [category, playSe, resetProblem])

  // ── クイズ：次の問題 ─────────────────────────────
  const nextQuestion = useCallback((nextIdx: number, order: WordEntry[]) => {
    resetProblem()
    setQuizIndex(nextIdx)
    setChoices(makeChoices(order[nextIdx], category.words))
    setSelected(null)
  }, [category.words, resetProblem])

  // ── クイズ：選択肢を選んだとき ──────────────────
  const handleSelect = useCallback((choice: WordEntry) => {
    if (selected !== null) return
    const correct = quizOrder[quizIndex]
    setSelected(choice.audioFile)

    // 音声再生（選択肢の発音を聞かせる）
    const choiceIdx = category.words.findIndex(w => w.audioFile === choice.audioFile)
    if (choiceIdx !== -1) playAudio(choiceIdx)

    if (choice.audioFile === correct.audioFile) {
      playSe("/sounds/seikai.mp3", 0.8)
      showSeikai()
      tryAddCoins(1)
      setTimeout(() => {
        const nextIdx = (quizIndex + 1) % quizOrder.length
        nextQuestion(nextIdx, quizOrder)
      }, 1200)
    } else {
      playSe("/sounds/cancel.mp3", 0.5)
    }
  }, [selected, quizOrder, quizIndex, category.words, playAudio, playSe, tryAddCoins, nextQuestion])

  // ── 学習モード：カードタッチ ────────────────────
  const handleLearnPlay = useCallback((word: WordEntry) => {
    const idx = category.words.findIndex(w => w.audioFile === word.audioFile)
    if (idx !== -1) playAudio(idx)
  }, [category.words, playAudio])

  // ── JSX ──────────────────────────────────────────

  const currentQuizWord = quizOrder[quizIndex]

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-1">English Words</h1>
      <p className="text-center text-sm text-gray-500 mb-4">
        英語の単語を聞いて・見て覚えよう
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

      {/* カテゴリ選択 + モード切り替え */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        {/* カテゴリセレクト */}
        <select
          value={categoryIdx}
          onChange={e => handleCategoryChange(Number(e.target.value))}
          className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-bold
            bg-white focus:border-brand-400 focus:outline-none"
        >
          {ENGLISH_WORDS.map((cat, i) => (
            <option key={cat.id} value={i}>{cat.title}</option>
          ))}
        </select>

        {/* モード切り替え */}
        <div className="flex gap-2">
          <button
            onClick={() => { playSe("/sounds/pi.mp3", 0.4); setMode("learn"); setSelected(null) }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-full font-bold border-2 text-sm transition-colors
              ${mode === "learn"
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white text-brand-600 border-brand-300 hover:bg-brand-50"}`}
          >
            学習
          </button>
          <button
            onClick={startQuiz}
            disabled={isLoading || category.words.length < 4}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-full font-bold border-2 text-sm transition-colors
              ${mode === "quiz"
                ? "bg-accent-500 text-white border-accent-500"
                : "bg-white text-accent-600 border-accent-300 hover:bg-accent-50"}
              disabled:opacity-40`}
          >
            クイズ
          </button>
        </div>
      </div>

      {/* ローディング */}
      {isLoading && (
        <p className="text-center text-sm text-gray-400 my-4">
          音声を読み込み中...
        </p>
      )}

      {/* ─── 学習モード ─────────────────────────────── */}
      {mode === "learn" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {category.words.map((word) => (
            <button
              key={word.audioFile}
              onClick={() => handleLearnPlay(word)}
              disabled={isLoading}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2
                border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50
                active:scale-95 transition-all disabled:opacity-40 min-h-[80px]"
              style={word.bgColor ? { backgroundColor: word.bgColor, borderColor: word.bgColor } : {}}
            >
              {/* 数字・アルファベット: 大きく文字表示 */}
              {!category.hasImage && (
                <span
                  className="text-2xl font-black"
                  style={{ color: word.textColor ?? "#1f2937" }}
                >
                  {word.word}
                </span>
              )}

              {/* 画像ありカテゴリ: 画像 + 単語テキスト */}
              {category.hasImage && word.imageFile && (
                <Image
                  src={`/images/english/words/${word.imageFile}.png`}
                  alt={word.word}
                  width={60}
                  height={60}
                  className="object-contain"
                  style={{ maxHeight: "60px" }}
                />
              )}
              {category.hasImage && !word.imageFile && (
                // Colors など画像なしカテゴリの hasImage=false 以外の例外
                <span className="text-lg font-bold" style={{ color: word.textColor }}>
                  {word.word}
                </span>
              )}

              {/* 単語テキスト（画像があるカテゴリは下に小さく） */}
              {category.hasImage && (
                <span
                  className="text-xs font-bold text-center leading-tight"
                  style={{ color: word.textColor ?? "#374151" }}
                >
                  {word.word}
                </span>
              )}

              {/* Colors: 色名テキストのみ（大きめ） */}
              {!category.hasImage && category.id === "colors" && (
                <span className="text-xs" style={{ color: word.textColor }}>tap!</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ─── クイズモード ────────────────────────────── */}
      {mode === "quiz" && currentQuizWord && (
        <div className="flex flex-col items-center gap-6">

          {/* 問題番号 */}
          <p className="text-sm text-gray-500">
            問題 {quizIndex + 1} / {quizOrder.length}
          </p>

          {/* 問題カード */}
          <div className="flex flex-col items-center gap-3 p-6 bg-amber-50 border-2 border-amber-200
            rounded-2xl w-full max-w-sm">
            <p className="text-xs text-gray-500">どれが正しい英語でしょう？</p>

            {/* 画像があるカテゴリは画像で出題、なければ音声ボタン */}
            {category.hasImage && currentQuizWord.imageFile ? (
              <Image
                src={`/images/english/words/${currentQuizWord.imageFile}.png`}
                alt="?"
                width={120}
                height={120}
                className="object-contain"
                style={{ maxHeight: "120px" }}
              />
            ) : (
              // 数字・アルファベット・色: 音声ボタンで出題
              <button
                onClick={() => {
                  const idx = category.words.findIndex(w => w.audioFile === currentQuizWord.audioFile)
                  if (idx !== -1) playAudio(idx)
                }}
                className="w-16 h-16 bg-amber-400 hover:bg-amber-500 text-white text-3xl
                  rounded-full shadow transition-all active:scale-95"
              >
                🔊
              </button>
            )}
          </div>

          {/* 4択ボタン */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {choices.map((choice) => {
              const isSelected = selected === choice.audioFile
              const isCorrect  = choice.audioFile === currentQuizWord.audioFile
              let btnClass = "px-3 py-3 rounded-xl border-2 font-bold text-sm transition-all"
              if (selected === null) {
                btnClass += " bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              } else if (isSelected && isCorrect) {
                btnClass += " bg-green-100 border-green-500 text-green-800"
              } else if (isSelected && !isCorrect) {
                btnClass += " bg-red-100 border-red-500 text-red-800"
              } else if (!isSelected && isCorrect) {
                btnClass += " bg-green-50 border-green-400 text-green-700"
              } else {
                btnClass += " bg-gray-50 border-gray-200 text-gray-400"
              }
              return (
                <button
                  key={choice.audioFile}
                  onClick={() => handleSelect(choice)}
                  disabled={selected !== null}
                  className={btnClass}
                >
                  {choice.word}
                </button>
              )
            })}
          </div>

          {/* 不正解後「次へ」ボタン */}
          {selected !== null && selected !== currentQuizWord.audioFile && (
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

      {/* 4語未満カテゴリへの注意 */}
      {mode === "quiz" && category.words.length < 4 && (
        <p className="text-center text-sm text-gray-400 mt-4">
          ※ このカテゴリは語数が少ないためクイズに対応していません
        </p>
      )}
    </main>
  )
}

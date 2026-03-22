"use client"

// ======================================================
// English Words
//
// 15カテゴリ・227語の英単語を画像と音声で学習する。
//
// 【学習モード】
//   カテゴリ選択 → 単語カードをタッチ → 音声再生
//
// 【クイズモード（3パターン）】
//   🔊→絵+単語: 音声を聞いて、絵+単語カードから選ぶ
//   🔊→単語:   音声を聞いて、単語のみから選ぶ（絵のヒントなし）
//   絵→単語:   絵を見て、単語から選ぶ
// ======================================================

import { useState, useCallback, useRef, useMemo } from "react"
import Image from "next/image"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { useCategoryAudio } from "@/hooks/useCategoryAudio"
import { useSound } from "@/hooks/useSound"
import { useProblemCoins } from "@/hooks/useProblemCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { ENGLISH_WORDS, type WordEntry, type WordCategory } from "@/data/englishWords"

// ── ユーティリティ ────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeChoices(correct: WordEntry, pool: WordEntry[]): WordEntry[] {
  const others = shuffled(pool.filter(w => w.audioFile !== correct.audioFile)).slice(0, 3)
  return shuffled([correct, ...others])
}

// ── クイズパターン定義 ────────────────────────────────

type QuizPattern = "audio-image" | "audio-word" | "image-word"

type QuizPatternDef = { id: QuizPattern; label: string; desc: string }

const QUIZ_PATTERNS: QuizPatternDef[] = [
  { id: "audio-image", label: "🔊 → 絵+単語", desc: "音声を聞いて 絵+単語 カードから選ぶ" },
  { id: "audio-word",  label: "🔊 → 単語",    desc: "音声を聞いて 単語のみ から選ぶ（絵のヒントなし）" },
  { id: "image-word",  label: "絵 → 単語",    desc: "絵を見て 単語 から選ぶ" },
]

// ── 単語のビジュアル表現（画像・色・大テキスト） ─────
// imageSize: カードサイズに応じて画像サイズを変える

function WordVisual({
  word,
  category,
  size = "md",
}: {
  word: WordEntry
  category: WordCategory
  size?: "sm" | "md" | "lg"
}) {
  const px = size === "sm" ? 52 : size === "md" ? 80 : 110
  const textCls = size === "sm" ? "text-xl" : size === "md" ? "text-3xl" : "text-5xl"

  if (category.hasImage && word.imageFile) {
    return (
      <Image
        src={`/images/english/words/${word.imageFile}.png`}
        alt={word.word}
        width={px}
        height={px}
        className="object-contain flex-shrink-0"
        style={{ maxHeight: px }}
      />
    )
  }
  if (word.bgColor) {
    // Colors カテゴリ: 色スウォッチ
    return (
      <div
        style={{
          backgroundColor: word.bgColor,
          width: px,
          height: px * 0.6,
          borderRadius: 8,
          border: "2px solid #d1d5db",
          flexShrink: 0,
        }}
      />
    )
  }
  // Numbers / Alphabet
  return (
    <span className={`${textCls} font-black leading-none`} style={{ color: "#1f2937" }}>
      {word.word}
    </span>
  )
}

// ── ページコンポーネント ──────────────────────────────

type Mode = "learn" | "quiz"

export default function EnglishWordsPage() {
  useAudioUnlock()
  const { play: playSe } = useSound()
  const { coins, tryAddCoins, resetProblem } = useProblemCoins()

  // ── カテゴリ・モード ──────────────────────────────
  const [categoryIdx, setCategoryIdx] = useState(0)
  const [mode, setMode]               = useState<Mode>("learn")
  const [quizPattern, setQuizPattern] = useState<QuizPattern>("audio-image")

  const category: WordCategory = ENGLISH_WORDS[categoryIdx]
  const canQuiz = category.words.length >= 4

  // ── 音声（カテゴリ単位で遅延ロード） ─────────────
  const audioFiles = useMemo(
    () => ENGLISH_WORDS[categoryIdx].words.map(w => `/sounds/english/words/${w.audioFile}.mp3`),
    [categoryIdx]
  )
  const { isLoading, play: playAudio } = useCategoryAudio(audioFiles)

  // ── クイズ状態 ────────────────────────────────────
  const [quizOrder, setQuizOrder] = useState<WordEntry[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [choices, setChoices]     = useState<WordEntry[]>([])
  const [selected, setSelected]   = useState<string | null>(null)
  const [audioPlayed, setAudioPlayed] = useState(false)

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
  }, [])

  // ── クイズ開始（パターンを指定） ─────────────────
  const startQuiz = useCallback((pattern: QuizPattern) => {
    if (!canQuiz) return
    playSe("/sounds/reset.mp3", 0.5)
    const order = shuffled(category.words)
    setQuizOrder(order)
    setQuizIndex(0)
    setChoices(makeChoices(order[0], category.words))
    setSelected(null)
    setAudioPlayed(pattern === "image-word") // 絵→単語は音声不要なので最初からtrue
    resetProblem()
    setQuizPattern(pattern)
    setMode("quiz")
  }, [canQuiz, category.words, playSe, resetProblem])

  // ── 次の問題へ ────────────────────────────────────
  const nextQuestion = useCallback((nextIdx: number, order: WordEntry[]) => {
    resetProblem()
    setQuizIndex(nextIdx)
    setChoices(makeChoices(order[nextIdx], category.words))
    setSelected(null)
    setAudioPlayed(quizPattern === "image-word")
  }, [category.words, quizPattern, resetProblem])

  // ── クイズの音声再生ボタン ────────────────────────
  const handlePlayQuizAudio = useCallback(() => {
    const word = quizOrder[quizIndex]
    if (!word) return
    const idx = category.words.findIndex(w => w.audioFile === word.audioFile)
    if (idx !== -1) {
      playAudio(idx)
      setAudioPlayed(true)
    }
  }, [quizOrder, quizIndex, category.words, playAudio])

  // ── 選択肢を選んだとき ────────────────────────────
  const handleSelect = useCallback((choice: WordEntry) => {
    if (selected !== null) return
    const correct = quizOrder[quizIndex]
    setSelected(choice.audioFile)

    // 選択した単語の音声を再生（正誤に関わらず発音を聞かせる）
    const choiceIdx = category.words.findIndex(w => w.audioFile === choice.audioFile)
    if (choiceIdx !== -1) playAudio(choiceIdx)

    if (choice.audioFile === correct.audioFile) {
      playSe("/sounds/seikai.mp3", 0.8)
      showSeikai()
      tryAddCoins(1)
      setTimeout(() => {
        nextQuestion((quizIndex + 1) % quizOrder.length, quizOrder)
      }, 1200)
    } else {
      playSe("/sounds/cancel.mp3", 0.5)
    }
  }, [selected, quizOrder, quizIndex, category.words, playAudio, playSe, tryAddCoins, nextQuestion])

  // ── 学習モード：カードタッチ ──────────────────────
  const handleLearnPlay = useCallback((word: WordEntry) => {
    const idx = category.words.findIndex(w => w.audioFile === word.audioFile)
    if (idx !== -1) playAudio(idx)
  }, [category.words, playAudio])

  // ── 選択肢ボタンのスタイル計算 ───────────────────
  function choiceBtnClass(choice: WordEntry, correct: WordEntry): string {
    const isSelected = selected === choice.audioFile
    const isCorrect  = choice.audioFile === correct.audioFile
    const base = "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 font-bold transition-all"
    if (selected === null) {
      const disabled = quizPattern !== "image-word" && !audioPlayed
      return `${base} bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 active:scale-95 ${disabled ? "opacity-40 pointer-events-none" : ""}`
    }
    if (isSelected && isCorrect)  return `${base} bg-green-100 border-green-500`
    if (isSelected && !isCorrect) return `${base} bg-red-100 border-red-500`
    if (!isSelected && isCorrect) return `${base} bg-green-50 border-green-400`
    return `${base} bg-gray-50 border-gray-200 opacity-50`
  }

  const currentQuizWord = quizOrder[quizIndex]

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-1">English Words</h1>
      <p className="text-center text-sm text-gray-500 mb-4">
        英語の単語を聞いて・見て覚えよう
      </p>

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

      {/* カテゴリ選択 + 学習ボタン */}
      <div className="flex gap-2 mb-3">
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
        <button
          onClick={() => { playSe("/sounds/pi.mp3", 0.4); setMode("learn") }}
          className={`px-4 py-2 rounded-lg font-bold border-2 text-sm transition-colors whitespace-nowrap
            ${mode === "learn"
              ? "bg-brand-500 text-white border-brand-500"
              : "bg-white text-brand-600 border-brand-300 hover:bg-brand-50"}`}
        >
          学習
        </button>
      </div>

      {/* クイズパターン選択（3ボタン） */}
      {canQuiz && (
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
      )}

      {isLoading && (
        <p className="text-center text-sm text-gray-400 my-4">音声を読み込み中...</p>
      )}

      {/* ─── 学習モード ───────────────────────────── */}
      {mode === "learn" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {category.words.map((word) => (
            <button
              key={word.audioFile}
              onClick={() => handleLearnPlay(word)}
              disabled={isLoading}
              className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border-2
                border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50
                active:scale-95 transition-all disabled:opacity-40 min-h-[80px]"
              style={word.bgColor ? { backgroundColor: word.bgColor, borderColor: word.bgColor } : {}}
            >
              {category.hasImage && word.imageFile ? (
                <Image
                  src={`/images/english/words/${word.imageFile}.png`}
                  alt={word.word}
                  width={56}
                  height={56}
                  className="object-contain"
                  style={{ maxHeight: 56 }}
                />
              ) : (
                <span className="text-2xl font-black" style={{ color: word.textColor ?? "#1f2937" }}>
                  {word.word}
                </span>
              )}
              {category.hasImage && (
                <span className="text-xs font-bold text-center leading-tight"
                  style={{ color: word.textColor ?? "#374151" }}>
                  {word.word}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ─── クイズモード ─────────────────────────── */}
      {mode === "quiz" && currentQuizWord && (
        <div className="flex flex-col items-center gap-5">

          <p className="text-sm text-gray-500">
            問題 {quizIndex + 1} / {quizOrder.length}
            <span className="ml-2 text-xs text-gray-400">
              （{QUIZ_PATTERNS.find(p => p.id === quizPattern)?.desc}）
            </span>
          </p>

          {/* 問題エリア */}
          <div className="flex flex-col items-center gap-3 p-6 bg-amber-50 border-2 border-amber-200
            rounded-2xl w-full max-w-sm min-h-[140px] justify-center">

            {quizPattern !== "image-word" ? (
              /* 音声パターン: 🔊ボタン */
              <>
                <button
                  onClick={handlePlayQuizAudio}
                  disabled={isLoading}
                  className="w-20 h-20 bg-amber-400 hover:bg-amber-500 active:bg-amber-600
                    text-white text-4xl rounded-full shadow-lg transition-all active:scale-95
                    disabled:opacity-40"
                >
                  🔊
                </button>
                {!audioPlayed && (
                  <p className="text-xs text-amber-600 font-bold animate-pulse">
                    ↑ まず音声を聞いてね
                  </p>
                )}
              </>
            ) : (
              /* 絵→単語パターン: ビジュアル表示 */
              <WordVisual word={currentQuizWord} category={category} size="lg" />
            )}
          </div>

          {/* 選択肢（2列グリッド） */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {choices.map((choice) => (
              <button
                key={choice.audioFile}
                onClick={() => handleSelect(choice)}
                disabled={selected !== null || (quizPattern !== "image-word" && !audioPlayed)}
                className={choiceBtnClass(choice, currentQuizWord)}
              >
                {/* 絵+単語パターン: ビジュアル + テキスト */}
                {quizPattern === "audio-image" && (
                  <WordVisual word={choice} category={category} size="sm" />
                )}
                <span className={`font-bold text-center leading-tight
                  ${quizPattern === "audio-image" ? "text-xs" : "text-base"}`}>
                  {choice.word}
                </span>
              </button>
            ))}
          </div>

          {/* 不正解後の「つぎへ」 */}
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

      {!canQuiz && (
        <p className="text-center text-xs text-gray-400 mt-2">
          ※ このカテゴリは語数が少ないためクイズに対応していません
        </p>
      )}
    </main>
  )
}

"use client"

// ======================================================
// 音楽記号を覚えよう
//
// 2つのモードで音楽記号を学習する。
//
// 【フラッシュカードモード】
//   - シャッフルした順番で40枚を1枚ずつ表示
//   - 最初は画像のみ（名前・意味は「?」）
//   - 「こたえをみる」で名前・意味を表示
//   - 「つぎへ」で次の問題へ
//
// 【クイズモード】
//   - 下部に40種の記号画像ボタン（5行×8列）を表示
//   - 上部に現在の問題の名前・意味を表示（表示オプションあり）
//   - 画像ボタンで正解を選ぶ → 正解:緑 / 不正解:赤
//   - スコア（正解数）をカウント
// ======================================================

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { useSound } from "@/hooks/useSound"
import { useProblemCoins } from "@/hooks/useProblemCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { shuffled } from "@/lib/utils"

// ── データ定義 ──────────────────────────────────────────
// 40種の音楽記号（no は画像ファイル名に対応: ongaku{no}.png）

type MusicSymbol = {
  no: number
  name: string
  mean: string
}

const DATA: MusicSymbol[] = [
  { no: 1,  name: "全音符",        mean: "4分の4拍子の1小節の長さ" },
  { no: 2,  name: "付点2分音符",   mean: "2分音符＋4分音符の長さ" },
  { no: 3,  name: "2分音符",       mean: "全音符の半分の長さ" },
  { no: 4,  name: "付点4分音符",   mean: "4分音符＋8分音符の長さ" },
  { no: 5,  name: "4分音符",       mean: "全音符の4分の1の長さ" },
  { no: 6,  name: "付点8分音符",   mean: "8分音符＋16分音符の長さ" },
  { no: 7,  name: "8分音符",       mean: "全音符の8分の1の長さ" },
  { no: 8,  name: "16分音符",      mean: "全音符の16分の1の長さ" },
  { no: 9,  name: "全休符",        mean: "全音符と同じ長さを休む" },
  { no: 10, name: "2分休符",       mean: "2分音符と同じ長さを休む" },
  { no: 11, name: "4分休符",       mean: "4分音符と同じ長さを休む" },
  { no: 12, name: "8分休符",       mean: "8分音符と同じ長さを休む" },
  { no: 13, name: "16分休符",      mean: "16分音符と同じ長さを休む" },
  { no: 14, name: "ト音記号",      mean: "五線上で「ソ」の位置を示す" },
  { no: 15, name: "ヘ音記号",      mean: "五線上で「ファ」の位置を示す（低い音を表すとき）" },
  { no: 16, name: "4分の2拍子",    mean: "4分音符を1拍として、1小節に2拍入る" },
  { no: 17, name: "4分の3拍子",    mean: "4分音符を1拍として、1小節に3拍入る" },
  { no: 18, name: "4分の4拍子",    mean: "4分音符を1拍として、1小節に4拍入る" },
  { no: 19, name: "8分の6拍子",    mean: "8分音符を1拍として、1小節に6拍入る" },
  { no: 20, name: "シャープ",      mean: "半音上げる" },
  { no: 21, name: "フラット",      mean: "半音下げる" },
  { no: 22, name: "ナチュラル",    mean: "もとの音に戻す" },
  { no: 23, name: "フォルテッシモ", mean: "非常に強く" },
  { no: 24, name: "フォルテ",      mean: "強く" },
  { no: 25, name: "メッゾフォルテ", mean: "やや強く" },
  { no: 26, name: "メッゾピアノ",  mean: "やや弱く" },
  { no: 27, name: "ピアノ",        mean: "弱く" },
  { no: 28, name: "ピアニッシモ",  mean: "非常に弱く" },
  { no: 29, name: "クレッシェンド", mean: "だんだん強く" },
  { no: 30, name: "デクレッシェンド", mean: "だんだん弱く" },
  { no: 31, name: "タイ",          mean: "同じ高さの音をつなげる" },
  { no: 32, name: "スラー",        mean: "違う高さの音をつなげる" },
  { no: 33, name: "スタッカート",  mean: "その音を短く切って演奏する" },
  { no: 34, name: "テヌート",      mean: "その音（が表現している時間）を十分に保って演奏する" },
  { no: 35, name: "アクセント",    mean: "その音だけを強く演奏する" },
  { no: 36, name: "フェルマータ",  mean: "その音を（約2倍）十分にのばして演奏する" },
  { no: 37, name: "リピート",      mean: "繰り返して演奏する" },
  { no: 38, name: "(8分)連符",     mean: "2つの(8分)音符をつなげて表記する" },
  { no: 39, name: "(16分)連符",    mean: "3つの(16分)音符をつなげて表記する" },
  { no: 40, name: "(1拍)3連符",    mean: "１拍の中に(8分)音符を3等分して演奏する" },
]

// ── ユーティリティ ───────────────────────────────────────
// 0〜(n-1) のシャッフル済み配列を生成する（utils.ts の shuffled を使用）
const createShuffledOrder = (n: number): number[] =>
  shuffled(Array.from({ length: n }, (_, i) => i))

// ── モード型 ─────────────────────────────────────────────
type Mode = "top" | "flash" | "quiz"

// クイズの表示オプション
// 0: 両方表示  1: 意味をかくす  2: 名前をかくす
type QuizOption = 0 | 1 | 2

// ── メインコンポーネント ─────────────────────────────────
export default function GakutenPage() {
  const { play } = useSound()
  const { coins, tryAddCoins, resetProblem } = useProblemCoins()

  // ── モード ────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("top")

  // ── フラッシュカード状態 ──────────────────────────────
  // order: シャッフル済みの DATA インデックス配列
  const [flashOrder, setFlashOrder] = useState<number[]>([])
  // 現在表示中の問題番号（0〜39）
  const [flashIndex, setFlashIndex] = useState(0)
  // 答えが開示されているか
  const [flashRevealed, setFlashRevealed] = useState(false)

  // ── クイズ状態 ────────────────────────────────────────
  const [quizOrder, setQuizOrder] = useState<number[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  // flags[i]: quizOrder[i] の問題に正解済かどうか
  const [quizFlags, setQuizFlags] = useState<boolean[]>(Array(40).fill(false))
  const [score, setScore] = useState(0)
  // 直前に選択した回答の DATA インデックス（null = 未選択）
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  // 表示オプション
  const [quizOption, setQuizOption] = useState<QuizOption>(0)

  // ── 正解演出 ─────────────────────────────────────────
  const seikaiRef = useRef<HTMLDivElement>(null)

  function showSeikai() {
    const el = seikaiRef.current
    if (!el) return
    el.style.display = "block"
    setTimeout(() => {
      el.style.display = "none"
    }, 1000)
  }

  // ── フラッシュカード：初期化 ──────────────────────────
  const initFlash = useCallback(() => {
    play("/sounds/reset.mp3", 0.5)
    setFlashOrder(createShuffledOrder(DATA.length))
    setFlashIndex(0)
    setFlashRevealed(false)
    setMode("flash")
  }, [play])

  // ── フラッシュカード：「つぎへ」ボタン ───────────────
  function handleFlashNext() {
    play("/sounds/pi.mp3", 0.4)
    if (!flashRevealed) {
      // 問題表示中 → 答えを開示
      setFlashRevealed(true)
    } else {
      // 答え開示中 → 次の問題へ
      setFlashIndex((prev) => (prev + 1) % DATA.length)
      setFlashRevealed(false)
    }
  }

  // ── フラッシュカード：「もどる」ボタン ───────────────
  function handleFlashPrev() {
    play("/sounds/pi.mp3", 0.4)
    const prevIndex = (flashIndex - 1 + DATA.length) % DATA.length
    setFlashIndex(prevIndex)
    // 前の問題の答えを見せた状態で戻る
    setFlashRevealed(true)
  }

  // ── フラッシュカード：シャッフル ─────────────────────
  function handleFlashShuffle() {
    play("/sounds/set.mp3", 0.4)
    if (!confirm("順番をシャッフルしますか？")) return
    setFlashOrder(createShuffledOrder(DATA.length))
    setFlashIndex(0)
    setFlashRevealed(false)
  }

  // ── クイズ：初期化 ────────────────────────────────────
  const initQuiz = useCallback(() => {
    play("/sounds/reset.mp3", 0.5)
    setQuizOrder(createShuffledOrder(DATA.length))
    setQuizIndex(0)
    setQuizFlags(Array(DATA.length).fill(false))
    setScore(0)
    setSelectedAnswer(null)
    setMode("quiz")
  }, [play])

  // ── クイズ：「つぎへ」ボタン ──────────────────────────
  function handleQuizNext() {
    play("/sounds/pi.mp3", 0.4)
    resetProblem()
    setQuizIndex((prev) => (prev + 1) % DATA.length)
    setSelectedAnswer(null)
  }

  // ── クイズ：「もどる」ボタン ──────────────────────────
  function handleQuizPrev() {
    play("/sounds/pi.mp3", 0.4)
    resetProblem()
    setQuizIndex((prev) => (prev - 1 + DATA.length) % DATA.length)
    setSelectedAnswer(null)
  }

  // ── クイズ：シャッフル ────────────────────────────────
  function handleQuizShuffle() {
    play("/sounds/set.mp3", 0.4)
    if (!confirm("順番をシャッフルしますか？")) return
    resetProblem()
    setQuizOrder(createShuffledOrder(DATA.length))
    setQuizIndex(0)
    setQuizFlags(Array(DATA.length).fill(false))
    setScore(0)
    setSelectedAnswer(null)
  }

  // ── クイズ：画像ボタンを押したとき ───────────────────
  function handleSelectAnswer(dataIndex: number) {
    setSelectedAnswer(dataIndex)
    const correctDataIndex = quizOrder[quizIndex]

    if (dataIndex === correctDataIndex) {
      // 正解
      play("/sounds/seikai.mp3", 0.6)
      showSeikai()
      // まだ正解済でない問題なら得点・コインを加算
      if (!quizFlags[quizIndex]) {
        tryAddCoins(1)
        setQuizFlags((prev) => {
          const next = [...prev]
          next[quizIndex] = true
          return next
        })
        setScore((prev) => prev + 1)
      }
    } else {
      // 不正解
      play("/sounds/kako.mp3", 0.4)
    }
  }

  // ── 現在の問題データ ──────────────────────────────────
  // フラッシュカード
  const flashData = DATA[flashOrder[flashIndex] ?? 0]
  // クイズ
  const quizData  = DATA[quizOrder[quizIndex] ?? 0]
  // クイズのステータステキスト
  const quizStatus = quizFlags[quizIndex] ? "正解済" : "未正解"

  // ── レンダリング ───────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-3 py-6 select-none">

      {/* ===== 正解演出 ===== */}
      <div
        ref={seikaiRef}
        style={{ display: "none" }}
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      >
        <div className="bg-green-500 text-white text-4xl font-bold px-10 py-6 rounded-2xl shadow-2xl">
          せいかい！🎉
        </div>
      </div>

      {/* ===== モード選択ボタン（常時表示） ===== */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={initFlash}
          className="px-6 py-2 rounded-full font-bold text-white shadow-md
            bg-brand-500 hover:bg-brand-600 active:translate-y-0.5 transition-all"
        >
          📇 フラッシュカード
        </button>
        <button
          onClick={initQuiz}
          className="px-6 py-2 rounded-full font-bold text-white shadow-md
            bg-accent-500 hover:bg-accent-600 active:translate-y-0.5 transition-all"
        >
          🎯 クイズ
        </button>
      </div>

      {/* ===== トップ画面 ===== */}
      {mode === "top" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">🎵 音楽記号を覚えよう 🎵</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            楽典・音楽理論を楽しく学べる学習アプリ
          </p>
          <p className="text-sm text-gray-400">全40種類の音楽記号を収録</p>
          <p className="mt-6 text-gray-600 dark:text-gray-300">
            上のボタンからモードを選んでください
          </p>
        </div>
      )}

      {/* ===== フラッシュカードモード ===== */}
      {mode === "flash" && flashData && (
        <div className="bg-brand-50 dark:bg-gray-800 rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-center mb-4">
            📇 フラッシュカード
          </h2>

          {/* 進捗 */}
          <p className="text-center text-sm text-gray-500 mb-4">
            {flashIndex + 1} / {DATA.length}
          </p>

          {/* 画像 */}
          <div className="flex justify-center mb-6">
            <div className="w-48 h-48 rounded-xl border-2 border-gray-200 dark:border-gray-600
                            flex items-center justify-center bg-gray-50 dark:bg-gray-700 overflow-hidden">
              <Image
                src={`/images/gakuten/ongaku${flashData.no}.png`}
                alt={flashData.name}
                width={160}
                height={160}
                className="max-w-full max-h-full object-contain p-2"
              />
            </div>
          </div>

          {/* 名前・意味テーブル */}
          <div className="overflow-hidden rounded-xl border-2 border-gray-400 dark:border-gray-500 mb-6">
            <table className="w-full">
              <tbody>
                <tr className="border-b-2 border-gray-400 dark:border-gray-500">
                  <td className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300
                                  font-bold text-center py-3 px-4 w-20 text-lg">
                    名前
                  </td>
                  <td className="text-center py-3 px-4 text-xl font-bold">
                    {flashRevealed ? flashData.name : "？"}
                  </td>
                </tr>
                <tr>
                  <td className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
                                  font-bold text-center py-3 px-4 w-20 text-lg">
                    意味
                  </td>
                  <td className="text-center py-3 px-4 text-base">
                    {flashRevealed ? flashData.mean : "？"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ボタン */}
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={handleFlashPrev}
              disabled={flashIndex === 0 && !flashRevealed}
              className="px-5 py-2 rounded-full font-bold text-white shadow
                bg-brand-500 hover:bg-brand-600 disabled:opacity-40
                active:translate-y-0.5 transition-all"
            >
              ⬅️ もどる
            </button>
            <button
              onClick={handleFlashShuffle}
              className="px-5 py-2 rounded-full font-bold text-white shadow
                bg-warm-500 hover:bg-warm-600 active:translate-y-0.5 transition-all"
            >
              🔀 シャッフル
            </button>
            <button
              onClick={handleFlashNext}
              className="px-5 py-2 rounded-full font-bold text-white shadow
                bg-brand-500 hover:bg-brand-600 active:translate-y-0.5 transition-all"
            >
              {flashRevealed ? "つぎへ ➡️" : "こたえをみる 👁️"}
            </button>
          </div>
        </div>
      )}

      {/* ===== クイズモード ===== */}
      {mode === "quiz" && quizData && (
        <div className="bg-accent-50 dark:bg-gray-800 rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-center mb-2">
            🎯 クイズ
          </h2>

          {/* 進捗・スコア */}
          <p className="text-center text-sm text-gray-500 mb-4">
            {quizIndex + 1} / {DATA.length}　<span className="text-green-600 dark:text-green-400 font-bold">{score}問正解</span>　（{quizStatus}）
          </p>

          {/* 表示オプション */}
          <div className="flex justify-center gap-4 mb-4 flex-wrap">
            {(
              [
                [0, "📝 どちらも見せる"],
                [1, "❓ 意味をかくす"],
                [2, "🔍 名前をかくす"],
              ] as [QuizOption, string][]
            ).map(([val, label]) => (
              <label key={val} className="flex items-center gap-1 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="quizOption"
                  value={val}
                  checked={quizOption === val}
                  onChange={() => setQuizOption(val)}
                  className="accent-brand-500"
                />
                {label}
              </label>
            ))}
          </div>

          {/* 名前・意味テーブル */}
          <div className="overflow-hidden rounded-xl border-2 border-gray-400 dark:border-gray-500 mb-5">
            <table className="w-full">
              <tbody>
                <tr className="border-b-2 border-gray-400 dark:border-gray-500">
                  <td className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300
                                  font-bold text-center py-3 px-4 w-20 text-lg">
                    名前
                  </td>
                  <td className="text-center py-3 px-4 text-xl font-bold min-h-[3rem]">
                    {quizOption === 2 ? "" : quizData.name}
                  </td>
                </tr>
                <tr>
                  <td className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
                                  font-bold text-center py-3 px-4 w-20 text-lg">
                    意味
                  </td>
                  <td className="text-center py-3 px-4 text-base min-h-[3rem]">
                    {quizOption === 1 ? "" : quizData.mean}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 記号グリッド（5行×8列） */}
          <div className="overflow-x-auto mb-5">
            <div className="flex flex-col items-center gap-2">
              {Array.from({ length: 5 }, (_, row) => (
                <div key={row} className="flex gap-2">
                  {Array.from({ length: 8 }, (_, col) => {
                    const dataIndex = row * 8 + col
                    const symbol = DATA[dataIndex]
                    // 選択状態のスタイルを決定
                    let btnStyle =
                      "bg-white dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                    if (selectedAnswer === dataIndex) {
                      if (dataIndex === quizOrder[quizIndex]) {
                        // 正解
                        btnStyle = "bg-green-100 dark:bg-green-900/50 border-2 border-green-500"
                      } else {
                        // 不正解
                        btnStyle = "bg-red-100 dark:bg-red-900/50 border-2 border-red-500"
                      }
                    }
                    return (
                      <button
                        key={col}
                        onClick={() => handleSelectAnswer(dataIndex)}
                        title={symbol.name}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg shadow-[2px_2px_0_rgba(0,0,0,0.2)]
                          flex items-center justify-center p-0.5
                          active:translate-y-0.5 transition-all ${btnStyle}`}
                      >
                        <Image
                          src={`/images/gakuten/ongaku${symbol.no}.png`}
                          alt={symbol.name}
                          width={48}
                          height={48}
                          className="max-w-full max-h-full object-contain"
                        />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ナビゲーションボタン */}
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={handleQuizPrev}
              className="px-5 py-2 rounded-full font-bold text-white shadow
                bg-brand-500 hover:bg-brand-600 active:translate-y-0.5 transition-all"
            >
              ⬅️ もどる
            </button>
            <button
              onClick={handleQuizShuffle}
              className="px-5 py-2 rounded-full font-bold text-white shadow
                bg-warm-500 hover:bg-warm-600 active:translate-y-0.5 transition-all"
            >
              🔀 シャッフル
            </button>
            <button
              onClick={handleQuizNext}
              className="px-5 py-2 rounded-full font-bold text-white shadow
                bg-brand-500 hover:bg-brand-600 active:translate-y-0.5 transition-all"
            >
              つぎへ ➡️
            </button>
          </div>

          {/* コイン表示 */}
          <CoinDisplay coins={coins} />
        </div>
      )}

    </div>
  )
}

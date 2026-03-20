// ======================================================
// たしざんの練習 ページ
//
// URL: /apps/tasu-renshu
// 対象: 小学1〜2年生
// 内容: 60秒タイムアタック形式のたしざん練習
//
// 難易度4段階:
//   ① 10までの　かず  → 答えが 1〜10
//   ② 10+□,□+10    → 答えが 11〜20（一方が必ず 10）
//   ③ 1□+□,□+1□   → 繰り上がりあり（答えが 12〜20）
//   ④ 20までの　かず  → 全体的なたしざん
//
// コイン: 5問正解ごとに1枚（ゲーム終了時に付与）
// ======================================================

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import * as se from "@/lib/se"
import { BtnNum } from "@/components/parts/buttons/BtnNum"
import { BtnStart } from "@/components/parts/buttons/BtnStart"
import { BtnStop } from "@/components/parts/buttons/BtnStop"
import { PutText } from "@/components/parts/displays/PutText"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { useCoins } from "@/hooks/useCoins"

// ── 定数 ─────────────────────────────────────────────

const NUM_1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const NUM_2 = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

const SELECT_ITEMS = ["10までの　かず", "10+□,□+10", "1□+□,□+1□", "20までの　かず"]

// 5問正解ごとに1コイン付与
const COINS_PER_N = 5

// ── コンポーネント ───────────────────────────────────

export default function TasuRenshuPage() {
  // ── 状態管理 ─────────────────────────────────────
  const [flag, setFlag]               = useState<boolean>(false)  // 回答受付フラグ
  const [time, setTime]               = useState<number>(60)      // 残り秒数
  const [score, setScore]             = useState<number>(0)       // 正解数
  const [selectIndex, setSelectIndex] = useState<number>(0)       // 難易度

  // ゲーム中フラグ・タイマーID・問題値 を ref で管理
  // （useCallback の deps に含めず、最新値を常に参照するため）
  const inGameRef    = useRef<boolean>(false)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const startWaitRef = useRef<ReturnType<typeof setTimeout> | null>(null)  // 「よーい」1秒待機
  const leftRef      = useRef<number>(0)
  const rightRef     = useRef<number>(0)
  const answerRef    = useRef<number>(0)
  const scoreRef     = useRef<number>(0)  // コイン計算用（score state の鏡）

  // メッセージ表示エリアへの参照
  const el_text = useRef<HTMLDivElement | null>(null)

  // コインシステム
  const { coins, addCoins } = useCoins()

  // ── タイマー・待機タイマー停止ヘルパー ────────────────
  const clearTimer = () => {
    if (startWaitRef.current) {
      clearTimeout(startWaitRef.current)  // 「よーい」1秒待機をキャンセル
      startWaitRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // ── ゲーム終了処理 ────────────────────────────────
  const gameStopEvent = useCallback(() => {
    if (!inGameRef.current) return
    inGameRef.current = false
    setFlag(false)
    clearTimer()
    se.playSe(se.seikai1)

    // 5問ごとに1コイン付与
    const earnedCoins = Math.floor(scoreRef.current / COINS_PER_N)
    if (earnedCoins > 0) addCoins(earnedCoins)

    if (el_text.current) {
      el_text.current.style.backgroundColor = "lightgray"
      el_text.current.innerHTML =
        earnedCoins > 0
          ? `おわり！　🪙 ${earnedCoins}まい　ゲット！（スタートでもういちどチャレンジ）`
          : "おわり！（スタートでもういちどチャレンジ）"
    }
  // addCoins は安定しているが lint のため記載
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 問題生成 ──────────────────────────────────────
  const giveQuestion = useCallback(() => {
    if (!inGameRef.current) return
    setFlag(true)
    const mode = Math.floor(Math.random() * 2 + 1)

    let left = 0, right = 0, ans = 0

    switch (selectIndex) {
      case 0:
        // 10までのたしざん（答え 1〜10）
        ans   = Math.floor(Math.random() * 10 + 1)
        left  = Math.floor(Math.random() * (ans + 1))
        right = ans - left
        break
      case 1:
        // 10+□ または □+10（答え 11〜20）
        ans = Math.floor(Math.random() * 10 + 11)
        if (mode === 1) { left = 10; right = ans - left }
        else            { right = 10; left = ans - right }
        break
      case 2:
        // 1□+□ または □+1□（繰り上がりあり、答え 12〜20）
        ans = Math.floor(Math.random() * 9 + 12)
        if (mode === 1) { left = Math.floor(Math.random() * (ans - 11) + 1); right = ans - left }
        else            { right = Math.floor(Math.random() * (ans - 11) + 1); left = ans - right }
        break
      case 3:
        // 20までのたしざん（答え 最大20）
        left  = Math.floor(Math.random() * 9 + 2)
        right = Math.floor(Math.random() * left + (10 - left) + 1)
        ans   = left + right
        break
    }

    leftRef.current   = left
    rightRef.current  = right
    answerRef.current = ans

    if (el_text.current) {
      el_text.current.innerHTML = `${left}　＋　${right}　＝`
    }
  }, [selectIndex])

  // ── ゲーム開始処理 ────────────────────────────────
  const gameStartEvent = useCallback(() => {
    if (inGameRef.current) return
    inGameRef.current = true
    scoreRef.current  = 0
    setFlag(false)
    setTime(60)
    setScore(0)
    se.playSe(se.pi)

    if (el_text.current) {
      el_text.current.style.backgroundColor = "antiquewhite"
      el_text.current.innerHTML = "よーい"
    }

    // 1秒後にスタート・タイマー開始（ID を保持してストップ時にキャンセル可能にする）
    startWaitRef.current = setTimeout(() => {
      if (!inGameRef.current) return  // 待機中にストップされた場合は何もしない
      if (el_text.current) el_text.current.innerHTML = "スタート"
      se.playSe(se.set)
      giveQuestion()
      timerRef.current = setInterval(() => {
        setTime((t) => (t > 0 ? t - 1 : 0))
      }, 1000)
    }, 1000)
  }, [giveQuestion])

  // ── 難易度変更 ────────────────────────────────────
  const changeSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    gameStopEvent()
    setSelectIndex(e.target.selectedIndex)
  }, [gameStopEvent])

  // 難易度変更時に表示をリセット
  useEffect(() => {
    if (el_text.current) {
      el_text.current.style.backgroundColor = "lightgray"
      el_text.current.innerHTML = "スタートをおしてね"
    }
    setTime(60)
    setScore(0)
  }, [selectIndex])

  // 残り時間が 0 になったらゲーム終了
  useEffect(() => {
    if (time <= 0) {
      clearTimer()
      gameStopEvent()
    }
  }, [time, gameStopEvent])

  // ── 回答チェック ──────────────────────────────────
  const checkAnswer = (myAnswer: number) => {
    if (!flag) return
    setFlag(false)

    if (myAnswer === answerRef.current) {
      // 正解
      se.playSe(se.right)
      scoreRef.current += 1
      setScore((s) => s + 1)
      if (el_text.current) {
        el_text.current.innerHTML = `<span style="color:red;">せいかい</span>`
      }
      setTimeout(() => giveQuestion(), 200)
    } else {
      // 不正解：0.2秒後に同じ問題を再表示
      se.playSe(se.alertSound)
      if (el_text.current) {
        el_text.current.innerHTML = `<span style="color:gray;">ちがうよ</span>`
        setTimeout(() => {
          if (el_text.current) {
            el_text.current.innerHTML =
              `${leftRef.current}　＋　${rightRef.current}　＝`
          }
          setFlag(true)
        }, 200)
      }
    }
  }

  // ── 描画 ─────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
        ➕ たしざんの練習
      </h1>

      {/* 難易度セレクト・スタート/ストップボタン */}
      <div className="flex flex-wrap justify-center items-center">
        <select
          onChange={changeSelect}
          className="text-center font-bold m-2 p-2 min-w-40 text-base md:text-xl
                     border-brand-500 text-black dark:text-gray-100 dark:bg-gray-700
                     border-2 rounded-lg shadow-lg"
        >
          {SELECT_ITEMS.map((item, i) => (
            <option key={i} value={i}>{item}</option>
          ))}
        </select>
        <BtnStart handleEvent={gameStartEvent} />
        <BtnStop  handleEvent={gameStopEvent}  />
      </div>

      {/* 残り時間・スコア表示 */}
      <div className="flex flex-wrap justify-center items-center my-4 gap-6 text-gray-800 dark:text-gray-100">
        <div className="flex items-center gap-2 text-lg font-bold">
          のこり
          <span className="w-16 text-center text-3xl border-2 border-warm-400 rounded-lg px-2 py-1 bg-warm-50 dark:bg-gray-700">
            {time}
          </span>
          秒
        </div>
        <div className="flex items-center gap-2 text-lg font-bold">
          とくてん
          <span className="w-16 text-center text-4xl border-2 border-accent-400 rounded-lg px-2 py-1 bg-accent-50 dark:bg-gray-700">
            {score}
          </span>
          もん
        </div>
      </div>

      {/* 問題文表示 */}
      <PutText el_text={el_text} />

      {/* 数字ボタン 0〜10 */}
      <BtnNum ITEM={NUM_1} handleEvent={checkAnswer} />
      {/* 数字ボタン 11〜20 */}
      <BtnNum ITEM={NUM_2} handleEvent={checkAnswer} />

      {/* コイン表示 */}
      <CoinDisplay coins={coins} />

    </div>
  )
}

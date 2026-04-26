// ======================================================
// とけい ページ
//
// URL: /tokei
// 対象: 小学1〜3年生
// 内容: 時計の針を読む・合わせる練習
//
// 問題タイプ:
//   nanji   : 「なんじなんふん？」表示された時刻を読んで答える
//   ugokasu : 「はりをうごかそう」指定時刻に針を合わせる
//   yomu    : 「なんじかな？」スライダーを動かして時刻を確認する（自由探索）
//
// 難易度:
//   easy      : 15分刻み（0, 15, 30, 45）
//   normal    : 5分刻み
//   difficult : 1分刻み
//
// ヒント:
//   hint1 : 5分刻みの数字を外周に青で表示
//   hint2 : 1分刻みの全数字を放射状に緑で表示
// ======================================================

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import * as se from "@/lib/se"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { useAnswerCheck } from "@/hooks/useAnswerCheck"
import { drawClock, type HintLevel } from "@/lib/clockDrawing"
import { BtnQuestion } from "@/components/parts/buttons/BtnQuestion"
import { BtnCheck } from "@/components/parts/buttons/BtnCheck"
import { BtnShowAnswer } from "@/components/parts/buttons/BtnShowAnswer"

// ── 型定義 ──────────────────────────────────────────────
type ProblemType = "nanji" | "ugokasu" | "yomu"
type Difficulty  = "easy" | "normal" | "difficult"

// ── Canvas 定数 ──────────────────────────────────────────
const C = 400

export default function TokeiPage() {

  // ── コインシステム ──────────────────────────────────────
  const { coins, addCoins } = useCoins()

  // ── 時計の針の状態 ──────────────────────────────────────
  const [hours,      setHours]      = useState(6)    // 0〜12（初期: 6時）
  const [minutes,    setMinutes]    = useState(0)    // 0〜59
  const [rangeValue, setRangeValue] = useState(360)  // スライダー値（0〜720）

  // ── 問題の状態 ──────────────────────────────────────────
  const [hasProblem,   setHasProblem]   = useState(false)
  const [type,         setType]         = useState<ProblemType>("yomu")
  const [mode,         setMode]         = useState<Difficulty>("easy")
  const [hariHours,    setHariHours]    = useState(0)  // 正解の時（ugokasu用）
  const [hariMinutes,  setHariMinutes]  = useState(0)  // 正解の分（ugokasu用）

  // ── ヒント ──────────────────────────────────────────────
  const [hint, setHint] = useState<HintLevel>("")

  // ── yomu モード: 時刻テキストの表示/非表示トグル ──────────
  const [showTime, setShowTime] = useState(true)

  // ── 数字入力（なんじなんふん？タイプ用） ──────────────────
  const [inputHours,   setInputHours]   = useState("")
  const [inputMinutes, setInputMinutes] = useState("")

  // ── refs ────────────────────────────────────────────────
  const canvasRef      = useRef<HTMLCanvasElement | null>(null)
  const ctxRef         = useRef<CanvasRenderingContext2D | null>(null)
  const el_text        = useRef<HTMLDivElement | null>(null)
  const hasAnsweredRef = useRef(false)  // 初回正解のみコインを付与するフラグ

  // ── Canvas 初期化（初回のみ） ───────────────────────────
  useEffect(() => {
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext("2d")
    }
  }, [])

  // ── 時計の描画関数 ──────────────────────────────────────
  // hours / minutes / hint が変わるたびに呼ばれる
  const draw = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    drawClock(ctx, hours, minutes, hint)
  }, [hours, minutes, hint])

  // hours / minutes / hint が変わるたびに再描画
  useEffect(() => {
    draw()
  }, [draw])

  // ── yomu モード: 時刻を表示（showTime=false のときは非表示） ──
  // nanji / ugokasu モードでは el_text は useAnswerCheck が管理するため干渉しない
  useEffect(() => {
    if (type !== "yomu" || !el_text.current) return
    if (showTime) {
      const h = hours === 0 ? 12 : hours
      el_text.current.innerHTML = `${h}じ　${minutes}ふん`
    } else {
      el_text.current.innerHTML = ""
    }
  }, [type, hours, minutes, showTime])

  // ── useAnswerCheck（なんじなんふん？タイプ用） ───────────
  // 時刻を hours * 100 + minutes に変換して1つの数値として比較する
  const { checkAnswer } = useAnswerCheck({
    addCoins,
    hasAnsweredRef,
    getPrevText:  () => "なんじ　なんふん？",
    el_text,
    correctText:  `<span style="color:red;">せいかい！</span>`,
    onCorrect:    () => setHasProblem(false),
  })

  // ── スライダー・±ボタン共通処理 ─────────────────────────
  // rangeValue（0〜720）を受け取って針を更新する
  const applyRange = useCallback((value: number) => {
    const v = Math.max(0, Math.min(720, value))
    setRangeValue(v)
    setHours(Math.floor(v / 60))
    setMinutes(v % 60)
    se.playSe(se.kako)
  }, [])

  // ── 問題を出題 ──────────────────────────────────────────
  // 効果音は BtnQuestion 側で内蔵（pi）。ここでは鳴らさない。
  const handleQuestion = useCallback(() => {
    hasAnsweredRef.current = false
    setHasProblem(true)
    setHint("")
    setInputHours("")
    setInputMinutes("")

    // 難易度に応じた分を生成
    const newH = Math.floor(Math.random() * 12) + 1  // 1〜12
    const newM =
      mode === "easy"     ? Math.floor(Math.random() * 4)  * 15 :
      mode === "normal"   ? Math.floor(Math.random() * 12) * 5  :
                            Math.floor(Math.random() * 60)

    if (type === "nanji") {
      // 時計に時刻を表示 → ユーザーが読んで数字を入力する
      setHours(newH)
      setMinutes(newM)
      setRangeValue(newH * 60 + newM)
      if (el_text.current) el_text.current.innerHTML = "なんじ　なんふん？"
    } else {
      // 正解を記憶して時計を6時にリセット → ユーザーがスライダーで合わせる
      setHariHours(newH)
      setHariMinutes(newM)
      setHours(6)
      setMinutes(0)
      setRangeValue(360)
      if (el_text.current) {
        el_text.current.innerHTML =
          `${newH}じ　${newM}ふんに　はりを　うごかそう`
      }
    }
  }, [mode, type])

  // ── こたえあわせ ────────────────────────────────────────
  const handleCheck = useCallback(() => {
    if (!hasProblem) return

    if (type === "nanji") {
      // useAnswerCheck に委譲
      // 時刻を hours*100+minutes に変換して比較（例: 3時15分 → 315）
      const userH     = parseInt(inputHours)  || 0
      const userM     = parseInt(inputMinutes) || 0
      const normH     = hours === 0 ? 12 : hours  // 0時 → 12時として扱う
      const normUserH = userH === 0 ? 12 : userH
      checkAnswer(normUserH * 100 + userM, normH * 100 + minutes)
    } else {
      // ugokasu: スライダーの位置（hours/minutes）を正解と比較
      const userH     = Math.floor(rangeValue / 60)
      const userM     = rangeValue % 60
      const normUserH = userH     === 0 ? 12 : userH
      const normHariH = hariHours === 0 ? 12 : hariHours

      if (normUserH === normHariH && userM === hariMinutes) {
        // 正解
        se.playSe(se.seikai1)
        if (!hasAnsweredRef.current) {
          addCoins(1)
          hasAnsweredRef.current = true
        }
        if (el_text.current) {
          el_text.current.innerHTML = `<span style="color:red;">せいかい！</span>`
        }
        setHasProblem(false)
      } else {
        // 不正解: 1秒後に問題文を復元
        se.playSe(se.alertSound)
        if (el_text.current) {
          const prev = el_text.current.innerHTML
          el_text.current.innerHTML = `<span style="color:gray;">ちがうよ</span>`
          setTimeout(() => {
            if (el_text.current) el_text.current.innerHTML = prev
          }, 1000)
        }
      }
    }
  }, [
    hasProblem, type, inputHours, inputMinutes,
    hours, minutes, rangeValue, hariHours, hariMinutes,
    checkAnswer, addCoins,
  ])

  // ── こたえをみる ────────────────────────────────────────
  const handleShowAnswer = useCallback(() => {
    if (!hasProblem) return
    se.playSe(se.seikai2)
    setHasProblem(false)

    if (type === "nanji") {
      const h = hours === 0 ? 12 : hours
      if (el_text.current) {
        el_text.current.innerHTML = `こたえは　${h}じ　${minutes}ふん　です。`
      }
    } else {
      // 正解の時刻に針を動かして表示
      setHours(hariHours)
      setMinutes(hariMinutes)
      setRangeValue(hariHours * 60 + hariMinutes)
      if (el_text.current) {
        el_text.current.innerHTML =
          `こたえは　${hariHours}じ　${hariMinutes}ふん　です。`
      }
    }
  }, [hasProblem, type, hours, minutes, hariHours, hariMinutes])

  // ── ヒント切り替え ──────────────────────────────────────
  const toggleHint = useCallback((level: "hint1" | "hint2") => {
    se.playSe(se.set)
    setHint(prev => prev === level ? "" : level)
  }, [])

  // ── 問題タイプ変更: 問題をリセット ──────────────────────
  const handleTypeChange = useCallback((v: ProblemType) => {
    setType(v)
    setHasProblem(false)
    hasAnsweredRef.current = false
    if (el_text.current) el_text.current.innerHTML = ""
    // yomu モードに切り替えたとき、表示状態をリセット
    if (v === "yomu") setShowTime(true)
  }, [])

  // ── 難易度変更: 問題をリセット ──────────────────────────
  const handleModeChange = useCallback((v: Difficulty) => {
    setMode(v)
    setHasProblem(false)
    hasAnsweredRef.current = false
    if (el_text.current) el_text.current.innerHTML = ""
  }, [])

  // モードに応じたスライダーの step
  const step = mode === "easy" ? 15 : mode === "normal" ? 5 : 1

  // ── JSX ────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800">
        とけい
      </h1>

      {/* メッセージエリア（useAnswerCheck が innerHTML を書き込む） */}
      <div
        ref={el_text}
        className="min-h-[2.5rem] text-xl font-bold px-3 py-2
                   bg-yellow-50 border border-yellow-200 rounded text-gray-800"
      />

      {/* スライダー + ±ボタン（横一列） */}
      <div className="space-y-1">
        <p className="text-sm text-gray-500">
          とけいのはりは　スライダーで　うごかせます
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => applyRange(rangeValue - step)}
            className="px-5 py-2 text-xl font-bold shrink-0
                       bg-brand-400 hover:bg-brand-500 active:bg-brand-600
                       text-white border-2 border-brand-400
                       active:translate-y-0.5 rounded-lg shadow-sm transition-colors"
          >
            −
          </button>
          <input
            type="range"
            min={0}
            max={720}
            step={step}
            value={rangeValue}
            onChange={e => applyRange(parseInt(e.target.value))}
            className="flex-1 h-8 cursor-pointer accent-blue-500"
          />
          <button
            onClick={() => applyRange(rangeValue + step)}
            className="px-5 py-2 text-xl font-bold shrink-0
                       bg-brand-400 hover:bg-brand-500 active:bg-brand-600
                       text-white border-2 border-brand-400
                       active:translate-y-0.5 rounded-lg shadow-sm transition-colors"
          >
            ＋
          </button>
        </div>
      </div>

      {/* Canvas + 右側コントロール */}
      <div className="flex flex-wrap gap-6 items-start">

        {/* 時計 Canvas（max-w-[400px]でレスポンシブ） */}
        <div className="w-full max-w-[400px]">
          <canvas
            ref={canvasRef}
            width={C}
            height={C}
            className="w-full h-auto border border-gray-300 rounded-lg bg-white"
          />
        </div>

        {/* 右側コントロール */}
        <div className="flex-1 min-w-[200px] space-y-4">

          {/* 問題タイプ・難易度セレクト */}
          <div className="flex flex-wrap gap-2">
            <select
              value={type}
              onChange={e => { se.playSe(se.set); handleTypeChange(e.target.value as ProblemType) }}
              className="px-3 py-2 border-2 border-brand-500 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="yomu">しらべる</option>
              <option value="nanji">なんじなんふん？</option>
              <option value="ugokasu">はりをうごかそう</option>
            </select>
            {/* yomu モードでも難易度（スライダーの刻み）は選べる */}
            <select
              value={mode}
              onChange={e => { se.playSe(se.set); handleModeChange(e.target.value as Difficulty) }}
              className="px-3 py-2 border-2 border-brand-500 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="easy">15分ごと</option>
              <option value="normal">5分ごと</option>
              <option value="difficult">1分ごと</option>
            </select>
          </div>

          {/* メインボタン（もんだい / こたえあわせ / こたえをみる）
              yomu モードでは問題を出題しないため非表示 */}
          {type !== "yomu" && (
            <div className="flex flex-wrap items-center">
              <BtnQuestion handleEvent={handleQuestion} />
              <BtnCheck handleEvent={handleCheck} disabled={!hasProblem} />
              <BtnShowAnswer handleEvent={handleShowAnswer} disabled={!hasProblem} />
            </div>
          )}

          {/* ヒントボタン（押すたびにトグル） */}
          <div className="flex gap-2">
            <button
              onClick={() => toggleHint("hint1")}
              className={`px-4 py-2 font-bold rounded-lg border-2 transition-all
                ${hint === "hint1"
                  ? "bg-accent-500 border-accent-500 text-white"
                  : "bg-white border-accent-300 text-accent-600 hover:bg-accent-100"
                }`}
            >
              ヒント１
            </button>
            <button
              onClick={() => toggleHint("hint2")}
              className={`px-4 py-2 font-bold rounded-lg border-2 transition-all
                ${hint === "hint2"
                  ? "bg-warm-500 border-warm-500 text-white"
                  : "bg-white border-warm-200 text-warm-600 hover:bg-warm-100"
                }`}
            >
              ヒント２
            </button>
          </div>

          {/* じこく表示トグル（「しらべる」モードのみ） */}
          {type === "yomu" && (
            <button
              onClick={() => { se.playSe(se.set); setShowTime(prev => !prev) }}
              className={`px-4 py-2 font-bold rounded-lg border-2 transition-all
                ${showTime
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "bg-white border-brand-300 text-brand-600 hover:bg-brand-100"
                }`}
            >
              {showTime ? "じこくをかくす" : "じこくをみる"}
            </button>
          )}

          {/* 数字入力欄（「なんじなんふん？」タイプのみ表示） */}
          {type === "nanji" && (
            <div className="flex items-center gap-2 text-lg">
              <input
                type="number"
                min={1}
                max={12}
                value={inputHours}
                onChange={e => setInputHours(e.target.value)}
                placeholder="？"
                className="w-16 px-2 py-2 border-2 border-gray-300 rounded-lg
                           text-center text-lg"
              />
              <span className="font-bold">じ</span>
              <input
                type="number"
                min={0}
                max={59}
                value={inputMinutes}
                onChange={e => setInputMinutes(e.target.value)}
                placeholder="？"
                className="w-16 px-2 py-2 border-2 border-gray-300 rounded-lg
                           text-center text-lg"
              />
              <span className="font-bold">ふん</span>
            </div>
          )}

        </div>
      </div>

      {/* コイン表示 */}
      <CoinDisplay coins={coins} />

    </div>
  )
}

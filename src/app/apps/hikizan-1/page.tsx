// ======================================================
// ひきざん１ ページ
//
// URL: /apps/hikizan-1
// 対象: 小学1〜2年生
// 内容: 数図ブロックを使ったひきざん練習
//
// 難易度4段階:
//   ① ～10のかず    → 答えが 0〜9
//   ② 10-□         → ひかれる数が必ず 10
//   ③ 1□-□         → 繰り下がりなし（答えが 1〜9）
//   ④ 1□-□（繰り下がり） → 繰り下がりあり（答えが 2〜9）
//
// 操作:
//   「もんだい」    → ランダムに問題を自動生成
//   「セット」      → 式の入力欄に直接入力して問題をセット
//   「こたえをみる」→ 答えを答え欄に表示
//   「こたえあわせ」→ 入力した答えを判定
//   数字ボタン      → そのままクリックで答えを送信
// ======================================================

"use client"

import { useState, useRef, useEffect } from "react"
import * as se from "@/components/apps/suuzu-block/se"
import { HikizanBlock } from "@/components/apps/hikizan-1/HikizanBlock"
import { BtnQuestion } from "@/components/parts/buttons/BtnQuestion"
import { BtnCheck } from "@/components/parts/buttons/BtnCheck"
import { BtnNum } from "@/components/parts/buttons/BtnNum"
import { PutText } from "@/components/parts/displays/PutText"
import { BtnSet } from "@/components/parts/buttons/BtnSet"
import { BtnShowAnswer } from "@/components/parts/buttons/BtnShowAnswer"
import { PutShiki } from "@/components/parts/displays/PutShiki"
import { HidePanel } from "@/components/parts/block/HidePanel"
import { useCoins } from "@/hooks/useCoins"

// ── 定数 ─────────────────────────────────────────────

// 難易度の選択肢
const ITEMS = ["～10のかず", "10-□", "1□-□", "1□-□（くりさがり）"]

// 数字ボタン（1行目: 0〜10 / 2行目: 11〜20）
const NUM_1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const NUM_2 = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

// ── コンポーネント ───────────────────────────────────

export default function Hikizan1Page() {
  // ── 状態管理 ─────────────────────────────────────
  const [selectIndex, setSelectIndex] = useState<number>(0)   // 選択中の難易度
  const [hasProblem, setHasProblem]   = useState<boolean>(false) // 問題が出ているか
  const [leftValue,  setLeftValue]    = useState<number>(0)   // ひかれる数（ブロック表示に使用）

  // 答えは表示不要なので useRef で管理（useState にすると不要な再レンダが発生）
  const answerRef      = useRef<number>(0)
  // 1問につき初回正解のみコインを付与するフラグ
  const hasAnsweredRef = useRef<boolean>(false)

  // 各入力欄への参照
  const el_text        = useRef<HTMLDivElement | null>(null)
  const el_left_input  = useRef<HTMLInputElement | null>(null)
  const el_right_input = useRef<HTMLInputElement | null>(null)
  const el_answer      = useRef<HTMLInputElement | null>(null)

  // コインシステム（全アプリ共通フック）
  const { addCoins } = useCoins()

  // ── 難易度変更時の初期化 ──────────────────────────
  useEffect(() => {
    setHasProblem(false)
    setLeftValue(0)
    if (el_left_input.current)  el_left_input.current.value  = ""
    if (el_right_input.current) el_right_input.current.value = ""
    if (el_text.current)        el_text.current.innerHTML    = "もんだい　または　セット"
  }, [selectIndex])

  // ── イベントハンドラー ────────────────────────────

  // 難易度を選択する
  const changeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    se.playSe(se.reset)
    setSelectIndex(e.target.selectedIndex)
  }

  // 「もんだい」ボタン：難易度に応じてランダムな問題を生成する
  const giveQuestion = () => {
    se.playSe(se.pi)
    setHasProblem(true)
    hasAnsweredRef.current = false
    if (el_text.current)   el_text.current.innerHTML   = ""
    if (el_answer.current) el_answer.current.value     = ""

    let lv = 0, rv = 0

    switch (selectIndex) {
      case 0: // ～10のかず（答え 0〜9）
        lv = Math.floor(Math.random() * 10 + 1)
        rv = Math.floor(Math.random() * lv + 1)
        break
      case 1: // 10-□（ひかれる数が必ず 10）
        lv = 10
        rv = Math.floor(Math.random() * 10 + 1)
        break
      case 2: // 1□-□（繰り下がりなし）
        lv = Math.floor(Math.random() * 9 + 11)
        rv = Math.floor(Math.random() * (lv - 11))
        break
      case 3: {
        // 1□-□（繰り下がりあり）
        // lv の一の位 < rv になるよう調整する
        lv = Math.floor(Math.random() * 9 + 11)
        const ichi = 20 - lv
        rv = Math.floor(Math.random() * ichi + (10 - ichi))
        break
      }
    }

    answerRef.current = lv - rv
    setLeftValue(lv)
    if (el_left_input.current)  el_left_input.current.value  = lv.toString()
    if (el_right_input.current) el_right_input.current.value = rv.toString()
  }

  // 「セット」ボタン：入力欄の数値を問題としてセットする
  const setQuest = () => {
    const lv = Number(el_left_input.current?.value  ?? "")
    const rv = Number(el_right_input.current?.value ?? "")
    if (el_answer.current) el_answer.current.value = ""

    // 未入力チェック
    if (!el_left_input.current?.value || !el_right_input.current?.value) {
      se.playSe(se.alertSound)
      if (el_text.current) el_text.current.innerHTML = "しきを　セット　して　ください。"
      setTimeout(() => {
        setHasProblem(false)
        if (el_text.current)        el_text.current.innerHTML    = "もんだい　または　セット"
        if (el_left_input.current)  el_left_input.current.value  = ""
        if (el_right_input.current) el_right_input.current.value = ""
      }, 1000)
      return
    }

    // 範囲チェック（ひかれる数 ≥ ひく数・0〜20 のみ受け付ける）
    if (lv > 20 || rv > lv || lv < 0 || rv < 0) {
      se.playSe(se.alertSound)
      alert("すうじは　0～20。ひかれるかず ≧ ひくかず")
      if (el_left_input.current)  el_left_input.current.value  = ""
      if (el_right_input.current) el_right_input.current.value = ""
      return
    }

    se.playSe(se.pi)
    setHasProblem(true)
    hasAnsweredRef.current = false
    answerRef.current = lv - rv
    setLeftValue(lv)
    if (el_text.current) el_text.current.innerHTML = ""
  }

  // 「こたえをみる」ボタン：答えを答え欄に表示する
  const showAnswer = () => {
    if (!hasProblem) return
    se.playSe(se.seikai1)
    if (el_answer.current) {
      // すでに正解が入っていたら空にする（トグル動作）
      el_answer.current.value =
        parseInt(el_answer.current.value) === answerRef.current
          ? ""
          : answerRef.current.toString()
    }
  }

  // 正誤を判定して結果を表示する（数字ボタン・こたえあわせ共通）
  const checkAnswer = (myAnswer: number) => {
    if (!hasProblem) return
    setHasProblem(false)
    if (el_answer.current) el_answer.current.value = myAnswer.toString()

    if (myAnswer === answerRef.current) {
      // ── 正解 ──
      if (!hasAnsweredRef.current) {
        addCoins(1)  // 初回正解のみコイン付与
        hasAnsweredRef.current = true
      }
      se.playSe(se.right)
      if (el_text.current)
        el_text.current.innerHTML = `<span style="color:red;">せいかい</span>`
    } else {
      // ── 不正解：1秒後に再入力可能に ──
      se.playSe(se.alertSound)
      if (el_text.current) {
        const prevText = el_text.current.innerHTML
        el_text.current.innerHTML = `<span style="color:gray;">ちがうよ</span>`
        setTimeout(() => {
          setHasProblem(true)
          if (el_text.current) el_text.current.innerHTML = prevText
        }, 1000)
      }
    }
  }

  // 「こたえあわせ」ボタン：答え欄に入力した値で判定する
  // ※ ひきざんは答えが 0 になる場合があるため、isNaN チェックを使う
  const checkAnswerEvent = () => {
    if (!hasProblem) return
    const val = el_answer.current?.value ?? ""
    const myAnswer = parseInt(val)
    if (val !== "" && !isNaN(myAnswer)) {
      checkAnswer(myAnswer)
    } else {
      se.playSe(se.alertSound)
      if (el_text.current) {
        el_text.current.innerHTML = "すうじを　おすか、こたえを　いれてから「こたえあわせ」"
        setTimeout(() => {
          if (el_text.current) el_text.current.innerHTML = ""
        }, 1000)
      }
    }
  }

  // ── 描画 ─────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
        ➖ ひきざん１
      </h1>

      {/* コントロール行：難易度選択 ＋ 操作ボタン */}
      <div className="flex flex-wrap justify-center items-center">
        {/* 難易度セレクト */}
        <select
          onChange={changeSelect}
          className="text-center font-bold m-2 p-2 min-w-24 text-base md:text-xl
                     border-brand-500 text-black dark:text-gray-100 dark:bg-gray-700
                     border-2 rounded-lg shadow-lg"
        >
          {ITEMS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <BtnQuestion handleEvent={giveQuestion} />
        <BtnSet      handleEvent={setQuest} />
        <BtnShowAnswer handleEvent={showAnswer} />
      </div>

      {/* メッセージエリア */}
      <PutText el_text={el_text} />

      {/* 式表示エリア ＋ こたえあわせボタン */}
      <div className="flex justify-center items-center">
        <PutShiki
          kigo="－"
          el_left_input={el_left_input}
          el_right_input={el_right_input}
          el_answer={el_answer}
        />
        <BtnCheck handleEvent={checkAnswerEvent} />
      </div>

      {/* 数図ブロック（ひかれる数のみ表示） */}
      <HikizanBlock leftCount={leftValue} />

      {/* かくすパネル：ブロックの上にかぶせてひき算を疑似体験 */}
      {/* height:0 + overflow:visible でDOMの高さを消す → 数字ボタンとの隙間をなくす */}
      <div className="flex justify-center" style={{ height: 0, overflow: "visible" }}>
        <HidePanel />
      </div>

      {/* 数字ボタン 0〜10 */}
      <BtnNum ITEM={NUM_1} handleEvent={checkAnswer} />
      {/* 数字ボタン 11〜20 */}
      <BtnNum ITEM={NUM_2} handleEvent={checkAnswer} />

    </div>
  )
}

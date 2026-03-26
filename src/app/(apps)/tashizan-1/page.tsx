// ======================================================
// たしざん１ ページ
//
// URL: /tashizan-1
// 対象: 小学1〜2年生
// 内容: 数図ブロックを使ったたしざん練習
//
// 難易度4段階:
//   ① 10までの　かず  → 答えが 1〜10
//   ② 10+□,□+10    → 答えが 11〜20（一方が必ず 10）
//   ③ 1□+□,□+1□   → 繰り上がりあり（答えが 12〜20）
//   ④ 20までの　かず  → 全体的なたしざん
//
// 操作:
//   「もんだい」    → ランダムに問題を自動生成
//   「セット」      → 式の入力欄に直接入力して問題をセット
//   「こたえをみる」→ 答えを答え欄に表示
//   「こたえあわせ」→ 入力した答えを判定
//   数字ボタン      → そのままクリックで答えを送信
// ======================================================

"use client"

import { useState, useRef } from "react"
import * as se from "@/lib/se"
import { BlockArea } from "@/components/parts/block/BlockArea"
import { BtnQuestion } from "@/components/parts/buttons/BtnQuestion"
import { BtnCheck } from "@/components/parts/buttons/BtnCheck"
import { BtnNum } from "@/components/parts/buttons/BtnNum"
import { PutText } from "@/components/parts/displays/PutText"
import { BtnSet } from "@/components/parts/buttons/BtnSet"
import { BtnShowAnswer } from "@/components/parts/buttons/BtnShowAnswer"
import { PutShiki } from "@/components/parts/displays/PutShiki"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { useAnswerCheck } from "@/hooks/useAnswerCheck"
import { NUM_1, NUM_2 } from "@/lib/constants"

// ── 定数 ─────────────────────────────────────────────

// 難易度の選択肢
const ITEMS = ["10までの　かず", "10+□,□+10", "1□+□,□+1□", "20までの　かず"]

// ── コンポーネント ───────────────────────────────────

export default function Tashizan1Page() {
  // ── 状態管理 ─────────────────────────────────────
  const [selectIndex, setSelectIndex] = useState<number>(0)  // 選択中の難易度
  const [hasProblem, setHasProblem]   = useState<boolean>(false) // 問題が出ているか
  const [leftValue,  setLeftValue]    = useState<number>(0)  // たされる数（ブロック表示に使用）
  const [rightValue, setRightValue]   = useState<number>(0)  // たす数（ブロック表示に使用）

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
  const { coins, addCoins } = useCoins()

  // 正誤判定フック（tashizan-1 は hasProblem を false→true と切り替えるパターン）
  const { checkAnswer } = useAnswerCheck({
    addCoins,
    hasAnsweredRef,
    // 不正解時に1秒後に戻すテキストは el_text の現在値をそのまま使う
    getPrevText: () => el_text.current?.innerHTML ?? "",
    el_text,
    // 不正解後1秒で再入力可能に（hasProblem を true に戻す）
    onWrongRestore: () => setHasProblem(true),
  })

  // ── イベントハンドラー ────────────────────────────

  // 難易度を選択する（選択時にリセット処理もまとめて行う）
  const changeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    se.playSe(se.reset)
    setSelectIndex(e.target.selectedIndex)
    setHasProblem(false)
    setLeftValue(0)
    setRightValue(0)
    if (el_left_input.current)  el_left_input.current.value  = ""
    if (el_right_input.current) el_right_input.current.value = ""
    if (el_text.current)        el_text.current.innerHTML    = "もんだい　または　セット"
  }

  // 「もんだい」ボタン：難易度に応じてランダムな問題を生成する
  const giveQuestion = () => {
    se.playSe(se.pi)
    setHasProblem(true)
    hasAnsweredRef.current = false
    if (el_text.current)   el_text.current.innerHTML   = ""
    if (el_answer.current) el_answer.current.value     = ""

    let lv = 0, rv = 0, ans = 0
    const mode = Math.floor(Math.random() * 2 + 1) // 1 or 2（左右どちらが大きい数か）

    switch (selectIndex) {
      case 0: // 10までのかず（答え 1〜10）
        ans = Math.floor(Math.random() * 10 + 1)
        lv  = Math.floor(Math.random() * (ans + 1))
        rv  = ans - lv
        break
      case 1: // 10+□ または □+10（答え 11〜20）
        ans = Math.floor(Math.random() * 10 + 11)
        if (mode === 1) { lv = 10; rv = ans - lv }
        else            { rv = 10; lv = ans - rv }
        break
      case 2: // 繰り上がりあり（答え 12〜20）
        ans = Math.floor(Math.random() * 9 + 12)
        if (mode === 1) { lv = Math.floor(Math.random() * (ans - 11) + 1); rv = ans - lv }
        else            { rv = Math.floor(Math.random() * (ans - 11) + 1); lv = ans - rv }
        break
      case 3: // 20までのかず（全体）
        lv  = Math.floor(Math.random() * 9 + 2)
        rv  = Math.floor(Math.random() * lv + (10 - lv) + 1)
        ans = lv + rv
        break
    }

    answerRef.current = ans
    setLeftValue(lv)
    setRightValue(rv)
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

    // 範囲チェック（0〜20 のみ受け付ける）
    if (lv > 20 || rv > 20 || lv < 0 || rv < 0) {
      se.playSe(se.alertSound)
      if (el_text.current) {
        el_text.current.innerHTML = "すうじは　0〜20"
        setTimeout(() => {
          if (el_text.current) el_text.current.innerHTML = "もんだい　または　セット"
        }, 1000)
      }
      if (el_left_input.current)  el_left_input.current.value  = ""
      if (el_right_input.current) el_right_input.current.value = ""
      return
    }

    se.playSe(se.pi)
    setHasProblem(true)
    hasAnsweredRef.current = false
    answerRef.current = lv + rv
    setLeftValue(lv)
    setRightValue(rv)
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
  // useAnswerCheck フックの checkAnswer をラップして前処理を追加する
  const handleCheckAnswer = (myAnswer: number) => {
    if (!hasProblem) return
    setHasProblem(false)
    if (el_answer.current) el_answer.current.value = myAnswer.toString()
    checkAnswer(myAnswer, answerRef.current)
  }

  // 「こたえあわせ」ボタン：答え欄に入力した値で判定する
  const checkAnswerEvent = () => {
    if (!hasProblem) return
    const val = el_answer.current?.value ?? ""
    const myAnswer = parseInt(val, 10)
    // val が空 または 数値でない場合はガイドメッセージを表示
    if (val !== "" && !isNaN(myAnswer)) {
      handleCheckAnswer(myAnswer)
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
        ➕ たしざん１
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
          kigo="＋"
          el_left_input={el_left_input}
          el_right_input={el_right_input}
          el_answer={el_answer}
        />
        <BtnCheck handleEvent={checkAnswerEvent} />
      </div>

      {/* 数図ブロック（upper-first: 上テーブルを優先して埋める） */}
      <BlockArea
        containerId="tashizan-block-area"
        counts={[
          leftValue  <= 10 ? leftValue  : 10,   // 左上
          rightValue <= 10 ? rightValue : 10,   // 右上
          leftValue  >  10 ? leftValue  - 10 : 0, // 左下
          rightValue >  10 ? rightValue - 10 : 0, // 右下
        ]}
      />

      {/* 数字ボタン 0〜10 */}
      <BtnNum ITEM={NUM_1} handleEvent={handleCheckAnswer} />
      {/* 数字ボタン 11〜20 */}
      <BtnNum ITEM={NUM_2} handleEvent={handleCheckAnswer} />

      {/* コイン表示 */}
      <CoinDisplay coins={coins} />

    </div>
  )
}

// ======================================================
// いくつといくつ ページ
//
// URL: /ikutu
// 対象: 小学1年生
// 内容: 選んだ数をふたつに分ける問題を解く
//
// 操作:
//   セレクト        → 対象の数（5〜10）を選ぶ
//   「もんだい」    → ランダムに問題を生成
//   数字ボタン      → □ に入る数を答える
//
// 問題の形式:
//   「n は □ と m」または「n は m と □」（左右ランダム）
//   例）「6 は □ と 4」→ 2 と答える
//
// 注意:
//   答えが 0 になるケースがある（例：「6 は □ と 6」→ 0）
//   isNaN チェックで正しく判定する。
// ======================================================

"use client"

import { useState, useRef, useEffect } from "react"
import * as se from "@/lib/se"
import { BlockArea } from "@/components/parts/block/BlockArea"
import { BtnQuestion } from "@/components/parts/buttons/BtnQuestion"
import { BtnNum } from "@/components/parts/buttons/BtnNum"
import { PutText } from "@/components/parts/displays/PutText"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { useAnswerCheck } from "@/hooks/useAnswerCheck"

// ── 定数 ─────────────────────────────────────────────

// 数字ボタン（0〜10）
const NUM = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// セレクトの選択肢（対象の数）
const SELECT_ITEMS = [5, 6, 7, 8, 9, 10]

// ── コンポーネント ───────────────────────────────────

export default function IkutuPage() {
  // ── 状態管理 ─────────────────────────────────────
  const [hasProblem, setHasProblem]   = useState<boolean>(false)  // 問題が出ているか
  const [selectValue, setSelectValue] = useState<number>(5)       // 選択中の数
  const [answer, setAnswer]           = useState<number>(0)       // □ の正解値

  // 1問につき初回正解のみコインを付与するフラグ
  const hasAnsweredRef = useRef<boolean>(false)

  // メッセージ表示エリアへの参照
  const el_text = useRef<HTMLDivElement | null>(null)

  // コインシステム（全アプリ共通フック）
  const { coins, addCoins } = useCoins()

  // 正誤判定フック（ikutu は hasProblem を false→true と切り替えるパターン）
  const { checkAnswer } = useAnswerCheck({
    addCoins,
    hasAnsweredRef,
    // 不正解時に1秒後に戻すテキストは el_text の現在値をそのまま使う
    getPrevText: () => el_text.current?.innerHTML ?? "",
    el_text,
    // 不正解後1秒で再入力可能に（hasProblem を true に戻す）
    onWrongRestore: () => setHasProblem(true),
  })

  // 初期メッセージを表示する
  useEffect(() => {
    if (el_text.current) {
      el_text.current.innerHTML = "かずをえらんで　もんだいをおそう"
    }
  }, [])

  // ── イベントハンドラー ────────────────────────────

  // セレクトで対象の数を変更する
  const changeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    se.playSe(se.reset)
    setSelectValue(parseInt(e.target.value, 10))
    setHasProblem(false)
    if (el_text.current) el_text.current.innerHTML = ""
  }

  // 「もんだい」ボタン：ランダムに問題を生成する
  const giveQuestion = () => {
    se.playSe(se.pi)
    setHasProblem(true)
    hasAnsweredRef.current = false

    const n = selectValue

    // □ を左に置くか右に置くかランダムに決める（1=左、2=右）
    const dir = Math.floor(Math.random() * 2 + 1)

    // □ の正解値（0 〜 n-1 のランダム）
    const ans = Math.floor(Math.random() * n)

    // 問題テキストを組み立てる
    let left: number | string
    let right: number | string
    if (dir === 1) {
      // 左が□：「n は □ と (n - ans)」
      left = "□"
      right = n - ans
    } else {
      // 右が□：「n は (n - ans) と □」
      left = n - ans
      right = "□"
    }

    if (el_text.current) {
      el_text.current.innerHTML = `${n} は　${left} と ${right}`
    }
    setAnswer(ans)
  }

  // 数字ボタンで答えを送信して正誤を判定する
  // useAnswerCheck フックの checkAnswer をラップして前処理を追加する
  const handleCheckAnswer = (myAnswer: number) => {
    if (!hasProblem) return
    setHasProblem(false)
    checkAnswer(myAnswer, answer)
  }

  // ── 描画 ─────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
        🔢 いくつといくつ
      </h1>

      {/* セレクト行 */}
      <div className="flex justify-center items-center">
        <select
          onChange={changeSelect}
          className="text-center font-bold m-2 p-2 min-w-16 text-base md:text-xl
                     border-brand-500 text-black dark:text-gray-100 dark:bg-gray-700
                     border-2 rounded-lg shadow-lg"
        >
          {SELECT_ITEMS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        {/* セレクトの右に説明ラベルを表示 */}
        <span className="font-bold text-brand-600 dark:text-brand-400"
              style={{ fontSize: "max(2vw, 20px)" }}>
          ← かずをえらぼう
        </span>
      </div>

      {/* メッセージエリア（問題テキスト・正誤結果を表示） */}
      <PutText el_text={el_text} />

      {/* 数図ブロック：selectValue 個だけ上テーブルに表示 */}
      {/* counts=[selectValue, 0, 0, 0] → 左上テーブルのみ使用 */}
      <BlockArea
        containerId="ikutu-block-area"
        counts={[selectValue, 0, 0, 0]}
      />

      {/* 数字ボタン 0〜10（□ に入る数を選ぶ） */}
      <BtnNum ITEM={NUM} handleEvent={handleCheckAnswer} />

      {/* もんだいボタン */}
      <div className="flex justify-center mt-2">
        <BtnQuestion handleEvent={giveQuestion} />
      </div>

      {/* コイン表示 */}
      <CoinDisplay coins={coins} />

    </div>
  )
}

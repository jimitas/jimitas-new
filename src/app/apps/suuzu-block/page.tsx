// ======================================================
// すうずぶろっく ページ
//
// URL: /apps/suuzu-block
// 対象: 小学1年生
// 内容: ブロックを並べながら数の概念を学ぶアプリ
//
// 4つのモード:
//   ① なんこならべたかな？ → 自由に並べてカウント確認
//   ② ならべたかずはいくつ？ → ブロックが自動で並ぶ、数字ボタンで答える
//   ③ ならべよう → 指定数のブロックを並べる
//   ④ しゅうちゅう → ブロックだけ表示（先生の投影モード）
// ======================================================

"use client"

import { useState, useRef, useEffect } from "react"
import * as se from "@/components/apps/suuzu-block/se"
import { Block } from "@/components/apps/suuzu-block/Block"
import { BtnQuestion } from "@/components/apps/suuzu-block/BtnQuestion"
import { BtnCheck } from "@/components/apps/suuzu-block/BtnCheck"
import { BtnNum } from "@/components/apps/suuzu-block/BtnNum"
import { PutText } from "@/components/apps/suuzu-block/PutText"
import { useCoins } from "@/hooks/useCoins"

// ── 定数 ─────────────────────────────────────────────

// 数字ボタンの配列（mode 2 で使用）
const NUM_1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const NUM_2 = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

// モードの型（1〜4）
type Mode = 1 | 2 | 3 | 4

// 難易度の型
type Difficulty = "1-5" | "1-10" | "11-20" | "1-20"

// モード一覧（ラベルとモード番号のペア）
const MODE_LABELS: { label: string; mode: Mode }[] = [
  { label: "なんこならべたかな？", mode: 1 },
  { label: "ならべたかずはいくつ？", mode: 2 },
  { label: "ならべよう", mode: 3 },
  { label: "しゅうちゅう", mode: 4 },
]

// 難易度一覧
const DIFFICULTIES: { label: string; value: Difficulty }[] = [
  { label: "１〜５",  value: "1-5"  },
  { label: "１〜１０", value: "1-10" },
  { label: "１１〜２０", value: "11-20" },
  { label: "１〜２０", value: "1-20" },
]

// 各モードの初期メッセージ
const INIT_TEXT: Record<Mode, string> = {
  1: "ぶろっくをならべて「たしかめ」をおそう",
  2: "「もんだい」をおそう",
  3: "「もんだい」をおそう",
  4: "",
}

// ── コンポーネント ───────────────────────────────────

export default function KazuBlockPage() {
  // ── 状態管理 ────────────────────────────────────────
  const el_text = useRef<HTMLDivElement>(null)

  const [mode, setMode]               = useState<Mode>(1)
  const [difficulty, setDifficulty]   = useState<Difficulty>("1-10")
  const [questionNum, setQuestionNum] = useState<number | null>(null)
  const [autoCount, setAutoCount]     = useState<number>(0)
  const [countInArea, setCountInArea] = useState<number>(0)
  const [showToast, setShowToast]     = useState<boolean>(true)

  // 1問につき初回正解のみコイン付与するためのフラグ
  const hasAnsweredRef = useRef(false)

  // コインシステム（jimitas-new 共通フック）
  const { coins, addCoins, resetCoins } = useCoins()

  // ページ読み込み時の初期メッセージ設定
  useEffect(() => {
    if (el_text.current) {
      el_text.current.innerHTML = INIT_TEXT[1]
    }
  }, [])

  // ── ヘルパー ────────────────────────────────────────

  // 難易度から出題範囲（min〜max）を返す
  const getRange = () => {
    if (difficulty === "1-5")   return { min: 1, max: 5 }
    if (difficulty === "1-10")  return { min: 1, max: 10 }
    if (difficulty === "11-20") return { min: 11, max: 20 }
    return { min: 1, max: 20 }
  }

  // ── イベントハンドラー ──────────────────────────────

  // トースト（起動時の説明）を閉じる
  const closeToast = () => {
    se.set.play()
    setShowToast(false)
  }

  // モード切り替え
  const changeMode = (m: Mode) => {
    se.set.play()
    setMode(m)
    setQuestionNum(null)
    setAutoCount(0)
    hasAnsweredRef.current = false
    if (el_text.current) el_text.current.innerHTML = INIT_TEXT[m]
  }

  // 問題を出す（mode 2・3 共通）
  const giveQuestion = () => {
    se.pi.play()
    const { min, max } = getRange()
    const n = Math.floor(Math.random() * (max - min + 1) + min)
    setQuestionNum(n)
    hasAnsweredRef.current = false

    if (mode === 2) {
      // mode 2: ブロックを自動配置して「何個？」と聞く
      setAutoCount(n)
      if (el_text.current)
        el_text.current.innerHTML = "ぶろっくは　なんこ　ならんでいるかな？"
    } else {
      // mode 3: ブロックを空にして「○個並べよう」と言う
      setAutoCount(0)
      if (el_text.current)
        el_text.current.innerHTML =
          `<span style="color:blue;">${n}</span>こ　ならべましょう`
    }
  }

  // たしかめボタン（mode 1: カウント表示 / mode 3: 正誤判定）
  const checkCount = () => {
    if (mode === 1) {
      // mode 1: 現在の個数を表示するだけ
      se.seikai1.play()
      if (el_text.current)
        el_text.current.innerHTML =
          `いま<span style="color:red;">${countInArea}</span>こ　ならんでいるよ`
      return
    }

    // mode 3: 正誤判定
    if (questionNum === null) {
      se.alertSound.play()
      if (el_text.current)
        el_text.current.innerHTML = "「もんだい」をおしてください"
      return
    }

    if (countInArea === questionNum) {
      // 正解
      if (!hasAnsweredRef.current) {
        addCoins(1)                  // コインを1枚追加
        hasAnsweredRef.current = true
      }
      se.right.play()
      if (el_text.current)
        el_text.current.innerHTML = `<span style="color:red;">せいかい</span>`
      setQuestionNum(null)
    } else {
      // 不正解
      se.alertSound.play()
      if (el_text.current) {
        const prevText = el_text.current.innerHTML
        el_text.current.innerHTML = `<span style="color:gray;">ちがうよ</span>`
        setTimeout(() => {
          if (el_text.current) el_text.current.innerHTML = prevText
        }, 1000)
      }
    }
  }

  // 数字ボタン（mode 2: 正誤判定）
  const checkAnswerNum = (myAnswer: number) => {
    if (questionNum === null) {
      se.alertSound.play()
      if (el_text.current)
        el_text.current.innerHTML = "「もんだい」をおしてください"
      return
    }

    if (myAnswer === questionNum) {
      // 正解
      if (!hasAnsweredRef.current) {
        addCoins(1)
        hasAnsweredRef.current = true
      }
      se.right.play()
      if (el_text.current)
        el_text.current.innerHTML = `<span style="color:red;">せいかい</span>`
      setQuestionNum(null)
    } else {
      // 不正解
      se.alertSound.play()
      if (el_text.current) {
        const prevText = el_text.current.innerHTML
        el_text.current.innerHTML = `<span style="color:gray;">ちがうよ</span>`
        setTimeout(() => {
          if (el_text.current) el_text.current.innerHTML = prevText
        }, 1000)
      }
    }
  }

  // コインリセット（掛け算問題に正解した場合のみリセット）
  const handleResetCoins = () => {
    se.set.play()
    const num1 = Math.floor(Math.random() * 90) + 10
    const num2 = Math.floor(Math.random() * 9) + 1
    const correct = num1 * num2
    const ans = prompt(
      `コインをリセットするには　けいさんもんだいに　こたえてください。\n\n${num1} × ${num2} = ?`
    )
    if (ans === null) return

    if (parseInt(ans, 10) === correct) {
      resetCoins()
      se.seikai1.play()
      alert("せいかい！　コインをリセットしました。")
    } else {
      se.alertSound.play()
      alert(`ちがいます。こたえは　${correct}　でした。`)
    }
  }

  // ── レンダリング ────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">

      {/* ===== ページタイトル ===== */}
      <header className="text-center mt-4 md:mt-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
          ぶろっく
        </h1>
      </header>

      <main className="flex-grow mt-4">

        {/* ===== 起動時トースト（使い方説明） ===== */}
        {showToast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md mx-4 flex flex-col max-h-[90vh]">
              <div className="overflow-y-auto p-4 md:p-6 flex-1">

                <h2 className="text-center text-lg md:text-2xl font-bold text-blue-600 mb-3">
                  🎯 ぶろっくのつかいかた
                </h2>
                <p className="text-center text-sm text-gray-600 mb-3">
                  ぶろっくをならべながら　かずをまなぼう！<br />
                  したの４つのモードからえらんでね。
                </p>

                {/* 4モードの説明 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3">
                    <span className="text-2xl">①</span>
                    <div>
                      <div className="font-bold text-blue-700">なんこならべたかな？</div>
                      <div className="text-sm text-gray-600">
                        ぶろっくをならべて「たしかめ」をおすと　いまなんこならんでいるか　おしえてくれるよ
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-green-50 rounded-xl p-3">
                    <span className="text-2xl">②</span>
                    <div>
                      <div className="font-bold text-green-700">ならべたかずはいくつ？</div>
                      <div className="text-sm text-gray-600">
                        「もんだい」をおすと　ぶろっくがならぶよ。なんこならんでいるか　すうじボタンでこたえよう
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-orange-50 rounded-xl p-3">
                    <span className="text-2xl">③</span>
                    <div>
                      <div className="font-bold text-orange-700">ならべよう</div>
                      <div className="text-sm text-gray-600">
                        「もんだい」をおすと　「○こならべましょう」ともんだいがでるよ。はこからぶろっくをうごかしてならべよう
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-purple-50 rounded-xl p-3">
                    <span className="text-2xl">④</span>
                    <div>
                      <div className="font-bold text-purple-700">しゅうちゅう</div>
                      <div className="text-sm text-gray-600">
                        ぶろっくだけをひょうじするモードだよ。もんだいなどをかくして　じゆうにぶろっくをうごかせるよ
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* はじめるボタン */}
              <div className="p-4 md:p-6 pt-0">
                <button
                  onClick={closeToast}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 active:translate-y-0.5
                             text-white font-bold text-lg rounded-xl shadow-md transition-colors"
                >
                  はじめる！
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== モード選択トグル ===== */}
        <div className="flex flex-wrap justify-center gap-2 my-3">
          {MODE_LABELS.map(({ label, mode: m }) => {
            // しゅうちゅうモード中は他のモードボタンを非表示にする
            if (mode === 4 && m !== 4) return null
            return (
              <button
                key={m}
                onClick={() => changeMode(m === 4 && mode === 4 ? 1 : m)}
                className={`font-bold px-3 py-2 rounded-lg border-2 text-sm md:text-base transition-colors
                  ${mode === m && m !== 4
                    ? "bg-blue-500 text-white border-blue-500"         // 選択中
                    : m === 4
                    ? "bg-purple-500 text-white border-purple-500 hover:bg-purple-600" // しゅうちゅうボタン
                    : "bg-white text-blue-500 border-blue-300 hover:bg-blue-50"        // 未選択
                  }`}
              >
                {/* しゅうちゅう中は「かいじょする」と表示 */}
                {m === 4 && mode === 4 ? "かいじょする" : label}
              </button>
            )
          })}
        </div>

        {/* ===== 難易度選択（mode 2・3 のみ表示） ===== */}
        {(mode === 2 || mode === 3) && (
          <div className="flex flex-wrap justify-center gap-4 my-2">
            {DIFFICULTIES.map(({ label, value }) => (
              <label
                key={value}
                className="flex items-center gap-1 cursor-pointer text-sm md:text-base font-bold"
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={value}
                  checked={difficulty === value}
                  onChange={() => { se.set.play(); setDifficulty(value) }}
                  className="w-4 h-4"
                />
                {label}
              </label>
            ))}
          </div>
        )}

        {/* ===== アクションボタン（しゅうちゅうモード以外） ===== */}
        {mode !== 4 && (
          <div className="flex flex-wrap justify-center items-center">
            {/* mode 2・3: 問題ボタン */}
            {(mode === 2 || mode === 3) && (
              <BtnQuestion handleEvent={giveQuestion} />
            )}
            {/* mode 1・3: たしかめボタン */}
            {(mode === 1 || mode === 3) && (
              <BtnCheck handleEvent={checkCount} btnText="たしかめ" />
            )}
          </div>
        )}

        {/* ===== メッセージエリア（しゅうちゅうモード以外） ===== */}
        {mode !== 4 && <PutText el_text={el_text} />}

        {/* ===== ブロックエリア（全モード表示） ===== */}
        <div className="place">
          <Block
            autoCount={autoCount}
            lowerEnabled={mode !== 2}   // mode 2 は木箱を非表示（自動配置のため）
            onCountChange={setCountInArea}
          />
        </div>

        {/* ===== 数字ボタン（mode 2 のみ） ===== */}
        {mode === 2 && (
          <>
            <BtnNum ITEM={NUM_1} handleEvent={checkAnswerNum} />
            <BtnNum ITEM={NUM_2} handleEvent={checkAnswerNum} />
          </>
        )}

        {/* ===== コインエリア（しゅうちゅうモード中は非表示） ===== */}
        {mode !== 4 && (
          <div
            className="flex items-center gap-3 mx-auto my-4 px-4 py-3
                       rounded-xl bg-amber-50 border-2 border-amber-300"
            style={{ width: "max(44vw, 440px)" }}
          >
            {/* コインのアイコン表示エリア */}
            <div className="flex flex-wrap gap-1 flex-1 min-h-[44px] items-center">
              {/* coins 枚分のコインアイコンを表示 */}
              {Array.from({ length: coins }).map((_, i) => (
                <span key={i} className="text-2xl">🪙</span>
              ))}
            </div>

            {/* 枚数 + リセットボタン */}
            <div className="text-right shrink-0">
              <div className="text-xs text-amber-700 font-bold">{coins}まい</div>
              <button
                onClick={handleResetCoins}
                className="mt-1 text-xs px-2 py-1 bg-red-400 hover:bg-red-500
                           text-white rounded-lg font-bold transition-colors"
              >
                リセット
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

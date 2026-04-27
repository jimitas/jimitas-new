"use client"
import { useState } from "react"
import Image from "next/image"
import { BtnShowAnswer } from "@/components/parts/buttons/BtnShowAnswer"
import * as se from "@/lib/se"

type Mode = "cherry" | "banana" | "clip"

type Problem = {
  mode: Mode
  imageCount: number  // 表示する画像の枚数
  answer: number      // 実際の個数（cherry: 枚数×2、banana: 枚数×5、clip: 枚数×1）
}

// さくらんぼ: 1枚の画像に2個の実 → 5〜9枚表示 → 答え = 枚数×2
// バナナ:     1枚の画像に5本の房 → 2〜4枚表示 → 答え = 枚数×5
// クリップ:   1枚の画像に1個     → 11〜19枚バラバラ表示 → 答え = 枚数×1
function makeProblem(mode: Mode): Problem {
  if (mode === "cherry") {
    const n = Math.floor(Math.random() * 5 + 5)  // 5〜9
    return { mode, imageCount: n, answer: n * 2 }
  } else if (mode === "banana") {
    const n = Math.floor(Math.random() * 3 + 2)  // 2〜4
    return { mode, imageCount: n, answer: n * 5 }
  } else {
    const n = Math.floor(Math.random() * 9 + 11)  // 11〜19
    return { mode, imageCount: n, answer: n }
  }
}

const MODE_HINT: Record<Mode, string> = {
  cherry: "２こずつ数えよう！",
  banana: "５こずつ数えよう！",
  clip: "１つずつ数えよう！",
}

// クリップ用のランダム配置データ（再レンダリングで変わらないよう Problem に持たせる）
type ClipPos = { left: number; top: number; rotate: number }

function makeClipPositions(n: number): ClipPos[] {
  return Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + 7) % 85,
    top: (i * 53 + 11) % 70,
    rotate: (i * 73) % 180,
  }))
}

export default function KazuPage() {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [clipPos, setClipPos] = useState<ClipPos[]>([])
  const [showAnswer, setShowAnswer] = useState(false)

  function start(mode: Mode) {
    const p = makeProblem(mode)
    setProblem(p)
    setShowAnswer(false)
    if (mode === "clip") setClipPos(makeClipPositions(p.imageCount))
    se.playSe(se.set)
  }

  function handleShowAnswer() {
    if (!problem) return
    setShowAnswer(true)
    se.playSe(se.seikai2)
  }

  function renderItems(p: Problem) {
    if (p.mode === "cherry") {
      // 元コードに忠実: cherry.png を imageCount 枚並べるだけ
      return (
        <div className="flex flex-wrap gap-3 justify-center">
          {Array.from({ length: p.imageCount }).map((_, i) => (
            <Image key={i} src="/images/kazu-cherry.png" alt="さくらんぼ" width={60} height={60} />
          ))}
        </div>
      )
    }

    if (p.mode === "banana") {
      // 元コードに忠実: banana.jpg を imageCount 枚並べるだけ
      return (
        <div className="flex flex-wrap gap-4 justify-center items-end">
          {Array.from({ length: p.imageCount }).map((_, i) => (
            <Image key={i} src="/images/kazu-banana.jpg" alt="バナナ" width={90} height={90} />
          ))}
        </div>
      )
    }

    // クリップ: 元コードに忠実: ランダムな位置・回転で配置
    return (
      <div className="relative w-full" style={{ height: 200 }}>
        {Array.from({ length: p.imageCount }).map((_, i) => (
          <Image
            key={i}
            src="/images/kazu-clip.png"
            alt="クリップ"
            width={40}
            height={40}
            style={{
              position: "absolute",
              left: `${clipPos[i]?.left ?? 0}%`,
              top: `${clipPos[i]?.top ?? 0}%`,
              transform: `rotate(${clipPos[i]?.rotate ?? 0}deg)`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
        🔢 くふうして かぞえよう
      </h1>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
        下のボタンを えらんで、いくつあるか かぞえよう
      </p>

      {/* モード選択 */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {(["cherry", "banana", "clip"] as Mode[]).map(mode => (
          <button
            key={mode}
            onClick={() => start(mode)}
            className="px-4 py-3 bg-brand-400 hover:bg-brand-500 active:bg-brand-600 text-white font-bold rounded-xl shadow-sm transition-colors"
          >
            {mode === "cherry" ? "🍒 さくらんぼ" : mode === "banana" ? "🍌 バナナ" : "📎 クリップ"}
          </button>
        ))}
      </div>

      {problem ? (
        <>
          {/* ヒント */}
          <div className="text-center text-base font-bold text-warm-600 dark:text-warm-400 mb-4">
            💡 {MODE_HINT[problem.mode]}
          </div>

          {/* 物の表示 */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 min-h-40">
            {renderItems(problem)}
          </div>

          {/* こたえ表示 */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <BtnShowAnswer handleEvent={handleShowAnswer} />
            {showAnswer && (
              <div className="text-4xl font-bold text-brand-600 dark:text-brand-400 animate-bounce">
                {problem.answer} こ
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 dark:text-gray-500 py-16 text-lg">
          上のボタンをおしてね
        </div>
      )}
    </main>
  )
}

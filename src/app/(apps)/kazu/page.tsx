"use client"
import { useState } from "react"
import Image from "next/image"
import { BtnShowAnswer } from "@/components/parts/buttons/BtnShowAnswer"
import * as se from "@/lib/se"

type Mode = "cherry" | "banana" | "clip"

type Problem = {
  mode: Mode
  count: number
  groupSize: number
}

function makeProblem(mode: Mode): Problem {
  if (mode === "cherry") {
    const pairs = Math.floor(Math.random() * 5 + 5)  // 5〜9組（計10〜18個）
    return { mode, count: pairs * 2, groupSize: 2 }
  } else if (mode === "banana") {
    const groups = Math.floor(Math.random() * 3 + 2)  // 2〜4房（計10〜20個）
    return { mode, count: groups * 5, groupSize: 5 }
  } else {
    const n = Math.floor(Math.random() * 9 + 11)  // 11〜19個
    return { mode, count: n, groupSize: 1 }
  }
}

const MODE_HINT: Record<Mode, string> = {
  cherry: "２こずつ数えよう！",
  banana: "５こずつ数えよう！",
  clip: "１つずつ数えよう！",
}

export default function KazuPage() {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  function start(mode: Mode) {
    setProblem(makeProblem(mode))
    setShowAnswer(false)
    se.playSe(se.set)
  }

  function handleShowAnswer() {
    if (!problem) return
    setShowAnswer(true)
    se.playSe(se.seikai2)
  }

  // 画像をグループ単位で並べる
  function renderItems(p: Problem) {
    const { mode, count, groupSize } = p
    const groups: number[] = []
    for (let i = 0; i < count; i += groupSize) {
      groups.push(Math.min(groupSize, count - i))
    }

    const imgSrc = mode === "cherry" ? "/images/kazu-cherry.png"
      : mode === "banana" ? "/images/kazu-banana.jpg"
      : "/images/kazu-clip.png"
    const imgSize = mode === "banana" ? 80 : mode === "clip" ? 44 : 44

    return (
      <div className="flex flex-wrap gap-4 justify-center">
        {groups.map((gSize, gi) => (
          <div
            key={gi}
            className={`flex flex-wrap gap-1 p-2 rounded-lg ${mode !== "clip" ? "border-2 border-gray-300 dark:border-gray-600" : ""}`}
            style={{ minWidth: imgSize + 8 }}
          >
            {Array.from({ length: gSize }).map((_, i) => (
              <Image
                key={i}
                src={imgSrc}
                alt={mode}
                width={imgSize}
                height={imgSize}
                className={mode === "clip" ? `rotate-[${(gi * 37 + i * 53) % 180}deg]` : ""}
                style={mode === "clip" ? { transform: `rotate(${(gi * 37 + i * 53) % 180}deg)` } : undefined}
              />
            ))}
          </div>
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
                {problem.count} こ
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

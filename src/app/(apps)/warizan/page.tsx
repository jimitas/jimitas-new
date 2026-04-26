"use client"

// ======================================================
// わり算の考え方①（○人にわける）
//
// クッキーを「○人」で分ける場面を視覚的に学習。
// ピンクのスペースに並んだクッキーを各人のお皿にドラッグして配ると、
// 1人あたり何個になるかを実感できる。
// 「こたえ」を押すと正しい配分が自動表示される。
//
// 旧 jimitas.com のわり算考え方①を React + Pointer Events で移植。
// ======================================================

import { useState, useCallback, useRef, useEffect } from "react"
import { useSound } from "@/hooks/useSound"

const MAX_DIVIDEND = 99
const MAX_DIVISOR = 10

type CookieId = string
type LocationKey = "space" | `plate-${number}`

// クッキー1個のデータ
type Cookie = {
  id: CookieId
  location: LocationKey
}

export default function WarizanPage() {
  // 入力値
  const [dividend, setDividend] = useState<number | "">("")
  const [divisor, setDivisor] = useState<number | "">("")
  // セット済みかどうか
  const [isSet, setIsSet] = useState(false)
  // 現在の問題のクッキー配置
  const [cookies, setCookies] = useState<Cookie[]>([])
  // 答え表示中
  const [showAnswer, setShowAnswer] = useState(false)
  // エラーメッセージ
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { play } = useSound()

  // ドラッグ管理（DOM直接更新でちらつき防止）
  const draggingRef = useRef<{
    el: HTMLElement
    cookieId: CookieId
    pointerId: number
    offsetX: number
    offsetY: number
  } | null>(null)

  // -------------------------------------------------------
  // 入力ハンドラ
  // -------------------------------------------------------
  const handleErase = () => {
    play("/sounds/set.mp3", 0.4)
    setDividend("")
    setDivisor("")
    setIsSet(false)
    setCookies([])
    setShowAnswer(false)
    setErrorMsg(null)
  }

  const handleSet = () => {
    setErrorMsg(null)
    const d = Number(dividend)
    const v = Number(divisor)

    if (!Number.isFinite(d) || d < 1 || d > MAX_DIVIDEND) {
      play("/sounds/cancel.mp3", 0.4)
      setErrorMsg(`わられる数は１から${MAX_DIVIDEND}までの数にしてね。`)
      return
    }
    if (!Number.isFinite(v) || v < 1 || v > MAX_DIVISOR) {
      play("/sounds/cancel.mp3", 0.4)
      setErrorMsg(`わる数は１から${MAX_DIVISOR}までの数にしてね。`)
      return
    }

    play("/sounds/set.mp3", 0.4)
    // d 個のクッキーを space にすべて配置
    const newCookies: Cookie[] = Array.from({ length: d }, (_, i) => ({
      id: `c${i}`,
      location: "space",
    }))
    setCookies(newCookies)
    setIsSet(true)
    setShowAnswer(false)
  }

  // -------------------------------------------------------
  // 「こたえ」ボタン: 正しい配分を自動配置
  // -------------------------------------------------------
  const handleAnswer = () => {
    if (!isSet) return
    const d = Number(dividend)
    const v = Number(divisor)
    const quotient = Math.floor(d / v)
    const remainder = d % v

    play("/sounds/seikai.mp3", 0.4)

    // 各皿に quotient 個ずつ、余りは space に
    const next: Cookie[] = []
    let cookieIdx = 0
    for (let p = 0; p < v; p++) {
      for (let k = 0; k < quotient; k++) {
        next.push({ id: `c${cookieIdx}`, location: `plate-${p}` })
        cookieIdx++
      }
    }
    for (let r = 0; r < remainder; r++) {
      next.push({ id: `c${cookieIdx}`, location: "space" })
      cookieIdx++
    }
    setCookies(next)
    setShowAnswer(true)
  }

  // -------------------------------------------------------
  // ドラッグ処理（PointerEvents）
  // -------------------------------------------------------
  const onCookiePointerDown = (e: React.PointerEvent<HTMLDivElement>, cookieId: CookieId) => {
    if (showAnswer) return  // 答え表示中はドラッグ無効
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.setPointerCapture(e.pointerId)
    el.style.position = "fixed"
    el.style.zIndex = "1000"
    el.style.left = `${rect.left}px`
    el.style.top = `${rect.top}px`
    el.style.width = `${rect.width}px`
    el.style.height = `${rect.height}px`

    draggingRef.current = {
      el,
      cookieId,
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    }
  }

  const onCookiePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = draggingRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const x = e.clientX - drag.offsetX
    const y = e.clientY - drag.offsetY
    drag.el.style.left = `${x}px`
    drag.el.style.top = `${y}px`
  }

  const onCookiePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = draggingRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    // 一時的に display:none にして下の要素を取得
    drag.el.style.display = "none"
    const below = document.elementFromPoint(e.clientX, e.clientY)
    drag.el.style.display = ""

    // ドロップ先を判定
    let target: LocationKey | null = null
    if (below) {
      const plateEl = (below as HTMLElement).closest('[data-plate]') as HTMLElement | null
      if (plateEl) {
        const idx = parseInt(plateEl.dataset.plate || "", 10)
        if (Number.isFinite(idx)) target = `plate-${idx}` as LocationKey
      } else if ((below as HTMLElement).closest('[data-space]')) {
        target = "space"
      }
    }

    // スタイルをリセット
    drag.el.style.position = ""
    drag.el.style.zIndex = ""
    drag.el.style.left = ""
    drag.el.style.top = ""
    drag.el.style.width = ""
    drag.el.style.height = ""

    if (target) {
      play("/sounds/pi.mp3", 0.3)
      setCookies(prev => prev.map(c =>
        c.id === drag.cookieId ? { ...c, location: target! } : c
      ))
    }

    if (drag.el.hasPointerCapture(drag.pointerId)) {
      drag.el.releasePointerCapture(drag.pointerId)
    }
    draggingRef.current = null
  }

  // クリーンアップ：アンマウント時にスタイルが残らないようにする
  useEffect(() => {
    return () => {
      const d = draggingRef.current
      if (d) {
        d.el.style.position = ""
        d.el.style.zIndex = ""
      }
    }
  }, [])

  // -------------------------------------------------------
  // 描画用の派生値
  // -------------------------------------------------------
  const d = Number(dividend) || 0
  const v = Number(divisor) || 0
  const quotient = v > 0 ? Math.floor(d / v) : 0
  const remainder = v > 0 ? d % v : 0
  const hint = v > 0 && d > 0
    ? (remainder === 0 ? `？×${v}＝${d}` : `？×${v}＋□＝${d}`)
    : "数字を入れてセットをおしてね。"

  // 各 location ごとに含まれるクッキー
  const cookiesAt = (loc: LocationKey) => cookies.filter(c => c.location === loc)

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <header className="flex items-baseline justify-between mb-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          わり算の考え方①（○人にわける）
        </h1>
        <button
          onClick={handleErase}
          className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          やりなおし
        </button>
      </header>

      {/* めあて */}
      <section className="bg-green-50 dark:bg-green-950 rounded-xl border-2 border-green-300 dark:border-green-800 p-3 mb-3">
        <div className="text-xs font-bold text-green-700 dark:text-green-300 mb-1">めあて</div>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          クッキーを動かしながら、○人で分ける計算のし方を考えよう。
        </p>
      </section>

      {/* 入力エリア */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input
            type="number"
            min={1}
            max={MAX_DIVIDEND}
            value={dividend}
            onChange={e => setDividend(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="?"
            className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-center"
          />
          <span>このクッキーを</span>
          <input
            type="number"
            min={1}
            max={MAX_DIVISOR}
            value={divisor}
            onChange={e => setDivisor(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="?"
            className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-center"
          />
          <span>人でわける</span>
          <button
            onClick={handleSet}
            className="ml-2 px-4 py-1 rounded-lg bg-brand-400 hover:bg-brand-500 active:bg-brand-600 text-white font-bold"
          >
            セット
          </button>
        </div>
        <p className="text-xs text-warm-600 dark:text-warm-400 mt-2">ヒント… {hint}</p>
        {errorMsg && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠ {errorMsg}</p>
        )}
      </section>

      {/* 式表示 */}
      {isSet && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-3">
          <div className="flex flex-wrap items-baseline gap-2 text-2xl font-bold">
            <span>{d}</span>
            <span className="text-gray-500">÷</span>
            <span>{v}</span>
            <span className="text-gray-500">＝</span>
            <span className="text-warm-600 dark:text-warm-400">{showAnswer ? quotient : "?"}</span>
            <span className="text-gray-500 text-base">あまり</span>
            <span className="text-warm-600 dark:text-warm-400">{showAnswer ? remainder : "?"}</span>
            <button
              onClick={handleAnswer}
              className="ml-2 px-3 py-1 rounded-lg bg-warm-400 hover:bg-warm-500 active:bg-warm-600 text-white text-sm font-bold"
            >
              こたえ
            </button>
          </div>
          {showAnswer && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              答え… 1人 {quotient} こずつ 分けられて {remainder} こ あまる。
              <br />
              たしかめ… {remainder === 0
                ? `${quotient}×${v}＝${d}`
                : `${quotient}×${v}＋${remainder}＝${d}`}
            </p>
          )}
        </section>
      )}

      {/* お皿 + 顔のテーブル */}
      {isSet && (
        <section className="mb-3">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${v}, minmax(0, 1fr))` }}>
            {Array.from({ length: v }).map((_, i) => (
              <div
                key={`plate-col-${i}`}
                data-plate={i}
                className="bg-yellow-100 dark:bg-yellow-900 rounded-lg border-2 border-yellow-400 dark:border-yellow-700 min-h-[100px] p-2 flex flex-wrap content-start gap-1"
              >
                {cookiesAt(`plate-${i}`).map(c => (
                  <CookieItem
                    key={c.id}
                    cookieId={c.id}
                    onPointerDown={onCookiePointerDown}
                    onPointerMove={onCookiePointerMove}
                    onPointerUp={onCookiePointerUp}
                  />
                ))}
              </div>
            ))}
            {Array.from({ length: v }).map((_, i) => (
              <div key={`face-col-${i}`} className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/warizan/egao.png"
                  alt="えがお"
                  className="w-12 h-12 sm:w-14 sm:h-14"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ピンクエリア（クッキー置き場） */}
      {isSet && (
        <section
          data-space="true"
          className="bg-pink-100 dark:bg-pink-950 rounded-xl border-2 border-pink-300 dark:border-pink-800 p-3 min-h-[120px] flex flex-wrap content-start gap-1"
        >
          {cookiesAt("space").length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 w-full text-center">
              クッキーをここからお皿へドラッグしてみよう。
            </p>
          )}
          {cookiesAt("space").map(c => (
            <CookieItem
              key={c.id}
              cookieId={c.id}
              onPointerDown={onCookiePointerDown}
              onPointerMove={onCookiePointerMove}
              onPointerUp={onCookiePointerUp}
            />
          ))}
        </section>
      )}
    </div>
  )
}

// -----------------------------------------------------
// クッキー1個（ドラッグ可能）
// -----------------------------------------------------
function CookieItem({
  cookieId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  cookieId: CookieId
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, id: CookieId) => void
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      data-cookie={cookieId}
      onPointerDown={(e) => onPointerDown(e, cookieId)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="touch-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/warizan/cookie.png"
        alt="クッキー"
        className="w-9 h-9 sm:w-10 sm:h-10 select-none pointer-events-none"
        draggable={false}
      />
    </div>
  )
}

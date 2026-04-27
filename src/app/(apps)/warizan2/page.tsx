"use client"

// ======================================================
// わり算の考え方②（○こずつわける）
//
// クッキーを「○こずつ」袋に分ける場面を視覚的に学習。
// 1袋あたりの数を決めて、何袋できるかを実感する。
// 「こたえ」を押すと正しい配分が自動表示される。
//
// 旧 jimitas.com warizan_2 を React + Pointer Events で移植。
// クッキー画像は /images/warizan/ 配下を共用。
// ======================================================

import { useState, useCallback, useRef, useEffect } from "react"
import { useSound } from "@/hooks/useSound"

const MAX_DIVIDEND = 99
const MAX_PER_GROUP = 10
const PLATES_PER_ROW = 5

type CookieId = string
type LocationKey = "space" | `plate-${number}`

type Cookie = {
  id: CookieId
  location: LocationKey
}

export default function Warizan2Page() {
  const [dividend, setDividend] = useState<number | "">("")
  const [perGroup, setPerGroup] = useState<number | "">("")
  const [isSet, setIsSet] = useState(false)
  const [cookies, setCookies] = useState<Cookie[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { play } = useSound()

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
    setPerGroup("")
    setIsSet(false)
    setCookies([])
    setShowAnswer(false)
    setErrorMsg(null)
  }

  const handleSet = () => {
    setErrorMsg(null)
    const d = Number(dividend)
    const p = Number(perGroup)

    if (!Number.isFinite(d) || d < 1 || d > MAX_DIVIDEND) {
      play("/sounds/cancel.mp3", 0.4)
      setErrorMsg(`わられる数は１から${MAX_DIVIDEND}までの数にしてね。`)
      return
    }
    if (!Number.isFinite(p) || p < 1 || p > MAX_PER_GROUP) {
      play("/sounds/cancel.mp3", 0.4)
      setErrorMsg(`１ふくろの数は１から${MAX_PER_GROUP}までにしてね。`)
      return
    }

    play("/sounds/set.mp3", 0.4)
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
    const p = Number(perGroup)
    const groups = Math.floor(d / p)
    const remainder = d % p

    play("/sounds/seikai.mp3", 0.4)

    const next: Cookie[] = []
    let idx = 0
    for (let g = 0; g < groups; g++) {
      for (let k = 0; k < p; k++) {
        next.push({ id: `c${idx}`, location: `plate-${g}` })
        idx++
      }
    }
    for (let r = 0; r < remainder; r++) {
      next.push({ id: `c${idx}`, location: "space" })
      idx++
    }
    setCookies(next)
    setShowAnswer(true)
  }

  // -------------------------------------------------------
  // ドラッグ処理
  // -------------------------------------------------------
  const onCookiePointerDown = (e: React.PointerEvent<HTMLDivElement>, cookieId: CookieId) => {
    if (showAnswer) return
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
    drag.el.style.left = `${e.clientX - drag.offsetX}px`
    drag.el.style.top = `${e.clientY - drag.offsetY}px`
  }

  const onCookiePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = draggingRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    drag.el.style.display = "none"
    const below = document.elementFromPoint(e.clientX, e.clientY)
    drag.el.style.display = ""

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

  useEffect(() => {
    return () => {
      const d = draggingRef.current
      if (d) {
        d.el.style.position = ""
        d.el.style.zIndex = ""
      }
    }
  }, [])

  // 描画用
  const d = Number(dividend) || 0
  const p = Number(perGroup) || 0
  const groups = p > 0 ? Math.floor(d / p) : 0
  const remainder = p > 0 ? d % p : 0
  const hint = p > 0 && d > 0
    ? (remainder === 0 ? `${d}÷${p}＝？（${p}×？＝${d}）` : `${p}×？＋□＝${d}`)
    : "数字を入れてセットをおしてね。"

  // 表示する袋（プレート）の数：セット中はグループ数分、あるいは最低5個
  const plateCount = isSet ? Math.max(groups, PLATES_PER_ROW) : 0

  const cookiesAt = useCallback((loc: LocationKey) => cookies.filter(c => c.location === loc), [cookies])

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <header className="flex items-baseline justify-between mb-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          わり算の考え方②（○こずつわける）
        </h1>
        <button
          onClick={handleErase}
          className="px-3 py-1 rounded-lg bg-danger-400 hover:bg-danger-500 active:bg-danger-600 text-white text-sm"
        >
          やりなおし
        </button>
      </header>

      {/* めあて */}
      <section className="bg-green-50 dark:bg-green-950 rounded-xl border-2 border-green-300 dark:border-green-800 p-3 mb-3">
        <div className="text-xs font-bold text-green-700 dark:text-green-300 mb-1">めあて</div>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          クッキーを動かしながら、○こずつ分ける計算のし方を考えよう。
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
            max={MAX_PER_GROUP}
            value={perGroup}
            onChange={e => setPerGroup(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="?"
            className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-center"
          />
          <span>こずつわける</span>
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
            <span>{p}</span>
            <span className="text-gray-500">＝</span>
            <span className="text-warm-600 dark:text-warm-400">{showAnswer ? groups : "?"}</span>
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
              答え… {p}こずつだと {groups}ふくろ できて {remainder}こ あまる。
              <br />
              たしかめ… {remainder === 0
                ? `${p}×${groups}＝${d}`
                : `${p}×${groups}＋${remainder}＝${d}`}
            </p>
          )}
        </section>
      )}

      {/* 袋の grid（5列） */}
      {isSet && (
        <section className="mb-3">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${PLATES_PER_ROW}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: plateCount }).map((_, i) => (
              <div
                key={`plate-${i}`}
                data-plate={i}
                className="bg-yellow-100 dark:bg-yellow-900 rounded-lg border-2 border-yellow-400 dark:border-yellow-700 min-h-[80px] p-2 flex flex-wrap content-start gap-1 relative"
              >
                <span className="absolute top-0.5 left-1 text-xs text-yellow-700 dark:text-yellow-300">{i + 1}</span>
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
          </div>
        </section>
      )}

      {/* ピンクエリア */}
      {isSet && (
        <section
          data-space="true"
          className="bg-pink-100 dark:bg-pink-950 rounded-xl border-2 border-pink-300 dark:border-pink-800 p-3 min-h-[120px] flex flex-wrap content-start gap-1"
        >
          {cookiesAt("space").length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 w-full text-center">
              クッキーをここから袋へドラッグしてみよう。
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

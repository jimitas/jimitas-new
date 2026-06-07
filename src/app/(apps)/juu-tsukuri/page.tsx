"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { shuffled } from "@/lib/utils"
import * as se from "@/lib/se"

// ── 型定義 ────────────────────────────────────────────────────────────
type Card  = { id: string; value: number }
type Phase = "idle" | "playing" | "clear" | "gameover"

// ── カード色テーブル ───────────────────────────────────────────────────
const CARD_COLORS: Record<number, string> = {
  1: "bg-red-100    border-red-300",
  2: "bg-orange-100 border-orange-300",
  3: "bg-yellow-100 border-yellow-300",
  4: "bg-green-100  border-green-300",
  5: "bg-teal-100   border-teal-300",
  6: "bg-blue-100   border-blue-300",
  7: "bg-indigo-100 border-indigo-300",
  8: "bg-purple-100 border-purple-300",
  9: "bg-pink-100   border-pink-300",
}

// ── 5フレームドット（1〜5段目 / 6〜9は2段）────────────────────────────
function CardDots({ value }: { value: number }) {
  const top = Math.min(value, 5)
  const bot = Math.max(0, value - 5)
  return (
    <div className="flex flex-col items-center gap-1 mt-2">
      <div className="flex gap-1">
        {Array.from({ length: top }, (_, i) => (
          <div key={i} className="w-3 h-3 rounded-full bg-gray-600 opacity-60" />
        ))}
      </div>
      {bot > 0 && (
        <div className="flex gap-1">
          {Array.from({ length: bot }, (_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-gray-600 opacity-60" />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 山札生成（1〜9 × 各2枚 = 18枚）──────────────────────────────────
function createDeck(): Card[] {
  const cards: Card[] = []
  for (let copy = 0; copy < 2; copy++) {
    for (let v = 1; v <= 9; v++) {
      cards.push({ id: `c${copy}_${v}`, value: v })
    }
  }
  return shuffled(cards)
}

// ── ゲームオーバー判定（純粋関数）────────────────────────────────────
function hasPairSumTen(field: (Card | null)[]): boolean {
  const cards = field.filter((c): c is Card => c !== null)
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].value + cards[j].value === 10) return true
    }
  }
  return false
}

function isGameOver(field: (Card | null)[]): boolean {
  return field.every(c => c !== null) && !hasPairSumTen(field)
}

// ── DnD: モジュールレベル変数（コンポーネント外定義）────────────────
type DragInfo = { card: Card; clone: HTMLElement; ox: number; oy: number }
let dragInfo: DragInfo | null = null

const dropCallbackRef = { current: null as ((card: Card, slotIdx: number) => void) | null }
const isFlashingRef   = { current: false }

function handlePointerMove(e: PointerEvent) {
  if (!dragInfo) return
  dragInfo.clone.style.left = `${e.clientX - dragInfo.ox}px`
  dragInfo.clone.style.top  = `${e.clientY - dragInfo.oy}px`
}

function handlePointerUp(e: PointerEvent) {
  if (!dragInfo) return
  const { card, clone } = dragInfo
  clone.remove()
  document.removeEventListener("pointermove", handlePointerMove)
  document.removeEventListener("pointerup",   handlePointerUp)
  dragInfo = null

  if (isFlashingRef.current) return

  const target = document.elementFromPoint(e.clientX, e.clientY)
  const slotEl = target?.closest("[data-slot-idx]") as HTMLElement | null
  if (slotEl) {
    const idx = parseInt(slotEl.dataset.slotIdx ?? "")
    if (!isNaN(idx)) dropCallbackRef.current?.(card, idx)
  }
}

function startDrag(e: PointerEvent, card: Card, el: HTMLElement) {
  if (isFlashingRef.current) return
  e.preventDefault()
  const rect  = el.getBoundingClientRect()
  const clone = el.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    position:      "fixed",
    left:          `${rect.left}px`,
    top:           `${rect.top}px`,
    width:         `${rect.width}px`,
    height:        `${rect.height}px`,
    pointerEvents: "none",
    zIndex:        "9999",
    opacity:       "0.9",
    transform:     "rotate(-6deg) scale(1.08)",
    boxShadow:     "0 8px 24px rgba(0,0,0,0.2)",
    transition:    "none",
  })
  document.body.appendChild(clone)
  dragInfo = { card, clone, ox: e.clientX - rect.left, oy: e.clientY - rect.top }
  document.addEventListener("pointermove", handlePointerMove)
  document.addEventListener("pointerup",   handlePointerUp)
}

// ── メインコンポーネント ─────────────────────────────────────────────
export default function JuuTsukuriPage() {
  const [deck,       setDeck]       = useState<Card[]>([])
  const [hand,       setHand]       = useState<Card[]>([])
  const [field,      setField]      = useState<(Card | null)[]>([null, null, null, null])
  const [flashSlots, setFlashSlots] = useState<Set<number>>(new Set())
  const [cleared,    setCleared]    = useState(0)
  const [phase,      setPhase]      = useState<Phase>("idle")

  const deckRef  = useRef<Card[]>([])
  const handRef  = useRef<Card[]>([])
  const fieldRef = useRef<(Card | null)[]>([null, null, null, null])

  const { coins, addCoins } = useCoins()

  // ── 手札 → 場スロットにドロップ ──────────────────────────────────
  const dropToSlot = useCallback((card: Card, slotIdx: number) => {
    if (isFlashingRef.current) return
    if (fieldRef.current[slotIdx] !== null) return

    se.playSe(se.pi)

    handRef.current = handRef.current.filter(c => c.id !== card.id)
    setHand([...handRef.current])

    fieldRef.current = fieldRef.current.map((c, i) => (i === slotIdx ? card : c))
    setField([...fieldRef.current])

    const occ = fieldRef.current
      .map((c, i) => ({ card: c, idx: i }))
      .filter((x): x is { card: Card; idx: number } => x.card !== null)

    for (let i = 0; i < occ.length; i++) {
      for (let j = i + 1; j < occ.length; j++) {
        if (occ[i].card.value + occ[j].card.value === 10) {
          const matchSlots = new Set([occ[i].idx, occ[j].idx])
          isFlashingRef.current = true
          setFlashSlots(matchSlots)
          se.playSe(se.seikai1)
          setTimeout(() => {
            matchSlots.forEach(k => { fieldRef.current[k] = null })
            setField([...fieldRef.current])
            setCleared(prev => prev + 1)
            addCoins(1)
            setFlashSlots(new Set())
            isFlashingRef.current = false
          }, 700)
          return
        }
      }
    }

    if (isGameOver(fieldRef.current)) {
      setTimeout(() => {
        setPhase("gameover")
        se.playSe(se.alertSound)
      }, 400)
    }
  }, [addCoins])

  useEffect(() => {
    dropCallbackRef.current = dropToSlot
  }, [dropToSlot])

  // ── 山札クリックで手札に1枚引く ──────────────────────────────────
  const drawCard = useCallback(() => {
    if (handRef.current.length >= 4 || deckRef.current.length === 0) return
    const card = deckRef.current[0]
    deckRef.current = deckRef.current.slice(1)
    setDeck([...deckRef.current])
    handRef.current = [...handRef.current, card]
    setHand([...handRef.current])
    se.playSe(se.pi)
  }, [])

  // ── ゲーム開始 ────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const newDeck = createDeck()
    deckRef.current  = newDeck
    handRef.current  = []
    fieldRef.current = [null, null, null, null]
    isFlashingRef.current = false
    setDeck(newDeck)
    setHand([])
    setField([null, null, null, null])
    setFlashSlots(new Set())
    setCleared(0)
    setPhase("playing")
    se.playSe(se.set)
  }, [])

  // ── クリア判定 ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return
    if (
      deck.length === 0 &&
      hand.length === 0 &&
      field.every(c => c === null)
    ) {
      const timer = setTimeout(() => {
        setPhase("clear")
        se.playSe(se.seikai2)
        addCoins(5)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [phase, deck.length, hand.length, field, addCoins])

  const handleCardPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, card: Card) => {
      startDrag(e.nativeEvent, card, e.currentTarget)
    },
    []
  )

  // ── UI ────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-amber-50 flex flex-col"
      style={{ userSelect: "none" }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-6 py-3 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-amber-700">10をつくろう</h1>
        {phase !== "idle" && (
          <span className="text-lg text-gray-600">
            けした: <strong className="text-green-600">{cleared}</strong>ペア
          </span>
        )}
      </div>

      {/* ──── アイドル画面（flex-1 で縦中央） ──── */}
      {phase === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-700 mb-4">
              たして 10に なる ペアを けそう！
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {([[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]] as [number, number][]).map(
                ([a, b]) => (
                  <span
                    key={a}
                    className="text-lg text-gray-600 bg-white px-4 py-2 rounded-full shadow"
                  >
                    {a} + {b} = 10
                  </span>
                )
              )}
            </div>
          </div>
          <button
            onClick={startGame}
            className="px-12 py-5 bg-amber-500 hover:bg-amber-600 text-white text-3xl font-bold rounded-2xl shadow-lg transition-colors cursor-pointer"
          >
            スタート
          </button>
        </div>
      )}

      {/* ──── ゲーム画面（playing / clear / gameover）コンパクト ──── */}
      {phase !== "idle" && (
        <div className="flex flex-col p-4 gap-3">

          {/* 場（4スロット） */}
          <div className="rounded-2xl bg-white/70 border-2 border-amber-200 p-4 flex flex-col gap-2">
            <p className="text-xs font-bold text-gray-400 text-center">
              ば — カードをドラッグしてスロットに おこう
            </p>
            <div className="flex gap-3 justify-center">
              {field.map((card, i) => {
                const isFlash = flashSlots.has(i)
                return (
                  <div
                    key={i}
                    data-slot-idx={String(i)}
                    className={[
                      "w-28 h-32 rounded-2xl border-2 flex flex-col items-center justify-center",
                      "transition-all duration-200",
                      card
                        ? `${CARD_COLORS[card.value]} shadow-md`
                        : "border-dashed border-amber-300 bg-amber-50/30",
                      isFlash
                        ? "!bg-yellow-200 !border-yellow-400 ring-4 ring-yellow-300 animate-pulse scale-110"
                        : "",
                    ].join(" ")}
                  >
                    {card && (
                      <>
                        <span className="text-4xl font-bold leading-none">{card.value}</span>
                        <CardDots value={card.value} />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 結果バナー（clear / gameover 時のみ） */}
          {(phase === "clear" || phase === "gameover") && (
            <div className={`rounded-xl border-2 p-4 text-center ${
              phase === "clear"
                ? "bg-green-100 border-green-300"
                : "bg-red-100 border-red-300"
            }`}>
              {phase === "clear" && (
                <>
                  <p className="text-2xl font-bold text-green-600 mb-1">
                    🎉 クリア！ {cleared}ペア けせたよ！
                  </p>
                  <p className="text-lg text-amber-500 font-bold mb-3">
                    +5コイン ボーナス！
                  </p>
                </>
              )}
              {phase === "gameover" && (
                <>
                  <p className="text-2xl font-bold text-red-500 mb-1">
                    😢 ゲームオーバー
                  </p>
                  <p className="text-lg text-gray-600 mb-3">
                    ばが いっぱいで 10が つくれない！ {cleared}ペア けせたよ
                  </p>
                </>
              )}
              <button
                onClick={startGame}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xl font-bold rounded-xl shadow transition-colors cursor-pointer"
              >
                もう いちど
              </button>
            </div>
          )}

          {/* 山札 + 手札（隣接） */}
          <div className="flex items-start">

            {/* 山札（クリックで引く） */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <p className="text-xs font-bold text-gray-400">やまふだ</p>
              <div
                className={`relative w-28 h-32 ${
                  deck.length > 0 && hand.length < 4 ? "cursor-pointer" : "opacity-50"
                }`}
                onClick={drawCard}
              >
                {deck.length > 2 && (
                  <div className="absolute inset-0 bg-indigo-500 rounded-xl border-2 border-indigo-700 translate-x-1.5 translate-y-1.5" />
                )}
                {deck.length > 1 && (
                  <div className="absolute inset-0 bg-indigo-400 rounded-xl border-2 border-indigo-600 translate-x-1 translate-y-1" />
                )}
                {deck.length > 0 ? (
                  <div className="absolute inset-0 bg-indigo-300 rounded-xl border-2 border-indigo-500 flex items-center justify-center shadow hover:scale-105 transition-transform">
                    <div className="grid grid-cols-3 gap-1 opacity-40">
                      {Array.from({ length: 9 }, (_, k) => (
                        <div key={k} className="w-2 h-2 bg-indigo-800 rounded-full" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-300 text-xs">なし</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-indigo-700">{deck.length}まい</p>
              <p className="text-xs text-gray-400 text-center leading-tight">
                {deck.length > 0 && hand.length >= 4
                  ? "てふだ いっぱい"
                  : deck.length > 0
                  ? "タップで引く"
                  : ""}
              </p>
            </div>

            {/* 手札（4スロット固定・山札の右隣） */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-gray-400 text-center pl-2">
                てふだ — ドラッグして ばに おこう
              </p>
              <div className="flex gap-2 pl-2">
                {Array.from({ length: 4 }, (_, i) => {
                  const card = hand[i] ?? null
                  return (
                    <div key={i} className="w-28 h-32">
                      {card ? (
                        <div
                          onPointerDown={e => handleCardPointerDown(e, card)}
                          className={[
                            "w-full h-full rounded-xl border-2 flex flex-col items-center justify-center",
                            "font-bold shadow cursor-grab active:cursor-grabbing",
                            "hover:scale-105 transition-transform",
                            CARD_COLORS[card.value],
                          ].join(" ")}
                        >
                          <span className="text-4xl font-bold leading-none">{card.value}</span>
                          <CardDots value={card.value} />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-xl border-2 border-dashed border-amber-200" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* コイン表示（playing 時はゲーム内容直下） */}
      <CoinDisplay coins={coins} />
    </div>
  )
}

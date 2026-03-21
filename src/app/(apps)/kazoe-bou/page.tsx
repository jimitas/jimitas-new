// ======================================================
// かぞえぼう ページ
//
// URL: /kazoe-bou
// 対象: 小学1〜2年生
// 内容: 計算棒（百・十・一の位）をドラッグして大きな数の位の概念を学ぶ
//
// 操作:
//   ストックから棒をドラッグ → 位の列（百・十・一）に並べる
//   ゴミ箱にドロップ         → 棒を削除
//   「けいさん」ボタン       → 並べた棒の合計値を計算・表示
//   「リセット」ボタン       → インライン確認後にテーブルをクリア
//
// DnD:
//   okane/page.tsx と同方式（position:fixed + elementFromPoint）
//   refillStockRef パターンで useEffect クロージャの stale 値を回避
// ======================================================

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import * as se from "@/lib/se"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"

// ── 定数 ─────────────────────────────────────────────

// 棒の種類（百・十・一）
const BOU = [
  { id: "k-hyaku", label: "百", value: 100, w: 56, h: 56 },
  { id: "k-ju",    label: "十", value: 10,  w: 24, h: 56 },
  { id: "k-ichi",  label: "一", value: 1,   w: 12, h: 56 },
] as const

// ── ヘルパー ──────────────────────────────────────────

// 棒の img 要素を生成する（DnD で動的に作る）
function createBouImg(bou: (typeof BOU)[number]): HTMLImageElement {
  const img = document.createElement("img")
  img.src = `/images/${bou.id}.png`
  img.alt = bou.label
  img.className = `kazoe-draggable ${bou.id}`
  img.setAttribute("data-bou-id", bou.id)
  img.style.cssText = `width:${bou.w}px;height:${bou.h}px;object-fit:contain;cursor:grab;margin:2px;display:inline-block;flex-shrink:0;`
  return img
}

// ── コンポーネント ───────────────────────────────────

export default function KazoeBouPage() {

  // ── 状態管理 ─────────────────────────────────────
  const [confirmReset, setConfirmReset] = useState(false) // インライン確認UI
  const hasAnswered = useRef(false) // 1問につき初回のみコイン付与

  // コインシステム
  const { coins, addCoins } = useCoins()

  // テーブル列の ref（百・十・一）
  const el_hyaku = useRef<HTMLDivElement>(null)
  const el_ju    = useRef<HTMLDivElement>(null)
  const el_ichi  = useRef<HTMLDivElement>(null)

  // ストック・結果表示エリアの ref
  const el_stock  = useRef<HTMLDivElement>(null)
  const el_result = useRef<HTMLDivElement>(null)

  // ── ストック補充 ──────────────────────────────────
  // 常に百・十・一が1本ずつある状態を保つ
  const refillStock = useCallback(() => {
    if (!el_stock.current) return
    el_stock.current.innerHTML = ""
    BOU.forEach((bou) => {
      el_stock.current!.appendChild(createBouImg(bou))
    })
  }, [])

  // DnD の useEffect（deps なし）から最新の refillStock を呼ぶためのパターン
  // （クロージャが古い refillStock を掴まないようにする）
  const refillStockRef = useRef(refillStock)
  refillStockRef.current = refillStock

  // ── テーブル操作 ──────────────────────────────────

  // テーブルの全列をクリアする
  const clearTable = useCallback(() => {
    ;[el_hyaku, el_ju, el_ichi].forEach((ref) => {
      if (ref.current) ref.current.innerHTML = ""
    })
  }, [])

  // ── けいさんボタン ────────────────────────────────

  const handleCalc = () => {
    // 各列の棒の枚数をカウント
    const hyakuCount = el_hyaku.current?.querySelectorAll(".k-hyaku").length ?? 0
    const juCount    = el_ju.current?.querySelectorAll(".k-ju").length ?? 0
    const ichiCount  = el_ichi.current?.querySelectorAll(".k-ichi").length ?? 0
    const total = hyakuCount * 100 + juCount * 10 + ichiCount

    if (total === 0) {
      se.playSe(se.alertSound)
      if (el_result.current) {
        el_result.current.innerHTML = `<span style="color:gray;">ぼうを　ならべてね</span>`
        setTimeout(() => { if (el_result.current) el_result.current.innerHTML = "" }, 1500)
      }
      return
    }

    se.playSe(se.seikai1)
    // 初回のみコイン付与（合計1以上が確認できたとき）
    if (!hasAnswered.current) {
      addCoins(1)
      hasAnswered.current = true
    }
    if (el_result.current) {
      el_result.current.innerHTML =
        `<span style="color:blue;font-size:1.6em;font-weight:bold;">${total}</span>`
      setTimeout(() => { if (el_result.current) el_result.current.innerHTML = "" }, 2000)
    }
  }

  // ── リセット ──────────────────────────────────────

  const handleReset = () => {
    se.playSe(se.reset)
    clearTable()
    refillStock()
    hasAnswered.current = false
    setConfirmReset(false)
    if (el_result.current) el_result.current.innerHTML = ""
  }

  // ── DnD（okane と同方式） ─────────────────────────
  // position:fixed + elementFromPoint でマウス・タッチを共通処理

  useEffect(() => {
    let dragged: HTMLImageElement | null = null
    let originalParent: HTMLElement | null = null
    let offsetX = 0
    let offsetY = 0

    const getPoint = (e: MouseEvent | TouchEvent) => {
      const te = e as TouchEvent
      return te.touches ? te.touches[0] : (e as MouseEvent)
    }
    const getChangedPoint = (e: MouseEvent | TouchEvent) => {
      const te = e as TouchEvent
      return te.changedTouches ? te.changedTouches[0] : (e as MouseEvent)
    }

    const handleStart = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement
      if (!target.classList.contains("kazoe-draggable")) return
      e.preventDefault()

      dragged = target as HTMLImageElement
      originalParent = dragged.parentElement as HTMLElement | null
      const touch = getPoint(e)
      const rect = dragged.getBoundingClientRect()

      // body に移動して position:fixed で追従させる
      document.body.appendChild(dragged)
      dragged.style.position    = "fixed"
      dragged.style.zIndex      = "1000"
      dragged.style.left        = rect.left + "px"
      dragged.style.top         = rect.top  + "px"
      dragged.style.width       = rect.width + "px"
      dragged.style.pointerEvents = "none"

      offsetX = touch.clientX - rect.left
      offsetY = touch.clientY - rect.top

      if (!(e as TouchEvent).touches) {
        document.addEventListener("mousemove", handleMove)
        document.addEventListener("mouseup",   handleEnd)
      }
    }

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragged) return
      e.preventDefault()
      const touch = getPoint(e)
      dragged.style.left = (touch.clientX - offsetX) + "px"
      dragged.style.top  = (touch.clientY - offsetY) + "px"
    }

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (!dragged) return
      e.preventDefault()
      const touch = getChangedPoint(e)

      // スタイルを元に戻す（棒の種類ごとにサイズを復元）
      dragged.style.position    = ""
      dragged.style.zIndex      = ""
      dragged.style.left        = ""
      dragged.style.top         = ""
      dragged.style.pointerEvents = ""
      const bouId = dragged.getAttribute("data-bou-id")
      const bou   = BOU.find(b => b.id === bouId)
      if (bou) {
        dragged.style.width  = bou.w + "px"
        dragged.style.height = bou.h + "px"
      }
      dragged.style.objectFit = "contain"

      // 一時的に非表示にしてドロップ先を特定
      dragged.style.display = "none"
      const below = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
      dragged.style.display = ""

      let placed = false

      if (below) {
        // ── テーブル列へのドロップ ──
        const cell = (
          below.classList.contains("kazoe-droppable")
            ? below
            : below.closest(".kazoe-droppable")
        ) as HTMLElement | null

        if (cell) {
          cell.appendChild(dragged)
          placed = true
          se.playSe(se.pi)
          // ストックから来た場合はストックを補充する
          if (originalParent === el_stock.current) {
            refillStockRef.current()
          }
        }
        // ── ゴミ箱へのドロップ → 棒を削除 ──
        else if (below.closest("#kazoe-trash")) {
          if (dragged.parentElement === document.body) dragged.remove()
          placed = true
          se.playSe(se.reset)
          // ストックから来た場合はストックを補充する
          if (originalParent === el_stock.current) {
            refillStockRef.current()
          }
        }
        // ── ストックエリアへのドロップ → テーブルから戻す ──
        else if (below.closest("#kazoe-stock")) {
          if (dragged.parentElement === document.body) dragged.remove()
          placed = true
          se.playSe(se.pi)
          refillStockRef.current()
        }
      }

      // ── ドロップ失敗 ──
      if (!placed) {
        if (originalParent === el_stock.current) {
          // ストックから来た棒 → body から削除してストック補充
          if (dragged.parentElement === document.body) dragged.remove()
          refillStockRef.current()
        } else {
          // テーブルから来た棒 → 元のセルに戻す
          if (dragged.parentElement === document.body && originalParent) {
            originalParent.appendChild(dragged)
          }
        }
      }

      dragged = null
      originalParent = null

      if (!(e as TouchEvent).changedTouches) {
        document.removeEventListener("mousemove", handleMove)
        document.removeEventListener("mouseup",   handleEnd)
      }
    }

    const stock = document.getElementById("kazoe-stock")
    const table = document.getElementById("kazoe-table-wrapper")

    stock?.addEventListener("mousedown",  handleStart, { passive: false })
    stock?.addEventListener("touchstart", handleStart, { passive: false })
    table?.addEventListener("mousedown",  handleStart, { passive: false })
    table?.addEventListener("touchstart", handleStart, { passive: false })
    document.addEventListener("touchmove", handleMove, { passive: false })
    document.addEventListener("touchend",  handleEnd,  { passive: false })

    return () => {
      stock?.removeEventListener("mousedown",  handleStart)
      stock?.removeEventListener("touchstart", handleStart)
      table?.removeEventListener("mousedown",  handleStart)
      table?.removeEventListener("touchstart", handleStart)
      document.removeEventListener("touchmove", handleMove)
      document.removeEventListener("touchend",  handleEnd)
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup",   handleEnd)
    }
  }, []) // DnD はマウント時に1回だけ設定（イベント委譲のため）

  // 初期化：マウント時にストックを補充
  useEffect(() => {
    refillStock()
  }, [refillStock])

  // ── 描画 ─────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-3">
        🪵 かぞえぼう
      </h1>

      {/* 合計値表示エリア */}
      <div
        ref={el_result}
        className="w-full flex justify-center items-center mb-3
                   min-h-10 py-1 px-3 text-black bg-yellow-100 font-bold"
      />

      {/* テーブルエリア（百・十・一）＋ ゴミ箱 */}
      <div className="flex gap-2 mb-3 items-stretch">

        {/* 位のテーブル（3列） */}
        <div id="kazoe-table-wrapper" className="flex flex-1 gap-1">

          {/* 百の位 */}
          <div className="flex-1 flex flex-col">
            <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 pointer-events-none">
              百の位
            </div>
            <div
              ref={el_hyaku}
              className="kazoe-droppable flex-1 border-2 border-pink-300 bg-pink-100
                         dark:bg-pink-900/20 rounded-lg p-2 min-h-[160px]
                         flex flex-wrap content-start gap-1"
            />
          </div>

          {/* 十の位 */}
          <div className="flex-1 flex flex-col">
            <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 pointer-events-none">
              十の位
            </div>
            <div
              ref={el_ju}
              className="kazoe-droppable flex-1 border-2 border-yellow-300 bg-yellow-100
                         dark:bg-yellow-900/20 rounded-lg p-2 min-h-[160px]
                         flex flex-wrap content-start gap-1"
            />
          </div>

          {/* 一の位 */}
          <div className="flex-1 flex flex-col">
            <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 pointer-events-none">
              一の位
            </div>
            <div
              ref={el_ichi}
              className="kazoe-droppable flex-1 border-2 border-blue-300 bg-blue-100
                         dark:bg-blue-900/20 rounded-lg p-2 min-h-[160px]
                         flex flex-wrap content-start gap-1"
            />
          </div>

        </div>

        {/* ゴミ箱：テーブル右に配置 */}
        <div
          id="kazoe-trash"
          className="flex flex-col items-center justify-end gap-1 p-2
                     border-2 border-gray-300 rounded-lg bg-gray-50
                     dark:bg-gray-800 dark:border-gray-600 w-16 shrink-0"
        >
          <Image
            src="/images/gomibako.png"
            alt="ゴミ箱"
            width={48}
            height={48}
            className="pointer-events-none opacity-70"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">すてる</span>
        </div>

      </div>

      {/* ストックエリア＋ボタン群（下段） */}
      <div className="flex items-center gap-3 flex-wrap mb-4
                      border-2 border-amber-400 rounded-xl p-3
                      bg-amber-50 dark:bg-amber-900/20">

        {/* 棒のストック（常に百・十・一が1本ずつ） */}
        <div
          id="kazoe-stock"
          ref={el_stock}
          className="flex items-end gap-3 min-h-[60px] flex-1"
        />

        {/* けいさんボタン */}
        <button
          onClick={handleCalc}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg font-bold
                     hover:bg-brand-600 transition-colors"
        >
          けいさん
        </button>

        {/* リセット（インライン確認UI） */}
        {!confirmReset ? (
          <button
            onClick={() => { se.playSe(se.alertSound); setConfirmReset(true) }}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg font-bold
                       hover:bg-gray-500 transition-colors"
          >
            リセット
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              ほんとうに？
            </span>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-red-500 text-white rounded-lg font-bold
                         hover:bg-red-600 transition-colors text-sm"
            >
              はい
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold
                         hover:bg-gray-400 transition-colors text-sm"
            >
              いいえ
            </button>
          </div>
        )}

      </div>

      {/* コイン表示 */}
      <CoinDisplay coins={coins} className="w-full" />

    </div>
  )
}

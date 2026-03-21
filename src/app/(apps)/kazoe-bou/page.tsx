// ======================================================
// かぞえぼう ページ
//
// テーブル構造:
//   [百くりあがり待機] | [十くりあがり待機] | [ゴミ箱]
//   [↑百くりあがり][↓百ばらす] | [↑十くりあがり][↓十ばらす] | (空)
//   [百の位ラベル]  | [十の位ラベル]  | [一の位ラベル]
//   ┌──────────────────────────────────────────────────┐
//   │ [百段1] │ [十段1] │ [一段1]  ←── 各段は min-h が可変（ドラッグで調整）
//   │ [百段2] │ [十段2] │ [一段2]
//   │ [百段3] │ [十段3] │ [一段3]
//   └──────────────────────────────────────────────────┘
//   [▼ リサイズハンドル]
//
// モード:
//   じゆうにならべる … 棒を置いて「けいさん」で合計表示
//   ならべよう       … 数字が出題 → 棒を並べて「こたえあわせ」→ コイン
//   いくつかな       … 棒が自動配置 → 数字を入力して「こたえあわせ」→ コイン
// ======================================================

"use client"

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react"
import Image from "next/image"
import * as se from "@/lib/se"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"

// ── 定数 ─────────────────────────────────────────────

// 棒の画像サイズ（h=56 が全種共通 → セルの min-height の基準）
const BOU = [
  { id: "k-hyaku", label: "百", value: 100, w: 56, h: 56 },
  { id: "k-ju",    label: "十", value: 10,  w: 24, h: 56 },
  { id: "k-ichi",  label: "一", value: 1,   w: 12, h: 56 },
] as const

const BOU_H = 56          // 棒の高さ（px）
const CELL_MIN_H_DEFAULT = BOU_H + 16  // 初期セル高さ = 棒 + 余白
const CELL_MIN_H_MIN     = BOU_H + 8   // リサイズの下限

type Mode = "free" | "narabe" | "ikutsu"

const MODE_LABEL: Record<Mode, string> = {
  free:   "じゆうにならべる",
  narabe: "ならべよう",
  ikutsu: "いくつかな",
}

// ── ヘルパー ──────────────────────────────────────────

function createBouImg(bou: (typeof BOU)[number]): HTMLImageElement {
  const img = document.createElement("img")
  img.src = `/images/${bou.id}.png`
  img.alt = bou.label
  img.className = `kazoe-draggable ${bou.id}`
  img.setAttribute("data-bou-id", bou.id)
  // margin は 1px（間隔を詰める）
  img.style.cssText = `width:${bou.w}px;height:${bou.h}px;object-fit:contain;cursor:grab;margin:1px;display:inline-block;flex-shrink:0;`
  return img
}

function generateQuestion(useHyaku: boolean, useJu: boolean, useIchi: boolean): number {
  const hyaku = useHyaku ? Math.floor(Math.random() * 9 + 1) : 0
  const ju    = useJu    ? Math.floor(Math.random() * 9 + 1) : 0
  const ichi  = useIchi  ? Math.floor(Math.random() * 9 + 1) : 0
  return hyaku * 100 + ju * 10 + ichi
}

// ── コンポーネント ───────────────────────────────────

export default function KazoeBouPage() {

  // ── 状態管理 ─────────────────────────────────────
  const [mode, setMode]                 = useState<Mode>("free")
  const [showModePanel, setShowModePanel] = useState(true)    // モード切り替えパネル（初回は開く）
  const [question, setQuestion]         = useState<number | null>(null)
  const [ikutsuAnswer, setIkutsuAnswer] = useState("")        // いくつかな: テキスト入力
  const [freeInput, setFreeInput]       = useState("")        // じゆうにならべる: 数字入力
  const [confirmReset, setConfirmReset] = useState(false)
  // 各段（0:1段目 1:2段目 2:3段目）の min-height。百/十/一が同じ値を共有
  const [cellMinHs, setCellMinHs] = useState<[number, number, number]>(
    [CELL_MIN_H_DEFAULT, CELL_MIN_H_DEFAULT, CELL_MIN_H_DEFAULT]
  )
  const [useHyaku, setUseHyaku] = useState(false)
  const [useJu,    setUseJu]    = useState(true)
  const [useIchi,  setUseIchi]  = useState(true)
  const hasAnswered = useRef(false)

  const { coins, addCoins } = useCoins()

  // ── DOM 参照 ──────────────────────────────────────
  const el_hyaku = useRef<HTMLDivElement>(null) // 百列ラッパー（3セル内包）
  const el_ju    = useRef<HTMLDivElement>(null) // 十列ラッパー
  const el_ichi  = useRef<HTMLDivElement>(null) // 一列ラッパー

  const el_kuri_hyaku = useRef<HTMLDivElement>(null) // 百くりあがり待機セル
  const el_kuri_ju    = useRef<HTMLDivElement>(null) // 十くりあがり待機セル

  const el_stock = useRef<HTMLDivElement>(null)
  const el_msg   = useRef<HTMLDivElement>(null)

  // ── 段ごとリサイズ ────────────────────────────────
  // どの段をドラッグ中か（0/1/2 or null）
  const resizingRowRef  = useRef<number | null>(null)
  const resizeStartYRef = useRef(0)
  const resizeStartHRef = useRef(CELL_MIN_H_DEFAULT)
  const cellMinHsRef    = useRef(cellMinHs)
  useLayoutEffect(() => { cellMinHsRef.current = cellMinHs })

  const startRowResize = (rowIdx: number, clientY: number) => {
    resizingRowRef.current  = rowIdx
    resizeStartYRef.current = clientY
    resizeStartHRef.current = cellMinHsRef.current[rowIdx]
  }

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (resizingRowRef.current === null) return
      const te = e as TouchEvent
      const clientY = te.touches ? te.touches[0].clientY : (e as MouseEvent).clientY
      const delta  = clientY - resizeStartYRef.current
      const rowIdx = resizingRowRef.current
      setCellMinHs(prev => {
        const next = [...prev] as [number, number, number]
        next[rowIdx] = Math.max(CELL_MIN_H_MIN, resizeStartHRef.current + delta)
        return next
      })
    }
    const onUp = () => { resizingRowRef.current = null }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup",   onUp)
    document.addEventListener("touchmove", onMove, { passive: false })
    document.addEventListener("touchend",  onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup",   onUp)
      document.removeEventListener("touchmove", onMove)
      document.removeEventListener("touchend",  onUp)
    }
  }, [])

  // ── ストック補充 ──────────────────────────────────
  const refillStock = useCallback(() => {
    if (!el_stock.current) return
    el_stock.current.innerHTML = ""
    BOU.forEach(bou => el_stock.current!.appendChild(createBouImg(bou)))
  }, [])

  const refillStockRef = useRef(refillStock)
  useLayoutEffect(() => { refillStockRef.current = refillStock })

  // ── テーブルクリア ────────────────────────────────
  // kazoe-droppable の構造は保持し、内部の棒だけ削除
  const clearTable = useCallback(() => {
    ;[el_hyaku, el_ju, el_ichi].forEach(ref => {
      ref.current?.querySelectorAll(".kazoe-droppable").forEach(cell => {
        cell.innerHTML = ""
      })
    })
    if (el_kuri_hyaku.current) el_kuri_hyaku.current.innerHTML = ""
    if (el_kuri_ju.current)    el_kuri_ju.current.innerHTML    = ""
  }, [])

  // ── メッセージ表示 ────────────────────────────────
  const showMsg = (html: string, duration = 2000) => {
    if (!el_msg.current) return
    el_msg.current.innerHTML = html
    if (duration > 0) {
      setTimeout(() => { if (el_msg.current) el_msg.current.innerHTML = "" }, duration)
    }
  }

  // ── 繰り上がり ────────────────────────────────────

  const handleKuriagariHyaku = () => {
    const items = el_ju.current?.querySelectorAll(".k-ju")
    if (!items || items.length < 10) {
      se.playSe(se.alertSound)
      showMsg(`<span style="color:red;">十の位が　10ぼん　ないよ</span>`, 1500)
      return
    }
    for (let i = 0; i < 10; i++) items[i].remove()
    el_kuri_hyaku.current?.appendChild(createBouImg(BOU[0]))
    se.playSe(se.piron)
  }

  const handleKuriagariJu = () => {
    const items = el_ichi.current?.querySelectorAll(".k-ichi")
    if (!items || items.length < 10) {
      se.playSe(se.alertSound)
      showMsg(`<span style="color:red;">一の位が　10ぼん　ないよ</span>`, 1500)
      return
    }
    for (let i = 0; i < 10; i++) items[i].remove()
    el_kuri_ju.current?.appendChild(createBouImg(BOU[1]))
    se.playSe(se.piron)
  }

  // ── ばらす ────────────────────────────────────────

  const handleBarasuHyaku = () => {
    const rod = el_hyaku.current?.querySelector(".k-hyaku")
    if (!rod) {
      se.playSe(se.alertSound)
      showMsg(`<span style="color:red;">百の位に　ぼんがないよ</span>`, 1500)
      return
    }
    rod.remove()
    const firstCell = el_ju.current?.querySelector(".kazoe-droppable")
    for (let i = 0; i < 10; i++) firstCell?.appendChild(createBouImg(BOU[1]))
    se.playSe(se.piron)
  }

  const handleBarasuJu = () => {
    const rod = el_ju.current?.querySelector(".k-ju")
    if (!rod) {
      se.playSe(se.alertSound)
      showMsg(`<span style="color:red;">十の位に　ぼんがないよ</span>`, 1500)
      return
    }
    rod.remove()
    const firstCell = el_ichi.current?.querySelector(".kazoe-droppable")
    for (let i = 0; i < 10; i++) firstCell?.appendChild(createBouImg(BOU[2]))
    se.playSe(se.piron)
  }

  // ── けいさん / こたえあわせ ────────────────────────

  const handleCalc = () => {
    // いくつかなモード: テキスト入力と問題を照合
    if (mode === "ikutsu") {
      if (question === null) {
        se.playSe(se.alertSound)
        showMsg(`<span style="color:gray;">もんだいを　おしてね</span>`, 1500)
        return
      }
      const ans = parseInt(ikutsuAnswer, 10)
      if (isNaN(ans) || ikutsuAnswer.trim() === "") {
        se.playSe(se.alertSound)
        showMsg(`<span style="color:red;">こたえを　いれてね</span>`, 1500)
        return
      }
      if (ans === question) {
        se.playSe(se.seikai1)
        showMsg(
          `<span style="color:green;font-size:1.4em;font-weight:bold;">⭕ せいかい！ ${question}</span>`,
          0
        )
        if (!hasAnswered.current) { addCoins(1); hasAnswered.current = true }
      } else {
        se.playSe(se.alertSound)
        showMsg(
          `<span style="color:red;font-size:1.2em;font-weight:bold;">❌ ${ans}　ちがうよ</span>`,
          2000
        )
      }
      return
    }

    // free / narabe モード: テーブルの棒をカウント
    const hyakuCount = el_hyaku.current?.querySelectorAll(".k-hyaku").length ?? 0
    const juCount    = el_ju.current?.querySelectorAll(".k-ju").length ?? 0
    const ichiCount  = el_ichi.current?.querySelectorAll(".k-ichi").length ?? 0
    const total = hyakuCount * 100 + juCount * 10 + ichiCount

    if (total === 0) {
      se.playSe(se.alertSound)
      showMsg(`<span style="color:gray;">ぼうを　ならべてね</span>`, 1500)
      return
    }

    if (mode === "narabe" && question !== null) {
      if (total === question) {
        se.playSe(se.seikai1)
        showMsg(
          `<span style="color:green;font-size:1.4em;font-weight:bold;">⭕ せいかい！ ${total}</span>`,
          0
        )
        if (!hasAnswered.current) { addCoins(1); hasAnswered.current = true }
      } else {
        se.playSe(se.alertSound)
        showMsg(
          `<span style="color:red;font-size:1.2em;font-weight:bold;">❌ ${total}　ちがうよ</span>`,
          2000
        )
      }
    } else {
      se.playSe(se.seikai1)
      showMsg(`<span style="color:blue;font-size:1.6em;font-weight:bold;">${total}</span>`, 2000)
    }
  }

  // ── もんだい（ならべよう） ────────────────────────

  const handleNarabeQuestion = () => {
    if (!useHyaku && !useJu && !useIchi) {
      se.playSe(se.alertSound)
      showMsg(`<span style="color:red;">くらいを　えらんでね</span>`, 1500)
      return
    }
    const q = generateQuestion(useHyaku, useJu, useIchi)
    setQuestion(q)
    hasAnswered.current = false
    clearTable()
    se.playSe(se.pi)
    showMsg(
      `<span style="color:blue;font-size:1.4em;font-weight:bold;">${q}</span>` +
      `<span style="color:blue;">　を　ならべよう</span>`,
      0
    )
  }

  // ── もんだい（いくつかな） ────────────────────────

  const handleIkutsuQuestion = () => {
    if (!useHyaku && !useJu && !useIchi) {
      se.playSe(se.alertSound)
      showMsg(`<span style="color:red;">くらいを　えらんでね</span>`, 1500)
      return
    }
    const q = generateQuestion(useHyaku, useJu, useIchi)
    setQuestion(q)
    setIkutsuAnswer("")
    hasAnswered.current = false
    clearTable()

    // 棒を自動配置（先頭セルに）
    const hyakuCount = Math.floor(q / 100)
    const juCount    = Math.floor((q % 100) / 10)
    const ichiCount  = q % 10
    const cellH = el_hyaku.current?.querySelector(".kazoe-droppable")
    const cellJ = el_ju.current?.querySelector(".kazoe-droppable")
    const cellI = el_ichi.current?.querySelector(".kazoe-droppable")
    for (let i = 0; i < hyakuCount; i++) cellH?.appendChild(createBouImg(BOU[0]))
    for (let i = 0; i < juCount;    i++) cellJ?.appendChild(createBouImg(BOU[1]))
    for (let i = 0; i < ichiCount;  i++) cellI?.appendChild(createBouImg(BOU[2]))

    se.playSe(se.pi)
    showMsg(`<span style="color:blue;">いくつかな？　こたえをいれてね</span>`, 0)
  }

  // ── じゆうにならべる: 数字入力 → 棒を自動配置 ────────────────────

  const handleFreeSet = useCallback(() => {
    const n = parseInt(freeInput, 10)
    if (isNaN(n) || !Number.isInteger(n) || n < 1 || n > 999) {
      se.playSe(se.alertSound)
      showMsg(`<span style="color:red;">1〜999 の せいすうを　いれてね</span>`, 2000)
      return
    }
    clearTable()
    // チェックされていない上位の位は下位に換算（お金アプリと同じ設計）
    let remaining = n
    const hyakuCount = useHyaku ? Math.floor(remaining / 100) : 0
    if (useHyaku) remaining = remaining % 100
    const juCount    = useJu    ? Math.floor(remaining / 10)  : 0
    if (useJu)    remaining = remaining % 10
    const ichiCount  = useIchi  ? remaining                   : 0
    const cellH = el_hyaku.current?.querySelector(".kazoe-droppable")
    const cellJ = el_ju.current?.querySelector(".kazoe-droppable")
    const cellI = el_ichi.current?.querySelector(".kazoe-droppable")
    for (let i = 0; i < hyakuCount; i++) cellH?.appendChild(createBouImg(BOU[0]))
    for (let i = 0; i < juCount;    i++) cellJ?.appendChild(createBouImg(BOU[1]))
    for (let i = 0; i < ichiCount;  i++) cellI?.appendChild(createBouImg(BOU[2]))
    se.playSe(se.pi)
  }, [freeInput, useHyaku, useJu, useIchi, clearTable])

  // ── リセット ──────────────────────────────────────

  const handleReset = () => {
    se.playSe(se.reset)
    clearTable()
    refillStock()
    hasAnswered.current = false
    setConfirmReset(false)
    setQuestion(null)
    setIkutsuAnswer("")
    if (el_msg.current) el_msg.current.innerHTML = ""
  }

  // ── モード選択 ────────────────────────────────────

  const selectMode = (m: Mode) => {
    clearTable()
    setMode(m)
    setShowModePanel(false)
    setQuestion(null)
    setIkutsuAnswer("")
    hasAnswered.current = false
    setConfirmReset(false)
    se.playSe(se.set)
    if (el_msg.current) el_msg.current.innerHTML = ""
  }

  useEffect(() => {
    if (mode !== null) refillStock()
  }, [mode, refillStock])

  // ── DnD ──────────────────────────────────────────
  // document レベルでリスナーを設定（mode=null 時でも有効）

  useEffect(() => {
    let dragged: HTMLImageElement | null = null
    let originalParent: HTMLElement | null = null
    let offsetX = 0, offsetY = 0

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
      const rect  = dragged.getBoundingClientRect()

      document.body.appendChild(dragged)
      dragged.style.position      = "fixed"
      dragged.style.zIndex        = "1000"
      dragged.style.left          = rect.left + "px"
      dragged.style.top           = rect.top  + "px"
      dragged.style.width         = rect.width + "px"
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

      dragged.style.position      = ""
      dragged.style.zIndex        = ""
      dragged.style.left          = ""
      dragged.style.top           = ""
      dragged.style.pointerEvents = ""
      const bou = BOU.find(b => b.id === dragged!.getAttribute("data-bou-id"))
      if (bou) { dragged.style.width = bou.w + "px"; dragged.style.height = bou.h + "px" }
      dragged.style.objectFit = "contain"

      dragged.style.display = "none"
      const below = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
      // display を "" に戻すと Tailwind preflight の img{display:block} が効いて縦並びになるため inline-block を明示
      dragged.style.display = "inline-block"

      let placed = false

      if (below) {
        const cell = (
          below.classList.contains("kazoe-droppable") ? below : below.closest(".kazoe-droppable")
        ) as HTMLElement | null

        if (cell) {
          cell.appendChild(dragged)
          placed = true
          se.playSe(se.pi)
          if (originalParent === el_stock.current) refillStockRef.current()
        } else if (below.closest("#kazoe-trash")) {
          if (dragged.parentElement === document.body) dragged.remove()
          placed = true
          se.playSe(se.cancel)
          if (originalParent === el_stock.current) refillStockRef.current()
        } else if (below.closest("#kazoe-stock")) {
          if (dragged.parentElement === document.body) dragged.remove()
          placed = true
          se.playSe(se.pi)
          refillStockRef.current()
        }
      }

      if (!placed) {
        if (originalParent === el_stock.current) {
          if (dragged.parentElement === document.body) dragged.remove()
          refillStockRef.current()
        } else if (dragged.parentElement === document.body && originalParent) {
          originalParent.appendChild(dragged)
        }
      }

      dragged = null
      originalParent = null
      if (!(e as TouchEvent).changedTouches) {
        document.removeEventListener("mousemove", handleMove)
        document.removeEventListener("mouseup",   handleEnd)
      }
    }

    document.addEventListener("mousedown",  handleStart, { passive: false })
    document.addEventListener("touchstart", handleStart, { passive: false })
    document.addEventListener("touchmove",  handleMove,  { passive: false })
    document.addEventListener("touchend",   handleEnd,   { passive: false })

    return () => {
      document.removeEventListener("mousedown",  handleStart)
      document.removeEventListener("touchstart", handleStart)
      document.removeEventListener("touchmove",  handleMove)
      document.removeEventListener("touchend",   handleEnd)
      document.removeEventListener("mousemove",  handleMove)
      document.removeEventListener("mouseup",    handleEnd)
    }
  }, [])

  // ── セルクラス（共通） ────────────────────────────
  const cellCls = (color: string, border: string) =>
    `kazoe-droppable ${color} ${border} rounded p-1 flex flex-wrap content-start`

  // ── 描画 ─────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* タイトル + モードトグル（中央揃え） */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          🪵 かぞえぼう
        </h1>
        <button
          onClick={() => { setShowModePanel(p => !p); se.playSe(se.set) }}
          className="text-sm font-bold text-brand-600 dark:text-brand-400
                     hover:text-brand-800 dark:hover:text-brand-300 transition-colors"
        >
          {showModePanel ? "▲ とじる" : "▼ モードをかえる"}
        </button>
      </div>

      {/* モード選択パネル */}
      {showModePanel && (
        <div className="flex items-center gap-2 flex-wrap mb-3 p-2
                        bg-gray-100 dark:bg-gray-800 rounded-lg">
          {(["free", "narabe", "ikutsu"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => selectMode(m)}
              className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-colors
                ${mode === m
                  ? "bg-brand-500 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border"}`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            ← モードをえらぼう
          </span>
        </div>
      )}

      {/* ── メインコンテンツ ── */}
      <>
        {/* メッセージエリア */}
          <div
            ref={el_msg}
            className="w-full flex justify-center items-center mb-3
                       min-h-10 py-1 px-3 text-black bg-yellow-100 font-bold rounded"
          />

          {/* ─── テーブルエリア（3列 + ゴミ箱はくりあがり右上に収める） ─── */}
          <div className="flex gap-1 mb-1">

            {/* ── 百の列（flex:3 で広め） ── */}
            <div className="flex flex-col gap-1 min-w-0" style={{ flex: 3 }}>
              {/* くりあがり待機 */}
              <div className="text-center text-[10px] text-pink-400 pointer-events-none leading-none">
                くりあがり
              </div>
              <div
                ref={el_kuri_hyaku}
                className="kazoe-droppable border border-dashed border-pink-300
                           bg-pink-50 dark:bg-pink-900/10 rounded p-1
                           flex flex-wrap content-start"
                style={{ minHeight: BOU_H + 8 + "px" }}
              />
              {/* ボタン */}
              <div className="flex gap-0.5 justify-center flex-wrap">
                <button onClick={handleKuriagariHyaku}
                  className="px-2 py-1 text-xs font-bold bg-pink-300 text-pink-900
                             border border-pink-400 rounded shadow-sm
                             hover:bg-pink-400 active:bg-pink-500 leading-tight">
                  ↑くりあがり
                </button>
                <button onClick={handleBarasuHyaku}
                  className="px-2 py-1 text-xs font-bold bg-pink-100 text-pink-800
                             border border-pink-300 rounded shadow-sm
                             hover:bg-pink-200 active:bg-pink-300 leading-tight">
                  ↓ばらす
                </button>
              </div>
              {/* ラベル */}
              <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-300 pointer-events-none">
                百の位
              </div>
              {/* メイン3段（段間にリサイズハンドル） */}
              <div ref={el_hyaku} className="flex-1 flex flex-col border-2 border-pink-300 rounded-lg p-1">
                <div className={cellCls("bg-pink-100 dark:bg-pink-900/20", "border border-pink-200")} style={{ minHeight: cellMinHs[0] + "px" }} />
                <div className="h-3 flex items-center cursor-ns-resize group"
                  onMouseDown={e => { e.stopPropagation(); startRowResize(0, e.clientY) }}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); startRowResize(0, e.touches[0].clientY) }}>
                  <div className="w-full h-px bg-pink-300 group-hover:bg-pink-500 transition-colors pointer-events-none" />
                </div>
                <div className={cellCls("bg-pink-100 dark:bg-pink-900/20", "border border-pink-200")} style={{ minHeight: cellMinHs[1] + "px" }} />
                <div className="h-3 flex items-center cursor-ns-resize group"
                  onMouseDown={e => { e.stopPropagation(); startRowResize(1, e.clientY) }}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); startRowResize(1, e.touches[0].clientY) }}>
                  <div className="w-full h-px bg-pink-300 group-hover:bg-pink-500 transition-colors pointer-events-none" />
                </div>
                <div className={cellCls("bg-pink-100 dark:bg-pink-900/20", "border border-pink-200")} style={{ minHeight: cellMinHs[2] + "px" }} />
              </div>
            </div>

            {/* ── 十の列（flex:2） ── */}
            <div className="flex flex-col gap-1 min-w-0" style={{ flex: 2 }}>
              <div className="text-center text-[10px] text-yellow-500 pointer-events-none leading-none">
                くりあがり
              </div>
              <div
                ref={el_kuri_ju}
                className="kazoe-droppable border border-dashed border-yellow-300
                           bg-yellow-50 dark:bg-yellow-900/10 rounded p-1
                           flex flex-wrap content-start"
                style={{ minHeight: BOU_H + 8 + "px" }}
              />
              <div className="flex gap-0.5 justify-center flex-wrap">
                <button onClick={handleKuriagariJu}
                  className="px-2 py-1 text-xs font-bold bg-yellow-300 text-yellow-900
                             border border-yellow-400 rounded shadow-sm
                             hover:bg-yellow-400 active:bg-yellow-500 leading-tight">
                  ↑くりあがり
                </button>
                <button onClick={handleBarasuJu}
                  className="px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-800
                             border border-yellow-300 rounded shadow-sm
                             hover:bg-yellow-200 active:bg-yellow-300 leading-tight">
                  ↓ばらす
                </button>
              </div>
              <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-300 pointer-events-none">
                十の位
              </div>
              <div ref={el_ju} className="flex-1 flex flex-col border-2 border-yellow-300 rounded-lg p-1">
                <div className={cellCls("bg-yellow-100 dark:bg-yellow-900/20", "border border-yellow-200")} style={{ minHeight: cellMinHs[0] + "px" }} />
                <div className="h-3 flex items-center cursor-ns-resize group"
                  onMouseDown={e => { e.stopPropagation(); startRowResize(0, e.clientY) }}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); startRowResize(0, e.touches[0].clientY) }}>
                  <div className="w-full h-px bg-yellow-300 group-hover:bg-yellow-500 transition-colors pointer-events-none" />
                </div>
                <div className={cellCls("bg-yellow-100 dark:bg-yellow-900/20", "border border-yellow-200")} style={{ minHeight: cellMinHs[1] + "px" }} />
                <div className="h-3 flex items-center cursor-ns-resize group"
                  onMouseDown={e => { e.stopPropagation(); startRowResize(1, e.clientY) }}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); startRowResize(1, e.touches[0].clientY) }}>
                  <div className="w-full h-px bg-yellow-300 group-hover:bg-yellow-500 transition-colors pointer-events-none" />
                </div>
                <div className={cellCls("bg-yellow-100 dark:bg-yellow-900/20", "border border-yellow-200")} style={{ minHeight: cellMinHs[2] + "px" }} />
              </div>
            </div>

            {/* ── 一の列（flex:1 で狭め） ── */}
            <div className="flex flex-col gap-1 min-w-0" style={{ flex: 1 }}>
              {/* 透明ラベル（高さ合わせ） */}
              <div className="text-[10px] text-transparent pointer-events-none leading-none">
                くりあがり
              </div>
              {/* ゴミ箱（くりあがり待機行の位置に収める） */}
              <div
                id="kazoe-trash"
                className="flex flex-col items-center justify-center gap-0.5 p-1
                           border-2 border-dashed border-gray-300 rounded
                           bg-gray-50 dark:bg-gray-800 dark:border-gray-600"
                style={{ minHeight: BOU_H + 8 + "px" }}
              >
                <Image src="/images/gomibako.png" alt="ゴミ箱" width={32} height={32}
                  className="pointer-events-none opacity-70" />
                <span className="text-[9px] text-gray-400 leading-none">すてる</span>
              </div>
              {/* ボタン行スペーサー（高さ合わせ） */}
              <div className="flex gap-0.5 justify-center opacity-0 pointer-events-none">
                <span className="px-2 py-1 text-xs leading-tight">dummy</span>
              </div>
              <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-300 pointer-events-none">
                一の位
              </div>
              <div ref={el_ichi} className="flex-1 flex flex-col border-2 border-blue-300 rounded-lg p-1">
                <div className={cellCls("bg-blue-100 dark:bg-blue-900/20", "border border-blue-200")} style={{ minHeight: cellMinHs[0] + "px" }} />
                <div className="h-3 flex items-center cursor-ns-resize group"
                  onMouseDown={e => { e.stopPropagation(); startRowResize(0, e.clientY) }}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); startRowResize(0, e.touches[0].clientY) }}>
                  <div className="w-full h-px bg-blue-300 group-hover:bg-blue-500 transition-colors pointer-events-none" />
                </div>
                <div className={cellCls("bg-blue-100 dark:bg-blue-900/20", "border border-blue-200")} style={{ minHeight: cellMinHs[1] + "px" }} />
                <div className="h-3 flex items-center cursor-ns-resize group"
                  onMouseDown={e => { e.stopPropagation(); startRowResize(1, e.clientY) }}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); startRowResize(1, e.touches[0].clientY) }}>
                  <div className="w-full h-px bg-blue-300 group-hover:bg-blue-500 transition-colors pointer-events-none" />
                </div>
                <div className={cellCls("bg-blue-100 dark:bg-blue-900/20", "border border-blue-200")} style={{ minHeight: cellMinHs[2] + "px" }} />
              </div>
            </div>

          </div>


          {/* ストック + ボタン群 */}
          <div className="flex items-center gap-2 flex-wrap mb-4
                          border-2 border-amber-400 rounded-xl p-3
                          bg-amber-50 dark:bg-amber-900/20">

            {/* 棒のストック */}
            <div id="kazoe-stock" ref={el_stock}
              className="flex items-end min-h-[60px] flex-1" />

            {/* 使う位チェックボックス（全モード共通） */}
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                つかう<br />くらい
              </span>
              {[
                { label: "百", checked: useHyaku, set: setUseHyaku },
                { label: "十", checked: useJu,    set: setUseJu    },
                { label: "一", checked: useIchi,  set: setUseIchi  },
              ].map(({ label, checked, set }) => (
                <label key={label} className="flex items-center gap-0.5 cursor-pointer">
                  <input type="checkbox" checked={checked}
                    onChange={e => { set(e.target.checked); se.playSe(se.set) }} />
                  <span className="text-xs">{label}</span>
                </label>
              ))}
            </div>

            {/* じゆうにならべる: 数字入力 → 棒を自動配置 */}
            {mode === "free" && (
              <>
                <input
                  type="number"
                  min="1" max="999"
                  value={freeInput}
                  onChange={e => setFreeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleFreeSet() }}
                  placeholder="すう字"
                  className="w-28 border-2 border-brand-300 rounded-lg px-2 py-1.5
                             text-lg font-bold text-center
                             dark:bg-gray-700 dark:border-brand-600 dark:text-white"
                />
                <button
                  onClick={handleFreeSet}
                  className="px-3 py-2 bg-accent-500 text-white rounded-lg font-bold
                             hover:bg-accent-600 transition-colors text-sm"
                >
                  ならべる
                </button>
              </>
            )}

            {/* もんだいボタン */}
            {mode === "narabe" && (
              <button onClick={handleNarabeQuestion}
                className="px-3 py-2 bg-accent-500 text-white rounded-lg font-bold
                           hover:bg-accent-600 transition-colors text-sm">
                もんだい
              </button>
            )}
            {mode === "ikutsu" && (
              <button onClick={handleIkutsuQuestion}
                className="px-3 py-2 bg-accent-500 text-white rounded-lg font-bold
                           hover:bg-accent-600 transition-colors text-sm">
                もんだい
              </button>
            )}

            {/* いくつかな: 答え入力欄 */}
            {mode === "ikutsu" && (
              <input
                type="number"
                min="1" max="999"
                value={ikutsuAnswer}
                onChange={e => setIkutsuAnswer(e.target.value)}
                placeholder="こたえ"
                className="w-20 border-2 border-brand-300 rounded-lg px-2 py-1.5
                           text-lg font-bold text-center
                           dark:bg-gray-700 dark:border-brand-600 dark:text-white"
              />
            )}

            {/* けいさん / こたえあわせ */}
            <button onClick={handleCalc}
              className="px-3 py-2 bg-brand-500 text-white rounded-lg font-bold
                         hover:bg-brand-600 transition-colors text-sm">
              {mode === "free" ? "いくつ？" : "こたえあわせ"}
            </button>

            {/* リセット */}
            {!confirmReset ? (
              <button
                onClick={() => { se.playSe(se.alertSound); setConfirmReset(true) }}
                className="px-3 py-2 bg-gray-400 text-white rounded-lg font-bold
                           hover:bg-gray-500 transition-colors text-sm">
                リセット
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">ほんとうに？</span>
                <button onClick={handleReset}
                  className="px-2 py-1.5 bg-red-500 text-white rounded-lg font-bold
                             hover:bg-red-600 transition-colors text-sm">はい</button>
                <button onClick={() => setConfirmReset(false)}
                  className="px-2 py-1.5 bg-gray-300 text-gray-700 rounded-lg font-bold
                             hover:bg-gray-400 transition-colors text-sm">いいえ</button>
              </div>
            )}
          </div>

          {/* コイン表示 */}
          <CoinDisplay coins={coins} className="w-full" />

      </>

    </div>
  )
}

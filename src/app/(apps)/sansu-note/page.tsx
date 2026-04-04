// ======================================================
// さんすうノート ページ
//
// URL: /sansu-note
// 対象: 1〜2年生（算数全般の自由操作ツール）
//
// 機能（Phase 1）:
//   - 方眼グリッド（4段階サイズ切替: 大/中/小/極小）
//   - グリッド表示 ON/OFF
//   - 画像パレット（ブロック・おはじき・お金）
//     → パレットから直接ドラッグしてノート上に配置
//   - ノート上のアイテムを自由ドラッグで移動
//   - ゴミ箱エリアにドロップで削除
//   - リセットボタン（全クリア）
//
// ドラッグ実装:
//   2種類のドラッグを統一的に処理する。
//   (1) パレットドラッグ: パレットを押す → ゴースト要素が指に追従
//       → ノート上でドロップすると新アイテムとして配置
//   (2) アイテムドラッグ: ノート上のアイテムを押す → 移動
//       → ゴミ箱ドロップで削除
//   どちらも document レベルの pointermove/pointerup で処理。
// ======================================================

"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import * as se from "@/lib/se"

// ── 方眼サイズ設定 ──────────────────────────────────────
const GRID_SIZES = [
  { label: "大", value: 80 },
  { label: "中", value: 60 },
  { label: "小", value: 40 },
  { label: "極小", value: 20 },
] as const

// ── パレットアイテム定義 ─────────────────────────────────
type PaletteItem = {
  id: string       // 画像ファイル名（拡張子なし）または __num_N
  label: string
  category: string
  width: number
  height: number
}

const PALETTE_ITEMS: PaletteItem[] = [
  // ブロック
  { id: "pink_block", label: "ブロック(赤)", category: "ブロック", width: 40, height: 40 },
  { id: "blue_block", label: "ブロック(青)", category: "ブロック", width: 40, height: 40 },
  // おはじき
  { id: "ohajiki_P",  label: "おはじき(赤)", category: "ブロック", width: 40, height: 40 },
  { id: "ohajiki_B",  label: "おはじき(青)", category: "ブロック", width: 40, height: 40 },
  // お金（硬貨）
  { id: "ichi",    label: "1円",   category: "おかね", width: 36, height: 36 },
  { id: "go",      label: "5円",   category: "おかね", width: 36, height: 36 },
  { id: "juu",     label: "10円",  category: "おかね", width: 36, height: 36 },
  { id: "gojuu",   label: "50円",  category: "おかね", width: 36, height: 36 },
  { id: "hyaku",   label: "100円", category: "おかね", width: 36, height: 36 },
  { id: "gohyaku", label: "500円", category: "おかね", width: 40, height: 40 },
  // お金（お札）
  { id: "sen",     label: "千円",  category: "おかね", width: 64, height: 36 },
  { id: "gosen",   label: "5千円", category: "おかね", width: 64, height: 36 },
  { id: "ichiman", label: "1万円", category: "おかね", width: 64, height: 36 },
]

// 数字タイルもパレットアイテムとして定義
const NUM_TILES: PaletteItem[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({
  id: `__num_${n}`,
  label: `${n}`,
  category: "すうじ",
  width: 36,
  height: 36,
}))

const CATEGORIES = ["ブロック", "おかね", "すうじ"] as const

// ── ノート上に配置されたアイテムの型 ──────────────────────
type PlacedItem = {
  uid: string
  imageId: string
  label: string
  width: number
  height: number
  x: number   // ノートエリア内の left 座標
  y: number   // ノートエリア内の top 座標
}

// ── ドラッグ中の情報（2種類を統合） ──────────────────────
type DragInfo = {
  mode: "palette"    // パレットから引き出し中
  palette: PaletteItem
  startPx: number    // 開始位置（タップ判定に使う）
  startPy: number
} | {
  mode: "item"       // ノート上のアイテムを移動中
  uid: string
  el: HTMLElement
  startPx: number
  startPy: number
  startOx: number
  startOy: number
}

// ── ユニークID生成 ────────────────────────────────────────
let itemCounter = 0
function genId(): string {
  return `item-${Date.now()}-${itemCounter++}`
}

// ── 手書きペンの色 ───────────────────────────────────────
// CUD（カラーユニバーサルデザイン）配色 6色
// 隣り合う色同士が色覚タイプに関わらず区別しやすい並び順
const PEN_COLORS = [
  { label: "くろ", value: "#333" },
  { label: "あか", value: "#ee5555" },
  { label: "だいだい", value: "#ff8800" },
  { label: "きみどり", value: "#88cc00" },
  { label: "あお", value: "#005aff" },
  { label: "うすむらさき", value: "#c8a0ff" },
] as const

// ======================================================
// ページ本体
// ======================================================
export default function SansuNotePage() {
  // ── 方眼の状態 ─────────────────────────────────────────
  const [gridSizeIndex, setGridSizeIndex] = useState(0)
  const [showGrid, setShowGrid] = useState(true)
  const gridSize = GRID_SIZES[gridSizeIndex].value

  // ── グリッドスナップ ───────────────────────────────────
  const [snapEnabled, setSnapEnabled] = useState(false)
  const snapEnabledRef = useRef(snapEnabled)
  snapEnabledRef.current = snapEnabled
  const gridSizeRef = useRef(gridSize)
  gridSizeRef.current = gridSize

  // スナップ関数: 有効時は最寄りのグリッド線に吸着させる
  const snap = useCallback((val: number) => {
    if (!snapEnabledRef.current) return val
    const gs = gridSizeRef.current
    return Math.round(val / gs) * gs
  }, [])

  // ── 手書きモード ───────────────────────────────────────
  const [drawingMode, setDrawingMode] = useState(false)
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0].value)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // undo 用の画像データスタック
  const undoStackRef = useRef<ImageData[]>([])

  // ── パレットのカテゴリタブ ─────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0])

  // ── 配置済みアイテム ───────────────────────────────────
  const [items, setItems] = useState<PlacedItem[]>([])
  const itemsRef = useRef(items)
  itemsRef.current = items

  // ── ドラッグ中の情報 ───────────────────────────────────
  const dragRef = useRef<DragInfo | null>(null)

  // ── ゴースト要素（パレットドラッグ中に指に追従する） ───
  const ghostRef = useRef<HTMLDivElement>(null)

  // ── ゴミ箱 ref ─────────────────────────────────────────
  const trashRef = useRef<HTMLDivElement>(null)

  // ── ノートエリア ref（座標変換に使用） ─────────────────
  const noteRef = useRef<HTMLDivElement>(null)

  // ── ゴミ箱ハイライト制御（共通） ───────────────────────
  const updateTrash = useCallback((clientX: number, clientY: number) => {
    if (!trashRef.current) return false
    const r = trashRef.current.getBoundingClientRect()
    const over = clientX >= r.left && clientX <= r.right
      && clientY >= r.top && clientY <= r.bottom
    trashRef.current.style.transform = over ? "scale(1.2)" : "scale(1)"
    trashRef.current.style.opacity = over ? "1" : "0.6"
    return over
  }, [])

  const resetTrash = useCallback(() => {
    if (!trashRef.current) return
    trashRef.current.style.transform = "scale(1)"
    trashRef.current.style.opacity = "0.6"
  }, [])

  // ── document レベルの pointermove / pointerup ──────────
  // ※ 手書きモード中はアイテムドラッグを無効化する
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      e.preventDefault()

      if (drag.mode === "palette") {
        // パレットドラッグ: ゴースト要素を指に追従させる
        const ghost = ghostRef.current
        if (ghost) {
          ghost.style.left = `${e.clientX - drag.palette.width / 2}px`
          ghost.style.top = `${e.clientY - drag.palette.height / 2}px`
        }
      } else {
        // アイテムドラッグ: DOM の left/top を直接更新
        const x = drag.startOx + (e.clientX - drag.startPx)
        const y = drag.startOy + (e.clientY - drag.startPy)
        drag.el.style.left = `${x}px`
        drag.el.style.top = `${y}px`
      }

      updateTrash(e.clientX, e.clientY)
    }

    const handleUp = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return

      const overTrash = updateTrash(e.clientX, e.clientY)
      resetTrash()

      if (drag.mode === "palette") {
        // ── パレットドラッグ終了 ─────────────────────────
        const ghost = ghostRef.current
        if (ghost) ghost.style.display = "none"

        // タップ判定: 指の移動が 10px 以下なら「タップ」扱い
        // → ノート上のランダム位置にアイテムを生成（連打で大量に出せる）
        const dx = e.clientX - drag.startPx
        const dy = e.clientY - drag.startPy
        const isTap = Math.abs(dx) < 10 && Math.abs(dy) < 10

        if (isTap) {
          // タップ: ノート上のランダム位置に配置（スナップ対応）
          const noteEl = noteRef.current
          if (noteEl) {
            const noteRect = noteEl.getBoundingClientRect()
            se.playSe(se.pi)
            const rawX = 20 + Math.random() * Math.max(100, noteRect.width - 100)
            const rawY = 20 + Math.random() * Math.max(100, noteRect.height - 100)
            setItems(prev => [...prev, {
              uid: genId(),
              imageId: drag.palette.id,
              label: drag.palette.label,
              width: drag.palette.width,
              height: drag.palette.height,
              x: snap(rawX),
              y: snap(rawY),
            }])
          }
        } else {
          // ドラッグ: ノートエリア内に落としたかチェック（スナップ対応）
          const noteEl = noteRef.current
          if (noteEl && !overTrash) {
            const noteRect = noteEl.getBoundingClientRect()
            const rawX = e.clientX - noteRect.left - drag.palette.width / 2
            const rawY = e.clientY - noteRect.top - drag.palette.height / 2
            if (rawX >= -drag.palette.width && rawY >= -drag.palette.height
              && e.clientX <= noteRect.right && e.clientY <= noteRect.bottom) {
              se.playSe(se.pi)
              setItems(prev => [...prev, {
                uid: genId(),
                imageId: drag.palette.id,
                label: drag.palette.label,
                width: drag.palette.width,
                height: drag.palette.height,
                x: snap(Math.max(0, rawX)),
                y: snap(Math.max(0, rawY)),
              }])
            }
          }
        }
      } else {
        // ── アイテムドラッグ終了（スナップ対応）──────────
        drag.el.style.zIndex = "1"
        const rawX = drag.startOx + (e.clientX - drag.startPx)
        const rawY = drag.startOy + (e.clientY - drag.startPy)
        const x = snap(rawX)
        const y = snap(rawY)

        if (overTrash) {
          se.playSe(se.cancel)
          setItems(prev => prev.filter(it => it.uid !== drag.uid))
        } else {
          se.playSe(se.pi)
          // スナップ時は DOM 位置も確定値に合わせる
          drag.el.style.left = `${x}px`
          drag.el.style.top = `${y}px`
          setItems(prev => prev.map(it =>
            it.uid === drag.uid ? { ...it, x, y } : it
          ))
        }
      }

      dragRef.current = null
    }

    document.addEventListener("pointermove", handleMove, { passive: false })
    document.addEventListener("pointerup", handleUp)
    return () => {
      document.removeEventListener("pointermove", handleMove)
      document.removeEventListener("pointerup", handleUp)
    }
  }, [updateTrash, resetTrash, snap])

  // ── Canvas リサイズ（ノートエリアに合わせる）──────────
  // ノートエリアが描画された後、Canvas サイズを実寸に合わせる
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const note = noteRef.current
    if (!canvas || !note) return
    const rect = note.getBoundingClientRect()
    // 既存の描画内容を退避
    const ctx = canvas.getContext("2d")
    let backup: ImageData | null = null
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      backup = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }
    canvas.width = rect.width
    canvas.height = rect.height
    // 退避した描画を復元（サイズ変更で消えるため）
    if (ctx && backup) {
      ctx.putImageData(backup, 0, 0)
    }
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [resizeCanvas])

  // ── Canvas 手書き描画ハンドラ ─────────────────────────
  const isDrawingRef = useRef(false)
  const penColorRef = useRef(penColor)
  penColorRef.current = penColor

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    e.stopPropagation()

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // undo 用に現在の画像を保存（ストローク開始時に1回だけ）
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    // スタック上限（メモリ節約）
    if (undoStackRef.current.length > 30) undoStackRef.current.shift()

    isDrawingRef.current = true

    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = penColorRef.current
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }, [])

  const handleCanvasPointerUp = useCallback(() => {
    isDrawingRef.current = false
  }, [])

  // ── undo: 直前のストロークを消す ──────────────────────
  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const prev = undoStackRef.current.pop()
    if (prev) {
      ctx.putImageData(prev, 0, 0)
      se.playSe(se.cancel)
    }
  }, [])

  // ── 手書き全消去 ──────────────────────────────────────
  const handleClearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    // undo 用に保存してからクリア
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    se.playSe(se.reset)
  }, [])

  // ── パレットの pointerdown（ドラッグ開始）──────────────
  const handlePalettePointerDown = useCallback((
    e: React.PointerEvent<HTMLElement>,
    palette: PaletteItem
  ) => {
    e.preventDefault()
    e.stopPropagation()
    se.playSe(se.move1)

    // ゴースト要素を表示して指の位置に配置
    const ghost = ghostRef.current
    if (ghost) {
      ghost.style.display = "block"
      ghost.style.width = `${palette.width}px`
      ghost.style.height = `${palette.height}px`
      ghost.style.left = `${e.clientX - palette.width / 2}px`
      ghost.style.top = `${e.clientY - palette.height / 2}px`

      // ゴーストの中身を設定
      if (palette.id.startsWith("__num_")) {
        ghost.innerHTML = `<div style="
          width:${palette.width}px; height:${palette.height}px;
          display:flex; align-items:center; justify-content:center;
          border:2px solid #3b82f6; border-radius:4px;
          background:white; color:#1d4ed8; font-weight:bold;
          font-size:${palette.height * 0.55}px;
        ">${palette.label}</div>`
      } else {
        ghost.innerHTML = `<img
          src="/images/${palette.id}.png"
          width="${palette.width}" height="${palette.height}"
          style="pointer-events:none;"
          draggable="false"
        />`
      }
    }

    dragRef.current = { mode: "palette", palette, startPx: e.clientX, startPy: e.clientY }
  }, [])

  // ── ノート上アイテムの pointerdown（移動開始）──────────
  // ※ 手書きモード中は Canvas が pointer-events: all で上に被るので
  //    そもそもアイテムには届かないが、念のためガードも入れる
  const drawingModeRef = useRef(drawingMode)
  drawingModeRef.current = drawingMode

  const handleItemPointerDown = useCallback((
    e: React.PointerEvent<HTMLDivElement>,
    uid: string
  ) => {
    if (drawingModeRef.current) return  // 手書きモード中はドラッグ無効
    e.preventDefault()
    e.stopPropagation()
    se.playSe(se.move1)

    const el = e.currentTarget
    el.style.zIndex = "100"

    const item = itemsRef.current.find(it => it.uid === uid)
    if (!item) return

    dragRef.current = {
      mode: "item",
      uid,
      el,
      startPx: e.clientX,
      startPy: e.clientY,
      startOx: item.x,
      startOy: item.y,
    }
  }, [])

  // ── リセット（2段階確認） ────────────────────────────────
  // 1回目: 「ほんとうに？」に変化、2回目: 実行。3秒放置で元に戻る
  const [resetConfirm, setResetConfirm] = useState(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleReset = () => {
    if (items.length === 0) return
    if (!resetConfirm) {
      // 1回目: 確認状態にする
      se.playSe(se.move1)
      setResetConfirm(true)
      // 3秒後に確認状態を解除
      resetTimerRef.current = setTimeout(() => setResetConfirm(false), 3000)
      return
    }
    // 2回目: 実行（アイテム + 手書き両方クリア）
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    se.playSe(se.reset)
    setItems([])
    // Canvas もクリア
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    undoStackRef.current = []
    setResetConfirm(false)
  }

  // ── 方眼グリッド背景 ──────────────────────────────────
  const gridBg = showGrid ? {
    backgroundImage: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent ${gridSize - 1}px,
        #93c5fd ${gridSize - 1}px,
        #93c5fd ${gridSize}px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent ${gridSize - 1}px,
        #93c5fd ${gridSize - 1}px,
        #93c5fd ${gridSize}px
      )
    `,
    backgroundSize: `${gridSize}px ${gridSize}px`,
  } : {}

  // ── 全パレットアイテム（カテゴリ別）────────────────────
  const allPalette = [...PALETTE_ITEMS, ...NUM_TILES]

  // ── JSX ────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 pt-3 pb-1">
        さんすうノート
      </h1>

      {/* コントロールバー */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-2 pb-2">
        {/* 方眼サイズ */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600">マス:</span>
          {GRID_SIZES.map((gs, i) => (
            <button
              key={gs.label}
              onClick={() => { setGridSizeIndex(i); se.playSe(se.kako) }}
              className={`px-2 py-0.5 text-xs rounded border transition-colors
                ${i === gridSizeIndex
                  ? "bg-accent-600 text-white border-accent-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
            >
              {gs.label}
            </button>
          ))}
        </div>

        {/* グリッド ON/OFF */}
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => {
              setShowGrid(e.target.checked)
              se.playSe(e.target.checked ? se.set : se.cancel)
            }}
            className="w-4 h-4 accent-brand-500"
          />
          <span className="text-xs text-gray-600">方眼</span>
        </label>

        {/* スナップ ON/OFF */}
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={snapEnabled}
            onChange={(e) => {
              setSnapEnabled(e.target.checked)
              se.playSe(e.target.checked ? se.set : se.cancel)
            }}
            className="w-4 h-4 accent-brand-500"
          />
          <span className="text-xs text-gray-600">スナップ</span>
        </label>

        {/* 区切り */}
        <div className="w-px h-5 bg-gray-300" />

        {/* 手書きモード切替 */}
        <button
          onClick={() => {
            setDrawingMode(prev => !prev)
            se.playSe(se.set)
          }}
          className={`px-3 py-1 text-xs rounded border-2 active:translate-y-0.5
            transition-colors font-bold ${drawingMode
              ? "border-yellow-400 bg-yellow-400 text-gray-800"
              : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
            }`}
        >
          ✏️ 手書き
        </button>

        {/* 手書きモード中のみ表示: ペン色 + undo + クリア */}
        {drawingMode && (
          <>
            {PEN_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => { setPenColor(c.value); se.playSe(se.move1) }}
                className={`w-6 h-6 rounded-full border-2 transition-transform
                  ${penColor === c.value ? "scale-125 border-gray-800" : "border-gray-300"}`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
            <button
              onClick={handleUndo}
              className="px-2 py-0.5 text-xs rounded border border-gray-300
                bg-white text-gray-600 hover:bg-gray-100 active:translate-y-0.5"
            >
              もどす
            </button>
            <button
              onClick={handleClearCanvas}
              className="px-2 py-0.5 text-xs rounded border border-gray-300
                bg-white text-gray-600 hover:bg-gray-100 active:translate-y-0.5"
            >
              全消し
            </button>
          </>
        )}

        {/* 区切り */}
        <div className="w-px h-5 bg-gray-300" />

        {/* リセット（2段階確認）— アイテム + 手書き両方クリア */}
        <button
          onClick={handleReset}
          className={`px-3 py-1 text-xs rounded border-2 active:translate-y-0.5
            transition-colors ${resetConfirm
              ? "border-red-400 bg-red-500 text-white animate-pulse"
              : "border-warm-300 bg-white text-warm-600 hover:bg-warm-500 hover:text-white"
            }`}
        >
          {resetConfirm ? "ほんとうに？" : "リセット"}
        </button>
      </div>

      {/* メインエリア: ノート + サイドパレット */}
      <div className="flex flex-1 overflow-hidden">

        {/* ノートエリア（方眼） */}
        <div
          ref={noteRef}
          className="relative flex-1 bg-white border border-gray-200 overflow-hidden"
          style={{ ...gridBg, touchAction: "none" }}
        >
          {/* 配置済みアイテム */}
          {items.map(item => {
            const isNumTile = item.imageId.startsWith("__num_")
            return (
              <div
                key={item.uid}
                className="select-none"
                style={{
                  position: "absolute",
                  left: item.x,
                  top: item.y,
                  touchAction: "none",
                  cursor: "grab",
                  zIndex: 1,
                  width: item.width,
                  height: item.height,
                }}
                onPointerDown={(e) => handleItemPointerDown(e, item.uid)}
              >
                {isNumTile ? (
                  <div
                    className="flex items-center justify-center rounded border-2
                      border-accent-500 bg-white text-accent-700 font-bold"
                    style={{
                      width: item.width,
                      height: item.height,
                      fontSize: item.height * 0.55,
                    }}
                  >
                    {item.label}
                  </div>
                ) : (
                  <Image
                    src={`/images/${item.imageId}.png`}
                    alt={item.label}
                    width={item.width}
                    height={item.height}
                    draggable={false}
                    style={{ pointerEvents: "none" }}
                  />
                )}
              </div>
            )
          })}

          {/* 手書き Canvas オーバーレイ
              drawingMode ON  → pointer-events: all（描画可能・アイテムはさわれない）
              drawingMode OFF → pointer-events: none（透過・アイテムドラッグ可能）
          */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            style={{
              zIndex: drawingMode ? 100 : 100,  // 常にアイテム(z:1)より上
              pointerEvents: drawingMode ? "auto" : "none",
              touchAction: "none",
              cursor: drawingMode ? "crosshair" : "default",
            }}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
          />

          {/* ゴミ箱 */}
          <div
            ref={trashRef}
            className="absolute bottom-2 right-2 transition-transform"
            style={{ opacity: 0.6, zIndex: 200 }}
          >
            <Image
              src="/images/gomibako.png"
              alt="ゴミ箱"
              width={48}
              height={60}
              draggable={false}
              style={{ pointerEvents: "none" }}
            />
          </div>
        </div>

        {/* サイドパレット */}
        <aside
          className="w-28 md:w-36 bg-blue-50 border-l border-gray-200
            flex flex-col overflow-y-auto shrink-0"
          style={{ touchAction: "none" }}
        >
          {/* カテゴリタブ */}
          <div className="flex border-b border-gray-200">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); se.playSe(se.move1) }}
                className={`flex-1 py-1.5 text-[10px] font-bold transition-colors
                  ${activeCategory === cat
                    ? "bg-white text-accent-600 border-b-2 border-accent-500"
                    : "text-gray-500 hover:bg-gray-100"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* パレットアイテム一覧 */}
          <div className="flex flex-wrap justify-center gap-2 p-2">
            {allPalette
              .filter(p => p.category === activeCategory)
              .map(palette => {
                const isNum = palette.id.startsWith("__num_")
                return (
                  <div
                    key={palette.id}
                    className="flex flex-col items-center gap-0.5 p-1 rounded
                      hover:bg-blue-100 active:bg-blue-200 transition-colors
                      cursor-grab select-none"
                    title={palette.label}
                    onPointerDown={(e) => handlePalettePointerDown(e, palette)}
                  >
                    {isNum ? (
                      <div
                        className="flex items-center justify-center rounded border
                          border-accent-500 bg-white text-accent-700 font-bold"
                        style={{ width: 36, height: 36, fontSize: 18 }}
                      >
                        {palette.label}
                      </div>
                    ) : (
                      <Image
                        src={`/images/${palette.id}.png`}
                        alt={palette.label}
                        width={40}
                        height={40}
                        draggable={false}
                        style={{ pointerEvents: "none" }}
                      />
                    )}
                    <span className="text-[10px] text-gray-600 leading-tight">
                      {palette.label}
                    </span>
                  </div>
                )
              })
            }
          </div>
        </aside>
      </div>

      {/* ゴースト要素（パレットドラッグ中に指に追従する半透明の分身） */}
      <div
        ref={ghostRef}
        style={{
          display: "none",
          position: "fixed",
          zIndex: 9999,
          pointerEvents: "none",
          opacity: 0.8,
        }}
      />
    </div>
  )
}

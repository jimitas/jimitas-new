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

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react"
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

// 数字タイル
const NUM_TILES: PaletteItem[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({
  id: `__num_${n}`,
  label: `${n}`,
  category: "すうじ",
  width: 36,
  height: 36,
}))

// 図形スタンプ（まる・さんかく・しかく × 赤/青）
const SHAPE_ITEMS: PaletteItem[] = [
  { id: "__shape_circle_red",    label: "まる(赤)",    category: "ずけい", width: 40, height: 40 },
  { id: "__shape_circle_blue",   label: "まる(青)",    category: "ずけい", width: 40, height: 40 },
  { id: "__shape_triangle_red",  label: "さんかく(赤)", category: "ずけい", width: 40, height: 40 },
  { id: "__shape_triangle_blue", label: "さんかく(青)", category: "ずけい", width: 40, height: 40 },
  { id: "__shape_square_red",    label: "しかく(赤)",   category: "ずけい", width: 40, height: 40 },
  { id: "__shape_square_blue",   label: "しかく(青)",   category: "ずけい", width: 40, height: 40 },
]

// かぞえぼう（赤・青・黄の3色）
const STICK_ITEMS: PaletteItem[] = [
  { id: "__stick_red",    label: "あか",  category: "ぼう", width: 12, height: 60 },
  { id: "__stick_blue",   label: "あお",  category: "ぼう", width: 12, height: 60 },
  { id: "__stick_yellow", label: "きいろ", category: "ぼう", width: 12, height: 60 },
]

// かぞえぼうの色マッピング
const STICK_COLORS: Record<string, string> = {
  "__stick_red": "#dc2626",
  "__stick_blue": "#2563eb",
  "__stick_yellow": "#eab308",
}

// 図形の色マッピング
const SHAPE_COLORS: Record<string, string> = {
  red: "#dc2626",
  blue: "#2563eb",
}

const CATEGORIES = ["ブロック", "おかね", "すうじ", "ずけい", "ぼう", "テキスト"] as const

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

// ── HTML エスケープ ──────────────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// ── 図形の SVG を返す ───────────────────────────────────
// id 例: "__shape_circle_red", "__shape_triangle_blue"
function renderShapeSvg(id: string, w: number, h: number): string {
  const parts = id.split("_")               // ["", "", "shape", "circle", "red"]
  const shape = parts[3]
  const color = SHAPE_COLORS[parts[4]] ?? "#888"
  const stroke = "rgba(0,0,0,0.3)"
  if (shape === "circle") {
    return `<svg width="${w}" height="${h}" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="17" fill="${color}" stroke="${stroke}" stroke-width="2"/></svg>`
  }
  if (shape === "triangle") {
    return `<svg width="${w}" height="${h}" viewBox="0 0 40 40">
      <polygon points="20,4 37,36 3,36" fill="${color}" stroke="${stroke}" stroke-width="2"/></svg>`
  }
  // square
  return `<svg width="${w}" height="${h}" viewBox="0 0 40 40">
    <rect x="3" y="3" width="34" height="34" fill="${color}" stroke="${stroke}" stroke-width="2"/></svg>`
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

// ── 配置済みアイテムの描画（種別別） ─────────────────────
function ItemRenderer({ item }: { item: PlacedItem }) {
  const { imageId, label, width, height } = item

  // 数字タイル
  if (imageId.startsWith("__num_")) {
    return (
      <div
        className="flex items-center justify-center rounded border-2
          border-accent-500 bg-white text-accent-700 font-bold"
        style={{ width, height, fontSize: height * 0.55 }}
      >
        {label}
      </div>
    )
  }

  // 図形スタンプ（SVG）
  if (imageId.startsWith("__shape_")) {
    return <div dangerouslySetInnerHTML={{ __html: renderShapeSvg(imageId, width, height) }} />
  }

  // かぞえぼう
  if (imageId.startsWith("__stick_")) {
    const color = STICK_COLORS[imageId] ?? "#888"
    return (
      <div style={{
        width, height, background: color,
        borderRadius: 3, border: "1px solid rgba(0,0,0,0.2)",
      }} />
    )
  }

  // テキスト
  if (imageId === "__text_") {
    return (
      <div style={{
        padding: "2px 6px", fontSize: 16, fontWeight: "bold",
        background: "white", border: "1px dashed #999", borderRadius: 4,
        whiteSpace: "nowrap", color: "#333",
      }}>
        {label}
      </div>
    )
  }

  // 画像（ブロック・おはじき・お金）
  return (
    <Image
      src={`/images/${imageId}.png`}
      alt={label}
      width={width}
      height={height}
      draggable={false}
      style={{ pointerEvents: "none" }}
    />
  )
}

// ── パレット内のプレビュー描画 ───────────────────────────
function PalettePreview({ palette }: { palette: PaletteItem }) {
  const { id, label } = palette

  // 数字タイル
  if (id.startsWith("__num_")) {
    return (
      <div
        className="flex items-center justify-center rounded border
          border-accent-500 bg-white text-accent-700 font-bold"
        style={{ width: 36, height: 36, fontSize: 18 }}
      >
        {label}
      </div>
    )
  }

  // 図形スタンプ
  if (id.startsWith("__shape_")) {
    return <div dangerouslySetInnerHTML={{ __html: renderShapeSvg(id, 36, 36) }} />
  }

  // かぞえぼう
  if (id.startsWith("__stick_")) {
    const color = STICK_COLORS[id] ?? "#888"
    return (
      <div style={{
        width: 12, height: 50, background: color,
        borderRadius: 3, border: "1px solid rgba(0,0,0,0.2)",
      }} />
    )
  }

  // 画像（ブロック・おはじき・お金）
  return (
    <Image
      src={`/images/${id}.png`}
      alt={label}
      width={40}
      height={40}
      draggable={false}
      style={{ pointerEvents: "none" }}
    />
  )
}

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
  const gridSizeRef = useRef(gridSize)
  useLayoutEffect(() => {
    snapEnabledRef.current = snapEnabled
    gridSizeRef.current = gridSize
  })

  // スナップ関数: 有効時は最寄りのグリッド線に吸着させる
  const snap = useCallback((val: number) => {
    if (!snapEnabledRef.current) return val
    const gs = gridSizeRef.current
    return Math.round(val / gs) * gs
  }, [])

  // ── 手書きモード ───────────────────────────────────────
  const [drawingMode, setDrawingMode] = useState(false)
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0].value)
  const [eraserMode, setEraserMode] = useState(false) // 消しゴムモード
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // undo 用の画像データスタック
  const undoStackRef = useRef<ImageData[]>([])

  // ── テキスト入力 ───────────────────────────────────────
  const [textInput, setTextInput] = useState("")

  // ── パレットのカテゴリタブ ─────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0])

  // ── 配置済みアイテム ───────────────────────────────────
  const [items, setItems] = useState<PlacedItem[]>([])
  const itemsRef = useRef(items)
  useLayoutEffect(() => { itemsRef.current = items })

  // ── タップ配置カーソル（左上から順に整列して配置する）───
  // { x, y } = 次に配置する座標。タップのたびに右へ進み、端で折り返す
  const tapCursorRef = useRef({ x: 20, y: 20 })

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
          // タップ: カーソル位置に整列配置（連打で横に並ぶ）
          const noteEl = noteRef.current
          if (noteEl) {
            const noteRect = noteEl.getBoundingClientRect()
            const margin = 4 // アイテム間の余白
            const cur = tapCursorRef.current

            se.playSe(se.pi)
            setItems(prev => [...prev, {
              uid: genId(),
              imageId: drag.palette.id,
              label: drag.palette.label,
              width: drag.palette.width,
              height: drag.palette.height,
              x: snap(cur.x),
              y: snap(cur.y),
            }])

            // カーソルを右へ進める。端に達したら次の行へ折り返す
            let nextX = cur.x + drag.palette.width + margin
            let nextY = cur.y
            if (nextX + drag.palette.width > noteRect.width - 20) {
              nextX = 20
              nextY = cur.y + drag.palette.height + margin
            }
            // 下端を超えたら先頭に戻る
            if (nextY + drag.palette.height > noteRect.height - 20) {
              nextX = 20
              nextY = 20
            }
            tapCursorRef.current = { x: nextX, y: nextY }
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
  const eraserModeRef = useRef(eraserMode)
  useLayoutEffect(() => {
    penColorRef.current = penColor
    eraserModeRef.current = eraserMode
  })

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

    if (eraserModeRef.current) {
      // 消しゴム: 描画を消す（destination-out で透明に塗る）
      ctx.globalCompositeOperation = "destination-out"
      ctx.lineWidth = 20
    } else {
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = penColorRef.current
      ctx.lineWidth = 3
    }
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

  // ── アイテム種別の判定ヘルパー ─────────────────────────
  // ゴースト（ドラッグ中の半透明分身）の innerHTML を返す
  const renderGhostHtml = (p: PaletteItem): string => {
    if (p.id.startsWith("__num_")) {
      return `<div style="
        width:${p.width}px; height:${p.height}px;
        display:flex; align-items:center; justify-content:center;
        border:2px solid #3b82f6; border-radius:4px;
        background:white; color:#1d4ed8; font-weight:bold;
        font-size:${p.height * 0.55}px;
      ">${p.label}</div>`
    }
    if (p.id.startsWith("__shape_")) {
      return renderShapeSvg(p.id, p.width, p.height)
    }
    if (p.id.startsWith("__stick_")) {
      const color = STICK_COLORS[p.id] ?? "#888"
      return `<div style="width:${p.width}px; height:${p.height}px;
        background:${color}; border-radius:3px; border:1px solid rgba(0,0,0,0.2);"></div>`
    }
    if (p.id === "__text_") {
      return `<div style="
        padding:2px 6px; font-size:16px; font-weight:bold;
        background:white; border:1px dashed #999; border-radius:4px;
        white-space:nowrap; color:#333;
      ">${escapeHtml(p.label)}</div>`
    }
    return `<img src="/images/${p.id}.png"
      width="${p.width}" height="${p.height}"
      style="pointer-events:none;" draggable="false" />`
  }

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

      // ゴーストの中身を設定（アイテム種別ごとに描画）
      ghost.innerHTML = renderGhostHtml(palette)
    }

    dragRef.current = { mode: "palette", palette, startPx: e.clientX, startPy: e.clientY }
  }, [])

  // ── ノート上アイテムの pointerdown（移動開始）──────────
  // ※ 手書きモード中は Canvas が pointer-events: all で上に被るので
  //    そもそもアイテムには届かないが、念のためガードも入れる
  const drawingModeRef = useRef(drawingMode)
  useLayoutEffect(() => { drawingModeRef.current = drawingMode })

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
    tapCursorRef.current = { x: 20, y: 20 }
    setResetConfirm(false)
  }

  // ── スクリーンショット保存 ──────────────────────────────
  // ノートエリアを1枚の Canvas に合成して PNG でダウンロード
  const handleScreenshot = useCallback(async () => {
    const note = noteRef.current
    const drawCanvas = canvasRef.current
    if (!note) return

    const rect = note.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    // オフスクリーン Canvas
    const offscreen = document.createElement("canvas")
    offscreen.width = w
    offscreen.height = h
    const ctx = offscreen.getContext("2d")
    if (!ctx) return

    // 1) 白背景
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, w, h)

    // 2) 方眼グリッド
    if (showGrid) {
      ctx.strokeStyle = "#93c5fd"
      ctx.lineWidth = 1
      for (let x = gridSize; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = gridSize; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
    }

    // 3) 配置済みアイテムを描画
    // 画像アイテムの読み込み待ちが必要なので Promise で処理
    const imagePromises = items.map(item => {
      return new Promise<void>((resolve) => {
        if (item.imageId.startsWith("__num_") || item.imageId === "__text_") {
          // テキスト系: Canvas テキスト描画
          ctx.save()
          ctx.font = item.imageId === "__text_"
            ? "bold 16px sans-serif"
            : `bold ${item.height * 0.55}px sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          if (item.imageId.startsWith("__num_")) {
            // 数字タイル: 枠 + 白背景
            ctx.fillStyle = "#fff"
            ctx.fillRect(item.x, item.y, item.width, item.height)
            ctx.strokeStyle = "#6366f1"
            ctx.lineWidth = 2
            ctx.strokeRect(item.x, item.y, item.width, item.height)
            ctx.fillStyle = "#4338ca"
          } else {
            // テキスト: 点線枠 + 白背景
            ctx.fillStyle = "#fff"
            const tw = ctx.measureText(item.label).width + 12
            ctx.fillRect(item.x, item.y, tw, 24)
            ctx.setLineDash([3, 3])
            ctx.strokeStyle = "#999"
            ctx.lineWidth = 1
            ctx.strokeRect(item.x, item.y, tw, 24)
            ctx.setLineDash([])
            ctx.fillStyle = "#333"
          }
          ctx.fillText(item.label, item.x + item.width / 2, item.y + item.height / 2)
          ctx.restore()
          resolve()
        } else if (item.imageId.startsWith("__shape_")) {
          // 図形: Canvas 描画
          ctx.save()
          const parts = item.imageId.split("_")
          const shape = parts[3]
          const color = SHAPE_COLORS[parts[4]] ?? "#888"
          ctx.fillStyle = color
          ctx.strokeStyle = "rgba(0,0,0,0.3)"
          ctx.lineWidth = 2
          if (shape === "circle") {
            ctx.beginPath()
            ctx.arc(item.x + item.width / 2, item.y + item.height / 2,
              item.width * 0.42, 0, Math.PI * 2)
            ctx.fill(); ctx.stroke()
          } else if (shape === "triangle") {
            ctx.beginPath()
            ctx.moveTo(item.x + item.width / 2, item.y + 2)
            ctx.lineTo(item.x + item.width - 2, item.y + item.height - 2)
            ctx.lineTo(item.x + 2, item.y + item.height - 2)
            ctx.closePath(); ctx.fill(); ctx.stroke()
          } else {
            ctx.fillRect(item.x + 2, item.y + 2, item.width - 4, item.height - 4)
            ctx.strokeRect(item.x + 2, item.y + 2, item.width - 4, item.height - 4)
          }
          ctx.restore()
          resolve()
        } else if (item.imageId.startsWith("__stick_")) {
          // かぞえぼう
          ctx.save()
          ctx.fillStyle = STICK_COLORS[item.imageId] ?? "#888"
          ctx.beginPath()
          // 角丸 rect の簡易描画
          const r = 3
          ctx.roundRect(item.x, item.y, item.width, item.height, r)
          ctx.fill()
          ctx.strokeStyle = "rgba(0,0,0,0.2)"
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.restore()
          resolve()
        } else {
          // 画像（ブロック・おはじき・お金）
          const img = new window.Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            ctx.drawImage(img, item.x, item.y, item.width, item.height)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = `/images/${item.imageId}.png`
        }
      })
    })

    await Promise.all(imagePromises)

    // 4) 手書きキャンバスを重ねる
    if (drawCanvas) {
      ctx.drawImage(drawCanvas, 0, 0)
    }

    // 5) PNG としてダウンロード
    const link = document.createElement("a")
    link.download = `sansu-note-${Date.now()}.png`
    link.href = offscreen.toDataURL("image/png")
    link.click()

    se.playSe(se.piron)
  }, [items, showGrid, gridSize])

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
  const allPalette = [...PALETTE_ITEMS, ...NUM_TILES, ...SHAPE_ITEMS, ...STICK_ITEMS]

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
              ? "bg-brand-500 text-white border-brand-500"
              : "bg-white text-brand-600 border-brand-300 hover:bg-brand-100 dark:bg-gray-800 dark:text-brand-300 dark:border-brand-700 dark:hover:bg-brand-900"
            }`}
        >
          ✏️ 手書き
        </button>

        {/* 手書きモード中のみ表示: ペン色 + 消しゴム + undo + クリア */}
        {drawingMode && (
          <>
            {PEN_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => { setPenColor(c.value); setEraserMode(false); se.playSe(se.move1) }}
                className={`w-6 h-6 rounded-full border-2 transition-transform
                  ${!eraserMode && penColor === c.value ? "scale-125 border-gray-800" : "border-gray-300"}`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
            {/* 消しゴム */}
            <button
              onClick={() => { setEraserMode(prev => !prev); se.playSe(se.set) }}
              className={`px-2 py-0.5 text-xs rounded border-2 active:translate-y-0.5
                transition-colors font-bold ${eraserMode
                  ? "border-warm-400 bg-warm-400 text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                }`}
            >
              消しゴム
            </button>
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

        {/* スクリーンショット保存 */}
        <button
          onClick={handleScreenshot}
          className="px-3 py-1 text-xs rounded border-2
            bg-accent-400 hover:bg-accent-500 active:bg-accent-600
            text-white border-accent-400
            active:translate-y-0.5 transition-colors"
        >
          保存
        </button>

        {/* リセット（2段階確認）— アイテム + 手書き両方クリア */}
        <button
          onClick={handleReset}
          className={`px-3 py-1 text-xs rounded border-2 active:translate-y-0.5
            transition-colors text-white ${resetConfirm
              ? "border-danger-500 bg-danger-500 hover:bg-danger-600 animate-pulse"
              : "border-danger-400 bg-danger-400 hover:bg-danger-500"
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
          {items.map(item => (
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
                width: item.imageId === "__text_" ? "auto" : item.width,
                height: item.imageId === "__text_" ? "auto" : item.height,
              }}
              onPointerDown={(e) => handleItemPointerDown(e, item.uid)}
            >
              <ItemRenderer item={item} />
            </div>
          ))}

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
              cursor: drawingMode ? (eraserMode ? "cell" : "crosshair") : "default",
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

          {/* パレットアイテム一覧 or テキスト入力UI */}
          {activeCategory === "テキスト" ? (
            // ── テキスト入力パレット ──────────────────────
            <div className="flex flex-col items-center gap-2 p-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="もじを入力"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded
                  focus:outline-none focus:border-accent-500"
                maxLength={20}
              />
              {textInput && (
                <div
                  className="flex flex-col items-center gap-0.5 p-2 rounded
                    hover:bg-blue-100 active:bg-blue-200 transition-colors
                    cursor-grab select-none w-full"
                  onPointerDown={(e) => handlePalettePointerDown(e, {
                    id: "__text_",
                    label: textInput,
                    category: "テキスト",
                    width: Math.max(40, textInput.length * 14),
                    height: 28,
                  })}
                >
                  <div className="px-2 py-0.5 text-sm font-bold bg-white
                    border border-dashed border-gray-400 rounded whitespace-nowrap">
                    {textInput}
                  </div>
                  <span className="text-[10px] text-gray-500">
                    タップ or ドラッグ
                  </span>
                </div>
              )}
            </div>
          ) : (
            // ── 通常のパレット一覧 ───────────────────────
            <div className="flex flex-wrap justify-center gap-2 p-2">
              {allPalette
                .filter(p => p.category === activeCategory)
                .map(palette => (
                  <div
                    key={palette.id}
                    className="flex flex-col items-center gap-0.5 p-1 rounded
                      hover:bg-blue-100 active:bg-blue-200 transition-colors
                      cursor-grab select-none"
                    title={palette.label}
                    onPointerDown={(e) => handlePalettePointerDown(e, palette)}
                  >
                    <PalettePreview palette={palette} />
                    <span className="text-[10px] text-gray-600 leading-tight">
                      {palette.label}
                    </span>
                  </div>
                ))
              }
            </div>
          )}
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

// ======================================================
// OkaneGrid — 筆算アプリ用お金グリッド（視覚的補助）
//
// variant:
//   "tashi"  — 4行×4列。行1=num1, 行2=num2, 行3=合計(ドロップ可), 行0=くり上がり(自動)
//   "hiki"   — 4行×4列。行1=num1, 行0=くり下がり(ドロップ可)
//   "kake1"  — 12行×4列。行1~num2=num1コピー, 行10=合計(自動くり上がり)
//              手動くり上がりボタン付き（グリッド上に配置）
//
// resetKey が変わるたびに initGrid() が再実行される。
// trashRef: 財布など外部のゴミ箱要素。コインをドロップすると削除される。
// ======================================================

"use client"

import { useEffect, useRef, useLayoutEffect, useId } from "react"
import type { RefObject } from "react"
import * as se from "@/lib/se"

// ── 型定義 ────────────────────────────────────────────

export interface OkaneGridProps {
  variant: "tashi" | "hiki" | "kake1"
  num1: number
  num2?: number                           // tashi/kake1 で使用
  onCarryDetected?: (col: number) => void // くり上がり/くり下がり検知コールバック
  resetKey?: number                       // 変更のたびに initGrid() を再実行
  trashRef?: RefObject<HTMLElement | null> // 財布などのゴミ箱要素（コインをドロップで削除）
}

type CoinType = "ichi" | "juu" | "hyaku" | "sen"

// ── 定数 ─────────────────────────────────────────────

const COLS = 4
// グリッド列インデックス → コイン種（col0=千 … col3=一）
const COL_COIN: CoinType[] = ["sen", "hyaku", "juu", "ichi"]

// ── ヘルパー（コイン枚数カウント）────────────────────
// ※ createCoin / placeCoins はコンポーネント内に移動（COIN_SIZE に依存するため）

function toDigits(n: number): number[] {
  return String(Math.abs(Math.floor(n))).split("").reverse().map(Number)
}

function countCoin(el: HTMLElement, type: CoinType): number {
  return el.getElementsByClassName(`hissan-coin-${type}`).length
}

// ── コンポーネント ─────────────────────────────────────

export function OkaneGrid({
  variant,
  num1,
  num2 = 1,
  onCarryDetected,
  resetKey = 0,
  trashRef,
}: OkaneGridProps) {
  const rawId = useId()
  const uid   = rawId.replace(/:/g, "u")
  const wrapperRef = useRef<HTMLDivElement>(null)
  const ROWS = variant === "kake1" ? 12 : 4

  // ── コインサイズ・列幅 ────────────────────────────
  // kake1: セル幅 = コイン幅×10（隙間なく横10枚並ぶ幅）
  // col0（千の位）だけ幅を狭くし、財布分の横幅を確保
  const COIN_SIZE  = variant === "kake1" ? 18 : 22
  const CELL_W     = variant === "kake1" ? COIN_SIZE * 10 : 72  // 180px / 72px
  const CELL_W_SEN = variant === "kake1" ? 130 : CELL_W          // 千の位は狭め

  // 列ごとのセル幅を返す
  function colWidthPx(col: number): number {
    return col === 0 ? CELL_W_SEN : CELL_W
  }

  // ── コイン img 要素を生成 ─────────────────────────
  // Tailwind preflight が img を block に変えるため inline-block を明示
  function createCoin(type: CoinType): HTMLImageElement {
    const img = document.createElement("img")
    img.src = `/images/${type}.png`
    img.alt = type
    img.className = `hissan-coin hissan-coin-${type}`
    const isSen = type === "sen"
    if (variant === "kake1") {
      // kake1: 千円のみ幅2倍、その他は同サイズ、隙間なし
      img.style.cssText = [
        `width:${isSen ? COIN_SIZE * 2 : COIN_SIZE}px`,
        `height:${COIN_SIZE}px`,
        "object-fit:contain",
        "cursor:grab",
        "margin:0",
        "display:inline-block",
        "vertical-align:middle",
      ].join(";")
    } else {
      // tashi/hiki: 千円は幅広、1px マージンあり
      img.style.cssText = [
        `width:${isSen ? 36 : COIN_SIZE}px`,
        `height:${COIN_SIZE}px`,
        "object-fit:contain",
        "cursor:grab",
        "margin:1px",
        "display:inline-block",
        "vertical-align:middle",
      ].join(";")
    }
    return img
  }

  // セルに n 枚のコインを追加
  function placeCoins(el: HTMLElement, type: CoinType, n: number) {
    for (let i = 0; i < n; i++) el.appendChild(createCoin(type))
  }

  // ── セル取得 ───────────────────────────────────────
  function getCell(row: number, col: number): HTMLElement | null {
    return wrapperRef.current
      ?.querySelector(`[data-row="${row}"][data-col="${col}"]`) ?? null
  }

  // ── A: row10（合計行）ヒント更新（kake1 のみ） ───
  // 空セル → 薄い「ここへあつめる」、コインあり → 右下に枚数を表示
  function updateRow10Hints() {
    if (variant !== "kake1") return
    for (let col = 0; col < COLS; col++) {
      const cell = getCell(10, col)
      if (!cell) continue
      cell.style.position = "relative"
      cell.querySelector(".okane-row10-hint")?.remove()

      // hissan-coin クラスを持つ img の枚数（種別問わず合計）
      const count = cell.getElementsByClassName("hissan-coin").length

      const span = document.createElement("span")
      span.className          = "okane-row10-hint"
      span.style.pointerEvents = "none"
      span.style.userSelect    = "none"
      span.style.position      = "absolute"

      if (count === 0) {
        span.style.top        = "50%"
        span.style.left       = "50%"
        span.style.transform  = "translate(-50%,-50%)"
        span.style.fontSize   = "9px"
        span.style.color      = "rgba(0,0,0,0.25)"
        span.style.whiteSpace = "nowrap"
        span.textContent      = "ここへあつめる"
      } else {
        span.style.bottom     = "2px"
        span.style.right      = "3px"
        span.style.fontSize   = "13px"
        span.style.color      = "rgba(0,0,0,0.3)"
        span.textContent      = String(count)
      }
      cell.appendChild(span)
    }
  }

  // ── actionsRef ─────────────────────────────────────
  // DnD useEffect（マウント時1回）の内部から最新コールバックを呼ぶための ref
  const actionsRef = useRef({
    initGrid: () => {},
    postDrop: (_coin: HTMLImageElement, _cell: HTMLElement) => {},
  })

  // actionsRef を最新の props/state で更新（useLayoutEffect で毎レンダー）
  useLayoutEffect(() => {

    // ── initGrid ──────────────────────────────────
    actionsRef.current.initGrid = () => {
      if (!wrapperRef.current) return
      // 全 hissan-coin-drop セルを空に
      wrapperRef.current
        .querySelectorAll<HTMLElement>(".hissan-coin-drop")
        .forEach(c => { c.innerHTML = "" })

      const d1 = toDigits(num1)
      const d2 = toDigits(num2)

      if (variant === "tashi") {
        d1.forEach((digit, i) => {
          const col = COLS - 1 - i
          const cell = getCell(1, col)
          if (cell) placeCoins(cell, COL_COIN[col], digit)
        })
        d2.forEach((digit, i) => {
          const col = COLS - 1 - i
          const cell = getCell(2, col)
          if (cell) placeCoins(cell, COL_COIN[col], digit)
        })

      } else if (variant === "hiki") {
        d1.forEach((digit, i) => {
          const col = COLS - 1 - i
          const cell = getCell(1, col)
          if (cell) placeCoins(cell, COL_COIN[col], digit)
        })

      } else if (variant === "kake1") {
        const jousu = Math.min(Math.max(1, num2), 9)

        // 行0: かけ算の意味を示す説明テキスト（col1〜col3 のみ、col0は省略）
        // 例: [10円画像]が（2×4）こ
        for (let c = 1; c < COLS; c++) {
          const cell = getCell(0, c)
          if (!cell) continue
          const ct  = COL_COIN[c]
          const di  = COLS - 1 - c         // 桁インデックス（0=一の位）
          const digit = d1[di] ?? 0
          cell.innerHTML =
            `<span style="font-size:10px;color:#555;display:block;width:100%;text-align:center;line-height:1.3;">` +
            `<img src="/images/${ct}.png" style="width:14px;height:14px;vertical-align:middle;display:inline-block;">` +
            `が（${digit}×${jousu}）こ</span>`
        }

        // 行1~jousu: num1 コインのコピー × jousu 行
        for (let r = 1; r <= jousu; r++) {
          d1.forEach((digit, i) => {
            const col = COLS - 1 - i
            const cell = getCell(r, col)
            if (cell) placeCoins(cell, COL_COIN[col], digit)
          })
        }
        // 合計行ヒントを初期表示（全クリア後なので全セル空 → 「ここへあつめる」）
        updateRow10Hints()
      }
    }

    // ── postDrop ──────────────────────────────────
    actionsRef.current.postDrop = (coin: HTMLImageElement, cell: HTMLElement) => {
      const row = parseInt(cell.getAttribute("data-row") ?? "-1")
      const col = parseInt(cell.getAttribute("data-col") ?? "-1")
      if (row < 0 || col < 0) return

      // tashi: 行3（合計）のくり上がり判定
      if (variant === "tashi" && row === 3) {
        for (let c = COLS - 1; c >= 1; c--) {
          const target = getCell(3, c)
          if (!target) continue
          const ct = COL_COIN[c]
          if (countCoin(target, ct) >= 10) {
            const coins = Array.from(target.getElementsByClassName(`hissan-coin-${ct}`))
            for (let i = 0; i < 10; i++) coins[i]?.remove()
            const carryCell = getCell(0, c - 1)
            if (carryCell) carryCell.appendChild(createCoin(COL_COIN[c - 1]))
            onCarryDetected?.(c - 1)
            se.playSe(se.pi)
          }
        }
      }

      // hiki: 行0（くり下がりエリア）へのドロップ
      else if (variant === "hiki" && row === 0) {
        coin.remove()
        if (col < COLS - 1) {
          const lowerCell = getCell(1, col + 1)
          if (lowerCell) placeCoins(lowerCell, COL_COIN[col + 1], 10)
        }
        onCarryDetected?.(col)
        se.playSe(se.pi)
      }

      // kake1: 行10（合計エリア）の自動くり上がり
      else if (variant === "kake1" && row === 10) {
        for (let c = COLS - 1; c >= 1; c--) {
          const target = getCell(10, c)
          if (!target) continue
          const ct = COL_COIN[c]
          if (countCoin(target, ct) >= 10) {
            const coins = Array.from(target.getElementsByClassName(`hissan-coin-${ct}`))
            for (let i = 0; i < 10; i++) coins[i]?.remove()
            const higherCell = getCell(10, c - 1)
            if (higherCell) higherCell.appendChild(createCoin(COL_COIN[c - 1]))
            onCarryDetected?.(c - 1)
            se.playSe(se.reset)
          }
        }
        // コインが移動したのでヒントを更新
        updateRow10Hints()
      }
    }
  })  // 毎レンダーで更新

  // ── initGrid 実行（問題変更時） ──────────────────
  useEffect(() => {
    actionsRef.current.initGrid()
  }, [resetKey, num1, num2])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── DnD セットアップ（マウント時1回） ────────────
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
      if (!target.classList.contains("hissan-coin")) return
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

      // ドロップ先を探す（一時非表示で elementFromPoint を正確に取得）
      dragged.style.display = "none"
      const below = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
      // Tailwind preflight 対策: display="" にすると img{display:block} が効くため inline-block を明示
      dragged.style.display = "inline-block"

      let placed = false

      // ① 財布（trashRef）へのドロップ → コインを削除
      if (below && trashRef?.current &&
          (below === trashRef.current || trashRef.current.contains(below))) {
        dragged.remove()
        placed = true
        se.playSe(se.pi)
      }

      // ② グリッド内セルへのドロップ
      if (!placed && below) {
        const cell = (below.classList.contains("hissan-coin-drop")
          ? below
          : below.closest<HTMLElement>(".hissan-coin-drop"))

        if (cell && wrapperRef.current?.contains(cell)) {
          cell.appendChild(dragged)
          placed = true
          se.playSe(se.pi)
          actionsRef.current.postDrop(dragged, cell)
        }
      }

      // ③ ドロップ失敗 → 元の親に戻す
      if (!placed) {
        if (originalParent) {
          originalParent.appendChild(dragged)
        } else {
          dragged.remove()
        }
      }

      dragged = null
      originalParent = null

      if (!(e as TouchEvent).changedTouches) {
        document.removeEventListener("mousemove", handleMove)
        document.removeEventListener("mouseup",   handleEnd)
      }
    }

    const wrapper = wrapperRef.current
    wrapper?.addEventListener("mousedown",  handleStart, { passive: false })
    wrapper?.addEventListener("touchstart", handleStart, { passive: false })
    document.addEventListener("touchmove",  handleMove,  { passive: false })
    document.addEventListener("touchend",   handleEnd,   { passive: false })

    return () => {
      wrapper?.removeEventListener("mousedown",  handleStart)
      wrapper?.removeEventListener("touchstart", handleStart)
      document.removeEventListener("touchmove",  handleMove)
      document.removeEventListener("touchend",   handleEnd)
      document.removeEventListener("mousemove",  handleMove)
      document.removeEventListener("mouseup",    handleEnd)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── kake1 手動くり上がりボタン ───────────────────
  // 元コード(16kah1.js) と同じ: while ループで10枚ごとに何度でも変換
  const handleKake1Carry = (fromType: CoinType, toType: CoinType, toCol: number) => {
    if (!wrapperRef.current) return
    let remaining = wrapperRef.current.getElementsByClassName(`hissan-coin-${fromType}`).length
    if (remaining < 10) {
      se.playSe(se.alertSound)
      return
    }
    se.playSe(se.reset)
    while (remaining >= 10) {
      const all = Array.from(wrapperRef.current.getElementsByClassName(`hissan-coin-${fromType}`))
      for (let i = 0; i < 10; i++) all[i]?.remove()
      const cell = getCell(10, toCol)
      if (cell) cell.appendChild(createCoin(toType))
      onCarryDetected?.(toCol)
      remaining -= 10
    }
    // くり上がりでコインが移動したのでヒントを更新
    updateRow10Hints()
  }

  // ── セルの droppable 判定 ─────────────────────────
  function isDroppable(row: number): boolean {
    if (variant === "tashi")  return row === 3
    if (variant === "hiki")   return row === 0 || row === 1
    if (variant === "kake1")  return row >= 1 && row <= 11
    return false
  }

  // ── 行の背景色 ───────────────────────────────────
  function rowBg(row: number): string {
    if (variant === "tashi") {
      if (row === 0) return "bg-amber-50"
      if (row === 3) return "bg-yellow-50"
      return "bg-white"
    }
    if (variant === "hiki") {
      if (row === 0) return "bg-amber-50"
      return "bg-white"
    }
    if (variant === "kake1") {
      if (row === 0)  return "bg-amber-50"   // ヘッダー行（説明テキスト）
      if (row === 10) return "bg-yellow-100"
      if (row === 11) return "bg-yellow-50"
      return "bg-white"
    }
    return "bg-white"
  }

  // ── 行の高さ（px）───────────────────────────────
  function rowHeightPx(row: number): number {
    if (variant === "kake1") {
      if (row === 0)  return 22            // ヘッダー行（説明テキスト、狭め）
      if (row === 11) return COIN_SIZE * 2 // 最下行は2倍高さ
      return COIN_SIZE
    }
    if (row === 0) return 32   // tashi/hiki のくり上がり行
    return 60
  }

  // ── 行の下ボーダー ───────────────────────────────
  function rowBorder(row: number): string {
    if (variant === "tashi" && row === 2) return "border-b-4 border-b-gray-700"
    if (variant === "hiki"  && row === 2) return "border-b-4 border-b-gray-700"
    return ""
  }

  // ── 描画 ─────────────────────────────────────────
  return (
    <div className="inline-block">

      {/* kake1: 手動くり上がりボタン（各列の上に右寄せで配置）*/}
      {variant === "kake1" && (
        <div className="flex mb-1">
          {/* col0: 千の位（CELL_W_SEN=130px）→ 「百→千 くり上がり」右寄せ */}
          <div style={{ width: CELL_W_SEN, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => handleKake1Carry("hyaku", "sen", 0)}
              className="px-1 py-0.5 text-xs font-bold border border-warm-400 text-warm-700
                         rounded hover:bg-warm-50 active:scale-95 transition-all whitespace-nowrap"
            >
              百→千　くり上がり
            </button>
          </div>
          {/* col1: 百の位 → 「十→百 くり上がり」右寄せ */}
          <div style={{ width: CELL_W, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => handleKake1Carry("juu", "hyaku", 1)}
              className="px-1 py-0.5 text-xs font-bold border border-warm-400 text-warm-700
                         rounded hover:bg-warm-50 active:scale-95 transition-all whitespace-nowrap"
            >
              十→百　くり上がり
            </button>
          </div>
          {/* col2: 十の位 → 「一→十 くり上がり」右寄せ */}
          <div style={{ width: CELL_W, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => handleKake1Carry("ichi", "juu", 2)}
              className="px-1 py-0.5 text-xs font-bold border border-warm-400 text-warm-700
                         rounded hover:bg-warm-50 active:scale-95 transition-all whitespace-nowrap"
            >
              一→十　くり上がり
            </button>
          </div>
          {/* col3: 一の位 → ボタンなし（スペース確保のみ）*/}
          <div style={{ width: CELL_W }} />
        </div>
      )}

      {/* グリッド本体 */}
      <div
        ref={wrapperRef}
        id={`hissan-okane-grid-${uid}`}
        className="border-2 border-gray-400"
      >
        {Array.from({ length: ROWS }, (_, r) => {
          const h = rowHeightPx(r)
          // row0 of kake1 は高さ0で非表示
          if (h === 0) return null
          return (
            <div
              key={r}
              className={`flex border-b border-gray-300 last:border-b-0 ${rowBorder(r)}`}
              style={variant === "kake1" ? { marginBottom: 3 } : undefined}
            >
              {Array.from({ length: COLS }, (_, c) => (
                <div
                  key={c}
                  data-row={r}
                  data-col={c}
                  className={[
                    isDroppable(r) ? "hissan-coin-drop" : "",
                    rowBg(r),
                    "border-r border-gray-300 last:border-r-0",
                    // row0（説明行）は縦中央・横中央、それ以外はコイン配置用に上詰め
                    r === 0 ? "flex items-center justify-center" : "flex flex-wrap content-start items-start",
                    isDroppable(r) ? "cursor-cell" : "",
                  ].join(" ")}
                  style={{
                    width:     colWidthPx(c),
                    minWidth:  colWidthPx(c),
                    minHeight: h,
                    // kake1: 硬貨を隙間なく詰めるためパディングなし
                    padding: variant === "kake1" ? 0 : 2,
                  }}
                />
              ))}
            </div>
          )
        })}
      </div>

    </div>
  )
}

// ======================================================
// わり算の筆算 ページ
//
// URL: /wari-hissan
// 対象: 小学3〜5年生
// 内容: 整数・小数のわり算を筆算形式で練習する
//       旧 jimitas.com/suu-keisan/wari-hissan2/ からの移植
//
// Phase 1: 整数モード（0〜5）のみ
//
// テーブル構造（13列 × 可変行）:
//   列: 0-4=除数、5=")"、6-12=被除数・商
//   偶数列=数字セル(50px)、奇数列=小数点セル(0〜10px)
//   row0: 商（ドロップ可）
//   row1: 除数 + ")" + 被除数（読み取り専用）
//   row2〜: 計算過程（かける→ひく→おろす の繰り返し）
//
// D&D:
//   数字パレット(0〜9) → ドロップ可能セル
//   0 をクリックで斜線トグル（小数末尾の消去用）
// ======================================================

"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Image from "next/image"
import * as se from "@/lib/se"
import { useProblemCoins } from "@/hooks/useProblemCoins"
import { useHissanDnD } from "@/hooks/useHissanDnD"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"

// ── 問題タイプ別の設定 ──────────────────────────────────
const QUESTION_LABELS: { value: string; label: string; group: string }[] = [
  // 整数のわり算
  { value: "0",  label: "(２けた)÷(１けた) 商１けた", group: "整数のわり算" },
  { value: "1",  label: "(２けた)÷(１けた) 商２けた", group: "整数のわり算" },
  { value: "2",  label: "(３けた)÷(１けた) 商２けた", group: "整数のわり算" },
  { value: "3",  label: "(２けた)÷(２けた) 商１けた", group: "整数のわり算" },
  { value: "4",  label: "(３けた)÷(２けた) 商１けた", group: "整数のわり算" },
  { value: "5",  label: "(３けた)÷(２けた) 商２けた", group: "整数のわり算" },
  // 小数÷整数
  { value: "10", label: "○○.○÷○（わり進み2回）",     group: "小数÷整数" },
  { value: "11", label: "○○○.○÷○○（わり進み2回）",   group: "小数÷整数" },
  // 小数÷小数
  { value: "20", label: "○.○÷○.○（わり進み1回）",     group: "小数÷小数" },
  { value: "21", label: "○○.○÷○.○（わり進み1回）",    group: "小数÷小数" },
  { value: "22", label: "○○.○÷○.○（わり進み2回）",    group: "小数÷小数" },
  { value: "23", label: "○○.○÷○.○（わり進み2回）②",  group: "小数÷小数" },
  // 特殊な計算
  { value: "30", label: "○.○○÷○（わり進み3回）",      group: "特殊な計算" },
  { value: "31", label: "あまり付き（商は整数）",       group: "特殊な計算" },
]

// グループ名の配列（select の optgroup 用）
const GROUPS = [...new Set(QUESTION_LABELS.map(q => q.group))]

// ── 定数 ──────────────────────────────────────────────
const COLS = 13         // テーブルの列数（固定）
const CELL_W = 50       // 数字セルの幅
const CELL_H = 50       // 数字セルの高さ
const NUM_SIZE = 44      // パレット数字の大きさ
const DOT_W = 10         // 小数点セルの幅

// ── ドロップゾーンパターン定義 ─────────────────────────
// 各モードの { droppable: [row,col][], underlines: [row, colStart, colEnd][] }
type CellPattern = {
  droppable: [number, number][]     // [row, col] のペア
  underlines: [number, number, number][]  // [row, colStart, colEnd]
}

// モードごとのドロップゾーン・罫線パターン
// 旧アプリ displayWriteTable.js から忠実に移植
function getCellPattern(mode: string): CellPattern {
  const d: [number, number][] = []
  const u: [number, number, number][] = []

  switch (mode) {
    case "0": // (2桁)÷(1桁) 商1桁 → 4行
      // 商: row0 j=8
      d.push([0, 8])
      // row2: j=6,8
      d.push([2, 6], [2, 8])
      // row3: j=8
      d.push([3, 8])
      // 罫線: row2 j=6-8
      u.push([2, 6, 8])
      break

    case "1": // (2桁)÷(1桁) 商2桁 → 6行
      // 商: row0 j=6,8
      d.push([0, 6], [0, 8])
      // row2: j=6,8
      d.push([2, 6], [2, 8])
      // row3: j=6,8
      d.push([3, 6], [3, 8])
      // row4: j=6,8
      d.push([4, 6], [4, 8])
      // row5: j=8
      d.push([5, 8])
      // 罫線: row2 j=6-8, row4 j=6-8
      u.push([2, 6, 8], [4, 6, 8])
      break

    case "2": // (3桁)÷(1桁) 商2桁 → 6行
      // 商: row0 j=8,10
      d.push([0, 8], [0, 10])
      // row2: j=6,8
      d.push([2, 6], [2, 8])
      // row3: j=8,10
      d.push([3, 8], [3, 10])
      // row4: j=8,10
      d.push([4, 8], [4, 10])
      // row5: j=10
      d.push([5, 10])
      // 罫線: row2 j=6-8, row4 j=8-10
      u.push([2, 6, 8], [4, 8, 10])
      break

    case "3": // (2桁)÷(2桁) 商1桁 → 4行
      // 商: row0 j=8
      d.push([0, 8])
      // row2: j=6,8
      d.push([2, 6], [2, 8])
      // row3: j=6,8
      d.push([3, 6], [3, 8])
      // 罫線: row2 j=6-8
      u.push([2, 6, 8])
      break

    case "4": // (3桁)÷(2桁) 商1桁 → 4行
      // 商: row0 j=10
      d.push([0, 10])
      // row2: j=6,8,10
      d.push([2, 6], [2, 8], [2, 10])
      // row3: j=8,10
      d.push([3, 8], [3, 10])
      // 罫線: row2 j=6-10
      u.push([2, 6, 10])
      break

    case "5": // (3桁)÷(2桁) 商2桁 → 6行
      // 商: row0 j=8,10
      d.push([0, 8], [0, 10])
      // row2: j=6,8,10
      d.push([2, 6], [2, 8], [2, 10])
      // row3: j=6,8,10
      d.push([3, 6], [3, 8], [3, 10])
      // row4: j=6,8,10
      d.push([4, 6], [4, 8], [4, 10])
      // row5: j=8,10
      d.push([5, 8], [5, 10])
      // 罫線: row2 j=6-10, row4 j=8-10
      u.push([2, 6, 10], [4, 8, 10])
      break

    // ── 小数÷整数 ──
    case "10": // XX.X÷X → 6行
      d.push([0, 8], [0, 10])
      d.push([2, 6], [2, 8])
      d.push([3, 8], [3, 10])
      d.push([4, 8], [4, 10])
      d.push([5, 10])
      u.push([2, 6, 10], [4, 8, 10])
      break

    case "11": // XXX.X÷XX → 6行
      d.push([0, 10], [0, 12])
      d.push([2, 6], [2, 8], [2, 10])
      d.push([3, 8], [3, 10], [3, 12])
      d.push([4, 8], [4, 10], [4, 12])
      d.push([5, 12])
      u.push([2, 6, 12], [4, 8, 12])
      break

    // ── 小数÷小数 ──
    case "20": // X.X÷X.X=X → 4行
      d.push([0, 8])
      d.push([2, 6], [2, 8])
      d.push([3, 8])
      u.push([2, 6, 8])
      break

    case "21": // XX.X÷X.X=X → 4行
      d.push([0, 10])
      d.push([2, 6], [2, 8], [2, 10])
      d.push([3, 10])
      u.push([2, 6, 10])
      break

    case "22": // XX.X÷X.X=XX → 6行
      d.push([0, 8], [0, 10])
      d.push([2, 6], [2, 8])
      d.push([3, 6], [3, 8], [3, 10])
      d.push([4, 6], [4, 8], [4, 10])
      d.push([5, 10])
      u.push([2, 6, 10], [4, 6, 10])
      break

    case "23": // XX.X÷X.X=XX → 6行
      d.push([0, 10], [0, 12])
      d.push([2, 6], [2, 8], [2, 10])
      d.push([3, 8], [3, 10], [3, 12])
      d.push([4, 8], [4, 10], [4, 12])
      d.push([5, 12])
      u.push([2, 6, 12], [4, 8, 12])
      break

    // ── 特殊 ──
    case "30": // X.XX÷X → 8行
      d.push([0, 8], [0, 10], [0, 12])
      d.push([2, 6], [2, 8])
      d.push([3, 8], [3, 10])
      d.push([4, 8], [4, 10])
      d.push([5, 10], [5, 12])
      d.push([6, 10], [6, 12])
      d.push([7, 12])
      u.push([2, 6, 10], [4, 8, 12], [6, 10, 12])
      break

    case "31": // XX÷X あまりX.X → 6行
      d.push([0, 8], [0, 10])
      d.push([2, 6], [2, 8])
      d.push([3, 8], [3, 10])
      d.push([4, 8], [4, 10])
      d.push([5, 10], [5, 12])
      u.push([2, 6, 10], [4, 8, 12])
      break
  }

  return { droppable: d, underlines: u }
}

// テーブルの行数を計算
function calcRows(mode: string, sho: number): number {
  if (mode === "") return 8  // 自由配置モード
  const shoDigits = String(sho).replace(".", "").length
  return 2 + shoDigits * 2
}

// ── 問題生成（createRandomNumber の移植） ────────────
function createRandomNumber(mode: string): [number, number, number, number] {
  let hijosu = 0, josu = 0, sho = 0, amari = 0

  switch (mode) {
    // ========== 整数のわり算 ==========
    case "0": // (2桁)÷(1桁) 商1桁
      josu = Math.floor(Math.random() * 8 + 2)
      sho = Math.floor(Math.random() * (9 - 10 / josu) + Math.floor(10 / josu) + 1)
      amari = Math.floor(Math.random() * josu)
      hijosu = sho * josu + amari
      break

    case "1": // (2桁)÷(1桁) 商2桁
      josu = Math.floor(Math.random() * 8 + 2)
      sho = Math.floor(Math.random() * (99 / josu - 10) + 10)
      amari = Math.floor(Math.random() * josu)
      hijosu = sho * josu + amari
      break

    case "2": // (3桁)÷(1桁) 商2桁
      josu = Math.floor(Math.random() * 8 + 2)
      sho = Math.floor(Math.random() * (99 - 100 / josu) + Math.floor(100 / josu))
      amari = Math.floor(Math.random() * josu)
      hijosu = sho * josu + amari
      break

    case "3": // (2桁)÷(2桁) 商1桁
      josu = Math.floor(Math.random() * 15 + 10)
      sho = Math.floor(Math.random() * (99 / josu - 2) + 2)
      amari = Math.floor(Math.random() * josu)
      hijosu = sho * josu + amari
      break

    case "4": // (3桁)÷(2桁) 商1桁
      josu = Math.floor(Math.random() * 88 + 12)
      sho = Math.floor(Math.random() * (9 - 100 / josu) + Math.floor(100 / josu) + 1)
      amari = Math.floor(Math.random() * josu)
      hijosu = sho * josu + amari
      break

    case "5": // (3桁)÷(2桁) 商2桁
      josu = Math.floor(Math.random() * 18 + 12)
      sho = Math.floor(Math.random() * (950 / josu - 10) + 10)
      amari = Math.floor(Math.random() * josu)
      hijosu = sho * josu + amari
      break

    // ========== 小数÷整数 ==========
    case "10": {
      let sInt = Math.floor(Math.random() * 9) + 1
      let sDec = Math.floor(Math.random() * 9) + 1
      sho = sInt + sDec / 10
      josu = Math.floor(Math.random() * 8 + 2)
      hijosu = Math.round(sho * josu * 10) / 10
      while (hijosu <= 10) {
        sInt = Math.floor(Math.random() * 9) + 1
        sDec = Math.floor(Math.random() * 9) + 1
        sho = sInt + sDec / 10
        josu = Math.floor(Math.random() * 8 + 2)
        hijosu = Math.round(sho * josu * 10) / 10
      }
      amari = 0
      break
    }

    case "11": {
      let sInt = Math.floor(Math.random() * 9) + 1
      let sDec = Math.floor(Math.random() * 9) + 1
      sho = sInt + sDec / 10
      josu = Math.floor(Math.random() * 89 + 11)
      hijosu = Math.round(sho * josu * 10) / 10
      while (hijosu <= 100) {
        sInt = Math.floor(Math.random() * 9) + 1
        sDec = Math.floor(Math.random() * 9) + 1
        sho = sInt + sDec / 10
        josu = Math.floor(Math.random() * 89 + 11)
        hijosu = Math.round(sho * josu * 10) / 10
      }
      amari = 0
      break
    }

    // ========== 小数÷小数 ==========
    case "20": {
      sho = Math.floor(Math.random() * 8) + 2
      let jInt = Math.floor(Math.random() * 9) + 1
      let jDec = Math.floor(Math.random() * 9) + 1
      josu = jInt + jDec / 10
      hijosu = Math.round(sho * josu * 10) / 10
      while (hijosu > 10) {
        sho = Math.floor(Math.random() * 8) + 2
        jInt = Math.floor(Math.random() * 9) + 1
        jDec = Math.floor(Math.random() * 9) + 1
        josu = jInt + jDec / 10
        hijosu = Math.round(sho * josu * 10) / 10
      }
      amari = 0
      break
    }

    case "21": {
      sho = Math.floor(Math.random() * 8) + 2
      let jInt = Math.floor(Math.random() * 9) + 1
      let jDec = Math.floor(Math.random() * 9) + 1
      josu = jInt + jDec / 10
      hijosu = Math.round(sho * josu * 10) / 10
      while (hijosu <= 10) {
        sho = Math.floor(Math.random() * 8) + 2
        jInt = Math.floor(Math.random() * 9) + 1
        jDec = Math.floor(Math.random() * 9) + 1
        josu = jInt + jDec / 10
        hijosu = Math.round(sho * josu * 10) / 10
      }
      amari = 0
      break
    }

    case "22": {
      sho = Math.floor(Math.random() * 89) + 11
      let jInt = Math.floor(Math.random() * 9) + 1
      let jDec = Math.floor(Math.random() * 9) + 1
      josu = jInt + jDec / 10
      hijosu = Math.round(sho * josu * 10) / 10
      while (hijosu > 100 || josu * 10 > hijosu) {
        sho = Math.floor(Math.random() * 89) + 11
        jInt = Math.floor(Math.random() * 9) + 1
        jDec = Math.floor(Math.random() * 9) + 1
        josu = jInt + jDec / 10
        hijosu = Math.round(sho * josu * 10) / 10
      }
      amari = 0
      break
    }

    case "23": {
      const pattern = Math.random() < 0.5
      const evenDigits = [2, 4, 6, 8]
      if (pattern) {
        sho = Math.floor(Math.random() * 9) + 1 + 0.5
        josu = Math.floor(Math.random() * 9) + 1 + evenDigits[Math.floor(Math.random() * 4)] / 10
      } else {
        josu = Math.floor(Math.random() * 9) + 1 + 0.5
        sho = Math.floor(Math.random() * 9) + 1 + evenDigits[Math.floor(Math.random() * 4)] / 10
      }
      hijosu = Math.round(sho * josu * 10) / 10
      while (hijosu > 100 || josu * 10 <= hijosu || hijosu < 10) {
        if (pattern) {
          sho = Math.floor(Math.random() * 9) + 1 + 0.5
          josu = Math.floor(Math.random() * 9) + 1 + evenDigits[Math.floor(Math.random() * 4)] / 10
        } else {
          josu = Math.floor(Math.random() * 9) + 1 + 0.5
          sho = Math.floor(Math.random() * 9) + 1 + evenDigits[Math.floor(Math.random() * 4)] / 10
        }
        hijosu = Math.round(sho * josu * 10) / 10
      }
      amari = 0
      break
    }

    // ========== 特殊な計算 ==========
    case "30": {
      let attempts = 0
      do {
        const sInt = Math.floor(Math.random() * 7) + 3
        let sDec1 = Math.floor(Math.random() * 10)
        let sDec2 = Math.floor(Math.random() * 10)
        if (sDec2 === 0) sDec2 = Math.floor(Math.random() * 9) + 1
        if (sDec1 === 0 && sDec2 <= 1) {
          sDec1 = Math.floor(Math.random() * 9) + 1
          sDec2 = Math.floor(Math.random() * 9) + 1
        }
        if (sInt === 3 && sDec1 < 3) sDec1 = Math.floor(Math.random() * 7) + 3
        if (sInt === 3 && sDec1 === 3 && sDec2 < 4) sDec2 = Math.floor(Math.random() * 6) + 4
        sho = Math.round((sInt + sDec1 / 10 + sDec2 / 100) * 100) / 100
        josu = Math.floor(Math.random() * 7) + 3
        hijosu = Math.round(sho * josu * 100) / 100
        const firstDigit = parseInt(String(hijosu)[0])
        attempts++
        if (firstDigit < josu) break
      } while (attempts < 100)
      amari = 0
      break
    }

    case "31": {
      let attempts = 0
      do {
        sho = Math.floor(Math.random() * 62) + 34
        josu = Math.floor(Math.random() * 7) + 3
        const maxAmariInt = josu - 1
        const amariInt = Math.floor(Math.random() * maxAmariInt)
        const amariDec = Math.floor(Math.random() * 9) + 1
        amari = Math.round((amariInt + amariDec / 10) * 10) / 10
        hijosu = Math.round((sho * josu + amari) * 10) / 10
        const firstDigit = parseInt(String(hijosu)[0])
        attempts++
        if (firstDigit < josu) break
      } while (attempts < 100)
      break
    }

    default:
      josu = Math.floor(Math.random() * 8 + 2)
      sho = Math.floor(Math.random() * (9 - 10 / josu) + Math.floor(10 / josu) + 1)
      amari = Math.floor(Math.random() * josu)
      hijosu = sho * josu + amari
  }

  // 最終的な丸め処理
  hijosu = Math.round(hijosu * 1000) / 1000
  josu = Math.round(josu * 1000) / 1000
  sho = Math.round(sho * 1000) / 1000
  amari = Math.round(amari * 1000) / 1000

  return [hijosu, josu, sho, amari]
}

// ── ページ本体 ────────────────────────────────────────
export default function WariHissanPage() {

  // 問題タイプ（""=未選択）
  const [selectMode, setSelectMode] = useState("")
  const selectModeRef = useRef("")
  selectModeRef.current = selectMode

  // テーブルの行数（問題に応じて変動）
  const [rows, setRows] = useState(6)

  // コイン
  const { coins, tryAddCoins, resetProblem } = useProblemCoins()

  // ── DOM 参照 ──────────────────────────────────────
  const tblRef     = useRef<HTMLTableElement>(null)
  const numPalRef  = useRef<HTMLDivElement>(null)
  const formulaRef = useRef<HTMLDivElement>(null)   // 式の表示
  const hintRef    = useRef<HTMLParagraphElement>(null) // 小数ヒント
  const hint2Ref   = useRef<HTMLParagraphElement>(null) // テーブル下のヒント
  const seikaiRef  = useRef<HTMLSpanElement>(null)  // せいかい！
  const msgRef     = useRef<HTMLParagraphElement>(null) // メッセージ

  // ── 問題データ（ref、レンダー不要） ────────────────
  const hijosuRef  = useRef(0)    // 被除数
  const josuRef    = useRef(0)    // 除数
  const shoRef     = useRef(0)    // 商（正解）
  const amariRef   = useRef(0)    // あまり（正解）
  const mondaiFlag = useRef(false)
  const showedFlag = useRef(false)  // 答えを見た
  const pointFlag  = useRef(false)  // 商行に小数点配置済み

  // ── DnD フック ────────────────────────────────────
  const { touchStartEvent, touchMoveEvent, touchEndEvent } = useHissanDnD({
    numPalRef,
    onDropDigit: () => {
      numSet()
      myAnswerUpdate()
    },
  })

  // ── メッセージ表示（alert の代替） ────────────────
  const showMsg = useCallback((text: string) => {
    if (!msgRef.current) return
    msgRef.current.textContent = text
    msgRef.current.style.display = ""
    setTimeout(() => { if (msgRef.current) msgRef.current.style.display = "none" }, 2500)
  }, [])

  // ── 数字パレット生成（0〜9） ──────────────────────
  function numSet() {
    const pal = numPalRef.current!
    while (pal.firstChild) pal.removeChild(pal.firstChild)
    for (let i = 0; i < 10; i++) {
      const div = document.createElement("div")
      div.innerHTML = String(i)
      div.className = "draggable-elem"
      div.setAttribute("draggable", "true")
      div.style.cssText = [
        `width:${NUM_SIZE}px`, `height:${NUM_SIZE}px`, `line-height:${NUM_SIZE}px`,
        "background:white", "font-size:26px", "text-align:center",
        "border-radius:10%", "border:1px solid #333",
        "cursor:pointer", "user-select:none", "display:inline-block",
      ].join(";")
      // 0 はクリックで斜線トグル（小数末尾の消去表現）
      if (i === 0) {
        div.addEventListener("click", () => {
          div.classList.toggle("hissan2-diagonal")
        })
      }
      div.addEventListener("touchstart", touchStartEvent as EventListener, false)
      div.addEventListener("touchmove", touchMoveEvent as EventListener, false)
      div.addEventListener("touchend", touchEndEvent as EventListener, false)
      pal.appendChild(div)
    }
  }

  // ── テーブル書き換え（除数・被除数の配置 + ドロップゾーン設定） ──
  function rewriteTable() {
    const TBL = tblRef.current
    if (!TBL) return
    const mode = selectModeRef.current
    const currentRows = TBL.rows.length

    // 全セルクリア
    for (let r = 0; r < currentRows; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = TBL.rows[r].cells[c]
        cell.innerHTML = ""
        cell.style.backgroundColor = ""
        cell.style.borderBottom = ""
        cell.classList.remove("droppable-elem")
        cell.classList.remove("hissan2-diagonal")
        cell.classList.remove("decimal-crossed")
      }
    }
    pointFlag.current = false

    // ")" 記号を配置（row1, col5）
    if (currentRows > 1) {
      TBL.rows[1].cells[5].innerText = ")"
    }

    // 除数の配置（row1, 列0-4）
    if (josuRef.current > 0) {
      const josuArr = String(josuRef.current).split("")
      if (josuArr.includes(".")) {
        const pi = josuArr.indexOf(".")
        const intPart = josuArr.slice(0, pi)
        const decPart = josuArr.slice(pi + 1)
        TBL.rows[1].cells[3].innerText = "."
        if (intPart.length === 2) {
          TBL.rows[1].cells[0].innerText = intPart[0]
          TBL.rows[1].cells[2].innerText = intPart[1]
        } else if (intPart.length === 1) {
          TBL.rows[1].cells[2].innerText = intPart[0]
        }
        if (decPart.length > 0) TBL.rows[1].cells[4].innerText = decPart[0]
      } else {
        // 整数の除数: 右詰め
        if (josuArr.length === 2) {
          TBL.rows[1].cells[2].innerText = josuArr[0]
          TBL.rows[1].cells[4].innerText = josuArr[1]
        } else if (josuArr.length === 1) {
          TBL.rows[1].cells[4].innerText = josuArr[0]
        }
      }
    }

    // 被除数の配置（row1, 列6-12）
    // lastDigitCol: 被除数の最後の数字列を追跡（屋根線の右端に使う）
    let lastDigitCol = 8 // デフォルト（最小2桁分）
    if (hijosuRef.current > 0) {
      const hijosuArr = String(hijosuRef.current).split("")
      let col = 6
      for (let i = 0; i < hijosuArr.length; i++) {
        if (hijosuArr[i] === ".") {
          const decCol = col - 1  // 奇数列（7, 9, 11）
          if (decCol >= 7 && decCol <= 11) {
            TBL.rows[1].cells[decCol].innerText = "."
          }
        } else {
          if (col <= 12) {
            TBL.rows[1].cells[col].innerText = hijosuArr[i]
            lastDigitCol = col
            col += 2
          }
        }
      }
    }

    // 屋根線: row0（商の行）に下罫線を引く
    // わり算の筆算の「┌──」に相当する横線
    // 被除数の桁数に合わせて、列5（")"）から最後の数字列までに引く
    for (let j = 5; j <= lastDigitCol; j++) {
      TBL.rows[0].cells[j].style.borderBottom = "solid black 2px"
    }

    // ドロップゾーンと罫線を設定
    if (mode !== "") {
      const pattern = getCellPattern(mode)
      // ドロップ可能セルを設定
      for (const [r, c] of pattern.droppable) {
        if (r < currentRows) {
          TBL.rows[r].cells[c].classList.add("droppable-elem")
          TBL.rows[r].cells[c].style.backgroundColor = "antiqueWhite"
        }
      }
      // 罫線を設定（colStart〜colEnd の全列に borderBottom）
      for (const [r, colStart, colEnd] of pattern.underlines) {
        if (r < currentRows) {
          for (let j = colStart; j <= colEnd; j++) {
            TBL.rows[r].cells[j].style.borderBottom = "solid black 2px"
          }
        }
      }
    }
  }

  // ── 商とあまりを読み取る ──────────────────────────
  function readShoAndAmari(): { mySho: number; myAmari: number } {
    const TBL = tblRef.current!
    const currentRows = TBL.rows.length

    // 商の読み取り（row0, 列6-12）
    const myShoArr: string[] = []
    for (let j = 6; j <= 12; j++) {
      const content = TBL.rows[0].cells[j].textContent?.trim() || ""
      if (content === ".") {
        myShoArr.push(".")
      } else if (content !== "") {
        myShoArr.push(content)
      }
    }
    const myShoNum = Number(myShoArr.join(""))
    const mySho = isNaN(myShoNum) ? 0 : myShoNum

    // あまりの読み取り（最終行, 列6-12）
    const lastRow = currentRows - 1
    const myAmariArr: string[] = []
    for (let j = 6; j <= 12; j++) {
      const content = TBL.rows[lastRow].cells[j].textContent?.trim() || ""
      if (content === ".") {
        myAmariArr.push(".")
      } else if (content !== "") {
        myAmariArr.push(content)
      }
    }
    const myAmariNum = Number(myAmariArr.join(""))
    const myAmari = isNaN(myAmariNum) ? 0 : myAmariNum

    return { mySho, myAmari }
  }

  // ── リアルタイム色フィードバック ──────────────────
  function myAnswerUpdate() {
    const TBL = tblRef.current!
    const { mySho, myAmari } = readShoAndAmari()

    // 式を更新
    if (formulaRef.current) {
      const amariStr = myAmari > 0 ? ` あまり ${myAmari}` : ""
      if (mySho === 0 && myAmari === 0) {
        formulaRef.current.textContent = `${hijosuRef.current} ÷ ${josuRef.current} =`
      } else {
        formulaRef.current.textContent = `${hijosuRef.current} ÷ ${josuRef.current} = ${mySho}${amariStr}`
      }
    }

    // 商の正誤色フィードバック（row0 の数字セル + 小数点セル）
    const shoStr = String(shoRef.current)
    const shoArray = [...shoStr]
    let shoIndex = 0

    for (let j = 6; j <= 12; j += 2) {
      const content = TBL.rows[0].cells[j].textContent?.trim() || ""
      if (content !== "") {
        if (shoIndex < shoArray.length && content === shoArray[shoIndex]) {
          TBL.rows[0].cells[j].style.backgroundColor = "orangered"
          shoIndex++
        } else {
          TBL.rows[0].cells[j].style.backgroundColor = "antiqueWhite"
        }
      }

      // 小数点セルもチェック（j+1 = 7, 9, 11）
      if (j <= 10) {
        const decContent = TBL.rows[0].cells[j + 1].textContent?.trim() || ""
        if (decContent === ".") {
          if (shoIndex < shoArray.length && shoArray[shoIndex] === ".") {
            TBL.rows[0].cells[j + 1].style.backgroundColor = "orangered"
            shoIndex++
          } else {
            TBL.rows[0].cells[j + 1].style.backgroundColor = "antiqueWhite"
          }
        }
      }
    }
  }

  // ── 問題作成 ──────────────────────────────────────
  function questionCreate() {
    const mode = selectModeRef.current
    if (mode === "") {
      se.playSe(se.alertSound)
      showMsg("問題の種類をえらんでください。")
      return
    }

    // 問題生成
    const [hijosu, josu, sho, amari] = createRandomNumber(mode)

    // テーブル行数の計算
    const newRows = calcRows(mode, sho)
    setRows(newRows)

    // フラグリセット
    mondaiFlag.current = true
    showedFlag.current = false
    pointFlag.current  = false
    resetProblem()

    // 問題データ保存
    hijosuRef.current = hijosu
    josuRef.current   = josu
    shoRef.current    = sho
    amariRef.current  = amari

    // 式を表示
    if (formulaRef.current) {
      formulaRef.current.textContent = `${hijosu} ÷ ${josu} =`
    }
    // 小数ヒント（整数モードでは非表示）
    const modeNum = parseInt(mode)
    if (hintRef.current) {
      hintRef.current.textContent = modeNum >= 10 ? "小数点はクリックすると出ます。" : ""
    }
    // モード31のあまりガイダンス
    if (hint2Ref.current) {
      hint2Ref.current.textContent = mode === "31"
        ? "あまりに小数点を付けると、あまりの欄に小数点が反映されます。" : ""
    }
    // せいかいを隠す
    if (seikaiRef.current) seikaiRef.current.style.display = "none"
    // メッセージも消す
    if (msgRef.current) msgRef.current.textContent = ""

    // テーブル書き換え:
    // rows が変わる場合は useEffect([rows]) で rewriteTable が呼ばれる。
    // rows が変わらない場合（同じモードで連続出題）は手動で呼ぶ。
    if (newRows === rows) {
      rewriteTable()
      setupDecimalClicks()
    }
    se.playSe(se.set)
  }

  // ── 答え合わせ ────────────────────────────────────
  function checkAnswer() {
    if (!mondaiFlag.current) {
      se.playSe(se.alertSound)
      showMsg("「もんだい」をおしてください。")
      return
    }

    const { mySho, myAmari } = readShoAndAmari()

    // 浮動小数点対策: 小数第2位まで丸めて比較
    const shoOk = Math.round(mySho * 100) / 100 === Math.round(shoRef.current * 100) / 100
    const amariOk = Math.round(myAmari * 100) / 100 === Math.round(amariRef.current * 100) / 100

    if (shoOk && amariOk) {
      if (showedFlag.current) {
        se.playSe(se.seikai2)
        showMsg("正解！（答えを見たのでコインはもらえません）")
      } else {
        if (tryAddCoins(1)) se.playSe(se.seikai1)
        if (seikaiRef.current) seikaiRef.current.style.display = ""
      }
      mondaiFlag.current = false
    } else {
      se.playSe(se.alertSound)
      showMsg("もう一度！")
    }
  }

  // ── 数字を消す ────────────────────────────────────
  function clearTable() {
    rewriteTable()
    showedFlag.current = false
    pointFlag.current = false
    if (formulaRef.current && hijosuRef.current > 0) {
      formulaRef.current.textContent = `${hijosuRef.current} ÷ ${josuRef.current} =`
    }
    if (seikaiRef.current) seikaiRef.current.style.display = "none"
    if (msgRef.current) msgRef.current.textContent = ""
    se.playSe(se.reset)
  }

  // ── 答えを見る ────────────────────────────────────
  function showAnswer() {
    if (!mondaiFlag.current) {
      se.playSe(se.alertSound)
      showMsg("「もんだい」をおしてください。")
      return
    }
    showedFlag.current = true

    // 答えを式に表示
    const amariStr = amariRef.current > 0 ? ` あまり ${amariRef.current}` : ""
    showMsg(`答え：${shoRef.current}${amariStr}`)
    if (formulaRef.current) {
      formulaRef.current.textContent = `${hijosuRef.current} ÷ ${josuRef.current} = ${shoRef.current}${amariStr}`
    }
    se.playSe(se.seikai2)
  }

  // ── ヒント ────────────────────────────────────────
  function showHint() {
    if (!mondaiFlag.current) {
      se.playSe(se.alertSound)
      showMsg("「もんだい」をおしてください。")
      return
    }
    showedFlag.current = true
    // 商の最初の桁を教える
    const firstDigit = String(shoRef.current).replace(".", "")[0]
    showMsg(`商のはじめの位は「${firstDigit}」です。`)
    se.playSe(se.seikai1)
  }

  // ── 小数点クリックのセットアップ（row0 商行） ────
  function setupDecimalClicks() {
    const TBL = tblRef.current
    if (!TBL) return

    // ── row0（商の行）: クリックで「.」配置/移動/消去 ──
    for (const col of [7, 9, 11]) {
      const cell = TBL.rows[0].cells[col]
      cell.style.cursor = "pointer"
      cell.onclick = () => {
        se.playSe(se.move1)
        if (!pointFlag.current) {
          cell.innerText = "."
          pointFlag.current = true
        } else if (cell.innerText === ".") {
          cell.innerText = ""
          pointFlag.current = false
        } else {
          // 別のセルに移動
          for (const c of [7, 9, 11]) TBL.rows[0].cells[c].innerText = ""
          cell.innerText = "."
        }
        myAnswerUpdate()
      }
    }

    // ── row1（除数・被除数行）: 3段階サイクル（空→"."→斜線付き→空） ──
    // 小数÷小数（モード20〜23）で除数の小数点を移動する操作に使う
    const modeNum = parseInt(selectModeRef.current)
    if (modeNum >= 20) {
      for (const col of [3, 7, 9, 11]) {
        const cell = TBL.rows[1].cells[col]
        cell.style.cursor = "pointer"
        cell.onclick = () => {
          se.playSe(se.pi)
          const txt = cell.innerText.trim()
          const hasCrossed = cell.classList.contains("decimal-crossed")
          if (txt === "" || txt === " ") {
            // 空 → 小数点
            cell.innerText = "."
            cell.classList.remove("decimal-crossed")
          } else if (txt === "." && !hasCrossed) {
            // 小数点 → 斜線付き
            cell.classList.add("decimal-crossed")
          } else if (txt === "." && hasCrossed) {
            // 斜線付き → 空
            cell.innerText = ""
            cell.classList.remove("decimal-crossed")
          }
        }
      }
    }

    // ── 最終行（あまり行）: クリックで「.」配置/移動/消去 ──
    // あまりが小数になるモード（31など）で使用
    const lastRow = TBL.rows.length - 1
    if (lastRow > 1) {
      for (const col of [7, 9, 11]) {
        const cell = TBL.rows[lastRow].cells[col]
        cell.style.cursor = "pointer"
        cell.onclick = () => {
          se.playSe(se.pi)
          // あまり行に小数点が既にあるか
          const amariPointExists =
            TBL.rows[lastRow].cells[7].innerText === "." ||
            TBL.rows[lastRow].cells[9].innerText === "." ||
            TBL.rows[lastRow].cells[11].innerText === "."
          if (!amariPointExists) {
            cell.innerText = "."
          } else if (cell.innerText === ".") {
            cell.innerText = ""
          } else {
            // 別のセルに移動
            for (const c of [7, 9, 11]) TBL.rows[lastRow].cells[c].innerText = ""
            cell.innerText = "."
          }
          myAnswerUpdate()
        }
      }
    }
  }

  // ── 初期化 ────────────────────────────────────────
  useEffect(() => {
    numSet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // テーブルのDOMが変わったら（行数変更 or 初回）ドロップゾーンを再設定
  useEffect(() => {
    rewriteTable()
    setupDecimalClicks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  // ── マウス D&D（PC用） ────────────────────────────
  useEffect(() => {
    let dragged: HTMLElement | null = null

    const onDragStart = (e: DragEvent) => { dragged = e.target as HTMLElement }
    const onDragOver = (e: DragEvent) => { e.preventDefault() }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      if (!dragged) return
      const target = e.target as HTMLElement

      if (target.className === "droppable-elem" && dragged.tagName !== "IMG") {
        dragged.parentNode?.removeChild(dragged)
        target.appendChild(dragged)
        const pal = numPalRef.current!
        while (pal.firstChild) pal.removeChild(pal.firstChild)
        numSet()
        myAnswerUpdate()
        se.playSe(target.tagName === "IMG" ? se.cancel : se.pi)
      }
    }

    document.addEventListener("dragstart", onDragStart)
    document.addEventListener("dragover", onDragOver)
    document.addEventListener("drop", onDrop)
    return () => {
      document.removeEventListener("dragstart", onDragStart)
      document.removeEventListener("dragover", onDragOver)
      document.removeEventListener("drop", onDrop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── ガイダンステキスト ────────────────────────────
  function getGuidance(): string {
    const m = selectMode
    if (["0","1","2","3","4","5"].includes(m)) return "商を整数まで求め、あまりがあれば求めましょう。"
    if (["10","11","30"].includes(m)) return "割り切れるまで計算しましょう。"
    if (m === "31") return "商を整数まで求め、あまりを求めましょう。"
    if (["20","21","22","23"].includes(m)) return "小数点を移動してから計算しましょう。"
    return ""
  }

  // ── 描画 ─────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">
        ➗ わり算の筆算
      </h1>

      {/* 問題タイプ選択 + ボタン群 */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectMode}
          onChange={e => {
            const v = e.target.value
            setSelectMode(v)
            selectModeRef.current = v
            se.playSe(se.move2)
          }}
          className="text-sm font-bold p-2 border-2 border-brand-500 rounded text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:border-brand-600"
        >
          <option value="">問題の種類をえらんでください</option>
          {GROUPS.map(group => (
            <optgroup key={group} label={group}>
              {QUESTION_LABELS.filter(q => q.group === group).map(q => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={questionCreate}
          className="px-4 py-2 rounded font-bold bg-brand-500 text-white hover:bg-brand-600 text-sm active:scale-95 transition-all"
        >
          もんだい
        </button>
        <button
          onClick={checkAnswer}
          className="px-4 py-2 rounded font-bold bg-accent-500 text-white hover:bg-accent-600 text-sm active:scale-95 transition-all"
        >
          答え合わせ
        </button>
      </div>

      {/* 2段目ボタン */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={showAnswer}
          className="px-3 py-2 rounded font-bold bg-warm-500 text-white hover:bg-warm-600 text-sm active:scale-95 transition-all"
        >
          答えを見る
        </button>
        <button
          onClick={clearTable}
          className="px-3 py-2 rounded font-bold bg-danger-400 hover:bg-danger-500 active:bg-danger-600 text-white text-sm active:scale-95 transition-all"
        >
          消す
        </button>
        <button
          onClick={showHint}
          className="px-3 py-2 rounded font-bold bg-warm-400 hover:bg-warm-500 active:bg-warm-600 text-white text-sm active:scale-95 transition-all"
        >
          ヒント
        </button>
      </div>

      {/* ガイダンス */}
      {getGuidance() && (
        <p className="text-center text-sm font-bold text-brand-600 dark:text-brand-400">
          {getGuidance()}
        </p>
      )}

      {/* メッセージ表示（alert の代替） */}
      <p ref={msgRef} style={{ display: "none" }}
         className="text-center text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg py-2 px-3 border border-red-200 dark:border-red-800">
      </p>

      {/* 式の表示 */}
      <div
        ref={formulaRef}
        className="text-center font-bold text-3xl md:text-4xl py-3 px-4 bg-gradient-to-r from-white to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-orange-200 dark:border-orange-800 shadow-sm tracking-wider min-h-[56px] flex items-center justify-center"
      />

      {/* 小数ヒント */}
      <p ref={hintRef}
         className="text-center text-sm text-gray-500 dark:text-gray-400 min-h-[20px]" />

      {/* 筆算テーブル（13列 × 可変行） + ゴミ箱 */}
      <div className="flex items-start gap-2">
        <table
          ref={tblRef}
          className="mx-auto"
          style={{ borderCollapse: "collapse", flexShrink: 0 }}
        >
          <tbody>
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row} style={{ minHeight: CELL_H }}>
                {Array.from({ length: COLS }).map((_, col) => {
                  const isDotCol = col % 2 === 1
                  // 列5は ")" 区切り用
                  const isSepCol = col === 5

                  return (
                    <td
                      key={col}
                      style={{
                        width: isDotCol ? DOT_W
                             : isSepCol ? 20
                             : CELL_W,
                        maxWidth: isDotCol ? DOT_W
                                : isSepCol ? 20
                                : CELL_W,
                        height: CELL_H,
                        maxHeight: CELL_H,
                        fontSize: 28,
                        textAlign: "center",
                        verticalAlign: "middle",
                        overflow: "hidden",
                        padding: 0,
                        backgroundColor: "white",
                        border: isDotCol ? "none"
                              : isSepCol ? "none"
                              : "1px dotted #bbb",
                        borderLeft: isDotCol ? "1px dotted #aaa" : undefined,
                        cursor: row === 0 && [7, 9, 11].includes(col) ? "pointer" : undefined,
                      }}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ゴミ箱 */}
        <div className="flex flex-col justify-end self-stretch" style={{ flexShrink: 0 }}>
          <Image
            src="/images/gomibako.png"
            className="droppable-elem"
            width={50}
            height={60}
            alt="ゴミ箱"
            draggable={false}
          />
        </div>
      </div>

      {/* テーブル下ヒント（モード31: あまりの小数点ガイダンス） */}
      <p ref={hint2Ref}
         className="text-center text-sm text-gray-500 dark:text-gray-400 min-h-[20px]" />

      {/* 数字パレット（0〜9） */}
      <div
        ref={numPalRef}
        className="droppable-elem"
        style={{ display: "flex", flexWrap: "wrap", gap: 4, minHeight: 48 }}
      />

      {/* せいかい！表示 */}
      <div className="text-center">
        <span
          ref={seikaiRef}
          style={{ display: "none" }}
          className="text-xl font-bold text-brand-600 animate-bounce inline-block"
        >
          せいかい！🎉
        </span>
      </div>

      {/* コイン */}
      <CoinDisplay coins={coins} />
    </div>
  )
}

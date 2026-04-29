// ======================================================
// かけ算の筆算②（小数対応） ページ
//
// URL: /kake-hissan2
// 対象: 小学3〜5年生
// 内容: 整数・小数のかけ算を筆算形式で練習する
//       旧 jimitas.com/kake-hissan/ からの移植
//
// 問題タイプ（10種類）:
//   0:(2桁)×(1桁)      1:(3桁)×(1桁)
//   2:(2桁)×(2桁)      3:(3桁)×(2桁)
//   4:小数(○.○)×(1桁)  5:小数(○.○○)×(1桁)
//   6:小数(○.○)×(2桁)  7:小数(○.○○)×(2桁)
//   8:小数(○.○)×小数(○.○)  9:小数(○.○○)×小数(○.○)
//
// テーブル構造（8行×9列）:
//   列: 偶数=数字セル(50px)、奇数=小数点セル(0〜10px)
//   row0: 被乗数 / row1: ×＋乗数
//   row2: 繰り上がり1 / row3: 部分積1（1桁モードでは非表示）
//   row4: 繰り上がり2 / row5: 部分積2（1桁モードでは非表示）
//   row6: 繰り上がり3 / row7: 最終答え
//
// D&D:
//   数字パレット(0〜9) → row2〜row7 の数字セル
//   0 をクリックで斜線トグル（小数末尾の消去用）
//   row7 の小数点セルをクリックで小数点配置
// ======================================================

"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Image from "next/image"
import * as se from "@/lib/se"
import { useProblemCoins } from "@/hooks/useProblemCoins"
import { useHissanDnD } from "@/hooks/useHissanDnD"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"

// ── 問題タイプ別の設定 ──────────────────────────────────
// 各配列の index 0〜9 が問題タイプに対応
const QUESTION_LABELS = [
  "(２けた)×(１けた)",     // 0
  "(３けた)×(１けた)",     // 1
  "(２けた)×(２けた)",     // 2
  "(３けた)×(２けた)",     // 3
  "小数(○.○)×(１けた)",   // 4
  "小数(○.○○)×(１けた)",  // 5
  "小数(○.○)×(２けた)",   // 6
  "小数(○.○○)×(２けた)",  // 7
  "小数(○.○)×小数(○.○)",  // 8
  "小数(○.○○)×小数(○.��)", // 9
]
// 被乗数の桁数（整数として扱ったときの桁数）
const MCAND_DIGITS = [2, 3, 2, 3, 2, 3, 2, 3, 2, 3]
// 乗数の桁数
const MPLIER_DIGITS = [1, 1, 2, 2, 1, 1, 2, 2, 2, 2]
// 被乗数を整数に戻すレート（0.12→12 なら 100）
const MCAND_RATIO = [1, 1, 1, 1, 10, 100, 10, 100, 10, 100]
// 乗数を整数に戻すレート
const MPLIER_RATIO = [1, 1, 1, 1, 1, 1, 1, 1, 10, 10]
// 答えの小数点を置くテーブル列（9=小数点なし）
const DECIMAL_COL = [9, 9, 9, 9, 7, 5, 7, 5, 5, 3]

// テーブルサイズ
const ROWS = 8
const COLS = 9

// ── セルサイズ定数 ──────────────────────────────────────
const CELL_W = 50      // 数字セルの幅
const CELL_H = 50      // 数字セルの高さ
const CARRY_H = 24     // 繰り上がり行の高さ
const DOT_W_SHOW = 10  // 小数点セルの幅（小数モード）
const NUM_SIZE = 44     // パレット数字の大きさ
const CARRY_NUM = 24    // 繰り上がりに置いた数字の大きさ

// ── ページ本体 ────────────────────────────────────────
export default function KakeHissan2Page() {

  // 問題タイプ（-1=未選択）
  const [selectIdx, setSelectIdx] = useState(-1)
  const selectIdxRef = useRef(-1)
  selectIdxRef.current = selectIdx

  // コイン
  const { coins, tryAddCoins, resetProblem } = useProblemCoins()

  // ── DOM 参照 ──────────────────────────────────────
  const tblRef     = useRef<HTMLTableElement>(null)
  const numPalRef  = useRef<HTMLDivElement>(null)
  const formulaRef = useRef<HTMLDivElement>(null)   // 式の表示
  const hintRef    = useRef<HTMLParagraphElement>(null) // 小数ヒント
  const seikaiRef  = useRef<HTMLSpanElement>(null)  // せいかい！
  const msgRef     = useRef<HTMLParagraphElement>(null) // メッセージ

  // ── 問題データ（ref、レンダー不要） ────────────────
  const mcandRef   = useRef(0)    // 被乗数
  const mplierRef  = useRef(0)    // 乗数
  const answerRef  = useRef(0)    // 正解
  const mcandArr   = useRef<string[]>([])  // 被乗数の文字列配列
  const mplierArr  = useRef<string[]>([])  // 乗数の文字列配列
  const answerArr  = useRef<string[]>([])  // 答えの文字列配列
  const mondaiFlag = useRef(false)         // 問題出題済み
  const hintFlag   = useRef(false)         // ヒント表示中
  const showedFlag = useRef(false)         // 答えを見た
  const pointFlag  = useRef(false)         // 小数点配置済み

  // ── DnD フック ────────────────────────────────────
  const { touchStartEvent, touchMoveEvent, touchEndEvent } = useHissanDnD({
    numPalRef,
    onDropDigit: (elem, target) => {
      resizeDroppedNumber(elem, target)
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

  // ── ドロップ後の数字サイズ調整 ────────────────────
  // 繰り上がり行（row2,4,6）は小さく、それ以外は通常サイズ
  function resizeDroppedNumber(elem: HTMLElement, parent: HTMLElement) {
    const TBL = tblRef.current!
    const isCarry =
      Array.from(TBL.rows[2].cells).some(c => c === parent) ||
      Array.from(TBL.rows[4].cells).some(c => c === parent) ||
      Array.from(TBL.rows[6].cells).some(c => c === parent)
    if (isCarry) {
      elem.style.width      = CARRY_NUM + "px"
      elem.style.height     = CARRY_NUM + "px"
      elem.style.lineHeight = CARRY_NUM + "px"
      elem.style.fontSize   = "14px"
    } else {
      elem.style.width      = NUM_SIZE + "px"
      elem.style.height     = NUM_SIZE + "px"
      elem.style.lineHeight = NUM_SIZE + "px"
      elem.style.fontSize   = "26px"
    }
  }

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

  // ── テーブル書き換え（問題の数字・レイアウト反映） ──
  function rewriteTable() {
    const TBL = tblRef.current!
    const si = selectIdxRef.current < 0 ? 0 : selectIdxRef.current
    const is2digit = MPLIER_DIGITS[si] === 2
    const isDecimal = si >= 4

    // 全セルクリア
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        TBL.rows[r].cells[c].innerHTML = ""
      }
    }
    // 斜線クラスもクリア
    for (let c = 0; c < COLS; c++) {
      TBL.rows[7].cells[c].classList.remove("hissan2-diagonal")
    }
    pointFlag.current = false

    // ── 小数点列の表示切替 ──
    // 列 3,5,7 の幅: 整数モード→0px、小数モード→10px
    for (let r = 0; r < ROWS; r++) {
      for (const c of [3, 5, 7]) {
        const cell = TBL.rows[r].cells[c]
        cell.style.width = isDecimal ? DOT_W_SHOW + "px" : "0px"
        cell.style.maxWidth = isDecimal ? DOT_W_SHOW + "px" : "0px"
        cell.style.borderLeft = isDecimal ? "1px dotted #aaa" : "none"
      }
    }

    // ── 行の表示切替（1桁/2桁モード） ──
    for (let r = 2; r <= 5; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = TBL.rows[r].cells[c]
        if (!is2digit) {
          // 1桁モード: row2-5 を非表示
          cell.style.height = "0px"
          cell.style.maxHeight = "0px"
          cell.style.borderBottom = "none"
          cell.style.overflow = "hidden"
          cell.style.padding = "0"
          cell.style.fontSize = "0"
        } else {
          // 2桁モード: 繰り上がり行(2,4)は小さく、部分積行(3,5)は通常
          const isCarry = r === 2 || r === 4
          cell.style.height = isCarry ? CARRY_H + "px" : CELL_H + "px"
          cell.style.maxHeight = isCarry ? CARRY_H + "px" : CELL_H + "px"
          cell.style.overflow = ""
          cell.style.padding = ""
          cell.style.fontSize = isCarry ? "10px" : ""
        }
      }
    }

    // ── 2桁モードの罫線 ──
    if (is2digit) {
      // row1: ×の下 = 実線
      // row2,3: 点線
      // row4: 点線
      // row5: 実線（部分積2の下）
      const borders = ["1px dotted #999", "1px dotted #999", "1px dotted #999", "2px solid #333"]
      for (let i = 2; i <= 5; i++) {
        for (let c = 0; c < COLS; c++) {
          TBL.rows[i].cells[c].style.borderBottom = borders[i - 2]
        }
      }
    }

    // ── 繰り上がり行(row6)の高さ ──
    for (let c = 0; c < COLS; c++) {
      TBL.rows[6].cells[c].style.height = CARRY_H + "px"
      TBL.rows[6].cells[c].style.maxHeight = CARRY_H + "px"
      TBL.rows[6].cells[c].style.fontSize = "10px"
    }

    // ── 被乗数の配置（row0） ──
    if (mcandArr.current.length > 0) {
      let addCol = MCAND_DIGITS[si] === 2 ? 5 : 3
      for (let j = 0; j < mcandArr.current.length; j++) {
        if (mcandArr.current[j] === ".") {
          TBL.rows[0].cells[j * 2 + addCol].innerText = "."
          addCol -= 2
        } else {
          TBL.rows[0].cells[j * 2 + addCol + 1].innerText = mcandArr.current[j]
        }
      }
    }

    // ── 乗数の配置（row1） ──
    if (mplierArr.current.length > 0) {
      let addCol = MPLIER_DIGITS[si] === 1 ? 7 : 5
      for (let j = 0; j < mplierArr.current.length; j++) {
        if (mplierArr.current[j] === ".") {
          TBL.rows[1].cells[j * 2 + addCol].innerText = "."
          addCol -= 2
        } else {
          TBL.rows[1].cells[j * 2 + addCol + 1].innerText = mplierArr.current[j]
        }
      }
    }

    // ── ×記号の配置 ──
    // 偶数index（2桁被乗数）→ cell[4]、奇数index（3桁被乗数）→ cell[2]
    if (si % 2 === 0) {
      TBL.rows[1].cells[4].innerText = "×"
    } else {
      TBL.rows[1].cells[2].innerText = "×"
    }
  }

  // ── 問題作成 ──────────────────────────────────────
  function questionCreate() {
    const si = selectIdxRef.current
    if (si < 0) {
      se.playSe(se.alertSound)
      showMsg("問題の種類をえらんでください。")
      return
    }

    mondaiFlag.current = true
    hintFlag.current   = false
    showedFlag.current = false
    pointFlag.current  = false
    resetProblem()

    let mcand = 0
    let mplier = 0

    // ── 被乗数の生成 ──
    for (let i = 0; i < MCAND_DIGITS[si]; i++) {
      // 整数の最上位 or 小数の末尾（i=0）は 1〜9
      if ((si < 4 && i === MCAND_DIGITS[si] - 1) || (si >= 4 && i === 0)) {
        mcand += (Math.floor(Math.random() * 9) + 1) * 10 ** i
      } else {
        mcand += Math.floor(Math.random() * 10) * 10 ** i
      }
    }
    mcand /= MCAND_RATIO[si]

    // ── 乗数の生成 ──
    for (let i = 0; i < MPLIER_DIGITS[si]; i++) {
      if ((si < 8 && i === MPLIER_DIGITS[si] - 1) || (si >= 8 && i === 0)) {
        mplier += (Math.floor(Math.random() * 9) + 1) * 10 ** i
      } else {
        mplier += Math.floor(Math.random() * 10) * 10 ** i
      }
    }
    mplier /= MPLIER_RATIO[si]

    // ── 答えの計算（浮動小数点対策） ──
    const ratio = MCAND_RATIO[si] * MPLIER_RATIO[si]
    const answer = Math.round(mcand * mplier * ratio) / ratio

    mcandRef.current  = mcand
    mplierRef.current = mplier
    answerRef.current = answer
    mcandArr.current  = [...String(mcand)]
    mplierArr.current = [...String(mplier)]
    answerArr.current = [...String(answer)]

    // 式を表示
    if (formulaRef.current) {
      formulaRef.current.textContent = `${mcand} × ${mplier} =`
    }
    // 小数ヒント
    if (hintRef.current) {
      hintRef.current.textContent = si >= 4 ? "小数点はクリックすると出ます。" : ""
    }
    // せいかいを隠す
    if (seikaiRef.current) seikaiRef.current.style.display = "none"

    rewriteTable()
    se.playSe(se.set)
  }

  // ── ヒント表示（2桁モードのみ：部分積を表示） ────
  function hintWrite() {
    const TBL = tblRef.current!
    const si = selectIdxRef.current
    if (MPLIER_DIGITS[si] === 1) return

    // 整数化して計算
    const numA = mcandRef.current * MCAND_RATIO[si]
    const numB = mplierRef.current * MPLIER_RATIO[si]

    // 1段目: 被乗数 × 一の位
    const part1 = Math.round(numA * (numB % 10))
    const p1arr = [...String(part1)]
    let addCol = 10 - 2 * p1arr.length
    for (let j = 0; j < p1arr.length; j++) {
      TBL.rows[3].cells[j * 2 + addCol].innerText = p1arr[j]
    }

    // 2段目: 被乗数 × 十の位（1桁左シフト）
    const part2 = Math.round(numA * Math.floor(numB / 10))
    const p2arr = [...String(part2)]
    addCol = 8 - 2 * p2arr.length
    for (let j = 0; j < p2arr.length; j++) {
      TBL.rows[5].cells[j * 2 + addCol].innerText = p2arr[j]
    }
  }

  // ── 答えを書く ────────────────────────────────────
  function answerWrite() {
    const TBL = tblRef.current!
    const si = selectIdxRef.current
    const arr = answerArr.current
    const ansLen = arr.length

    hintWrite()

    // 小数点を配置
    if (DECIMAL_COL[si] !== 9) {
      TBL.rows[7].cells[DECIMAL_COL[si]].innerText = "."
    }

    // 小数点の位置から整数部分の桁数を得る
    const dotIdx = arr.indexOf(".")
    const intDigits = dotIdx === -1 ? ansLen : dotIdx

    // 開始列の計算
    let addCol = DECIMAL_COL[si] - 2 * intDigits + 1

    // 答えの各桁を配置
    for (let j = 0; j < 6; j++) {
      if (j < ansLen && arr[j] === ".") {
        addCol -= 2
      } else if (j < ansLen) {
        const cellIdx = j * 2 + addCol
        if (cellIdx >= 0 && cellIdx < COLS) {
          TBL.rows[7].cells[cellIdx].innerText = arr[j]
          TBL.rows[7].cells[cellIdx].classList.remove("hissan2-diagonal")
        }
      } else {
        const cellIdx = j * 2 + addCol
        if (cellIdx >= 0 && cellIdx < COLS) {
          TBL.rows[7].cells[cellIdx].innerText = "0"
          TBL.rows[7].cells[cellIdx].classList.add("hissan2-diagonal")
        }
      }
    }

    // 式を更新
    if (formulaRef.current) {
      formulaRef.current.textContent = `${mcandRef.current} × ${mplierRef.current} = ${answerRef.current}`
    }
  }

  // ── 自分の答えを読み取る ──────────────────────────
  function myAnswerUpdate() {
    const TBL = tblRef.current!
    let myAns = 0
    let ratio = 1

    // row7 の小数点セル(3,5,7)を調べて ratio を決定
    for (let j = 0; j < 3; j++) {
      if (TBL.rows[7].cells[j * 2 + 3].innerText === ".") {
        ratio = 10 ** (3 - j)
      }
    }

    // 数字セル(0,2,4,6,8)から値を組み立て
    for (let j = 0; j < 5; j++) {
      myAns += Number(TBL.rows[7].cells[j * 2].innerText) * 10 ** (4 - j)
    }
    myAns /= ratio

    if (isNaN(myAns)) {
      showMsg("「消す」を押してから、もう一度やってみよう。")
      se.playSe(se.alertSound)
      return
    }

    // 式を更新
    if (formulaRef.current) {
      if (myAns === 0) {
        formulaRef.current.textContent = `${mcandRef.current} × ${mplierRef.current} =`
      } else {
        formulaRef.current.textContent = `${mcandRef.current} × ${mplierRef.current} = ${myAns}`
      }
    }
  }

  // ── 答え合わせ ────────────────────────────────────
  function checkAnswer() {
    if (!mondaiFlag.current) {
      se.playSe(se.alertSound)
      showMsg("「もんだい」をおしてください。")
      return
    }

    // 最新の答えを読み取る
    const TBL = tblRef.current!
    let myAns = 0
    let ratio = 1
    for (let j = 0; j < 3; j++) {
      if (TBL.rows[7].cells[j * 2 + 3].innerText === ".") ratio = 10 ** (3 - j)
    }
    for (let j = 0; j < 5; j++) {
      myAns += Number(TBL.rows[7].cells[j * 2].innerText) * 10 ** (4 - j)
    }
    myAns /= ratio

    if (myAns === answerRef.current) {
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
    if (formulaRef.current && mcandRef.current > 0) {
      formulaRef.current.textContent = `${mcandRef.current} × ${mplierRef.current} =`
    }
    if (seikaiRef.current) seikaiRef.current.style.display = "none"
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
    answerWrite()
    se.playSe(se.seikai2)
  }

  // ─��� ヒントボタン ──────────────────────────────────
  function toggleHint() {
    if (!mondaiFlag.current) {
      se.playSe(se.alertSound)
      showMsg("「もんだい」をおしてください。")
      return
    }
    const si = selectIdxRef.current
    if (MPLIER_DIGITS[si] === 1) {
      se.playSe(se.alertSound)
      showMsg("かける数が２けたのときにヒントが出ます。")
      return
    }
    se.playSe(se.seikai1)
    if (!hintFlag.current) {
      hintWrite()
      hintFlag.current = true
    } else {
      hintFlag.current = false
      rewriteTable()
    }
  }

  // ── 小数点クリックのセットアップ ──────────────────
  function setupDecimalClicks() {
    const TBL = tblRef.current!
    for (const col of [3, 5, 7]) {
      const cell = TBL.rows[7].cells[col]
      cell.style.cursor = "pointer"
      cell.onclick = () => {
        se.playSe(se.move1)
        if (!pointFlag.current) {
          // まだ小数点がない → 配置
          cell.innerText = "."
          pointFlag.current = true
        } else if (TBL.rows[7].cells[col].innerText === ".") {
          // 同じセルをクリック → 消す
          TBL.rows[7].cells[col].innerText = ""
          pointFlag.current = false
        } else {
          // 別のセルに移動
          TBL.rows[7].cells[3].innerText = ""
          TBL.rows[7].cells[5].innerText = ""
          TBL.rows[7].cells[7].innerText = ""
          cell.innerText = "."
        }
      }
    }
  }

  // ── 初期化 ────────────────────────────────────────
  useEffect(() => {
    numSet()
    setupDecimalClicks()
    rewriteTable()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        resizeDroppedNumber(dragged, target)
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

  // ── 描画 ─────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800">
        ✖️ かけ算の筆算②
      </h1>

      {/* 問題タイプ選択 + ボタン群 */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectIdx}
          onChange={e => {
            const v = Number(e.target.value)
            setSelectIdx(v)
            selectIdxRef.current = v
            se.playSe(se.move2)
          }}
          className="text-sm font-bold p-2 border-2 border-brand-500 rounded text-gray-700 dark:text-gray-200 dark:bg-gray-700"
        >
          <option value={-1}>問題の種類をえらんでください</option>
          {QUESTION_LABELS.map((label, i) => (
            <option key={i} value={i}>{label}</option>
          ))}
        </select>
        <button
          onClick={questionCreate}
          className="px-4 py-2 rounded font-bold bg-brand-400 hover:bg-brand-500 active:bg-brand-600 text-white text-sm active:scale-95 transition-all"
        >
          もんだい
        </button>
        <button
          onClick={checkAnswer}
          className="px-4 py-2 rounded font-bold bg-accent-400 hover:bg-accent-500 active:bg-accent-600 text-white text-sm active:scale-95 transition-all"
        >
          答え合わせ
        </button>
      </div>

      {/* 2段目ボタン */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={showAnswer}
          className="px-3 py-2 rounded font-bold bg-warm-400 hover:bg-warm-500 active:bg-warm-600 text-white text-sm active:scale-95 transition-all"
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
          onClick={toggleHint}
          className="px-3 py-2 rounded font-bold bg-warm-400 hover:bg-warm-500 active:bg-warm-600 text-white text-sm active:scale-95 transition-all"
        >
          ヒント
        </button>
      </div>

      {/* メッセージ表示（alert の代替） */}
      <p ref={msgRef} style={{ display: "none" }}
         className="text-center text-sm font-bold text-danger-600 bg-danger-50 rounded-lg py-2 px-3 border border-danger-200">
      </p>

      {/* 式の表示 */}
      <div
        ref={formulaRef}
        className="text-center font-bold text-3xl md:text-4xl py-3 px-4 bg-linear-to-r from-white to-orange-50 rounded-xl border-2 border-orange-200 shadow-sm tracking-wider min-h-14 flex items-center justify-center"
      />

      {/* 小数ヒント */}
      <p ref={hintRef}
         className="text-center text-sm text-gray-500 min-h-5" />

      {/* 筆算テーブル（8行×9列） */}
      <div className="flex items-start gap-2">
        <table
          ref={tblRef}
          className="mx-auto"
          style={{ borderCollapse: "collapse", flexShrink: 0 }}
        >
          <tbody>
            {Array.from({ length: ROWS }).map((_, row) => (
              <tr key={row}>
                {Array.from({ length: COLS }).map((_, col) => {
                  const isDigitCol = col % 2 === 0
                  const isDotCol = col % 2 === 1
                  // col=1 は常に非表示のスペーサー
                  const isHiddenSpacer = col === 1
                  // row2以降の数字セルがドロップ対象
                  const isDroppable = row >= 2 && isDigitCol
                  // 繰り上がり行
                  const isCarryRow = row === 2 || row === 4 || row === 6
                  // 答え行の小数点セル
                  const isDecimalClickable = row === 7 && [3, 5, 7].includes(col)

                  return (
                    <td
                      key={col}
                      className={isDroppable ? "droppable-elem" : ""}
                      style={{
                        width: isHiddenSpacer ? 0
                             : isDotCol ? 0
                             : CELL_W,
                        maxWidth: isHiddenSpacer ? 0
                                : isDotCol ? 0
                                : CELL_W,
                        height: isCarryRow ? CARRY_H : CELL_H,
                        maxHeight: isCarryRow ? CARRY_H : CELL_H,
                        fontSize: isCarryRow ? 10 : 28,
                        textAlign: "center",
                        verticalAlign: "middle",
                        overflow: "hidden",
                        padding: 0,
                        // 背景色: row0-1 は白、droppable は薄黄
                        backgroundColor: isDroppable ? "#fffde7" : "white",
                        // 罫線（基本: 点線。row1下は実線）
                        border: isHiddenSpacer ? "none"
                              : isDotCol ? "none"
                              : "1px dotted #bbb",
                        borderBottom: row === 1 && !isHiddenSpacer && !isDotCol
                          ? "2px solid #333"
                          : isHiddenSpacer || isDotCol ? "none" : "1px dotted #bbb",
                        borderTop: row === 0 && isDigitCol ? "1px dotted #bbb" : undefined,
                        // 小数点クリック用
                        cursor: isDecimalClickable ? "pointer" : undefined,
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

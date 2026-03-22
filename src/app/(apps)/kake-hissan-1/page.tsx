// ======================================================
// かけ算のひっ算① ページ（16kah1.js を忠実に移植）
//
// URL: /kake-hissan-1
// 対象: 小学3〜4年生
// 内容: 2〜3桁 × 1桁 のかけ算を筆算形式で練習する
//
// レイアウト:
//   [ボタン群]
//   [入力欄: 被乗数 × 乗数 ＝ 答え]
//   flex row:
//     左列: [筆算テーブル]
//           [数字パレット（2段×5）]
//           [財布（ゴミ箱）]
//     右列: [くり上がりボタン（OkaneGrid上部）]
//           [OkaneGrid]
//
// D&D:
//   数字パレット(0〜9) → 筆算 row2（くり上がり）/ row3（こたえ）
//   財布          → 数字を捨てる（droppable-elem として機能）
//
// グリッド構造（4列×4行）:
//   row0: 被乗数 (num1)                  ← 白・読み取り専用
//   row1: × 記号 + 乗数 (num2)、下線    ← 白・読み取り専用
//   row2: くり上がり                      ← 黄・droppable-elem
//   row3: こたえ                          ← 黄・droppable-elem
// ======================================================

"use client"

import { useRef, useEffect, useState } from "react"
import * as se from "@/lib/se"
import { useProblemCoins } from "@/hooks/useProblemCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { OkaneGrid } from "@/components/parts/hissan/OkaneGrid"

// ── 定数 ─────────────────────────────────────────────
const COLS = 4
const TYPES = ["(2けた)×(1けた)", "(3けた)×(1けた)"]

// ── ヘルパー ──────────────────────────────────────────
function toDigits(n: number): number[] {
  return String(Math.abs(Math.floor(n))).split("").reverse().map(Number)
}

// ── ページ本体 ────────────────────────────────────────
export default function KakeHissan1Page() {

  const [typeIndex, setTypeIndex] = useState(0)
  const typeIndexRef = useRef(0)
  typeIndexRef.current = typeIndex

  // num1/num2 は OkaneGrid の props に必要なため state でも管理
  const [num1, setNum1] = useState(23)
  const [num2, setNum2] = useState(4)

  // 問題が変わるたびに +1 → OkaneGrid の resetKey として渡す
  const [problemKey, setProblemKey] = useState(0)

  const { coins, tryAddCoins, resetProblem } = useProblemCoins()

  // ── DOM 参照 ──────────────────────────────────────
  const tblRef    = useRef<HTMLTableElement>(null)  // 筆算テーブル
  const numPalRef = useRef<HTMLDivElement>(null)    // 数字パレット
  const box1Ref   = useRef<HTMLInputElement>(null)  // 被乗数入力
  const box2Ref   = useRef<HTMLInputElement>(null)  // 乗数入力
  const box5Ref   = useRef<HTMLInputElement>(null)  // こたえ表示（読み取り用）
  const seikaiRef = useRef<HTMLSpanElement>(null)   // せいかい！表示

  // ── 問題データ（ref で保持 ─ レンダー不要） ────────
  const num1Ref = useRef(23)
  const num2Ref = useRef(4)
  const ansRef  = useRef(92)

  // ── タッチ: 開始（スクロール禁止） ────────────────
  function touchStartEvent(event: TouchEvent) {
    event.preventDefault()
  }

  // ── タッチ: 移動中（要素を指に追従） ──────────────
  function touchMoveEvent(event: TouchEvent) {
    event.preventDefault()
    const elem  = event.target as HTMLElement
    const touch = event.changedTouches[0]
    elem.style.position = "fixed"
    elem.style.zIndex   = "9999"
    elem.style.top  = touch.pageY - window.pageYOffset - elem.offsetHeight / 2 + "px"
    elem.style.left = touch.pageX - window.pageXOffset - elem.offsetWidth  / 2 + "px"
  }

  // ── タッチ終了: 数字パレット用 ────────────────────
  function touchEndEvent(event: TouchEvent) {
    event.preventDefault()
    const elem  = event.target as HTMLElement
    elem.style.position = ""
    elem.style.zIndex   = ""
    elem.style.top      = ""
    elem.style.left     = ""

    const touch     = event.changedTouches[0]
    const newParent = document.elementFromPoint(
      touch.pageX - window.pageXOffset,
      touch.pageY - window.pageYOffset,
    ) as HTMLElement | null

    if (newParent?.className === "droppable-elem") {
      newParent.appendChild(elem)
      resizeDroppedNumber(elem, newParent)
      const pal = numPalRef.current!
      while (pal.firstChild) pal.removeChild(pal.firstChild)
      numSet()
      kotaeInput()
      // ゴミ箱（img タグ）へドロップしたときは cancel 音、それ以外は pi 音
      se.playSe(newParent.tagName === "IMG" ? se.cancel : se.pi)
    }
  }

  // ── ドロップ後に数字の大きさを調整 ───────────────
  // くり上がり行（row2、高さ 36px）は小さく、こたえ行（row3）は元サイズ
  function resizeDroppedNumber(elem: HTMLElement, parent: HTMLElement) {
    const TBL     = tblRef.current!
    const isCarry = Array.from(TBL.rows[2].cells).some(cell => cell === parent)
    if (isCarry) {
      elem.style.width      = "28px"
      elem.style.height     = "28px"
      elem.style.lineHeight = "28px"
      elem.style.fontSize   = "16px"
    } else {
      // row3 やパレットに戻ったとき → 元のサイズに戻す
      elem.style.width      = "44px"
      elem.style.height     = "44px"
      elem.style.lineHeight = "44px"
      elem.style.fontSize   = "26px"
    }
  }

  // ── 数字パレットを生成（0〜9） ────────────────────
  // 2段×5列に収まるよう 44px 幅に設定
  function numSet() {
    const pal = numPalRef.current!
    while (pal.firstChild) pal.removeChild(pal.firstChild)
    for (let i = 0; i < 10; i++) {
      const div = document.createElement("div")
      div.innerHTML = String(i)
      div.className = "draggable-elem"
      div.setAttribute("draggable", "true")
      div.style.cssText = [
        "width:44px", "height:44px", "line-height:44px",
        "background:white", "font-size:26px", "text-align:center",
        "border-radius:10%", "border:1px solid #333",
        "cursor:pointer", "user-select:none", "display:inline-block",
      ].join(";")
      div.addEventListener("touchstart", touchStartEvent as EventListener, false)
      div.addEventListener("touchmove",  touchMoveEvent  as EventListener, false)
      div.addEventListener("touchend",   touchEndEvent   as EventListener, false)
      pal.appendChild(div)
    }
  }

  // ── 筆算テーブルに数字を配置 ──────────────────────
  function suujiSet() {
    const TBL = tblRef.current!
    for (let col = 0; col < COLS; col++) {
      TBL.rows[0].cells[col].innerHTML = ""
      TBL.rows[1].cells[col].innerHTML = ""
    }
    // 被乗数を row0 に右詰め
    const d1 = toDigits(num1Ref.current)
    for (let i = 0; i < d1.length; i++) {
      TBL.rows[0].cells[COLS - 1 - i].innerHTML = String(d1[i])
    }
    // × 記号: num1 が2桁なら col1、3桁なら col0
    const signCol = num1Ref.current < 100 ? 1 : 0
    TBL.rows[1].cells[signCol].innerHTML = "×"
    // 乗数（1桁）を row1 の最右列に
    TBL.rows[1].cells[COLS - 1].innerHTML = String(num2Ref.current)
  }

  // ── 答えチェック（row3 から読み取り） ──────────────
  function kotaeInput() {
    const TBL  = tblRef.current!
    const box5 = box5Ref.current!

    const ans =
      Number(TBL.rows[3].cells[0].innerText) * 1000 +
      Number(TBL.rows[3].cells[1].innerText) * 100  +
      Number(TBL.rows[3].cells[2].innerText) * 10   +
      Number(TBL.rows[3].cells[3].innerText)

    box5.value = ans > 0 ? String(ans) : ""

    if (ans === ansRef.current) {
      box5.style.color = "red"
      if (tryAddCoins(1)) se.playSe(se.seikai1)
      if (seikaiRef.current) seikaiRef.current.style.display = ""
    } else {
      box5.style.color = "black"
    }
  }

  // ── 問題セット（メイン処理） ──────────────────────
  function hissanSet(a: number, b: number) {
    if (!isFinite(a) || !isFinite(b) || a < 10 || a > 999 || b < 1 || b > 9) {
      se.playSe(se.alertSound)
      return
    }

    num1Ref.current = Math.floor(a)
    num2Ref.current = Math.floor(b)
    ansRef.current  = num1Ref.current * num2Ref.current
    resetProblem()

    if (box1Ref.current) box1Ref.current.value       = String(num1Ref.current)
    if (box2Ref.current) box2Ref.current.value       = String(num2Ref.current)
    if (box5Ref.current) {
      box5Ref.current.value       = ""
      box5Ref.current.style.color = "black"
    }
    if (seikaiRef.current) seikaiRef.current.style.display = "none"

    // row2・row3 をクリアしてスタイルリセット
    const TBL = tblRef.current!
    for (let col = 0; col < COLS; col++) {
      TBL.rows[2].cells[col].innerHTML       = ""
      TBL.rows[3].cells[col].innerHTML       = ""
      TBL.rows[2].cells[col].style.fontSize      = ""
      TBL.rows[2].cells[col].style.color         = ""
      TBL.rows[2].cells[col].style.verticalAlign = ""
    }

    suujiSet()
    setNum1(num1Ref.current)
    setNum2(num2Ref.current)
    setProblemKey(k => k + 1)
  }

  // ── もんだい（ランダム問題生成） ──────────────────
  function shutudai() {
    let a = 0
    const b = Math.floor(Math.random() * 9) + 1
    switch (typeIndexRef.current) {
      case 0: a = Math.floor(Math.random() * 90) + 10;   break
      case 1: a = Math.floor(Math.random() * 900) + 100; break
    }
    se.playSe(se.set)
    hissanSet(a, b)
  }

  // ── セット（手入力） ──────────────────────────────
  function mondaiSet() {
    const a = Number(box1Ref.current!.value)
    const b = Number(box2Ref.current!.value)
    hissanSet(a, b)
    se.playSe(se.set)
  }

  // ── クリア ───────────────────────────────────────
  function masuClear() {
    se.playSe(se.reset)
    const TBL = tblRef.current!
    for (let col = 0; col < COLS; col++) {
      TBL.rows[2].cells[col].innerHTML       = ""
      TBL.rows[3].cells[col].innerHTML       = ""
      TBL.rows[2].cells[col].style.fontSize      = ""
      TBL.rows[2].cells[col].style.color         = ""
      TBL.rows[2].cells[col].style.verticalAlign = ""
    }
    if (box5Ref.current) {
      box5Ref.current.value       = ""
      box5Ref.current.style.color = "black"
    }
    if (seikaiRef.current) seikaiRef.current.style.display = "none"
  }

  // ── こたえ表示 ───────────────────────────────────
  function showAnswer() {
    se.playSe(se.seikai2)
    const TBL  = tblRef.current!
    const d1   = toDigits(num1Ref.current)
    const dAns = toDigits(ansRef.current)

    // くり上がりを計算して row2 に表示（小さい赤字）
    let carry = 0
    for (let i = 0; i < d1.length; i++) {
      const prod = d1[i] * num2Ref.current + carry
      carry = Math.floor(prod / 10)
      const col = COLS - 2 - i
      if (carry > 0 && col >= 0) {
        const cell = TBL.rows[2].cells[col]
        cell.innerHTML           = String(carry)
        cell.style.fontSize      = "14px"
        cell.style.color         = "red"
        cell.style.verticalAlign = "bottom"
      }
    }

    // 答えを row3 に右詰め
    for (let i = 0; i < dAns.length; i++) {
      TBL.rows[3].cells[COLS - 1 - i].innerHTML = String(dAns[i])
    }

    // box5 に答えを表示
    if (box5Ref.current) {
      box5Ref.current.value       = String(ansRef.current)
      box5Ref.current.style.color = "blue"
    }
  }

  // ── 初期化（マウント後に実行） ────────────────────
  useEffect(() => {
    hissanSet(23, 4)
    numSet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── マウス D&D ────────────────────────────────────
  useEffect(() => {
    let dragged: HTMLElement | null = null

    const onDragStart = (e: DragEvent) => { dragged = e.target as HTMLElement }
    const onDragOver  = (e: DragEvent) => { e.preventDefault() }
    const onDrop      = (e: DragEvent) => {
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
        kotaeInput()
        // ゴミ箱（img タグ）へドロップしたときは cancel 音、それ以外は pi 音
        se.playSe(target.tagName === "IMG" ? se.cancel : se.pi)
      }
    }

    document.addEventListener("dragstart", onDragStart)
    document.addEventListener("dragover",  onDragOver)
    document.addEventListener("drop",      onDrop)
    return () => {
      document.removeEventListener("dragstart", onDragStart)
      document.removeEventListener("dragover",  onDragOver)
      document.removeEventListener("drop",      onDrop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 描画 ─────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800">
        ✖️ かけ算のひっ算①
      </h1>

      {/* ボタン群エリア */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={masuClear}
          className="px-3 py-2 rounded font-bold border-2 border-gray-400
                     text-gray-600 hover:bg-gray-100 text-sm active:scale-95 transition-all"
        >
          クリア
        </button>
        <select
          value={typeIndex}
          onChange={e => setTypeIndex(Number(e.target.value))}
          className="text-sm font-bold p-2 border-2 border-brand-400 rounded text-gray-700"
        >
          {TYPES.map((t, i) => <option key={i} value={i}>{t}</option>)}
        </select>
        <button
          onClick={shutudai}
          className="px-4 py-2 rounded font-bold bg-brand-500 text-white
                     hover:bg-brand-600 text-sm active:scale-95 transition-all"
        >
          もんだい
        </button>
        <button
          onClick={mondaiSet}
          onTouchStart={e => { e.preventDefault(); mondaiSet() }}
          className="px-4 py-2 rounded font-bold bg-accent-500 text-white
                     hover:bg-accent-600 text-sm active:scale-95 transition-all"
        >
          セット
        </button>
        <button
          onClick={showAnswer}
          className="px-4 py-2 rounded font-bold bg-warm-500 text-white
                     hover:bg-warm-600 text-sm active:scale-95 transition-all"
        >
          こたえ
        </button>
      </div>

      {/* 式の入力欄（被乗数 × 乗数 ＝ こたえ）+ 財布（右詰）*/}
      <div className="flex items-center gap-2">
        <input
          ref={box1Ref}
          type="number" min={10} max={999}
          defaultValue={23}
          className="w-24 h-12 text-center border-2 border-gray-300 rounded
                     font-bold text-2xl p-1"
        />
        <span className="text-2xl font-bold text-gray-600">×</span>
        <input
          ref={box2Ref}
          type="number" min={1} max={9}
          defaultValue={4}
          className="w-16 h-12 text-center border-2 border-gray-300 rounded
                     font-bold text-2xl p-1"
        />
        <span className="text-2xl font-bold text-gray-600">＝</span>
        {/* こたえ: kotaeInput() が書き込む・showAnswer() が青で書き込む */}
        <input
          ref={box5Ref}
          type="number"
          readOnly
          className="w-28 h-12 text-center border-2 border-gray-300 rounded
                     font-bold text-2xl p-1 bg-gray-50"
          style={{ color: "black" }}
        />
        {/* せいかい！表示（DOM から直接 display を切り替える）*/}
        <span
          ref={seikaiRef}
          style={{ display: "none" }}
          className="text-xl font-bold text-brand-600 animate-bounce"
        >
          せいかい！🎉
        </span>
      </div>

      {/* メインフィールド: 左列（筆算＋パレット）・ゴミ箱・右列（OkaneGrid）*/}
      {/* gap: 0 にして各要素の margin で間隔を調整（たし算と同じパターン）*/}
      <div className="flex items-start" style={{ gap: 0 }}>

        {/* ── 左列: 筆算テーブル / 数字パレット / 財布 ── */}
        <div className="flex flex-col gap-2" style={{ flexShrink: 0 }}>

          {/* 筆算テーブル（4行×4列、60px セル）*/}
          <table
            ref={tblRef}
            style={{ borderCollapse: "collapse" }}
          >
            <tbody>
              {[0, 1, 2, 3].map(row => (
                <tr key={row}>
                  {[0, 1, 2, 3].map(col => (
                    <td
                      key={col}
                      // row2（くり上がり）と row3（こたえ）のみドロップ可
                      className={row === 2 || row === 3 ? "droppable-elem" : ""}
                      style={{
                        border: "1px solid #333",
                        width: 60,
                        maxWidth: 60,
                        height: row === 2 ? 36 : 60,
                        maxHeight: row === 2 ? 36 : 60,
                        fontSize: row === 2 ? 14 : 30,
                        textAlign: "center",
                        verticalAlign: "middle",
                        backgroundColor: row === 2 || row === 3 ? "lightyellow" : "white",
                        borderBottom: row === 1 ? "3px solid #333" : "1px solid #333",
                      }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* 数字パレット（0〜9、44px×2段×5列）*/}
          {/* className は "droppable-elem" のみ（余計なクラスを混ぜると D&D の判定が壊れる）*/}
          <div
            ref={numPalRef}
            className="droppable-elem"
            style={{ display: "flex", flexWrap: "wrap", gap: 4, width: 236, minHeight: 48 }}
          />


        </div>

        {/* ゴミ箱（筆算とお金の間・たし算と同じ位置）*/}
        {/* className は "droppable-elem" のみ → 数字をドロップで削除（硬貨は D&D 判定で弾く）*/}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/gomibako.png"
          className="droppable-elem"
          alt="ゴミ箱"
          draggable={false}
          style={{
            width: 50,
            height: 60,
            position: "relative",
            left: 10,
            top: 150,
            flexShrink: 0,
          }}
        />

        {/* ── 右列: OkaneGrid（くり上がりボタン込み）── */}
        <div style={{ marginLeft: 10, flexShrink: 0 }}>
          <OkaneGrid
            variant="kake1"
            num1={num1}
            num2={num2}
            resetKey={problemKey}
          />
        </div>

      </div>

      {/* コイン（正解スコア） */}
      <CoinDisplay coins={coins} />

    </div>
  )
}

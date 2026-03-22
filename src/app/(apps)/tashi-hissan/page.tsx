// ======================================================
// たし算のひっ算 ページ（14tahi.js を忠実に移植）
//
// URL: /tashi-hissan
// 対象: 小学2〜3年生
// 内容: 2〜3桁のたし算を筆算形式で練習する
//
// レイアウト:
//   [ボタン群][問題タイプ選択]
//   [式の入力欄]
//   [筆算テーブル] [ゴミ箱] [お金テーブル]  ← 横並び
//   [数字パレット]
//   [コイン（スコア）]
//
// D&D:
//   数字パレット(0〜9) → 筆算 row0/row3（droppable-elem）
//   硬貨画像           → お金テーブル全セル（droppable-elem-2）
//   両方               → ゴミ箱（droppable-elem）で削除
//
// 繰り上がり:
//   row3 に同金種が10枚溜まると自動的に上位金種に変換し row0 へ
// ======================================================

"use client"

import { useRef, useEffect, useState } from "react"
import * as se from "@/lib/se"
import { useProblemCoins } from "@/hooks/useProblemCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"

// ── 定数 ─────────────────────────────────────────────
const MAX_KETA = 4
const TYPE_DATA = [
  "(２けた)+(２けた)",
  "(３けた)+(２けた)",
  "(２けた)+(３けた)",
  "(３けた)+(３けた)",
]
// 元コードの img_arr に対応（index 0=一の位 … 3=千の位）
// 画像は /images/ 配下（public/images/）
const COIN_ARR = ["ichi", "juu", "hyaku", "sen"]

// ── ページ本体 ────────────────────────────────────────
export default function TashiHissanPage() {

  // 問題タイプ選択（セレクトボックスの再描画が必要なため state で管理）
  const [typeIndex, setTypeIndex] = useState(0)
  const typeIndexRef = useRef(0)
  typeIndexRef.current = typeIndex

  // コイン（同問題の重複防止付き）
  const { coins, tryAddCoins, resetProblem } = useProblemCoins()

  // ── DOM 参照 ──────────────────────────────────────
  const tblRef    = useRef<HTMLTableElement>(null)   // 筆算テーブル
  const tbl2Ref   = useRef<HTMLTableElement>(null)   // お金テーブル
  const numPalRef = useRef<HTMLDivElement>(null)     // 数字パレット
  const box1Ref   = useRef<HTMLInputElement>(null)   // 被加数入力
  const box3Ref   = useRef<HTMLInputElement>(null)   // 加数入力
  const box5Ref   = useRef<HTMLInputElement>(null)   // 答え入力

  // ── 問題データ（ref で保持 ─ レンダー不要） ────────
  const hikasRef  = useRef(123)
  const kasuRef   = useRef(456)
  const waRef     = useRef(0)
  const hikasArr  = useRef<number[]>([])
  const kasuArr   = useRef<number[]>([])
  const waArr     = useRef<number[]>([])
  const hikasKeta = useRef(0)
  const kasuKeta  = useRef(0)
  const waKeta    = useRef(0)
  const kuriagari = useRef(0)

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
  // ドロップ先が droppable-elem ならそこへ移動し、パレットをリフレッシュ
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
      // 数字パレットを一旦クリアして再生成（常に 0〜9 が使える状態を保つ）
      const pal = numPalRef.current!
      while (pal.firstChild) pal.removeChild(pal.firstChild)
      numSet()
      kotaeInput()
      // ゴミ箱（img タグ）へドロップしたときは cancel 音、それ以外は pi 音
      se.playSe(newParent.tagName === "IMG" ? se.cancel : se.pi)
    }
  }

  // ── タッチ終了: 硬貨用 ────────────────────────────
  // ドロップ先が droppable-elem-2 ならそこへ移動し、繰り上がりを確認
  function touchEndEvent2(event: TouchEvent) {
    event.preventDefault()
    const elem  = event.target as HTMLElement
    elem.style.position = ""
    elem.style.zIndex   = ""
    elem.style.top      = ""
    elem.style.left     = ""
    // Tailwind preflight が display をリセットするため明示指定
    elem.style.display  = "inline-block"

    const touch     = event.changedTouches[0]
    const newParent = document.elementFromPoint(
      touch.pageX - window.pageXOffset,
      touch.pageY - window.pageYOffset,
    ) as HTMLElement | null

    if (newParent?.className === "droppable-elem-2") {
      newParent.appendChild(elem)
    }
    se.playSe(se.pi)
    imgKuriagari()
  }

  // ── くり上がり処理 ────────────────────────────────
  // row3 に同金種が 10 枚溜まったら自動で上位金種に変換して row0 へ
  function imgKuriagari() {
    const TBL_2 = tbl2Ref.current!
    for (let j = 0; j < 3; j++) {
      const count = TBL_2.rows[3].cells[3 - j].getElementsByClassName(COIN_ARR[j]).length
      if (count > 9) {
        se.playSe(se.reset)
        // 10枚削除
        for (let i = 0; i < 10; i++) {
          TBL_2.rows[3].cells[3 - j].getElementsByClassName(COIN_ARR[j])[0].remove()
        }
        // 1つ上の金種を繰り上がり行（row0）に追加
        imgStyle(j)
      }
    }
    updateRow3Hints()
  }

  // ── row3 のガイド表示を更新 ───────────────────────
  // A: 硬貨が0枚のセルに薄い「↓」を表示（集め方の誘導）
  // B: 1枚以上のセルに右下小さく「枚数/10」カウンターを表示
  //    9枚になったら「あと1こ！」に変化
  // pointer-events:none で D&D 判定に影響させない
  function updateRow3Hints() {
    const TBL_2 = tbl2Ref.current!
    const row3  = TBL_2.rows[3]
    for (let col = 0; col < 4; col++) {
      const cell  = row3.cells[col]
      cell.style.position = "relative"  // 子要素の absolute 配置に必要

      // 前回のヒントを削除してから再描画
      const old = cell.querySelector(".row3-hint")
      if (old) old.remove()

      // 硬貨（img）の枚数をカウント
      const count = cell.getElementsByTagName("img").length

      const span = document.createElement("span")
      span.className = "row3-hint"
      // pointer-events:none → タッチ/マウス D&D の elementFromPoint を透過
      span.style.pointerEvents = "none"
      span.style.userSelect    = "none"
      span.style.position      = "absolute"

      if (count === 0) {
        // A: 薄い「↓」ガイド（中央）
        span.style.top       = "50%"
        span.style.left      = "50%"
        span.style.transform = "translate(-50%,-50%)"
        span.style.fontSize  = "22px"
        span.style.color     = "rgba(0,0,0,0.18)"
        span.textContent     = "↓"
      } else {
        // B: 枚数カウンター（右下）
        span.style.bottom   = "3px"
        span.style.right    = "5px"
        span.style.fontSize = "11px"
        span.style.lineHeight = "1"
        if (count >= 9) {
          // 9枚以上: 少し目立つ色で「あと1こ！」
          span.style.color = "rgba(200,80,0,0.7)"
          span.textContent = count === 9 ? "あと1こ！" : `${count}/10`
        } else {
          // 1〜8枚: 薄いグレーでカウント
          span.style.color = "rgba(0,0,0,0.25)"
          span.textContent = `${count}/10`
        }
      }
      cell.appendChild(span)
    }
  }

  // 上位金種の硬貨画像を row0 に追加する（imgKuriagari の内部処理）
  // j=0: 1円×10→10円を col2 へ
  // j=1: 10円×10→100円を col1 へ
  // j=2: 100円×10→1000円を col0 へ
  function imgStyle(j: number) {
    const TBL_2 = tbl2Ref.current!
    const img   = document.createElement("img")
    img.setAttribute("src", `/images/${COIN_ARR[j + 1]}.png`)
    img.setAttribute("class", COIN_ARR[j + 1])
    // 1000円（j=2）は大きめ、それ以外は 25px
    img.style.width   = j === 2 ? "90px" : "25px"
    img.style.height  = j === 2 ? "38px" : "25px"
    img.style.display = "inline-block"
    img.addEventListener("touchstart", touchStartEvent as EventListener, false)
    img.addEventListener("touchmove",  touchMoveEvent  as EventListener, false)
    img.addEventListener("touchend",   touchEndEvent2  as EventListener, false)
    TBL_2.rows[0].cells[2 - j].appendChild(img)
  }

  // ── 硬貨画像を生成 ───────────────────────────────
  function makeCoinImg(col: number): HTMLImageElement {
    const img = document.createElement("img")
    img.setAttribute("src", `/images/${COIN_ARR[col]}.png`)
    img.setAttribute("class", COIN_ARR[col])
    img.setAttribute("draggable", "true")
    // 1000円（col=3）は大きめ
    img.style.width   = col === 3 ? "90px" : "25px"
    img.style.height  = col === 3 ? "38px" : "25px"
    img.style.cursor  = "pointer"
    img.style.display = "inline-block"
    img.addEventListener("touchstart", touchStartEvent as EventListener, false)
    img.addEventListener("touchmove",  touchMoveEvent  as EventListener, false)
    img.addEventListener("touchend",   touchEndEvent2  as EventListener, false)
    return img
  }

  // ── 数字パレットを生成（0〜9） ────────────────────
  function numSet() {
    const pal = numPalRef.current!
    // 呼ぶ前に必ずクリア（StrictMode 二重実行・D&D後リフレッシュの両方に対応）
    while (pal.firstChild) pal.removeChild(pal.firstChild)
    for (let i = 0; i < 10; i++) {
      const div = document.createElement("div")
      div.innerHTML = String(i)
      div.className = "draggable-elem"
      div.setAttribute("draggable", "true")
      div.style.cssText = [
        "width:50px", "height:50px", "line-height:50px",
        "background:white", "font-size:30px", "text-align:center",
        "border-radius:10%", "border:1px solid #333",
        "cursor:pointer", "user-select:none", "display:inline-block",
      ].join(";")
      div.addEventListener("touchstart", touchStartEvent as EventListener, false)
      div.addEventListener("touchmove",  touchMoveEvent  as EventListener, false)
      div.addEventListener("touchend",   touchEndEvent   as EventListener, false)
      pal.appendChild(div)
    }
  }

  // ── お金テーブルに硬貨を配置 ──────────────────────
  function okaneSet() {
    const TBL_2 = tbl2Ref.current!
    // 全セルをクリア（クリアせずに配置するとお金が増え続けてバグになる）
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        TBL_2.rows[row].cells[col].innerHTML = ""
      }
    }
    // 被加数のお金を row1 に
    for (let col = 0; col < hikasKeta.current; col++) {
      for (let i = 0; i < hikasArr.current[col]; i++) {
        TBL_2.rows[1].cells[MAX_KETA - col - 1].appendChild(makeCoinImg(col))
      }
    }
    // 加数のお金を row2 に
    for (let col = 0; col < kasuKeta.current; col++) {
      for (let i = 0; i < kasuArr.current[col]; i++) {
        TBL_2.rows[2].cells[MAX_KETA - col - 1].appendChild(makeCoinImg(col))
      }
    }
    // ＋記号の位置（両数が2桁以下なら十の位、それ以外は百の位）
    if (hikasRef.current < 100 && kasuRef.current < 100) {
      TBL_2.rows[2].cells[1].innerHTML = "+"
    } else {
      TBL_2.rows[2].cells[0].innerHTML = "+"
    }

    // 新問題セット直後（row3 が空）にヒントを初期表示
    updateRow3Hints()
  }

  // ── 筆算テーブルに数字を配置 ──────────────────────
  function suujiSet() {
    const TBL = tblRef.current!
    // 全セルをクリア
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        TBL.rows[row].cells[col].innerHTML = ""
      }
    }
    // 被加数を row1 に（右詰め）
    for (let col = 0; col < hikasKeta.current; col++) {
      TBL.rows[1].cells[MAX_KETA - col - 1].innerHTML = String(hikasArr.current[col])
    }
    // 加数を row2 に（右詰め）
    for (let col = 0; col < kasuKeta.current; col++) {
      TBL.rows[2].cells[MAX_KETA - col - 1].innerHTML = String(kasuArr.current[col])
    }
    // ＋記号
    if (hikasRef.current < 100 && kasuRef.current < 100) {
      TBL.rows[2].cells[1].innerHTML = "+"
    } else {
      TBL.rows[2].cells[0].innerHTML = "+"
    }
  }

  // ── 筆算セット（メイン処理） ──────────────────────
  function hissanSet(h: number, k: number) {
    // バリデーション
    if (h > 999 || k > 999 || h < 0 || k < 0) {
      se.playSe(se.alertSound)
      alert("数字は1～999までにしてください。")
      box1Ref.current!.value = ""
      box3Ref.current!.value = ""
      return
    }

    hikasRef.current  = Math.floor(h)
    kasuRef.current   = Math.floor(k)
    waRef.current     = Math.floor(h + k)
    kuriagari.current = 0
    resetProblem()  // 新問題なので正解済みフラグをリセット

    // 式入力欄を更新
    box1Ref.current!.value       = String(hikasRef.current)
    box3Ref.current!.value       = String(kasuRef.current)
    box5Ref.current!.value       = ""
    box5Ref.current!.style.color = "black"

    // 桁配列を設定（index 0 = 一の位）
    const hs = String(hikasRef.current)
    const ks = String(kasuRef.current)
    const ws = String(waRef.current)
    hikasKeta.current = hs.length
    kasuKeta.current  = ks.length
    waKeta.current    = ws.length

    hikasArr.current = []
    kasuArr.current  = []
    waArr.current    = []
    for (let i = 0; i < hikasKeta.current; i++) {
      hikasArr.current[i] = Number(hs.charAt(hikasKeta.current - i - 1))
    }
    for (let i = 0; i < kasuKeta.current; i++) {
      kasuArr.current[i] = Number(ks.charAt(kasuKeta.current - i - 1))
    }
    for (let i = 0; i < waKeta.current; i++) {
      waArr.current[i] = Number(ws.charAt(waKeta.current - i - 1))
    }

    suujiSet()
    okaneSet()
  }

  // ── クリア ───────────────────────────────────────
  function masuClear() {
    se.playSe(se.reset)
    const TBL = tblRef.current!
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        TBL.rows[row].cells[col].innerHTML = ""
      }
    }
    TBL.rows[2].cells[0].innerHTML = "+"
    box1Ref.current!.value = ""
    box3Ref.current!.value = ""
    box5Ref.current!.value = ""
  }

  // ── もんだい（ランダム問題生成） ──────────────────
  function shutudai() {
    let h = 0, k = 0
    switch (typeIndexRef.current) {
      case 0: h = Math.floor(Math.random() * 90 + 10);   k = Math.floor(Math.random() * 90 + 10);   break
      case 1: h = Math.floor(Math.random() * 900 + 100); k = Math.floor(Math.random() * 90 + 10);   break
      case 2: h = Math.floor(Math.random() * 90 + 10);   k = Math.floor(Math.random() * 900 + 10);  break
      case 3: h = Math.floor(Math.random() * 900 + 100); k = Math.floor(Math.random() * 900 + 100); break
    }
    box1Ref.current!.value = String(h)
    box3Ref.current!.value = String(k)
    hissanSet(h, k)
    se.playSe(se.set)
  }

  // ── セット（手入力から問題をセット） ─────────────
  function mondaiSet() {
    const h = Number(box1Ref.current!.value)
    const k = Number(box3Ref.current!.value)
    hissanSet(h, k)
    se.playSe(se.set)
  }

  // ── こたえ表示 ───────────────────────────────────
  function showAnswer() {
    const box5 = box5Ref.current!
    box5.value       = String(waRef.current)
    box5.style.color = "blue"
    se.playSe(se.seikai2)

    const TBL = tblRef.current!
    // くり上がりを計算して row0 に表示
    kuriagari.current = 0
    for (let col = 0; col < Math.min(hikasKeta.current, kasuKeta.current); col++) {
      if (Math.floor(hikasArr.current[col] + kasuArr.current[col] + kuriagari.current) > 9) {
        const cell = TBL.rows[0].cells[MAX_KETA - col - 2]
        cell.innerHTML           = "1"
        cell.style.fontSize      = "20px"
        cell.style.color         = "red"
        cell.style.verticalAlign = "bottom"
        kuriagari.current = 1
      } else {
        kuriagari.current = 0
      }
    }
    // 答えを row3 に表示（右詰め）
    for (let col = 0; col < waKeta.current; col++) {
      TBL.rows[3].cells[MAX_KETA - col - 1].innerHTML = String(waArr.current[col])
    }
  }

  // ── 答え入力チェック（row3 から読み取り） ──────────
  // 数字パレットを筆算 row3 にドロップするたびに呼ばれる
  function kotaeInput() {
    const TBL  = tblRef.current!
    const box5 = box5Ref.current!

    // row3 の 4 セルから数値を読み取って合成
    const ans =
      Number(TBL.rows[3].cells[0].innerText) * 1000 +
      Number(TBL.rows[3].cells[1].innerText) * 100  +
      Number(TBL.rows[3].cells[2].innerText) * 10   +
      Number(TBL.rows[3].cells[3].innerText)

    box5.value = String(ans)

    if (ans === waRef.current) {
      box5.style.color = "red"
      // 初回正解のときだけ音とコイン（2回目以降は tryAddCoins が false を返す）
      if (tryAddCoins(1)) se.playSe(se.seikai1)
    } else {
      box5.style.color = "black"
    }
  }

  // ── 初期化（マウント後に実行） ────────────────────
  useEffect(() => {
    hissanSet(123, 456)
    numSet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── マウス D&D ────────────────────────────────────
  // タッチと同じ動作をマウスでも実現する
  useEffect(() => {
    let dragged: HTMLElement | null = null

    const onDragStart = (e: DragEvent) => { dragged = e.target as HTMLElement }
    const onDragOver  = (e: DragEvent) => { e.preventDefault() }
    const onDrop      = (e: DragEvent) => {
      e.preventDefault()
      if (!dragged) return
      const target = e.target as HTMLElement

      if (target.className === "droppable-elem" && dragged.tagName !== "IMG") {
        // 数字パレットの数字のみ筆算セル・ゴミ箱へ（硬貨はドロップ不可）
        dragged.parentNode?.removeChild(dragged)
        target.appendChild(dragged)
        const pal = numPalRef.current!
        while (pal.firstChild) pal.removeChild(pal.firstChild)
        numSet()
        kotaeInput()
        // ゴミ箱（img タグ）へドロップしたときは cancel 音、それ以外は pi 音
        se.playSe(target.tagName === "IMG" ? se.cancel : se.pi)
      } else if (target.className === "droppable-elem-2" && dragged.tagName === "IMG") {
        // 硬貨をお金テーブルのセルへ
        dragged.parentNode?.removeChild(dragged)
        target.appendChild(dragged)
        imgKuriagari()
        se.playSe(se.pi)
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
        ➕ たし算のひっ算
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
          {TYPE_DATA.map((t, i) => <option key={i} value={i}>{t}</option>)}
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

      {/* 式の入力欄 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={box1Ref}
          type="number" min={10} max={999}
          defaultValue={123}
          className="w-24 h-12 text-center border-2 border-gray-300 rounded
                     font-bold text-2xl p-1"
        />
        <span className="text-2xl font-bold text-gray-600">＋</span>
        <input
          ref={box3Ref}
          type="number" min={10} max={999}
          defaultValue={456}
          className="w-24 h-12 text-center border-2 border-gray-300 rounded
                     font-bold text-2xl p-1"
        />
        <span className="text-2xl font-bold text-gray-600">＝</span>
        {/* 答え入力欄: 正解なら赤、こたえボタンで青 */}
        <input
          ref={box5Ref}
          type="number"
          className="w-24 h-12 text-center border-2 border-gray-300 rounded
                     font-bold text-2xl p-1"
          onChange={() => {
            const box5 = box5Ref.current!
            if (Number(box5.value) === waRef.current) {
              box5.style.color = "red"
              if (tryAddCoins(1)) se.playSe(se.seikai1)
            } else {
              box5.style.color = "black"
            }
          }}
        />
      </div>

      {/* フィールド: 筆算テーブル ＋ ゴミ箱 ＋ お金テーブル（横並び） */}
      <div className="flex items-start" style={{ gap: 0 }}>

        {/* 筆算テーブル（4行×4列、60×60px） */}
        <table
          ref={tblRef}
          style={{ borderCollapse: "collapse", flexShrink: 0 }}
        >
          <tbody>
            {[0, 1, 2, 3].map(row => (
              <tr key={row} style={{ maxHeight: 60 }}>
                {[0, 1, 2, 3].map(col => (
                  <td
                    key={col}
                    // row0（繰り上がり）と row3（答え）のみドロップ可
                    className={row === 0 || row === 3 ? "droppable-elem" : ""}
                    style={{
                      border: "1px solid #333",
                      width: 60,
                      maxWidth: 60,
                      height: 60,
                      maxHeight: 60,
                      fontSize: 30,
                      textAlign: "center",
                      backgroundColor: row === 0 || row === 3 ? "lightyellow" : "white",
                      // row2 の下線（加数の下の横線）
                      borderBottom: row === 2 ? "3px solid #333" : "1px solid #333",
                    }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ゴミ箱（数字パレットの数字のみドロップで削除、硬貨は不可） */}
        <div style={{
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          alignSelf: "stretch", flexShrink: 0, padding: "0 10px",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/gomibako.png"
            className="droppable-elem"
            style={{ width: 50, height: 60 }}
            alt="ゴミ箱"
            draggable={false}
          />
        </div>

        {/* お金テーブル（4行×4列、200×60px） */}
        <table
          ref={tbl2Ref}
          style={{ marginLeft: 20, borderCollapse: "collapse", flexShrink: 0 }}
        >
          <tbody>
            {[0, 1, 2, 3].map(row => (
              <tr key={row} style={{ maxHeight: 60 }}>
                {[0, 1, 2, 3].map(col => (
                  <td
                    key={col}
                    className="droppable-elem-2"
                    style={{
                      border: "1px solid #333",
                      width: 130,
                      maxWidth: 130,
                      height: 60,
                      maxHeight: 60,
                      backgroundColor: row === 0 || row === 3 ? "lightyellow" : "white",
                      // row3: hint の absolute 配置に必要
                      position: row === 3 ? "relative" : undefined,
                    }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* 数字パレット（0〜9、ドラッグして筆算に配置） */}
      {/* className は "droppable-elem" のみ（余計なクラスを混ぜると D&D の判定が壊れる） */}
      <div
        ref={numPalRef}
        className="droppable-elem"
        style={{ display: "flex", flexWrap: "wrap", gap: 4, minHeight: 54 }}
      />

      {/* コイン（正解スコア） */}
      <CoinDisplay coins={coins} />

    </div>
  )
}

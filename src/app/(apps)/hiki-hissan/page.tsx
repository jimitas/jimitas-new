// ======================================================
// ひき算のひっ算 ページ（15hihi.js を忠実に移植）
//
// URL: /hiki-hissan
// 対象: 小学2〜3年生
// 内容: 2〜3桁のひき算を筆算形式で練習する
//
// たし算（tashi-hissan）との主な差分:
//   - 演算子が「＋」→「－」
//   - 問題タイプは3種（たし算は4種）
//   - 数字パレットは 0〜10（11個）：繰り下がりの「10」入力用
//   - お金テーブルは被減数（row1）のみ。減数（row2）は硬貨なし
//   - 繰り下がり: row0 に上位金種1枚を置くと下位金種10枚に両替（逆方向）
//   - バリデーション追加: 被減数 >= 減数 のチェック
//
// 実装済み:
//   ✅ 筆算テーブル・suujiSet
//   ✅ お金テーブル・okaneSet（被減数のみ）
//   ✅ 繰り下がり imgKurisagari（上位1枚→下位10枚）
//   ✅ kurisagariDone フラグ（各列1回のみ変換）
//   ✅ タッチ・マウス D&D
//   ✅ 数字パレット（0〜10）
//   ✅ こたえ表示（row3 の数字・row0 の「10」）
//   ✅ showAnswer の取り消し線・赤字（naname1 クラス）
//   ✅ useProblemCoins（重複コイン防止）
// ======================================================

"use client"

import { useRef, useEffect, useState } from "react"
import * as se from "@/lib/se"
import { useProblemCoins } from "@/hooks/useProblemCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"

// ── 定数 ─────────────────────────────────────────────
const MAX_KETA = 4
const TYPE_DATA = [
  "(２けた)－(２けた)",
  "(３けた)－(２けた)",
  "(３けた)－(３けた)",
]
// ひき算では ichi/juu/hyaku の3種のみ（1000円は被減数に登場しない）
// 画像は /images/ 配下（public/images/）
const COIN_ARR = ["ichi", "juu", "hyaku"]

// ── ページ本体 ────────────────────────────────────────
export default function HikiHissanPage() {

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
  const box1Ref   = useRef<HTMLInputElement>(null)   // 被減数入力
  const box3Ref   = useRef<HTMLInputElement>(null)   // 減数入力
  const box5Ref   = useRef<HTMLInputElement>(null)   // 答え入力

  // ── 問題データ（ref で保持 ─ レンダー不要） ────────
  const higensuRef  = useRef(456)
  const gensuRef    = useRef(123)
  const saRef       = useRef(0)
  const higensuArr  = useRef<number[]>([])
  const gensuArr    = useRef<number[]>([])
  const saArr       = useRef<number[]>([])
  const higensuKeta = useRef(0)
  const gensuKeta   = useRef(0)
  const saKeta      = useRef(0)
  // こたえボタン用の繰り下がり計算用（showAnswer 内で使うローカル変数相当）
  // ここでは使わないが、元コードの変数構造に合わせて保持
  const kurisagari  = useRef(0)

  // 繰り下がり変換済みフラグ（各列1回のみ変換を許可）
  // index 0 = col3（一の位）, index 1 = col2（十の位）, index 2 = col1（百の位）
  const kurisagariDoneRef = useRef([false, false, false])

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
      const pal = numPalRef.current!
      while (pal.firstChild) pal.removeChild(pal.firstChild)
      numSet()
      kotaeInput()
    }
    se.playSe(se.pi)
  }

  // ── タッチ終了: 硬貨用 ────────────────────────────
  // ドロップ先が droppable-elem-2 ならそこへ移動し、繰り下がりを確認
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
    imgKurisagari()
  }

  // ── 繰り下がり処理（たし算と逆方向） ─────────────
  // たし算: row3 で下位10枚→上位1枚にまとめて row0 へ上げる
  // ひき算: row0 に上位金種が1枚置かれたら→下位金種10枚に崩す（同セル内）
  //
  // j=0: row0 col3（一の位）の juu(10円)1枚 → ichi(1円)×10枚
  // j=1: row0 col2（十の位）の hyaku(100円)1枚 → juu(10円)×10枚
  // j=2: COIN_ARR[3] は undefined → `if (!upperCoin) continue` でスキップ
  function imgKurisagari() {
    const TBL_2 = tbl2Ref.current!
    for (let j = 0; j < 3; j++) {
      const upperCoin = COIN_ARR[j + 1]
      // j=2 は COIN_ARR に要素がないためスキップ
      if (!upperCoin) continue
      const count = TBL_2.rows[0].cells[3 - j].getElementsByClassName(upperCoin).length
      // フラグチェック：各列1回のみ変換を許可（2回目の変換を防ぐ）
      if (count === 1 && !kurisagariDoneRef.current[j]) {
        kurisagariDoneRef.current[j] = true  // 変換済みにする
        se.playSe(se.reset)
        // 上位金種を1枚削除
        TBL_2.rows[0].cells[3 - j].getElementsByClassName(upperCoin)[0].remove()
        // 下位金種を10枚追加（同じセルに崩す）
        for (let i = 0; i < 10; i++) {
          TBL_2.rows[0].cells[3 - j].appendChild(makeCoinImg(j))
        }
      }
    }
  }

  // ── 硬貨画像を生成 ───────────────────────────────
  // ひき算は ichi/juu/hyaku の3種のみ、すべて 25×25px
  function makeCoinImg(col: number): HTMLImageElement {
    const img = document.createElement("img")
    img.setAttribute("src", `/images/${COIN_ARR[col]}.png`)
    img.setAttribute("class", COIN_ARR[col])
    img.setAttribute("draggable", "true")
    img.style.width   = "25px"
    img.style.height  = "25px"
    img.style.cursor  = "pointer"
    img.style.display = "inline-block"
    img.addEventListener("touchstart", touchStartEvent as EventListener, false)
    img.addEventListener("touchmove",  touchMoveEvent  as EventListener, false)
    img.addEventListener("touchend",   touchEndEvent2  as EventListener, false)
    return img
  }

  // ── 数字パレットを生成（0〜10、11個） ────────────
  // たし算は i < 10（10個）、ひき算は i <= 10（11個）
  // 「10」が必要な理由: 繰り下がり後のセルに「10」を記入できるようにするため
  function numSet() {
    const pal = numPalRef.current!
    // 先にクリア（StrictMode 二重実行・D&D 後リフレッシュ対策）
    while (pal.firstChild) pal.removeChild(pal.firstChild)
    for (let i = 0; i <= 10; i++) {
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

  // ── お金テーブルに硬貨を配置（被減数のみ） ────────
  // たし算: 被加数（row1）+ 加数（row2）の両方に配置
  // ひき算: 被減数（row1）のみ。減数（row2）は「-」記号のみ
  function okaneSet() {
    const TBL_2 = tbl2Ref.current!
    // 全クリア（クリアせず配置するとお金が増え続けてバグになる）
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        TBL_2.rows[row].cells[col].innerHTML = ""
      }
    }
    // 被減数のお金を row1 に配置
    for (let col = 0; col < higensuKeta.current; col++) {
      for (let i = 0; i < higensuArr.current[col]; i++) {
        TBL_2.rows[1].cells[MAX_KETA - col - 1].appendChild(makeCoinImg(col))
      }
    }
    // 減数行（row2）は硬貨なし、「-」記号のみ表示
    if (higensuRef.current < 100 && gensuRef.current < 100) {
      TBL_2.rows[2].cells[1].innerHTML = "-"
    } else {
      TBL_2.rows[2].cells[0].innerHTML = "-"
    }
  }

  // ── 筆算テーブルに数字を配置 ──────────────────────
  function suujiSet() {
    const TBL = tblRef.current!
    // 全クリア
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        TBL.rows[row].cells[col].innerHTML = ""
      }
    }
    // 被減数を row1 に（右詰め）
    for (let col = 0; col < higensuKeta.current; col++) {
      TBL.rows[1].cells[MAX_KETA - col - 1].innerHTML = String(higensuArr.current[col])
    }
    // 減数を row2 に（右詰め）
    for (let col = 0; col < gensuKeta.current; col++) {
      TBL.rows[2].cells[MAX_KETA - col - 1].innerHTML = String(gensuArr.current[col])
    }
    // 「-」記号の位置
    if (higensuRef.current < 100 && gensuRef.current < 100) {
      TBL.rows[2].cells[1].innerHTML = "-"
    } else {
      TBL.rows[2].cells[0].innerHTML = "-"
    }
  }

  // ── 筆算セット（メイン処理） ──────────────────────
  function hissanSet(h: number, k: number) {
    // バリデーション1: 範囲チェック（たし算と共通）
    if (h > 999 || k > 999 || h < 0 || k < 0) {
      se.playSe(se.alertSound)
      alert("数字は1～999までにしてください。")
      box1Ref.current!.value = ""
      box3Ref.current!.value = ""
      return
    }
    // バリデーション2: ひき算固有（被減数 >= 減数）
    if (h < k) {
      se.playSe(se.alertSound)
      alert("引かれる数は，引く数よりも大きくしてください。")
      box1Ref.current!.value = ""
      box3Ref.current!.value = ""
      return
    }

    higensuRef.current = Math.floor(h)
    gensuRef.current   = Math.floor(k)
    saRef.current      = Math.floor(h - k)
    kurisagari.current = 0
    kurisagariDoneRef.current = [false, false, false]  // 繰り下がりフラグもリセット
    resetProblem()  // 新問題なので正解済みフラグをリセット

    // 式入力欄を更新
    box1Ref.current!.value       = String(higensuRef.current)
    box3Ref.current!.value       = String(gensuRef.current)
    box5Ref.current!.value       = ""
    box5Ref.current!.style.color = "black"

    // 桁配列を設定（index 0 = 一の位）
    const hs = String(higensuRef.current)
    const ks = String(gensuRef.current)
    const ss = String(saRef.current)
    higensuKeta.current = hs.length
    gensuKeta.current   = ks.length
    saKeta.current      = ss.length

    higensuArr.current = []
    gensuArr.current   = []
    saArr.current      = []
    for (let i = 0; i < higensuKeta.current; i++) {
      higensuArr.current[i] = Number(hs.charAt(higensuKeta.current - i - 1))
    }
    for (let i = 0; i < gensuKeta.current; i++) {
      gensuArr.current[i] = Number(ks.charAt(gensuKeta.current - i - 1))
    }
    for (let i = 0; i < saKeta.current; i++) {
      saArr.current[i] = Number(ss.charAt(saKeta.current - i - 1))
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
    // クリア後の初期「-」記号（たし算は「+」）
    TBL.rows[2].cells[0].innerHTML = "-"
    box1Ref.current!.value = ""
    box3Ref.current!.value = ""
    box5Ref.current!.value = ""
    kurisagariDoneRef.current = [false, false, false]  // 繰り下がりフラグもリセット
  }

  // ── もんだい（ランダム問題生成） ──────────────────
  // 必ず被減数 > 減数 になるよう生成する
  function shutudai() {
    let h = 0, k = 0
    switch (typeIndexRef.current) {
      case 0:
        // (2けた)-(2けた): gensu の上限を higensu-1 に制限
        h = Math.floor(Math.random() * 90 + 10)          // 10〜99
        k = Math.floor(Math.random() * (h - 10) + 10)    // 10〜h-1
        break
      case 1:
        // (3けた)-(2けた)
        h = Math.floor(Math.random() * 900 + 100)         // 100〜999
        k = Math.floor(Math.random() * 90 + 10)           // 10〜99
        break
      case 2:
        // (3けた)-(3けた): gensu の上限を higensu-1 に制限
        h = Math.floor(Math.random() * 900 + 100)         // 100〜999
        k = Math.floor(Math.random() * (h - 100) + 100)   // 100〜h-1
        break
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

  // ── こたえ表示 ────────────────────────────────────
  // row3 の答え・row0 の「10」赤字・row1 の取り消し線（naname1）
  function showAnswer() {
    const box5 = box5Ref.current!
    box5.value       = String(saRef.current)
    box5.style.color = "blue"
    se.playSe(se.seikai2)

    const TBL = tblRef.current!
    let kuri = 0
    for (let col = 0; col < Math.max(higensuKeta.current, gensuKeta.current) - 1; col++) {
      if (Math.floor((higensuArr.current[col] ?? 0) - (gensuArr.current[col] ?? 0) - kuri) < 0) {
        // row0 に「10」を赤字で表示（この桁で借りた）
        TBL.rows[0].cells[MAX_KETA - col - 1].innerHTML =
          "<span style='color:red;font-size:20px;vertical-align:bottom;'>10</span>"
        // row1 の上位桁に「取り消し線付き元の数字」＋「-1した数字（赤）」を表示
        // col+1 が借りる桁（一の位なら十の位、十の位なら百の位）
        const origDigit = higensuArr.current[col + 1] ?? 0
        TBL.rows[1].cells[MAX_KETA - col - 2].innerHTML =
          `<span style="position:relative;display:inline-block;">` +
            `<span style="position:absolute;top:50%;left:0;width:100%;height:2px;background:red;transform:rotate(-45deg);display:block;"></span>` +
            `${origDigit}` +
          `</span>` +
          `<span style="color:red;font-size:20px;vertical-align:top;">${origDigit - 1}</span>`
        kuri = 1
      } else {
        kuri = 0
      }
      // 特殊ケース: 一の位でくり下がり かつ 十の位が 0（301-52 など）
      // → 十の位は「9」として row0 に表示、row1 の十の位は「0」のまま
      if ((higensuArr.current[0] ?? 0) - (gensuArr.current[0] ?? 0) < 0
          && higensuArr.current[1] === 0) {
        TBL.rows[0].cells[2].innerHTML =
          "<span style='color:red;font-size:20px;vertical-align:bottom;'>9</span>"
        TBL.rows[1].cells[2].innerHTML = "0"
      }
    }
    // 差（答え）を row3 に表示（右詰め）
    for (let col = 0; col < saKeta.current; col++) {
      TBL.rows[3].cells[MAX_KETA - col - 1].innerHTML = String(saArr.current[col])
    }
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

    box5.value = String(ans)

    if (ans === saRef.current) {
      box5.style.color = "red"
      // 初回正解のみ音とコイン（2回目以降は tryAddCoins が false を返す）
      if (tryAddCoins(1)) se.playSe(se.seikai1)
    } else {
      box5.style.color = "black"
    }
  }

  // ── 初期化（マウント後に実行） ────────────────────
  useEffect(() => {
    hissanSet(456, 123)
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
        // 数字を筆算セルへ（またはゴミ箱へ）
        dragged.parentNode?.removeChild(dragged)
        target.appendChild(dragged)
        const pal = numPalRef.current!
        while (pal.firstChild) pal.removeChild(pal.firstChild)
        numSet()
        kotaeInput()
        se.playSe(se.pi)
      } else if (target.className === "droppable-elem-2" && dragged.tagName === "IMG") {
        // 硬貨をお金テーブルのセルへ
        dragged.parentNode?.removeChild(dragged)
        target.appendChild(dragged)
        imgKurisagari()
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
        ➖ ひき算のひっ算
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
          defaultValue={456}
          className="w-24 h-12 text-center border-2 border-gray-300 rounded
                     font-bold text-2xl p-1"
        />
        <span className="text-2xl font-bold text-gray-600">－</span>
        <input
          ref={box3Ref}
          type="number" min={10} max={999}
          defaultValue={123}
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
            if (Number(box5.value) === saRef.current) {
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
                    // row0（繰り下がり記入欄）と row3（答え）のみドロップ可
                    className={row === 0 || row === 3 ? "droppable-elem" : ""}
                    style={{
                      border: "1px solid #333",
                      width: 60, maxWidth: 60,
                      height: 60, maxHeight: 60,
                      fontSize: 30,
                      textAlign: "center",
                      backgroundColor: row === 0 || row === 3 ? "lightyellow" : "white",
                      // row2 の下線（減数の下の横線）
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

        {/* お金テーブル（4行×4列、130×60px） */}
        {/* row0: 繰り下がり硬貨を置いて崩す場所（lightyellow） */}
        {/* row1: 被減数の硬貨（white） */}
        {/* row2: 減数行（硬貨なし・「-」記号のみ、white） */}
        {/* row3: 答え行（lightyellow） */}
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
                      width: 130, maxWidth: 130,
                      height: 60, maxHeight: 60,
                      backgroundColor: row === 0 || row === 3 ? "lightyellow" : "white",
                    }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* 数字パレット（0〜10）*/}
      {/* className は "droppable-elem" のみ（Tailwind クラスを混ぜると D&D の判定が壊れる） */}
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

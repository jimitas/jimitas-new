// ======================================================
// おかねのけいさん ページ
//
// URL: /okane
// 対象: 小学1〜2年生
// 内容: お金の画像をドラッグして金額を数える練習
//
// モード:
//   セット      → 金額を入力してお金をテーブルに配置、合計確認
//   ならべよう  → 指定された金額になるようにお金を並べる
//   もんだい    → テーブルに並んだお金の合計を答える
//
// DnD実装:
//   position:fixed + elementFromPoint 方式（タッチ・マウス共通）
//   イベント委譲で財布エリアとテーブルに mousedown/touchstart を設定
//   ドロップ先：テーブル td（.okane-droppable）または財布（#okane-wallet）
// ======================================================

"use client"

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react"
import Image from "next/image"
import * as se from "@/lib/se"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { NumPad } from "@/components/parts/buttons/NumPad"
import { useKeyboardInput } from "@/hooks/useKeyboardInput"

// ── 定数 ─────────────────────────────────────────────

// お金の種類（インデックス順に並べる）
const OKANE = [
  { id: "ichiman", value: 10000, label: "1万円", isBill: true  },
  { id: "gosen",   value: 5000,  label: "5千円", isBill: true  },
  { id: "sen",     value: 1000,  label: "千円",  isBill: true  },
  { id: "gohyaku", value: 500,   label: "500円", isBill: false },
  { id: "hyaku",   value: 100,   label: "100円", isBill: false },
  { id: "gojuu",   value: 50,    label: "50円",  isBill: false },
  { id: "juu",     value: 10,    label: "10円",  isBill: false },
  { id: "go",      value: 5,     label: "5円",   isBill: false },
  { id: "ichi",    value: 1,     label: "1円",   isBill: false },
]

// デフォルト：100円〜1円を有効
const DEFAULT_CHECKED = [false, false, false, false, true, true, true, true, true]

// もんだい・ならべよう用の問題生成に使う denomination インデックス
// （元アプリと同様に偶数インデックス: 万・千・百・十・一 のみ使用）
const Q_INDICES = [0, 2, 4, 6, 8]

// セット時にどのテーブルセル（0〜4）に入れるか
const CELL_MAP = [0, 1, 1, 2, 2, 3, 3, 4, 4]

type Mode = "set" | "narabeyou" | "mondai"

// ── ヘルパー ──────────────────────────────────────────

// お金の img 要素を生成する（DnD で動的に作る）
function createCoinImg(id: string, isBill: boolean): HTMLImageElement {
  const img = document.createElement("img")
  img.src = `/images/${id}.png`
  img.alt = id
  img.className = `okane-draggable ${id}`
  img.setAttribute("data-bill", isBill ? "1" : "0")
  const w = isBill ? 80 : 48
  const h = isBill ? 40 : 40
  img.style.cssText = `width:${w}px;height:${h}px;object-fit:contain;cursor:grab;margin:2px;display:inline-block;`
  return img
}

// ── コンポーネント ───────────────────────────────────

export default function OkanePage() {
  const [mode, setMode]           = useState<Mode>("set")
  const [activeCoins, setActiveCoins] = useState<boolean[]>([...DEFAULT_CHECKED])
  // もんだいモードで問題が出ているか（NumPad・キーボード入力の enabled フラグ）
  const [hasMondaiProblem, setHasMondaiProblem] = useState<boolean>(false)

  const { coins, addCoins } = useCoins()

  // 財布エリア
  const el_bills = useRef<HTMLDivElement>(null) // お札置き場（上段）
  const el_coins = useRef<HTMLDivElement>(null) // コイン置き場（下段）
  // お金を並べるエリア（flex コンテナ）
  const el_tableArea = useRef<HTMLDivElement>(null)

  // 各セルの幅比率（flex値）。ドラッグで変更できる
  const [cellFlexes, setCellFlexes] = useState<number[]>([1, 1, 1, 1, 1])
  // メッセージ
  const el_text  = useRef<HTMLDivElement>(null)
  // 入力欄（セット・もんだいモード）
  const el_kazu   = useRef<HTMLInputElement>(null)
  const el_answer = useRef<HTMLInputElement>(null)

  // 問題の正解を保持
  const narabeyouAns = useRef<number>(0)
  const mondaiAns    = useRef<number>(0)
  const hasAnswered  = useRef<boolean>(false)

  // ── 財布にお金を補充 ──────────────────────────────────
  // activeCoins が変わるたびに財布内を再生成する

  const refillWallet = useCallback(() => {
    if (!el_bills.current || !el_coins.current) return
    el_bills.current.innerHTML = ""
    el_coins.current.innerHTML = ""
    OKANE.forEach((coin, i) => {
      if (!activeCoins[i]) return
      const img = createCoinImg(coin.id, coin.isBill)
      if (coin.isBill) el_bills.current!.appendChild(img)
      else             el_coins.current!.appendChild(img)
    })
  }, [activeCoins])

  useEffect(() => { refillWallet() }, [refillWallet])

  // 初期表示：セットモードの説明を表示
  useEffect(() => {
    if (el_text.current)
      el_text.current.innerHTML = "きんがくを　セット、または　いくらかを　しらべる"
  }, [])

  // DnD の useEffect から最新の refillWallet を呼べるよう ref に保持する
  const refillWalletRef = useRef(refillWallet)
  useLayoutEffect(() => { refillWalletRef.current = refillWallet })

  // ── テーブル操作ユーティリティ ────────────────────────

  // テーブルの全セルを空にする
  const clearTable = useCallback(() => {
    if (!el_tableArea.current) return
    el_tableArea.current.querySelectorAll<HTMLElement>(".okane-droppable")
      .forEach((cell) => { cell.innerHTML = "" })
  }, [])

  // テーブルに並んでいるお金の合計金額を計算する
  const calcTotal = (): number => {
    if (!el_tableArea.current) return 0
    const cells = el_tableArea.current.querySelectorAll(".okane-droppable")
    let total = 0
    OKANE.forEach((coin) => {
      let count = 0
      cells.forEach((cell) => { count += cell.getElementsByClassName(coin.id).length })
      total += count * coin.value
    })
    return total
  }

  // 指定した金額に対応するお金をテーブルに配置する
  const setAmountToTable = useCallback((amount: number) => {
    clearTable()
    if (!el_tableArea.current) return
    const cells = el_tableArea.current.querySelectorAll<HTMLElement>(".okane-droppable")

    let remaining = amount
    OKANE.forEach((coin, i) => {
      if (!activeCoins[i]) return
      const count = Math.floor(remaining / coin.value)
      remaining -= count * coin.value
      for (let j = 0; j < count; j++) {
        cells[CELL_MAP[i]]?.appendChild(createCoinImg(coin.id, coin.isBill))
      }
    })
    refillWallet()
  }, [activeCoins, clearTable, refillWallet])

  // ── セルのリサイズ ────────────────────────────────────
  // セル間のハンドルをドラッグして隣り合うセルの幅比率を調整する

  const handleResizeStart = (handleIdx: number) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const getX = (ev: MouseEvent | TouchEvent) =>
      "touches" in ev ? ev.touches[0].clientX : ev.clientX

    const startX      = getX(e.nativeEvent as MouseEvent | TouchEvent)
    const startFlexes = [...cellFlexes]
    const totalFlex   = startFlexes.reduce((a, b) => a + b, 0)
    const containerW  = el_tableArea.current?.offsetWidth ?? 800

    const onMove = (ev: MouseEvent | TouchEvent) => {
      ev.preventDefault()
      const dx      = getX(ev) - startX
      const flexDx  = (dx / containerW) * totalFlex
      const next    = [...startFlexes]
      next[handleIdx]     = Math.max(0.15, startFlexes[handleIdx]     + flexDx)
      next[handleIdx + 1] = Math.max(0.15, startFlexes[handleIdx + 1] - flexDx)
      setCellFlexes(next)
    }
    const onEnd = () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup",   onEnd)
      document.removeEventListener("touchmove", onMove)
      document.removeEventListener("touchend",  onEnd)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup",   onEnd)
    document.addEventListener("touchmove", onMove, { passive: false })
    document.addEventListener("touchend",  onEnd)
  }

  // ── DnD セットアップ ──────────────────────────────────
  // イベント委譲：財布とテーブルラッパーで mousedown/touchstart を受け取る
  // body に fixed で持ち上げ → 離した位置の要素を判定 → 移動先に appendChild

  useEffect(() => {
    let dragged: HTMLImageElement | null = null
    let originalParent: HTMLElement | null = null  // ドラッグ元の親要素を記録
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
      if (!target.classList.contains("okane-draggable")) return
      e.preventDefault()

      dragged = target as HTMLImageElement
      originalParent = dragged.parentElement as HTMLElement | null
      const touch = getPoint(e)
      const rect = dragged.getBoundingClientRect()

      // body に移動して position:fixed で追従させる
      document.body.appendChild(dragged)
      dragged.style.position = "fixed"
      dragged.style.zIndex   = "1000"
      dragged.style.left     = rect.left + "px"
      dragged.style.top      = rect.top  + "px"
      dragged.style.width    = rect.width + "px"
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

      // スタイルを元に戻す（width は createCoinImg の初期値に戻す）
      dragged.style.position      = ""
      dragged.style.zIndex        = ""
      dragged.style.left          = ""
      dragged.style.top           = ""
      const restoreIsBill = dragged.getAttribute("data-bill") === "1"
      dragged.style.width         = restoreIsBill ? "80px" : "48px"
      dragged.style.height        = restoreIsBill ? "40px" : "40px"
      dragged.style.objectFit     = "contain"
      dragged.style.pointerEvents = ""

      // 一時的に非表示にして、ドロップ先を特定する
      dragged.style.display = "none"
      const below = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
      // display を "" に戻すと Tailwind preflight の img{display:block} が効いて縦並びになるため inline-block を明示
      dragged.style.display = "inline-block"

      let placed = false
      let droppedToWallet = false

      if (below) {
        // テーブルセルへのドロップ
        const td = (below.classList.contains("okane-droppable") ? below : below.closest(".okane-droppable")) as HTMLElement | null
        if (td) {
          td.appendChild(dragged)
          placed = true
          se.playSe(se.pi)
        }
        // 財布エリアへのドロップ（しまう音）
        else if (below.closest("#okane-wallet")) {
          droppedToWallet = true
          placed = true
          se.playSe(se.cancel)
        }
      }

      // ドロップ失敗 → 財布に戻す扱いにする
      if (!placed) droppedToWallet = true

      // 財布が関わった場合（出た・入った・失敗）は body に残っている dragged を削除してから
      // refillWallet で1種1枚に再描画する
      if (droppedToWallet || originalParent === el_bills.current || originalParent === el_coins.current) {
        if (dragged?.parentElement === document.body) dragged.remove()
        refillWalletRef.current()
      }

      dragged = null
      originalParent = null

      if (!(e as TouchEvent).changedTouches) {
        document.removeEventListener("mousemove", handleMove)
        document.removeEventListener("mouseup",   handleEnd)
      }
    }

    const wallet  = document.getElementById("okane-wallet")
    const wrapper = document.getElementById("okane-table-wrapper")

    wallet?.addEventListener( "mousedown",  handleStart, { passive: false })
    wallet?.addEventListener( "touchstart", handleStart, { passive: false })
    wrapper?.addEventListener("mousedown",  handleStart, { passive: false })
    wrapper?.addEventListener("touchstart", handleStart, { passive: false })
    document.addEventListener("touchmove",  handleMove,  { passive: false })
    document.addEventListener("touchend",   handleEnd,   { passive: false })

    return () => {
      wallet?.removeEventListener( "mousedown",  handleStart)
      wallet?.removeEventListener( "touchstart", handleStart)
      wrapper?.removeEventListener("mousedown",  handleStart)
      wrapper?.removeEventListener("touchstart", handleStart)
      document.removeEventListener("touchmove",  handleMove)
      document.removeEventListener("touchend",   handleEnd)
      document.removeEventListener("mousemove",  handleMove)
      document.removeEventListener("mouseup",    handleEnd)
    }
  }, [])  // DnD はマウント時に1回だけ設定（イベント委譲のため）

  // ── モード切り替え ────────────────────────────────────

  const changeMode = (newMode: Mode) => {
    if (newMode === mode) return
    se.playSe(se.set)
    setMode(newMode)
    clearTable()
    refillWallet()
    narabeyouAns.current = 0
    mondaiAns.current    = 0
    hasAnswered.current  = false
    setHasMondaiProblem(false)
    if (el_kazu.current)   { el_kazu.current.value   = ""; el_kazu.current.style.color = "" }
    if (el_answer.current) { el_answer.current.value = ""; el_answer.current.style.backgroundColor = "" }
    if (el_text.current) {
      const desc: Record<Mode, string> = {
        set:       "きんがくを　セット、または　いくらかを　しらべる",
        narabeyou: "お金を　ならべる　もんだい",
        mondai:    "おかねの　ごうけいを　かぞえる　もんだい",
      }
      el_text.current.innerHTML = desc[newMode]
    }
  }

  // ── セットモード ──────────────────────────────────────

  const handleSet = () => {
    const v = Number(el_kazu.current?.value ?? "")
    if (!el_kazu.current?.value || v < 1 || v > 99999) {
      se.playSe(se.alertSound)
      if (el_text.current) el_text.current.innerHTML = "1〜99999の　すうじを　いれてください。"
      return
    }
    se.playSe(se.set)
    if (el_kazu.current) el_kazu.current.style.color = "blue"
    setAmountToTable(v)
    if (el_text.current) el_text.current.innerHTML = ""
  }

  const handleIkura = () => {
    const total = calcTotal()
    se.playSe(se.seikai1)
    if (el_text.current)
      el_text.current.innerHTML = `<span style="color:red;font-weight:bold;">ごうけい：${total}円</span>`
  }

  const handleResetSet = () => {
    se.playSe(se.reset)
    clearTable()
    refillWallet()
    if (el_kazu.current)  { el_kazu.current.value  = ""; el_kazu.current.style.color = "" }
    if (el_text.current)  el_text.current.innerHTML = ""
  }

  // ── ならべようモード ──────────────────────────────────

  const handleNarabeyouQuestion = () => {
    se.playSe(se.set)
    clearTable()
    refillWallet()
    hasAnswered.current = false
    if (el_text.current) el_text.current.innerHTML = ""

    // 偶数インデックス（万・千・百・十・一）の有効なものごとに 1〜9 の乗数をランダム生成
    // 旧コードと同じロジック: l[i] = Math.floor(Math.random() * 9 + 1)
    let amount = 0
    Q_INDICES.forEach((qi) => {
      if (!activeCoins[qi]) return
      const mult = Math.floor(Math.random() * 9 + 1)
      amount += mult * OKANE[qi].value
    })
    narabeyouAns.current = amount

    if (el_text.current)
      el_text.current.innerHTML =
        `<span style="color:blue;font-size:1.3em;font-weight:bold;">${amount}円</span>　を　ならべよう`
  }

  const handleNarabeyouCheck = () => {
    if (narabeyouAns.current === 0) {
      se.playSe(se.alertSound)
      if (el_text.current) el_text.current.innerHTML = "「もんだい」ボタンを　おしてね。"
      return
    }
    const total = calcTotal()
    if (total === narabeyouAns.current) {
      se.playSe(se.right)
      if (!hasAnswered.current) { addCoins(1); hasAnswered.current = true }
      if (el_text.current)
        el_text.current.innerHTML = `<span style="color:red;font-weight:bold;">せいかい！　${total}円！</span>`
    } else {
      se.playSe(se.alertSound)
      if (el_text.current)
        el_text.current.innerHTML =
          `<span style="color:gray;">ちがうよ。（ならべた：${total}円）</span>`
    }
  }

  // ── もんだいモード ────────────────────────────────────

  const handleMondaiQuestion = () => {
    se.playSe(se.set)
    clearTable()
    refillWallet()
    hasAnswered.current = false
    setHasMondaiProblem(true)
    if (el_answer.current) { el_answer.current.value = ""; el_answer.current.style.backgroundColor = "" }
    if (el_text.current)   el_text.current.innerHTML = "ごうけいは　いくら？"

    // 偶数インデックスの有効なものごとに 1〜9 の乗数で金額を生成（旧コードと同じロジック）
    let amount = 0
    Q_INDICES.forEach((qi) => {
      if (!activeCoins[qi]) return
      const mult = Math.floor(Math.random() * 9 + 1)
      amount += mult * OKANE[qi].value
    })
    mondaiAns.current = amount

    // 生成した金額を分解してテーブルに配置する（旧コードの OkaneSet と同じ）
    setAmountToTable(amount)
  }

  // もんだいモード用テンキー入力ハンドラー（NumPad・キーボード共通）
  const handleMondaiDigit  = (n: number) => {
    if (!el_answer.current) return
    if (el_answer.current.value.length >= 5) return  // 最大5桁（99999円）
    el_answer.current.value += n.toString()
  }
  const handleMondaiDelete = () => {
    if (el_answer.current) el_answer.current.value = el_answer.current.value.slice(0, -1)
  }
  const handleMondaiClear  = () => {
    if (el_answer.current) el_answer.current.value = ""
  }

  // キーボード入力（数字キー → el_answer に蓄積、Enter → 答え合わせ）
  useKeyboardInput({
    onDigit:  handleMondaiDigit,
    onDelete: handleMondaiDelete,
    onClear:  handleMondaiClear,
    onEnter:  () => handleMondaiCheck(),
    enabled:  hasMondaiProblem,
  })

  const handleMondaiCheck = () => {
    const myAnswer = parseInt(el_answer.current?.value ?? "")
    if (isNaN(myAnswer) || !el_answer.current?.value) {
      se.playSe(se.alertSound)
      if (el_text.current) el_text.current.innerHTML = "こたえを　いれてね。"
      return
    }
    const total = calcTotal()
    if (myAnswer === total) {
      se.playSe(se.right)
      if (!hasAnswered.current) { addCoins(1); hasAnswered.current = true }
      if (el_answer.current) el_answer.current.style.backgroundColor = "#bbdefb"
      if (el_text.current)
        el_text.current.innerHTML = `<span style="color:red;font-weight:bold;">せいかい！　${total}円！</span>`
    } else {
      se.playSe(se.alertSound)
      if (el_answer.current) el_answer.current.style.backgroundColor = "#ffcdd2"
      if (el_text.current)
        el_text.current.innerHTML = `<span style="color:gray;">ちがうよ。もう　いちど。</span>`
      setTimeout(() => {
        if (el_answer.current) { el_answer.current.value = ""; el_answer.current.style.backgroundColor = "" }
      }, 1200)
    }
  }

  // ── 描画 ─────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
        💴 おかねのけいさん
      </h1>

      {/* モード選択ボタン */}
      <div className="flex justify-center items-center gap-2 mb-3">
        {(["set", "narabeyou", "mondai"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={`px-4 py-2 rounded-lg font-bold text-sm md:text-base border-2 transition-colors
              ${mode === m
                ? "bg-brand-500 text-white border-brand-600"
                : "bg-white text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
              }`}
          >
            {m === "set" ? "セット" : m === "narabeyou" ? "ならべよう" : "いくらかな"}
          </button>
        ))}
        <span className="text-sm font-bold text-brand-500 whitespace-nowrap">
          ← モードをえらぼう
        </span>
      </div>

      {/* ① メッセージエリア */}
      <div
        ref={el_text}
        className="w-full flex justify-center items-center mb-3
                   min-h-8 py-1 px-3
                   text-black bg-yellow-100
                   text-sm md:text-base font-bold"
      />

      {/* ② チェックボックス（左）＋ ボタン群（右）：横並び */}
      <div className="flex gap-3 mb-3 items-start">

        {/* 左：つかうお金チェックボックス */}
        <div className="flex flex-wrap gap-2 p-3 basis-1/2
                        bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
          <p className="w-full text-xs font-bold text-gray-600 dark:text-gray-300">
            つかう　お金に　チェック
          </p>
          {OKANE.map((coin, i) => (
            <label key={coin.id} className="flex flex-col items-center cursor-pointer gap-0.5">
              <input
                type="checkbox"
                checked={activeCoins[i]}
                onChange={(e) => {
                  se.playSe(se.set)
                  const next = [...activeCoins]
                  next[i] = e.target.checked
                  setActiveCoins(next)
                }}
              />
              <Image
                src={`/images/${coin.id}.png`}
                alt={coin.label}
                width={coin.isBill ? 60 : 36}
                height={coin.isBill ? 30 : 36}
                style={{ objectFit: "contain" }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">{coin.label}</span>
            </label>
          ))}
        </div>

        {/* 右：モード別コントロール */}
        <div className="flex flex-wrap items-center gap-2 p-3 basis-1/2
                        bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600
                        min-h-[80px]">
          {mode === "set" && (<>
            <input
              ref={el_kazu}
              type="number" min={1} max={99999}
              placeholder="きんがく"
              className="border-2 border-gray-300 rounded-lg p-2 w-32 text-center font-bold
                         text-gray-800 dark:text-gray-100 dark:bg-gray-700"
            />
            <span className="font-bold text-gray-700 dark:text-gray-300">円</span>
            <button onClick={handleSet}
              className="px-3 py-2 bg-brand-500 text-white rounded-lg font-bold hover:bg-brand-600 transition-colors"
            >セット</button>
            <button onClick={handleIkura}
              className="px-3 py-2 bg-accent-500 text-white rounded-lg font-bold hover:bg-accent-600 transition-colors"
            >いくら？</button>
            <button onClick={handleResetSet}
              className="px-3 py-2 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition-colors"
            >リセット</button>
          </>)}
          {mode === "narabeyou" && (<>
            <button onClick={handleNarabeyouQuestion}
              className="px-3 py-2 bg-brand-500 text-white rounded-lg font-bold hover:bg-brand-600 transition-colors"
            >もんだい</button>
            <button onClick={handleNarabeyouCheck}
              className="px-3 py-2 bg-accent-500 text-white rounded-lg font-bold hover:bg-accent-600 transition-colors"
            >こたえあわせ</button>
          </>)}
          {mode === "mondai" && (<>
            <button onClick={handleMondaiQuestion}
              className="px-3 py-2 bg-brand-500 text-white rounded-lg font-bold hover:bg-brand-600 transition-colors"
            >もんだい</button>
            <input
              ref={el_answer}
              type="number" min={0} max={99999}
              placeholder="こたえ"
              className="border-2 border-gray-300 rounded-lg p-2 w-28 text-center font-bold
                         text-gray-800 dark:text-gray-100 dark:bg-gray-700"
            />
            <span className="font-bold text-gray-700 dark:text-gray-300">円</span>
            <button onClick={handleMondaiCheck}
              className="px-3 py-2 bg-accent-500 text-white rounded-lg font-bold hover:bg-accent-600 transition-colors"
            >こたえあわせ</button>
          </>)}
        </div>

      </div>

      {/* もんだいモード：NumPad（問題が出ているときのみ表示） */}
      {mode === "mondai" && hasMondaiProblem && (
        <div className="flex justify-center mb-3">
          <NumPad
            onDigit={handleMondaiDigit}
            onDelete={handleMondaiDelete}
            onClear={handleMondaiClear}
          />
        </div>
      )}

      {/* ③ お金を並べるエリア（セル幅をドラッグで変更できる） */}
      <div id="okane-table-wrapper" className="w-full mb-3">
        <div
          ref={el_tableArea}
          className="flex w-full border-2 border-gray-400 bg-yellow-50 dark:bg-yellow-900/20"
          style={{ minHeight: "140px" }}
        >
          {cellFlexes.map((flex, i) => (
            <React.Fragment key={i}>
              <div
                className="okane-droppable px-2 py-1 overflow-hidden"
                style={{ flex, minHeight: "140px", borderRight: i < 4 ? "1px solid #d1d5db" : "none" }}
              />
              {i < 4 && (
                <div
                  className="w-2 flex-shrink-0 bg-gray-200 hover:bg-brand-300 active:bg-brand-500
                             cursor-col-resize select-none"
                  onMouseDown={handleResizeStart(i)}
                  onTouchStart={handleResizeStart(i)}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ④ 財布エリア：さいふ絵 | お札3種 | 硬貨6種 を横一列 */}
      <div
        id="okane-wallet"
        className="flex flex-row items-center gap-3 mb-4 w-full
                   border-2 border-amber-400 rounded-xl p-3
                   bg-amber-50 dark:bg-amber-900/20"
      >
        {/* さいふの絵 */}
        <Image
          src="/images/saifu.png" alt="財布"
          width={72} height={54}
          className="pointer-events-none flex-shrink-0"
        />

        {/* お札エリア（1万・5千・千） */}
        <div
          ref={el_bills}
          className="flex flex-wrap items-center gap-1 min-h-[44px] min-w-[96px]"
        />

        {/* 仕切り */}
        <div className="w-px self-stretch bg-amber-300" />

        {/* 硬貨エリア（500〜1円） */}
        <div
          ref={el_coins}
          className="flex flex-wrap items-center gap-1 min-h-[44px] flex-1"
        />
      </div>

      {/* コイン表示 */}
      <CoinDisplay coins={coins} className="w-full" />

    </div>
  )
}

// ======================================================
// 京都市の11区を覚えよう ページ
//
// URL: /kyoto-ku
// 対象: 3年生（社会科・地域学習）
//
// 操作:
//   右側の区名カードをドラッグして、地図上の正しい位置にドロップ。
//   タップで選択 → 地図上のエリアをタップでも配置可能。
//   ドロップした瞬間に正誤判定（正解なら○、不正解ならバツで戻る）。
//   全問正解で完了。
//
// 実装:
//   地図画像を width:100% で描画し、コンテナの高さを画像に合わせる。
//   ドロップゾーンを % ベースで配置し、画面サイズに依存しない。
// ======================================================

"use client"

import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react"
import Image from "next/image"
import * as se from "@/lib/se"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"

// ── 11区のデータ ────────────────────────────────────────
// left/top: 地図画像（512×512）に対する % 位置
// 元アプリの vw 座標を変換:
//   left% = (ken_left + 2.5) / 50 * 100
//   top%  = (ken_top + 2) / 50 * 100
//   ※ +2 は section(+19) と maru(+17) の差分
const WARDS = [
  // CUD（カラーユニバーサルデザイン）配色: 色覚タイプに依存せず区別しやすい
  { id: 0,  kanji: "右京区",   kana: "うきょうく",     color: "#ff4b00", left: 10, top: 45 },
  { id: 1,  kanji: "左京区",   kana: "さきょうく",     color: "#005aff", left: 49, top: 30 },
  { id: 2,  kanji: "北区",     kana: "きたく",         color: "#fff100", left: 30, top: 50 },
  { id: 3,  kanji: "南区",     kana: "みなみく",       color: "#ff8082", left: 10, top: 90 },
  { id: 4,  kanji: "東山区",   kana: "ひがしやまく",   color: "#03af7a", left: 73, top: 63 },
  { id: 5,  kanji: "伏見区",   kana: "ふしみく",       color: "#4dc4ff", left: 55, top: 90 },
  { id: 6,  kanji: "西京区",   kana: "にしきょうく",   color: "#f6aa00", left: 0,  top: 65 },
  { id: 7,  kanji: "山科区",   kana: "やましなく",     color: "#990099", left: 73, top: 74 },
  { id: 8,  kanji: "上京区",   kana: "かみぎょうく",   color: "#804000", left: 73, top: 34 },
  { id: 9,  kanji: "下京区",   kana: "しもぎょうく",   color: "#c8c800", left: 0,  top: 80 },
  { id: 10, kanji: "中京区",   kana: "なかぎょうく",   color: "#ff87ab", left: 75, top: 50 },
] as const

// ── コンポーネント ───────────────────────────────────────

export default function KyotoKuPage() {
  // ── 状態 ─────────────────────────────────────────────
  // placed[zoneId] = ドロップゾーンに置かれたカードの wardId（null なら空）
  const [placed, setPlaced] = useState<(number | null)[]>(
    () => Array(WARDS.length).fill(null)
  )
  // 判定結果: "correct" | "wrong" | null
  const [results, setResults] = useState<(string | null)[]>(
    () => Array(WARDS.length).fill(null)
  )
  // 右パネルのカード順（シャッフル済み wardId の配列）
  // ※ SSRとクライアントで Math.random() の結果が異なるため、
  //   初期値は固定順にして、マウント後にシャッフルする（hydration mismatch 防止）
  const [cardOrder, setCardOrder] = useState<number[]>(
    () => WARDS.map((_, i) => i)
  )
  // マウント後にシャッフル（hydration mismatch 防止のため useEffect で実行）
  // queueMicrotask で非同期化して react-hooks/set-state-in-effect を回避
  useEffect(() => {
    queueMicrotask(() => {
      const ids = WARDS.map((_, i) => i)
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]]
      }
      setCardOrder(ids)
    })
  }, [])
  // 正解済みのゾーン（コイン重複防止用）
  const [locked, setLocked] = useState<boolean[]>(
    () => Array(WARDS.length).fill(false)
  )
  // 全問正解フラグ
  const [allCorrect, setAllCorrect] = useState(false)

  // コインシステム
  const { coins, addCoins } = useCoins()

  // せいかい演出
  const seikaiRef = useRef<HTMLDivElement>(null)

  // ── ドラッグ中の情報 ─────────────────────────────────
  const dragRef = useRef<{
    wardId: number
    fromZone: number | null  // ゾーンから取り出した場合のゾーンID
  } | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null)

  // ── 選択モード（タップ配置用） ──────────────────────
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  // ── カードが右パネルに残っているか ──────────────────
  const isCardAvailable = useCallback((wardId: number) => {
    return !placed.includes(wardId)
  }, [placed])

  // ── 正誤判定（ドロップ直後に呼ぶ）──────────────────
  const judgeZone = useCallback((zoneId: number, wardId: number) => {
    const isCorrect = zoneId === wardId

    if (isCorrect) {
      // 正解: ゾーンをロック、コイン加算
      setResults(prev => {
        const next = [...prev]
        next[zoneId] = "correct"
        return next
      })
      setLocked(prev => {
        const next = [...prev]
        next[zoneId] = true
        return next
      })
      // コイン加算（ロック済みでなければ）
      if (!locked[zoneId]) {
        addCoins(1)
      }
      // 全問正解チェック → コンプリート音のみ、それ以外は正解音
      const newLocked = [...locked]
      newLocked[zoneId] = true
      if (newLocked.every(Boolean)) {
        setAllCorrect(true)
        se.playSe(se.seikai2)
        if (seikaiRef.current) {
          seikaiRef.current.style.display = "flex"
          setTimeout(() => {
            if (seikaiRef.current) seikaiRef.current.style.display = "none"
          }, 2000)
        }
      } else {
        se.playSe(se.seikai1)
      }
    } else {
      // 不正解: バツ表示 → 1秒後にカードを戻す
      se.playSe(se.alertSound)
      setResults(prev => {
        const next = [...prev]
        next[zoneId] = "wrong"
        return next
      })
      setTimeout(() => {
        setPlaced(prev => {
          const next = [...prev]
          next[zoneId] = null
          return next
        })
        setResults(prev => {
          const next = [...prev]
          next[zoneId] = null
          return next
        })
      }, 800)
    }
  }, [locked, addCoins])

  // ── ゴースト操作 ──────────────────────────────────────
  const showGhost = useCallback((x: number, y: number, wardId: number) => {
    const ghost = ghostRef.current
    if (!ghost) return
    const ward = WARDS[wardId]
    ghost.style.display = "block"
    ghost.style.left = `${x - 40}px`
    ghost.style.top = `${y - 16}px`
    ghost.innerHTML = `<span style="
      display:inline-block; padding:2px 8px;
      background:${ward.color}; color:white;
      border:2px solid rgba(0,0,0,0.3); border-radius:4px;
      font-size:12px; font-weight:bold; white-space:nowrap;
    ">${ward.kanji}</span>`
  }, [])

  const hideGhost = useCallback(() => {
    const ghost = ghostRef.current
    if (ghost) ghost.style.display = "none"
  }, [])

  // ── Pointer Events: ドラッグ ────────────────────────
  // useCallback の循環参照を避けるため、move/up ハンドラーを ref で管理する
  const lockedRef = useRef(locked)
  const judgeZoneRef = useRef(judgeZone)
  useLayoutEffect(() => {
    lockedRef.current = locked
    judgeZoneRef.current = judgeZone
  })

  const handlersRef = useRef<{
    move: (e: PointerEvent) => void
    up: (e: PointerEvent) => void
  } | null>(null)

  // ドラッグ開始時にハンドラーを生成・登録する共通関数
  const startDrag = useCallback((wardId: number, fromZone: number | null, x: number, y: number) => {
    dragRef.current = { wardId, fromZone }
    showGhost(x, y, wardId)

    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return
      showGhost(e.clientX, e.clientY, dragRef.current.wardId)
    }

    const onUp = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      dragRef.current = null
      hideGhost()

      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
      handlersRef.current = null

      // ドロップ先を探す
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const dropZone = el?.closest("[data-drop-zone]") as HTMLElement | null

      if (dropZone) {
        const zoneId = parseInt(dropZone.dataset.dropZone!, 10)

        // ロック済みのゾーンには置けない
        if (lockedRef.current[zoneId]) return

        se.playSe(se.pi)

        // 元のゾーンからの移動を処理
        if (drag.fromZone !== null) {
          setPlaced(prev => {
            const next = [...prev]
            next[drag.fromZone!] = null
            return next
          })
        }

        // ドロップ先に配置
        setPlaced(prev => {
          const next = [...prev]
          next[zoneId] = drag.wardId
          return next
        })

        // 即時判定
        setTimeout(() => judgeZoneRef.current(zoneId, drag.wardId), 100)
      } else if (drag.fromZone !== null) {
        // ゾーン外にドロップ → 元のゾーンから戻す
        se.playSe(se.cancel)
        setPlaced(prev => {
          const next = [...prev]
          next[drag.fromZone!] = null
          return next
        })
      }
    }

    handlersRef.current = { move: onMove, up: onUp }
    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }, [showGhost, hideGhost])

  // カードパネルからドラッグ開始
  const startCardDrag = useCallback((e: React.PointerEvent, wardId: number) => {
    e.preventDefault()
    setSelectedCard(wardId)
    startDrag(wardId, null, e.clientX, e.clientY)
  }, [startDrag])

  // ドロップゾーン上のカードをドラッグ開始（移動）
  const startZoneDrag = useCallback((e: React.PointerEvent, zoneId: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (locked[zoneId]) return
    const wardId = placed[zoneId]
    if (wardId === null) return
    startDrag(wardId, zoneId, e.clientX, e.clientY)
  }, [placed, locked, startDrag])

  // ドロップゾーンをタップ（選択中のカードを配置）
  const handleZoneTap = useCallback((zoneId: number) => {
    if (locked[zoneId]) return
    if (selectedCard === null) return
    if (!isCardAvailable(selectedCard)) {
      setSelectedCard(null)
      return
    }
    se.playSe(se.pi)
    setPlaced(prev => {
      const next = [...prev]
      next[zoneId] = selectedCard
      return next
    })
    setSelectedCard(null)
    // 即時判定
    setTimeout(() => judgeZone(zoneId, selectedCard), 100)
  }, [selectedCard, locked, isCardAvailable, judgeZone])

  // ── リセット ──────────────────────────────────────────
  const handleReset = useCallback(() => {
    se.playSe(se.reset)
    setPlaced(Array(WARDS.length).fill(null))
    setResults(Array(WARDS.length).fill(null))
    setLocked(Array(WARDS.length).fill(false))
    setAllCorrect(false)
    setSelectedCard(null)
    // 再シャッフル
    const ids = WARDS.map((_, i) => i)
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]]
    }
    setCardOrder(ids)
  }, [])

  // ── 正解数 ────────────────────────────────────────────
  const correctCount = locked.filter(Boolean).length

  // ── JSX ────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 mb-2">
        🗾 京都市の11区をおぼえよう
      </h1>

      {/* スコア */}
      <p className="text-sm text-center text-gray-500 mb-3">
        {allCorrect
          ? <span className="text-red-500 font-bold">ぜんもんせいかい！🎉</span>
          : `カードをドラッグして正しい場所に置こう（${correctCount} / ${WARDS.length}）`
        }
      </p>

      {/* メインエリア: 地図 + カードパネル */}
      <div className="flex gap-3 items-start justify-center">

        {/* ── 地図コンテナ ────────────────────────────── */}
        {/* Image を width:100% で描画し、コンテナ高さを画像に合わせる。
            ドロップゾーンは % 指定なので画像と完全に連動する */}
        <div
          className="relative shrink-0"
          style={{ width: "min(55vw, 440px)" }}
        >
          <Image
            src="/images/kyoutoshi.png"
            alt="京都市の地図"
            width={512}
            height={512}
            className="w-full h-auto block"
            draggable={false}
            priority
          />

          {/* ドロップゾーン（11区分） */}
          {WARDS.map((ward, i) => {
            const placedWardId = placed[i]
            const placedWard = placedWardId !== null ? WARDS[placedWardId] : null
            const result = results[i]
            const isLocked = locked[i]

            return (
              <div
                key={ward.id}
                data-drop-zone={i}
                className={`absolute flex items-center justify-center
                  rounded cursor-pointer transition-all text-center
                  ${isLocked
                    ? "border-2 border-red-400 ring-2 ring-red-300"
                    : result === "wrong"
                      ? "border-2 border-yellow-400 bg-yellow-50/90 animate-shake"
                      : selectedCard !== null && !placedWard
                        ? "border-2 border-blue-400 bg-blue-50/80 animate-pulse"
                        : "border-2 border-gray-400 bg-white/80 hover:bg-white/90"
                  }`}
                style={{
                  left: `${ward.left}%`,
                  top: `${ward.top}%`,
                  width: "clamp(50px, 16%, 80px)",
                  height: "clamp(20px, 7%, 32px)",
                  zIndex: 10,
                  backgroundColor: placedWard
                    ? isLocked
                      ? `${placedWard.color}dd`
                      : `${placedWard.color}aa`
                    : undefined,
                }}
                onClick={() => {
                  if (isLocked || placedWardId !== null) return
                  handleZoneTap(i)
                }}
                onPointerDown={(e) => {
                  if (placedWardId !== null && !isLocked) {
                    startZoneDrag(e, i)
                  }
                }}
              >
                {placedWard ? (
                  <span className="text-white font-bold drop-shadow-sm"
                    style={{ fontSize: "clamp(8px, 2.2vw, 12px)" }}>
                    {placedWard.kanji}
                  </span>
                ) : (
                  <span className="text-gray-400"
                    style={{ fontSize: "clamp(8px, 2.2vw, 11px)" }}>
                    ?
                  </span>
                )}

                {/* 正解マーク */}
                {isLocked && (
                  <span className="absolute -top-2 -right-2 text-red-500 font-bold text-base">○</span>
                )}
                {/* 不正解マーク */}
                {result === "wrong" && (
                  <span className="absolute -top-2 -right-2 text-yellow-500 font-bold text-base">×</span>
                )}
              </div>
            )
          })}
        </div>

        {/* ── カードパネル（右側）──────────────────────── */}
        <div className="flex flex-col gap-1.5 min-w-[80px]">
          {/* カード一覧 */}
          {cardOrder.map(wardId => {
            const ward = WARDS[wardId]
            const available = isCardAvailable(wardId)
            if (!available) return null
            return (
              <div
                key={wardId}
                className={`px-2 py-1 rounded border-2 cursor-grab select-none
                  text-center transition-all active:scale-95
                  ${selectedCard === wardId
                    ? "border-blue-500 bg-blue-100 ring-2 ring-blue-300"
                    : "border-gray-300 bg-amber-50 hover:bg-amber-100"
                  }`}
                style={{ touchAction: "none" }}
                onPointerDown={(e) => startCardDrag(e, wardId)}
                onClick={() => setSelectedCard(
                  selectedCard === wardId ? null : wardId
                )}
              >
                <div className="font-bold text-xs leading-tight">{ward.kanji}</div>
                <div className="text-gray-500" style={{ fontSize: "10px" }}>{ward.kana}</div>
              </div>
            )
          })}

          {/* リセットボタン */}
          <button
            onClick={handleReset}
            className="mt-2 px-3 py-1.5 text-xs font-bold rounded border-2 transition-colors
              active:translate-y-0.5
              bg-danger-400 hover:bg-danger-500 active:bg-danger-600
              text-white border-danger-400"
          >
            リセット
          </button>
        </div>
      </div>

      {/* コイン表示 */}
      <CoinDisplay coins={coins} />

      {/* せいかい演出 */}
      <div
        ref={seikaiRef}
        className="fixed inset-0 z-50 items-center justify-center pointer-events-none"
        style={{ display: "none" }}
      >
        <div className="text-5xl md:text-7xl font-bold text-red-500 animate-bounce
          drop-shadow-lg bg-white/80 px-8 py-4 rounded-2xl">
          せいかい！🎉
        </div>
      </div>

      {/* ゴースト要素 */}
      <div
        ref={ghostRef}
        style={{
          display: "none",
          position: "fixed",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0.85,
        }}
      />
    </div>
  )
}

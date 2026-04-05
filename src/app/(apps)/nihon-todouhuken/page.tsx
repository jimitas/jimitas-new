// ======================================================
// 日本の都道府県を覚えよう ページ
//
// URL: /nihon-todouhuken
// 対象: 4年生（社会科）
//
// 操作:
//   カードパネルの都道府県名カードをドラッグして、
//   地図上の番号付きドロップゾーンに配置する。
//   タップで選択 → ゾーンタップでも配置可能。
//   ドロップした瞬間に正誤判定（正解なら○、不正解ならバツで戻る）。
//
// レイアウト:
//   元アプリと同様に、地方ごとに列で整列したドロップゾーンを
//   地図上に配置。kyoto-ku のような個別座標ではなく列ベース。
//   右列=北海道+東北+関東、左列=九州・沖縄。
// ======================================================

"use client"

import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react"
import Image from "next/image"
import * as se from "@/lib/se"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"

// ── 地方の定義 ─────────────────────────────────────────
// CUD（カラーユニバーサルデザイン）配色
const REGIONS = {
  hokkaido: { name: "北海道",     color: "#990099" },
  tohoku:   { name: "東北",       color: "#4dc4ff" },
  kanto:    { name: "関東",       color: "#03af7a" },
  chubu:    { name: "中部",       color: "#c8c800" },
  kinki:    { name: "近畿",       color: "#f6aa00" },
  chugoku:  { name: "中国",       color: "#ff4b00" },
  shikoku:  { name: "四国",       color: "#ff87ab" },
  kyushu:   { name: "九州・沖縄", color: "#ff8082" },
} as const

type RegionKey = keyof typeof REGIONS

// ── 47都道府県データ ──────────────────────────────────────
// id は0始まり（表示番号は id + 1）
const PREFS: {
  id: number
  kanji: string
  kana: string
  region: RegionKey
}[] = [
  // ── 北海道（id:0） ──
  { id: 0,  kanji: "北海道",   kana: "ほっかいどう",   region: "hokkaido" },
  // ── 東北（id:1〜6） ──
  { id: 1,  kanji: "青森県",   kana: "あおもりけん",   region: "tohoku" },
  { id: 2,  kanji: "岩手県",   kana: "いわてけん",     region: "tohoku" },
  { id: 3,  kanji: "宮城県",   kana: "みやぎけん",     region: "tohoku" },
  { id: 4,  kanji: "秋田県",   kana: "あきたけん",     region: "tohoku" },
  { id: 5,  kanji: "山形県",   kana: "やまがたけん",   region: "tohoku" },
  { id: 6,  kanji: "福島県",   kana: "ふくしまけん",   region: "tohoku" },
  // ── 関東（id:7〜13） ──
  { id: 7,  kanji: "茨城県",   kana: "いばらきけん",   region: "kanto" },
  { id: 8,  kanji: "栃木県",   kana: "とちぎけん",     region: "kanto" },
  { id: 9,  kanji: "群馬県",   kana: "ぐんまけん",     region: "kanto" },
  { id: 10, kanji: "埼玉県",   kana: "さいたまけん",   region: "kanto" },
  { id: 11, kanji: "千葉県",   kana: "ちばけん",       region: "kanto" },
  { id: 12, kanji: "東京都",   kana: "とうきょうと",   region: "kanto" },
  { id: 13, kanji: "神奈川県", kana: "かながわけん",   region: "kanto" },
  // ── 中部（id:14〜22） ──
  { id: 14, kanji: "新潟県",   kana: "にいがたけん",   region: "chubu" },
  { id: 15, kanji: "富山県",   kana: "とやまけん",     region: "chubu" },
  { id: 16, kanji: "石川県",   kana: "いしかわけん",   region: "chubu" },
  { id: 17, kanji: "福井県",   kana: "ふくいけん",     region: "chubu" },
  { id: 18, kanji: "山梨県",   kana: "やまなしけん",   region: "chubu" },
  { id: 19, kanji: "長野県",   kana: "ながのけん",     region: "chubu" },
  { id: 20, kanji: "岐阜県",   kana: "ぎふけん",       region: "chubu" },
  { id: 21, kanji: "静岡県",   kana: "しずおかけん",   region: "chubu" },
  { id: 22, kanji: "愛知県",   kana: "あいちけん",     region: "chubu" },
  // ── 近畿（id:23〜29） ──
  { id: 23, kanji: "三重県",   kana: "みえけん",       region: "kinki" },
  { id: 24, kanji: "滋賀県",   kana: "しがけん",       region: "kinki" },
  { id: 25, kanji: "京都府",   kana: "きょうとふ",     region: "kinki" },
  { id: 26, kanji: "大阪府",   kana: "おおさかふ",     region: "kinki" },
  { id: 27, kanji: "兵庫県",   kana: "ひょうごけん",   region: "kinki" },
  { id: 28, kanji: "奈良県",   kana: "ならけん",       region: "kinki" },
  { id: 29, kanji: "和歌山県", kana: "わかやまけん",   region: "kinki" },
  // ── 中国（id:30〜34） ──
  { id: 30, kanji: "鳥取県",   kana: "とっとりけん",   region: "chugoku" },
  { id: 31, kanji: "島根県",   kana: "しまねけん",     region: "chugoku" },
  { id: 32, kanji: "岡山県",   kana: "おかやまけん",   region: "chugoku" },
  { id: 33, kanji: "広島県",   kana: "ひろしまけん",   region: "chugoku" },
  { id: 34, kanji: "山口県",   kana: "やまぐちけん",   region: "chugoku" },
  // ── 四国（id:35〜38） ──
  { id: 35, kanji: "徳島県",   kana: "とくしまけん",   region: "shikoku" },
  { id: 36, kanji: "香川県",   kana: "かがわけん",     region: "shikoku" },
  { id: 37, kanji: "愛媛県",   kana: "えひめけん",     region: "shikoku" },
  { id: 38, kanji: "高知県",   kana: "こうちけん",     region: "shikoku" },
  // ── 九州・沖縄（id:39〜46） ──
  { id: 39, kanji: "福岡県",   kana: "ふくおかけん",   region: "kyushu" },
  { id: 40, kanji: "佐賀県",   kana: "さがけん",       region: "kyushu" },
  { id: 41, kanji: "長崎県",   kana: "ながさきけん",   region: "kyushu" },
  { id: 42, kanji: "熊本県",   kana: "くまもとけん",   region: "kyushu" },
  { id: 43, kanji: "大分県",   kana: "おおいたけん",   region: "kyushu" },
  { id: 44, kanji: "宮崎県",   kana: "みやざきけん",   region: "kyushu" },
  { id: 45, kanji: "鹿児島県", kana: "かごしまけん",   region: "kyushu" },
  { id: 46, kanji: "沖縄県",   kana: "おきなわけん",   region: "kyushu" },
]

const N = PREFS.length // 47

// ── 列レイアウト定義 ──────────────────────────────────────
// 元アプリと同様に、地方ごとの列でドロップゾーンを整列配置。
// left: 列の左端（% of 地図コンテナ幅）
// topStart: 列の最初のゾーンの上端（%）
// prefIds: この列に含まれる都道府県ID（上から順）
//
// ※ 微調整するときはここの left / topStart を変更する
const COLUMNS = [
  { prefIds: [39, 40, 41, 42, 43, 44, 45, 46],                           left: 1,  topStart: 14 }, // 九州・沖縄（8）
  { prefIds: [30, 31, 32, 33, 34, 35, 36, 37, 38],                       left: 15, topStart: 14 }, // 中国・四国（9）
  { prefIds: [23, 24, 25, 26, 27, 28, 29],                               left: 29, topStart: 14 }, // 近畿（7）
  { prefIds: [14, 15, 16, 17, 18, 19, 20, 21, 22],                       left: 71, topStart: 27 }, // 中部（9）
  { prefIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],            left: 85, topStart: 18 }, // 北海道+東北+関東（14）
]
// ゾーン1個の % サイズと行間隔
const ZONE_W = 13   // ゾーン幅 (%)
const ZONE_H = 4.2  // ゾーン高さ (%)
const ROW_STEP = 5  // 行送り (%)（高さ + 余白）

// prefId → { left, top } の位置テーブルを事前計算
const ZONE_POS: Record<number, { left: number; top: number }> = {}
for (const col of COLUMNS) {
  col.prefIds.forEach((pid, rowIdx) => {
    ZONE_POS[pid] = {
      left: col.left,
      top: col.topStart + rowIdx * ROW_STEP,
    }
  })
}

// ── コンポーネント ───────────────────────────────────────

export default function NihonTodouhukenPage() {
  // ── 状態 ─────────────────────────────────────────────
  // placed[zoneId] = ドロップゾーンに置かれたカードの prefId（null なら空）
  const [placed, setPlaced] = useState<(number | null)[]>(
    () => Array(N).fill(null)
  )
  // 判定結果: "correct" | "wrong" | null
  const [results, setResults] = useState<(string | null)[]>(
    () => Array(N).fill(null)
  )
  // カード順（シャッフル済み prefId の配列）
  // ※ hydration mismatch 防止: 初期値は固定順、マウント後にシャッフル
  const [cardOrder, setCardOrder] = useState<number[]>(
    () => PREFS.map((_, i) => i)
  )
  // マウント後にシャッフル（hydration mismatch 防止のため useEffect で実行）
  // queueMicrotask で非同期化して react-hooks/set-state-in-effect を回避
  useEffect(() => {
    queueMicrotask(() => {
      const ids = PREFS.map((_, i) => i)
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]]
      }
      setCardOrder(ids)
    })
  }, [])
  // 正解済みのゾーン（コイン重複防止用）
  const [locked, setLocked] = useState<boolean[]>(
    () => Array(N).fill(false)
  )
  // 全問正解フラグ
  const [allCorrect, setAllCorrect] = useState(false)

  // コインシステム
  const { coins, addCoins } = useCoins()

  // せいかい演出
  const seikaiRef = useRef<HTMLDivElement>(null)

  // ── ドラッグ中の情報 ─────────────────────────────────
  const dragRef = useRef<{
    prefId: number
    fromZone: number | null  // ゾーンから取り出した場合のゾーンID
  } | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null)

  // ── 選択モード（タップ配置用） ──────────────────────
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  // ── カードがカードパネルに残っているか ──────────────
  const isCardAvailable = useCallback((prefId: number) => {
    return !placed.includes(prefId)
  }, [placed])

  // ── 正誤判定（ドロップ直後に呼ぶ）──────────────────
  const judgeZone = useCallback((zoneId: number, prefId: number) => {
    const isCorrect = zoneId === prefId

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
      // 不正解: バツ表示 → 0.8秒後にカードを戻す
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
  const showGhost = useCallback((x: number, y: number, prefId: number) => {
    const ghost = ghostRef.current
    if (!ghost) return
    const pref = PREFS[prefId]
    const color = REGIONS[pref.region].color
    ghost.style.display = "block"
    ghost.style.left = `${x - 36}px`
    ghost.style.top = `${y - 14}px`
    ghost.innerHTML = `<span style="
      display:inline-block; padding:1px 6px;
      background:${color}; color:white;
      border:2px solid rgba(0,0,0,0.3); border-radius:4px;
      font-size:11px; font-weight:bold; white-space:nowrap;
    ">${pref.kanji}</span>`
  }, [])

  const hideGhost = useCallback(() => {
    const ghost = ghostRef.current
    if (ghost) ghost.style.display = "none"
  }, [])

  // ── Pointer Events: ドラッグ ────────────────────────
  // useCallback の循環参照を避けるため、最新値を ref で保持
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
  const startDrag = useCallback((prefId: number, fromZone: number | null, x: number, y: number) => {
    dragRef.current = { prefId, fromZone }
    showGhost(x, y, prefId)

    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return
      showGhost(e.clientX, e.clientY, dragRef.current.prefId)
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
          next[zoneId] = drag.prefId
          return next
        })

        // 即時判定
        setTimeout(() => judgeZoneRef.current(zoneId, drag.prefId), 100)
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
  const startCardDrag = useCallback((e: React.PointerEvent, prefId: number) => {
    e.preventDefault()
    setSelectedCard(prefId)
    startDrag(prefId, null, e.clientX, e.clientY)
  }, [startDrag])

  // ドロップゾーン上のカードをドラッグ開始（移動）
  const startZoneDrag = useCallback((e: React.PointerEvent, zoneId: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (locked[zoneId]) return
    const prefId = placed[zoneId]
    if (prefId === null) return
    startDrag(prefId, zoneId, e.clientX, e.clientY)
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

  // ── リセット（2段階確認）──────────────────────────────
  const [confirmReset, setConfirmReset] = useState(false)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleResetClick = useCallback(() => {
    if (!confirmReset) {
      // 1回目: 確認状態にする（3秒で自動キャンセル）
      se.playSe(se.alertSound)
      setConfirmReset(true)
      confirmTimer.current = setTimeout(() => setConfirmReset(false), 3000)
      return
    }
    // 2回目: 実際にリセット
    if (confirmTimer.current) clearTimeout(confirmTimer.current)
    setConfirmReset(false)
    se.playSe(se.reset)
    setPlaced(Array(N).fill(null))
    setResults(Array(N).fill(null))
    setLocked(Array(N).fill(false))
    setAllCorrect(false)
    setSelectedCard(null)
    // 再シャッフル
    const ids = PREFS.map((_, i) => i)
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]]
    }
    setCardOrder(ids)
  }, [confirmReset])

  // ── 正解数 ────────────────────────────────────────────
  const correctCount = locked.filter(Boolean).length

  // ── JSX ────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 mb-2">
        🗾 日本の都道府県をおぼえよう
      </h1>

      {/* スコア */}
      <p className="text-sm text-center text-gray-500 mb-3">
        {allCorrect
          ? <span className="text-red-500 font-bold">ぜんもんせいかい！🎉</span>
          : `カードをドラッグして番号の場所に置こう（${correctCount} / ${N}）`
        }
      </p>

      {/* メインエリア: 地図（ドロップゾーン付き） + カードパネル */}
      <div className="flex flex-col md:flex-row gap-3 items-start justify-center">

        {/* ── 地図コンテナ（ドロップゾーン列を重ねる）──── */}
        <div
          className="relative shrink-0 mx-auto md:mx-0"
          style={{ width: "min(65vw, 500px)" }}
        >
          <Image
            src="/images/nihon.png"
            alt="日本地図"
            width={512}
            height={512}
            className="w-full h-auto block"
            draggable={false}
            priority
          />

          {/* ドロップゾーン: 列ごとにまとめて配置 */}
          {COLUMNS.map((col, colIdx) =>
            col.prefIds.map((prefId, rowIdx) => {
              const pos = ZONE_POS[prefId]
              const placedPrefId = placed[prefId]
              const placedPref = placedPrefId !== null ? PREFS[placedPrefId] : null
              const result = results[prefId]
              const isLocked = locked[prefId]
              const color = placedPref
                ? REGIONS[placedPref.region].color
                : REGIONS[PREFS[prefId].region].color

              return (
                <div
                  key={`${colIdx}-${rowIdx}`}
                  data-drop-zone={prefId}
                  className={`absolute flex items-center justify-center
                    rounded cursor-pointer transition-all text-center
                    ${isLocked
                      ? "border-2 border-red-400 ring-2 ring-red-300"
                      : result === "wrong"
                        ? "border-2 border-yellow-400 bg-yellow-50/90"
                        : "border-2 border-gray-700"
                    }`}
                  style={{
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                    width: `${ZONE_W}%`,
                    height: `${ZONE_H}%`,
                    zIndex: 10,
                    backgroundColor: placedPref
                      ? isLocked ? `${color}dd` : `${color}aa`
                      : `${color}33`,
                  }}
                  onClick={() => {
                    if (isLocked || placedPrefId !== null) return
                    handleZoneTap(prefId)
                  }}
                  onPointerDown={(e) => {
                    if (placedPrefId !== null && !isLocked) {
                      startZoneDrag(e, prefId)
                    }
                  }}
                >
                  {placedPref ? (
                    // カードが置かれている状態: 都道府県名を表示
                    <span className="text-white font-bold drop-shadow-sm"
                      style={{ fontSize: "clamp(6px, 1.8vw, 11px)" }}>
                      {placedPref.kanji}
                    </span>
                  ) : (
                    // 空の状態: 番号を表示
                    <span className="text-white/80 font-bold"
                      style={{ fontSize: "clamp(7px, 1.8vw, 11px)" }}>
                      {prefId + 1}
                    </span>
                  )}

                  {/* 正解マーク ○ */}
                  {isLocked && (
                    <span className="absolute -top-2 -right-2 font-black text-red-500 drop-shadow"
                      style={{ fontSize: "clamp(14px, 3vw, 20px)", WebkitTextStroke: "1px darkred" }}>○</span>
                  )}
                  {/* 不正解マーク × */}
                  {result === "wrong" && (
                    <span className="absolute -top-1.5 -right-1.5 text-yellow-500 font-bold text-xs">×</span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* ── カードパネル（右側 / モバイルでは下）──── */}
        <div className="w-full md:w-auto md:max-h-[520px] md:overflow-y-auto">
          {/* カード一覧（3列グリッド） */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-1">
            {cardOrder.map(prefId => {
              const pref = PREFS[prefId]
              const available = isCardAvailable(prefId)
              if (!available) return null
              const regionColor = REGIONS[pref.region].color
              return (
                <div
                  key={prefId}
                  className={`px-1.5 py-0.5 rounded border-2 cursor-grab select-none
                    text-center transition-all active:scale-95
                    ${selectedCard === prefId
                      ? "border-blue-500 bg-blue-100 ring-2 ring-blue-300"
                      : "border-gray-300 hover:border-gray-400"
                    }`}
                  style={{
                    touchAction: "none",
                    backgroundColor: selectedCard === prefId ? undefined : `${regionColor}22`,
                  }}
                  onPointerDown={(e) => startCardDrag(e, prefId)}
                  onClick={() => setSelectedCard(
                    selectedCard === prefId ? null : prefId
                  )}
                >
                  <div className="font-bold leading-tight"
                    style={{ fontSize: "clamp(9px, 2vw, 12px)" }}>
                    {pref.kanji}
                  </div>
                  <div className="text-gray-500"
                    style={{ fontSize: "clamp(7px, 1.5vw, 9px)" }}>
                    {pref.kana}
                  </div>
                </div>
              )
            })}
          </div>

          {/* リセットボタン（2段階確認） */}
          <button
            onClick={handleResetClick}
            className={`mt-2 w-full px-3 py-1.5 text-xs font-bold rounded border-2 transition-colors
              active:translate-y-0.5
              ${confirmReset
                ? "border-red-400 bg-red-500 text-white"
                : "border-warm-300 bg-white text-warm-600 hover:bg-warm-500 hover:text-white"
              }`}
          >
            {confirmReset ? "ほんとうにリセットする？" : "リセット"}
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

      {/* ゴースト要素（ドラッグ中に指に追従する表示） */}
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

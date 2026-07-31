// ======================================================
// 夏の星 ページ
//
// URL: /natsu-no-hoshi
// 対象: 4年生（理科「夏の星」）
//
// 3つのモード:
//   さがそう … 星をタップして名前・明るさ・色を調べる
//   うごき   … 時こくを動かして、星が東から西へ動くのを見る
//   むすぼう … 星の名前カードを正しい星にドラッグするクイズ
//
// 星の位置は、実際の赤経・赤緯（src/data/summerStars.ts）から
// 京都・その日時の高度と方位を計算して描いている（src/lib/starPosition.ts）。
// そのため「時こくを進めると星が動く」「9月は同じ時こくでも西寄り」が
// すべて本物どおりになる。
//
// 空の描き方:
//   地面に寝ころんで見上げた図。円の中心が真上（天頂）、ふちが地平線。
//   見上げているので東西は地図と逆で、東が左・西が右になる。
// ======================================================

"use client"

import { useState, useRef, useMemo, useCallback, useEffect, useLayoutEffect } from "react"
import * as se from "@/lib/se"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { toHorizontal, toScreen, jstDate } from "@/lib/starPosition"
import {
  STARS, STAR_BY_ID, STAR_COLOR_HEX, CONSTELLATIONS,
  SUMMER_TRIANGLE, QUIZ_STAR_IDS, magToRadius,
} from "@/data/summerStars"

// ── 描画の基準になる数値 ──────────────────────────────
// SVG の内部座標。実際の表示サイズは CSS 側で決まる
const VIEW = 560       // viewBox の一辺
const CX = 280         // 円の中心X（＝天頂）
const CY = 280         // 円の中心Y
const R = 245          // 地平線までの半径

// 年は固定でよい（同じ月日・時こくなら、年がちがっても星の位置はほぼ変わらない）
const YEAR = 2026

// ── 日付プリセット ────────────────────────────────────
const DATE_PRESETS = [
  { id: "jul", label: "7月20日", month: 7,  day: 20, note: "夏休みのはじめ" },
  { id: "aug", label: "8月15日", month: 8,  day: 15, note: "お盆のころ" },
  { id: "sep", label: "9月10日", month: 9,  day: 10, note: "2学期のはじめ" },
] as const

// 時こくスライダーの範囲（分）19:00 〜 翌1:00
const MIN_TIME = 19 * 60
const MAX_TIME = 25 * 60

// クイズは空が動くと困るので、5つの星が全部出ている日時に固定する
const QUIZ_DATE = jstDate(YEAR, 8, 15, 21)

type Mode = "sagasou" | "ugoki" | "musubou"

/** 分 → 「21:30」「翌0:10」のような表示 */
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const mm = String(m).padStart(2, "0")
  return h >= 24 ? `翌${h - 24}:${mm}` : `${h}:${mm}`
}

export default function NatsuNoHoshiPage() {
  // ── 状態 ─────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("sagasou")
  const [dateIdx, setDateIdx] = useState(1)          // 初期値は 8月15日
  const [minutes, setMinutes] = useState(21 * 60)    // 初期値は 21:00
  const [showLines, setShowLines] = useState(true)   // 星座線
  const [showTriangle, setShowTriangle] = useState(true) // 夏の大三角
  const [selectedStarId, setSelectedStarId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)  // 時こくの自動再生

  const { coins, addCoins } = useCoins()
  const seikaiRef = useRef<HTMLDivElement>(null)

  // ── 星の画面位置を計算する ───────────────────────────
  // モードで使う日時が変わる（クイズだけ固定）
  const preset = DATE_PRESETS[dateIdx]
  const date = useMemo(() => {
    if (mode === "musubou") return QUIZ_DATE
    // 時（hour）を0にして分だけ渡すと、25:00 のような値も正しく翌日になる
    return jstDate(YEAR, preset.month, preset.day, 0, minutes)
  }, [mode, preset.month, preset.day, minutes])

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; alt: number }>()
    for (const s of STARS) {
      const hz = toHorizontal(s.ra, s.dec, date)
      const p = toScreen(hz, CX, CY, R)
      map.set(s.id, { x: p.x, y: p.y, alt: hz.alt })
    }
    return map
  }, [date])

  /** 地平線より上に出ている星だけ位置を返す（沈んでいる星は描かない）*/
  const visible = useCallback((id: string) => {
    const p = positions.get(id)
    return p && p.alt >= 0 ? p : null
  }, [positions])

  // ── 時こくの自動再生 ─────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setMinutes(prev => {
        if (prev >= MAX_TIME) {
          setIsPlaying(false)
          return MAX_TIME
        }
        return prev + 5
      })
    }, 120)
    return () => clearInterval(timer)
  }, [isPlaying])

  // モードを変えたら自動再生は止める
  const changeMode = useCallback((m: Mode) => {
    setIsPlaying(false)
    setMode(m)
  }, [])

  // ══════════════════════════════════════════════════════
  // 【むすぼう】クイズ
  // ══════════════════════════════════════════════════════

  // placed[i] … i番目の星（QUIZ_STAR_IDS[i]）に置かれたカードの番号
  const [placed, setPlaced] = useState<(number | null)[]>(
    () => Array(QUIZ_STAR_IDS.length).fill(null)
  )
  const [results, setResults] = useState<(string | null)[]>(
    () => Array(QUIZ_STAR_IDS.length).fill(null)
  )
  const [locked, setLocked] = useState<boolean[]>(
    () => Array(QUIZ_STAR_IDS.length).fill(false)
  )
  const [cardOrder, setCardOrder] = useState<number[]>(
    () => QUIZ_STAR_IDS.map((_, i) => i)
  )
  const [allCorrect, setAllCorrect] = useState(false)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  // マウント後にシャッフル（サーバーとクライアントで結果がずれないようにするため）
  useEffect(() => {
    queueMicrotask(() => setCardOrder(shuffledIndexes()))
  }, [])

  /** 正誤判定（ドロップ直後に呼ぶ）*/
  const judge = useCallback((zoneIdx: number, cardIdx: number) => {
    if (zoneIdx === cardIdx) {
      // 正解
      setResults(prev => { const n = [...prev]; n[zoneIdx] = "correct"; return n })
      setLocked(prev => { const n = [...prev]; n[zoneIdx] = true; return n })
      if (!locked[zoneIdx]) addCoins(1)

      const newLocked = [...locked]
      newLocked[zoneIdx] = true
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
      // 不正解 → 少し見せてからカードを戻す
      se.playSe(se.alertSound)
      setResults(prev => { const n = [...prev]; n[zoneIdx] = "wrong"; return n })
      setTimeout(() => {
        setPlaced(prev => { const n = [...prev]; n[zoneIdx] = null; return n })
        setResults(prev => { const n = [...prev]; n[zoneIdx] = null; return n })
      }, 800)
    }
  }, [locked, addCoins])

  // ── ドラッグ（Pointer Events）────────────────────────
  const dragRef = useRef<{ cardIdx: number } | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  // ハンドラーの中から最新の state を見るための ref
  const lockedRef = useRef(locked)
  const judgeRef = useRef(judge)
  useLayoutEffect(() => {
    lockedRef.current = locked
    judgeRef.current = judge
  })

  const showGhost = useCallback((x: number, y: number, cardIdx: number) => {
    const ghost = ghostRef.current
    if (!ghost) return
    const name = STAR_BY_ID[QUIZ_STAR_IDS[cardIdx]].name
    ghost.style.display = "block"
    ghost.style.left = `${x - 40}px`
    ghost.style.top = `${y - 18}px`
    // innerHTML で作る要素は Tailwind が効かないのでインラインスタイルで書く
    ghost.innerHTML = `<span style="
      display:inline-block; padding:4px 10px;
      background:#1e293b; color:#fff;
      border:2px solid #fbbf24; border-radius:8px;
      font-size:13px; font-weight:bold; white-space:nowrap;
    ">${name}</span>`
  }, [])

  const hideGhost = useCallback(() => {
    if (ghostRef.current) ghostRef.current.style.display = "none"
  }, [])

  const startDrag = useCallback((cardIdx: number, x: number, y: number) => {
    dragRef.current = { cardIdx }
    showGhost(x, y, cardIdx)

    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return
      showGhost(e.clientX, e.clientY, dragRef.current.cardIdx)
    }

    const onUp = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      dragRef.current = null
      hideGhost()
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)

      const el = document.elementFromPoint(e.clientX, e.clientY)
      const zone = el?.closest("[data-drop-zone]") as SVGElement | HTMLElement | null
      if (!zone) return

      const zoneIdx = parseInt(zone.getAttribute("data-drop-zone")!, 10)
      if (lockedRef.current[zoneIdx]) return

      se.playSe(se.pi)
      setPlaced(prev => { const n = [...prev]; n[zoneIdx] = drag.cardIdx; return n })
      setTimeout(() => judgeRef.current(zoneIdx, drag.cardIdx), 100)
    }

    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }, [showGhost, hideGhost])

  const startCardDrag = useCallback((e: React.PointerEvent, cardIdx: number) => {
    e.preventDefault()
    setSelectedCard(cardIdx)
    startDrag(cardIdx, e.clientX, e.clientY)
  }, [startDrag])

  /** 星をタップして配置（選択中のカードがあるとき）*/
  const handleZoneTap = useCallback((zoneIdx: number) => {
    if (locked[zoneIdx] || selectedCard === null) return
    if (placed.includes(selectedCard)) { setSelectedCard(null); return }
    se.playSe(se.pi)
    setPlaced(prev => { const n = [...prev]; n[zoneIdx] = selectedCard; return n })
    setSelectedCard(null)
    setTimeout(() => judge(zoneIdx, selectedCard), 100)
  }, [locked, placed, selectedCard, judge])

  const resetQuiz = useCallback(() => {
    se.playSe(se.reset)
    setPlaced(Array(QUIZ_STAR_IDS.length).fill(null))
    setResults(Array(QUIZ_STAR_IDS.length).fill(null))
    setLocked(Array(QUIZ_STAR_IDS.length).fill(false))
    setAllCorrect(false)
    setSelectedCard(null)
    setCardOrder(shuffledIndexes())
  }, [])

  const correctCount = locked.filter(Boolean).length
  const selectedStar = selectedStarId ? STAR_BY_ID[selectedStarId] : null

  // ══════════════════════════════════════════════════════
  // 画面
  // ══════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-center text-gray-800 mb-3">
        ✨ 夏の星
      </h1>

      {/* モード切替 */}
      <div className="flex justify-center gap-2 mb-3">
        <BtnMode value="sagasou" current={mode} onChange={changeMode}>さがそう</BtnMode>
        <BtnMode value="ugoki"   current={mode} onChange={changeMode}>うごき</BtnMode>
        <BtnMode value="musubou" current={mode} onChange={changeMode}>むすぼう</BtnMode>
      </div>

      {/* モードの説明 */}
      <p className="text-sm text-center text-gray-600 mb-3">
        {mode === "sagasou" && "星をタップすると、名前や明るさ・色が分かるよ"}
        {mode === "ugoki" && "時こくを進めると、星が東（左）から西（右）へ動くよ"}
        {mode === "musubou" && (allCorrect
          ? <span className="text-danger-500 font-bold">ぜんもんせいかい！🎉</span>
          : `星の名前のカードを、正しい星にドラッグしよう（${correctCount} / ${QUIZ_STAR_IDS.length}）`
        )}
      </p>

      <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">

        {/* ══ 星空 ══════════════════════════════════════ */}
        <div className="shrink-0 mx-auto" style={{ width: "min(92vw, 520px)" }}>
          {/* いつの空かを表示 */}
          <p className="text-center text-xs text-gray-500 mb-1">
            京都の空　{mode === "musubou"
              ? "8月15日 21:00"
              : `${preset.label} ${formatTime(minutes)}`}
          </p>

          <svg
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            className="w-full h-auto rounded-xl select-none"
            style={{ touchAction: "none" }}
          >
            <defs>
              {/* 夜空。天頂（中心）が暗く、地平線（ふち）に向かって少し明るい */}
              <radialGradient id="skyGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#0a1024" />
                <stop offset="70%"  stopColor="#132a4d" />
                <stop offset="100%" stopColor="#22406b" />
              </radialGradient>
            </defs>

            {/* 空の円 */}
            <circle cx={CX} cy={CY} r={R} fill="url(#skyGrad)" />

            {/* 高度の目もり（30°・60°）*/}
            {[30, 60].map(alt => (
              <circle
                key={alt}
                cx={CX} cy={CY} r={((90 - alt) / 90) * R}
                fill="none" stroke="#ffffff" strokeOpacity={0.12} strokeDasharray="3 5"
              />
            ))}
            {/* 地平線 */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#94a3b8" strokeWidth={2} />

            {/* 方位（見上げた図なので東が左・西が右）*/}
            <text x={CX} y={CY - R - 8} textAnchor="middle" fontSize={20} fill="#475569" fontWeight="bold">北</text>
            <text x={CX} y={CY + R + 24} textAnchor="middle" fontSize={20} fill="#475569" fontWeight="bold">南</text>
            <text x={CX - R - 20} y={CY + 7} textAnchor="middle" fontSize={20} fill="#475569" fontWeight="bold">東</text>
            <text x={CX + R + 20} y={CY + 7} textAnchor="middle" fontSize={20} fill="#475569" fontWeight="bold">西</text>

            {/* 星座線 */}
            {showLines && CONSTELLATIONS.map(c => (
              <g key={c.id}>
                {c.lines.map(([a, b], i) => {
                  const pa = visible(a), pb = visible(b)
                  if (!pa || !pb) return null
                  return (
                    <line
                      key={i}
                      x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                      stroke="#7dd3fc" strokeOpacity={0.5} strokeWidth={1.4}
                    />
                  )
                })}
              </g>
            ))}

            {/* 夏の大三角 */}
            {showTriangle && (() => {
              const pts = SUMMER_TRIANGLE.map(id => visible(id))
              if (pts.some(p => !p)) return null
              const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p!.x},${p!.y}`).join(" ") + " Z"
              return (
                <path d={d} fill="#fbbf24" fillOpacity={0.07}
                  stroke="#fbbf24" strokeOpacity={0.75} strokeWidth={2.2} />
              )
            })()}

            {/* 星 */}
            {STARS.map(s => {
              const p = visible(s.id)
              if (!p) return null
              const r = magToRadius(s.mag)
              const hex = STAR_COLOR_HEX[s.color]
              return (
                <g key={s.id}>
                  {/* 明るい星はぼんやり光らせる */}
                  {s.mag < 2.2 && (
                    <circle cx={p.x} cy={p.y} r={r * 2.8} fill={hex} opacity={0.2} />
                  )}
                  <circle cx={p.x} cy={p.y} r={r} fill={hex} />
                </g>
              )
            })}

            {/* 星座の名前 */}
            {showLines && CONSTELLATIONS.map(c => {
              const p = visible(c.labelStarId)
              if (!p) return null
              return (
                <text key={c.id} x={p.x} y={p.y + 30} textAnchor="middle"
                  fontSize={13} fill="#7dd3fc" fillOpacity={0.85}>
                  {c.name}
                </text>
              )
            })}

            {/* 主役の星の名前（クイズ中は答えになるので出さない）*/}
            {mode !== "musubou" && STARS.filter(s => s.isMain).map(s => {
              const p = visible(s.id)
              if (!p) return null
              const isSel = selectedStarId === s.id
              return (
                <text key={s.id} x={p.x + 12} y={p.y - 10}
                  fontSize={15} fontWeight="bold"
                  fill={isSel ? "#fbbf24" : "#ffffff"}>
                  {s.name}
                </text>
              )
            })}

            {/* 【さがそう】タップ用の当たり判定（見えない大きめの円）*/}
            {mode === "sagasou" && STARS.filter(s => s.isMain).map(s => {
              const p = visible(s.id)
              if (!p) return null
              return (
                <circle
                  key={s.id}
                  data-clickable
                  cx={p.x} cy={p.y} r={22}
                  fill="transparent"
                  stroke={selectedStarId === s.id ? "#fbbf24" : "transparent"}
                  strokeWidth={2}
                  onClick={() => {
                    se.playSe(se.pi)
                    setSelectedStarId(prev => prev === s.id ? null : s.id)
                  }}
                />
              )
            })}

            {/* 【むすぼう】ドロップゾーン */}
            {mode === "musubou" && QUIZ_STAR_IDS.map((starId, i) => {
              const p = visible(starId)
              if (!p) return null
              const cardIdx = placed[i]
              const isLocked = locked[i]
              const result = results[i]
              const ringColor = isLocked ? "#34d399"
                : result === "wrong" ? "#fb7185"
                : selectedCard !== null ? "#60a5fa" : "#94a3b8"
              return (
                <g key={starId} data-clickable onClick={() => handleZoneTap(i)}>
                  <circle
                    data-drop-zone={i}
                    cx={p.x} cy={p.y} r={22}
                    fill="transparent"
                    stroke={ringColor}
                    strokeOpacity={isLocked || result ? 0.95 : 0.55}
                    strokeWidth={2.5}
                    strokeDasharray={isLocked ? undefined : "4 3"}
                  />
                  {/* 置かれたカードの名前 */}
                  {cardIdx !== null && (
                    <text x={p.x} y={p.y - 28} textAnchor="middle"
                      fontSize={14} fontWeight="bold"
                      fill={isLocked ? "#34d399" : result === "wrong" ? "#fb7185" : "#ffffff"}>
                      {STAR_BY_ID[QUIZ_STAR_IDS[cardIdx]].name}
                    </text>
                  )}
                  {isLocked && (
                    <text x={p.x + 20} y={p.y - 14} fontSize={18} fill="#34d399">○</text>
                  )}
                  {result === "wrong" && (
                    <text x={p.x + 20} y={p.y - 14} fontSize={18} fill="#fb7185">×</text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* ══ 右パネル ══════════════════════════════════ */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3">

          {/* ── さがそう ── */}
          {mode === "sagasou" && (
            <>
              <div className="flex flex-wrap gap-2">
                <ToggleBtn on={showLines} onToggle={() => setShowLines(v => !v)}>
                  星ざの線
                </ToggleBtn>
                <ToggleBtn on={showTriangle} onToggle={() => setShowTriangle(v => !v)}>
                  夏の大三角
                </ToggleBtn>
              </div>

              {selectedStar ? (
                <div className="rounded-xl border-2 border-brand-300 bg-white p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-block rounded-full border border-gray-300"
                      style={{
                        width: 18, height: 18,
                        backgroundColor: STAR_COLOR_HEX[selectedStar.color],
                      }}
                    />
                    <span className="font-bold text-lg">{selectedStar.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    明るさ：{selectedStar.mag.toFixed(2)} 等星　／　色：{selectedStar.color}
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed">{selectedStar.info}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 rounded-xl border-2 border-dashed border-gray-300 p-3">
                  ベガ・デネブ・アルタイル・アンタレス・北極星をタップしてみよう。
                </p>
              )}
            </>
          )}

          {/* ── うごき ── */}
          {mode === "ugoki" && (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1">いつの空？</p>
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((p, i) => (
                    <BtnMode key={p.id} value={i} current={dateIdx} onChange={setDateIdx}>
                      {p.label}
                    </BtnMode>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{preset.note}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  時こく：<span className="font-bold text-base text-gray-800">{formatTime(minutes)}</span>
                </p>
                <input
                  type="range"
                  min={MIN_TIME} max={MAX_TIME} step={5}
                  value={minutes}
                  onChange={e => setMinutes(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: "#3b82f6" }}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>19:00</span><span>翌1:00</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    se.playSe(se.pi)
                    if (!isPlaying && minutes >= MAX_TIME) setMinutes(MIN_TIME)
                    setIsPlaying(v => !v)
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold text-white border-2
                    active:translate-y-0.5 transition-colors
                    ${isPlaying
                      ? "bg-danger-400 hover:bg-danger-500 active:bg-danger-600 border-danger-400"
                      : "bg-brand-400 hover:bg-brand-500 active:bg-brand-600 border-brand-400"}`}
                >
                  {isPlaying ? "ストップ" : "さいせい"}
                </button>
                <button
                  onClick={() => { se.playSe(se.reset); setIsPlaying(false); setMinutes(MIN_TIME) }}
                  className="px-3 py-2 rounded-lg text-sm font-bold text-white border-2
                    bg-danger-400 hover:bg-danger-500 active:bg-danger-600 border-danger-400
                    active:translate-y-0.5 transition-colors"
                >
                  もどす
                </button>
              </div>

              <div className="rounded-xl bg-brand-50 border-2 border-brand-200 p-3 text-sm text-gray-800 leading-relaxed">
                <p className="font-bold mb-1">みつけよう</p>
                <p>星は<strong>東（左）から西（右）</strong>へ動くよ。でも<strong>北極星だけは動かない</strong>ね。</p>
                <p className="mt-2">日づけを変えると、同じ時こくでも星の位置がちがうことも分かるよ。</p>
              </div>
            </>
          )}

          {/* ── むすぼう ── */}
          {mode === "musubou" && (
            <>
              <p className="text-xs text-gray-500">
                カードを星にドラッグ（タップして星をタップでもOK）
              </p>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {cardOrder.map(cardIdx => {
                  if (placed.includes(cardIdx)) return null
                  const star = STAR_BY_ID[QUIZ_STAR_IDS[cardIdx]]
                  return (
                    <div
                      key={cardIdx}
                      data-clickable
                      className={`px-3 py-2 rounded-lg border-2 select-none text-center font-bold
                        transition-all active:scale-95
                        ${selectedCard === cardIdx
                          ? "border-accent-500 bg-accent-100 ring-2 ring-accent-300"
                          : "border-gray-300 bg-white hover:bg-gray-50"}`}
                      style={{ touchAction: "none", cursor: "grab" }}
                      onPointerDown={e => startCardDrag(e, cardIdx)}
                      onClick={() => setSelectedCard(prev => prev === cardIdx ? null : cardIdx)}
                    >
                      {star.name}
                    </div>
                  )
                })}
              </div>
              <button
                onClick={resetQuiz}
                className="px-3 py-2 rounded-lg text-sm font-bold text-white border-2
                  bg-danger-400 hover:bg-danger-500 active:bg-danger-600 border-danger-400
                  active:translate-y-0.5 transition-colors"
              >
                リセット
              </button>
            </>
          )}
        </div>
      </div>

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

      {/* ドラッグ中に指について動く要素 */}
      <div
        ref={ghostRef}
        style={{
          display: "none", position: "fixed",
          pointerEvents: "none", zIndex: 9999, opacity: 0.9,
        }}
      />
    </div>
  )
}

/**
 * ON/OFF を切り替えるトグルボタン
 *
 * BtnMode は「同じ値を押しても何も起きない」仕様なので、
 * ON⇄OFF を行き来するトグルには使えない。ここだけ自前で書く。
 * 見た目は BtnMode に合わせてある（brand トークン）。
 */
function ToggleBtn({
  on, onToggle, children,
}: { on: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={() => { se.playSe(se.set); onToggle() }}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95
        ${on
          ? "bg-brand-500 text-white"
          : "bg-white border border-brand-300 text-brand-600 hover:bg-brand-100"}`}
    >
      {children}
    </button>
  )
}

/** クイズカードの並び順をシャッフルする */
function shuffledIndexes(): number[] {
  const ids = QUIZ_STAR_IDS.map((_, i) => i)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return ids
}

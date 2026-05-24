// ======================================================
// モンティホール問題シミュレーター
//
// URL: /monty-hall
// 対象: 先生向け（確率・統計の授業教材）
// 内容:
//   手動プレイ：ドア選択 → 司会者がヤギのドアを開示
//               → 変える／変えないを選択 → 結果表示
//               累計集計（変えた / 変えない の勝率）
//   自動シミュレーション：最大100万回実行し2戦略の勝率を比較
//
// 解説コメントアウト中（授業後に index.html と合わせて復元可能）
// ======================================================

"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import * as se from "@/lib/se"

// ── 型 ─────────────────────────────────────────────────────
type Phase    = "pick" | "decide" | "done"
type Strategy = "switch" | "stay"
type Tab      = "play" | "sim"
interface TallyEntry { win: number; total: number }
interface SimPartial { rate: string; detail: string; barWidth: number }
interface LogEntry   { num: number; car: number; pick: number; switchWin: boolean; stayWin: boolean }

// ── SVG 部品 ────────────────────────────────────────────────
function CarSvg() {
  return (
    <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-label="車（当たり）" role="img">
      <path d="M8 64 L112 64 Q116 64 116 60 L116 54 Q116 49 110 48 L96 45 L82 30 Q78 26 70 26 L40 26 Q33 26 30 32 L22 47 L12 50 Q8 51 8 56 Z" fill="#e63946"/>
      <path d="M40 31 Q37 31 35 36 L30 46 L57 46 L57 31 Z" fill="#bfe3f7"/>
      <path d="M63 31 L68 31 Q74 31 77 35 L86 46 L63 46 Z" fill="#bfe3f7"/>
      <line x1="60" y1="31" x2="60" y2="62" stroke="#b71c2c" strokeWidth="2.5"/>
      <circle cx="110" cy="55" r="4.5" fill="#ffd95e"/>
      <circle cx="34" cy="66" r="14" fill="#26262b"/>
      <circle cx="34" cy="66" r="6"  fill="#aab0b8"/>
      <circle cx="86" cy="66" r="14" fill="#26262b"/>
      <circle cx="86" cy="66" r="6"  fill="#aab0b8"/>
    </svg>
  )
}

function GoatSvg() {
  return (
    <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-label="ヤギ（はずれ）" role="img">
      <g fill="#a9744f">
        <rect x="34" y="60" width="9" height="30" rx="4"/>
        <rect x="44" y="60" width="9" height="30" rx="4"/>
        <rect x="62" y="60" width="9" height="30" rx="4"/>
        <rect x="80" y="60" width="9" height="30" rx="4"/>
      </g>
      <g fill="#4a3526">
        <rect x="34" y="84" width="9" height="7" rx="3"/>
        <rect x="44" y="84" width="9" height="7" rx="3"/>
        <rect x="62" y="84" width="9" height="7" rx="3"/>
        <rect x="80" y="84" width="9" height="7" rx="3"/>
      </g>
      <path d="M96 44 Q108 42 106 58" stroke="#a9744f" strokeWidth="9" fill="none" strokeLinecap="round"/>
      <ellipse cx="64" cy="50" rx="38" ry="22" fill="#bf8a63"/>
      <path d="M30 56 Q22 50 24 32 L42 36 Q46 52 44 60 Z" fill="#bf8a63"/>
      <ellipse cx="26" cy="34" rx="16" ry="13" fill="#cd9b75"/>
      <ellipse cx="13" cy="40" rx="8"  ry="6"  fill="#e0c4a8"/>
      <ellipse cx="40" cy="26" rx="8"  ry="5"  fill="#a9744f" transform="rotate(-25 40 26)"/>
      <path d="M30 22 Q34 4 50 4"  stroke="#5a4326" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d="M22 22 Q24 6 38 4"  stroke="#6b5232" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <circle cx="20" cy="33" r="3.4" fill="#2a2018"/>
      <circle cx="10" cy="40" r="2"   fill="#7a5b42"/>
      <path d="M14 46 Q13 60 18 66 Q23 58 22 46 Z" fill="#d8c0a6"/>
    </svg>
  )
}

// ── ユーティリティ ──────────────────────────────────────────
function randInt(n: number): number { return Math.floor(Math.random() * n) }
function pct(t: TallyEntry): string {
  return t.total === 0 ? "―" : ((t.win / t.total) * 100).toFixed(1) + "%"
}

// ── アプリ固有 CSS（mh- プレフィックスでスコープ） ─────��────
const MH_CSS = `
:root {
  --mh-accent:      #2563eb;
  --mh-accent-dark: #1d4ed8;
  --mh-switch:      #0d9488;
  --mh-stay:        #d97706;
  --mh-win:         #16a34a;
  --mh-lose:        #dc2626;
  --mh-border:      #d8dee9;
  --mh-card:        #ffffff;
  --mh-bg:          #f4f6fb;
  --mh-muted:       #5b6b7b;
  --mh-radius:      12px;
}
.mh-lead { color: var(--mh-muted); font-size: 0.95rem; text-align: center; margin-bottom: 1.5rem; }

/* タブ */
.mh-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.mh-tab {
  flex: 1; padding: 0.7rem; font-size: 1rem; font-weight: 600;
  border: 1px solid var(--mh-border); background: var(--mh-card);
  color: var(--mh-muted); border-radius: var(--mh-radius); cursor: pointer;
  transition: all 0.15s;
}
.mh-tab:hover:not(.mh-tab-active) { background: #eef2f7; }
.mh-tab-active { background: var(--mh-accent); color: #fff; border-color: var(--mh-accent); }

/* パネル */
.mh-panel {
  background: var(--mh-card); border: 1px solid var(--mh-border);
  border-radius: var(--mh-radius); padding: 1.5rem; margin-bottom: 1rem;
}

/* ステータス */
.mh-status { text-align: center; font-size: 1rem; margin-bottom: 1rem; min-height: 1.7em; }
.mh-status-win  { color: var(--mh-win);  font-weight: 800; font-size: 1.25rem; animation: mhPopIn 0.4s ease; }
.mh-status-lose { color: var(--mh-lose); font-weight: 700; }
@keyframes mhPopIn {
  0%   { transform: scale(0.7); opacity: 0; }
  70%  { transform: scale(1.1); }
  100% { transform: scale(1);   opacity: 1; }
}

/* ドア */
.mh-doors { display: flex; gap: 1rem; justify-content: center; margin: 1.5rem 0; }
.mh-door {
  position: relative; width: 33%; max-width: 180px; aspect-ratio: 3 / 4;
  border: 3px solid var(--mh-accent-dark); border-radius: 8px;
  background: linear-gradient(160deg, #8b5e34, #6b4423);
  cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.mh-door:not(.mh-door-selected):hover:not(:disabled) {
  transform: translateY(-4px); box-shadow: 0 6px 16px rgba(0,0,0,0.25);
  border-color: var(--mh-accent);
  background: linear-gradient(160deg, #a97a47, #7a5232);
}
.mh-door:disabled { cursor: default; }
.mh-door-number {
  font-size: 2rem; font-weight: 700; color: #fff5e6;
  background: rgba(0,0,0,0.25); width: 2.6rem; height: 2.6rem;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.mh-door-open .mh-door-number { opacity: 0; visibility: hidden; }
.mh-door-content {
  position: absolute; width: 6.4rem; height: 6.4rem;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; opacity: 0; transform: scale(0.3);
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.mh-door-content svg { width: 84%; height: 84%; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.22)); }
.mh-door-open { background: #ffffff; border-color: var(--mh-border); }
.mh-door-open .mh-door-content {
  opacity: 1; transform: scale(1);
  background: radial-gradient(circle, #ffffff 48%, #dde4ee 100%);
  box-shadow: 0 3px 10px rgba(0,0,0,0.18);
}
.mh-door-selected {
  border-color: var(--mh-accent); border-width: 5px;
  background: linear-gradient(160deg, #3b6ea5, #234e7d);
  box-shadow: 0 0 0 5px rgba(37,99,235,0.35);
}
.mh-door-selected::after {
  content: "あなたの選択"; position: absolute; top: -13px; left: 50%;
  transform: translateX(-50%); background: var(--mh-accent); color: #fff;
  font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 999px;
  white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.mh-door-win {
  border-color: var(--mh-win)  !important; background: #eafaef !important;
  animation: mhWinPulse 0.7s ease-in-out 3; z-index: 2;
}
.mh-door-win .mh-door-content {
  background: radial-gradient(circle, #ffffff 44%, #b6e8c6 100%) !important;
  animation: mhWinBounce 0.6s ease;
}
.mh-door-lose { border-color: var(--mh-lose) !important; background: #fbeaea !important; }
@keyframes mhWinPulse {
  0%,100% { box-shadow: 0 0 0  4px rgba(22,163,74,0.35); }
  50%      { box-shadow: 0 0 0 16px rgba(22,163,74,0);    }
}
@keyframes mhWinBounce {
  0%   { transform: scale(0.4) rotate(-12deg); }
  60%  { transform: scale(1.25) rotate(8deg);  }
  100% { transform: scale(1)    rotate(0);     }
}

/* ボタン */
.mh-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem; }
.mh-btn {
  padding: 0.7rem 1.4rem; font-size: 1rem; font-weight: 600;
  border: 1px solid var(--mh-border); background: var(--mh-card); color: #1f2933;
  border-radius: 8px; cursor: pointer; transition: all 0.15s;
}
.mh-btn:hover { background: #eef2f7; }
.mh-btn-primary { background: var(--mh-accent); color: #fff; border-color: var(--mh-accent); }
.mh-btn-primary:hover { background: var(--mh-accent-dark); }
.mh-btn-choice { border-width: 2px; }
.mh-btn-choice:hover {
  background: var(--mh-accent); color: #fff; border-color: var(--mh-accent);
  transform: translateY(-2px);
}

/* 集計 */
.mh-tally { display: flex; gap: 1rem; margin-top: 1.5rem; }
.mh-tally-item { flex: 1; text-align: center; padding: 0.8rem; background: var(--mh-bg); border-radius: 8px; }
.mh-tally-label { display: block; font-weight: 700; color: var(--mh-muted); }
.mh-tally-value { display: block; font-size: 0.9rem; }
.mh-tally-rate  { display: block; font-size: 1.5rem; font-weight: 700; color: var(--mh-accent-dark); }

/* シミュレーション */
.mh-sim-controls {
  display: flex; gap: 0.6rem; align-items: center; justify-content: center;
  flex-wrap: wrap; margin: 1rem 0 1.5rem;
}
.mh-sim-controls label { font-weight: 600; }
.mh-trials-input {
  padding: 0.5rem; font-size: 1rem; width: 8rem;
  border: 1px solid var(--mh-border); border-radius: 6px;
}
.mh-sim-results { display: flex; gap: 1rem; }
.mh-result-card {
  flex: 1; padding: 1rem; border-radius: 8px;
  text-align: center; border: 2px solid var(--mh-border);
}
.mh-result-card h3 { font-size: 1rem; margin-bottom: 0.5rem; }
.mh-card-switch { border-color: var(--mh-switch); }
.mh-card-switch h3 { color: var(--mh-switch); }
.mh-card-switch .mh-big-rate  { color: var(--mh-switch); }
.mh-card-switch .mh-bar-fill  { background: var(--mh-switch); }
.mh-card-stay   { border-color: var(--mh-stay);   }
.mh-card-stay   h3 { color: var(--mh-stay);   }
.mh-card-stay   .mh-big-rate  { color: var(--mh-stay);   }
.mh-card-stay   .mh-bar-fill  { background: var(--mh-stay);   }
.mh-big-rate { font-size: 2.4rem; font-weight: 800; }
.mh-sub { font-size: 0.85rem; color: var(--mh-muted); }
.mh-bar { height: 12px; background: var(--mh-bg); border-radius: 6px; margin-top: 0.7rem; overflow: hidden; }
.mh-bar-fill { height: 100%; width: 0; border-radius: 6px; transition: width 0.12s linear; }

/* ログ */
.mh-sim-log { margin-top: 1.4rem; }
.mh-sim-log h3 { font-size: 0.95rem; color: var(--mh-muted); margin-bottom: 0.4rem; }
.mh-log-box {
  background: #161d2e; color: #dfe5ef;
  font-family: "Consolas", "Courier New", monospace;
  font-size: 0.8rem; line-height: 1.7;
  border: 1px solid #2c3650; border-radius: 8px;
  padding: 0.7rem 0.9rem; height: 230px; overflow: auto;
}
.mh-log-line { white-space: nowrap; }
.mh-log-done {
  color: #ffe07a; font-weight: 700; padding-bottom: 0.4rem;
  margin-bottom: 0.4rem; border-bottom: 1px solid #2c3650; white-space: normal;
}
.mh-log-win   { color: #4ade80; font-weight: 700; }
.mh-log-lose  { color: #f87171; font-weight: 700; }
.mh-log-empty { color: #6b7689; }
.mh-theory { text-align: center; margin-top: 1.2rem; font-size: 0.9rem; color: var(--mh-muted); }

/* 紙吹雪 */
.mh-confetti {
  position: fixed; top: -10px; width: 10px; height: 14px;
  z-index: 999; pointer-events: none;
  animation: mhConfettiFall linear forwards;
}
@keyframes mhConfettiFall {
  0%   { transform: translateY(-10vh)  rotate(0);     opacity: 1;   }
  100% { transform: translateY(105vh) rotate(720deg); opacity: 0.9; }
}

/* レスポンシブ */
@media (max-width: 480px) {
  .mh-doors { gap: 0.5rem; }
  .mh-door-number { font-size: 1.5rem; width: 2rem; height: 2rem; }
  .mh-door-content { width: 4.4rem; height: 4.4rem; }
  .mh-tally, .mh-sim-results { flex-direction: column; }
  .mh-big-rate { font-size: 2rem; }
}
`

// ── コンポーネント ──────────────────────────────────────────
export default function MontyHallPage() {

  // ── タブ ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("play")

  // ── ゲーム状態 ─────────────────────────────────────────
  const [phase,       setPhase      ] = useState<Phase>("pick")
  const [carDoor,     setCarDoor    ] = useState(-1)
  const [pickedDoor,  setPickedDoor ] = useState(-1)
  const [openedDoor,  setOpenedDoor ] = useState(-1)
  const [finalDoor,   setFinalDoor  ] = useState(-1)
  const [finalResult, setFinalResult] = useState<"win" | "lose" | null>(null)
  const [statusText,  setStatusText ] = useState(
    "3つのドアから1つ選んでください。1つに車（当たり）、2つにヤギ（はずれ）が入っています。"
  )
  const [statusVariant, setStatusVariant] = useState<"normal" | "win" | "lose">("normal")
  const [tally, setTally] = useState<{ switch: TallyEntry; stay: TallyEntry }>({
    switch: { win: 0, total: 0 },
    stay:   { win: 0, total: 0 },
  })

  // ゲームロジックのコールバック内でステールクロージャを避けるための ref
  const carDoorRef    = useRef(-1)
  const pickedDoorRef = useRef(-1)
  const openedDoorRef = useRef(-1)

  // ── シミュレーション状態 ─────────────────────────────
  const [trialsValue,   setTrialsValue  ] = useState(1000)
  const [simSwitch,     setSimSwitch    ] = useState<SimPartial>({ rate: "―", detail: "未実行", barWidth: 0 })
  const [simStay,       setSimStay      ] = useState<SimPartial>({ rate: "―", detail: "未実行", barWidth: 0 })
  const [logHtml,       setLogHtml      ] = useState('<div class="mh-log-empty">シミュレーションを実行すると、各試行の結果がここに表示されます。</div>')
  const [simBtnText,    setSimBtnText   ] = useState("シミュレーション実行")
  const [simBtnDisabled,setSimBtnDisabled] = useState(false)

  const simRunningRef = useRef(false)
  const rafRef        = useRef<number | null>(null)
  const trialsRef     = useRef(1000)

  // ── 紙吹雪 ────────────────────────────────────────────
  const launchConfetti = useCallback(() => {
    const colors = ["#2563eb", "#0d9488", "#d97706", "#16a34a", "#dc2626", "#facc15"]
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement("div")
      piece.className = "mh-confetti"
      piece.style.left             = Math.random() * 100 + "vw"
      piece.style.background       = colors[randInt(colors.length)]
      piece.style.animationDuration = (1.5 + Math.random() * 1.5) + "s"
      piece.style.animationDelay   = (Math.random() * 0.4) + "s"
      document.body.appendChild(piece)
      setTimeout(() => piece.remove(), 3500)
    }
  }, [])

  // ── 新しいゲーム ──────────────────────────────────────
  const newGame = useCallback(() => {
    const car = randInt(3)
    carDoorRef.current    = car
    pickedDoorRef.current = -1
    openedDoorRef.current = -1
    setCarDoor(car)
    setPickedDoor(-1)
    setOpenedDoor(-1)
    setFinalDoor(-1)
    setFinalResult(null)
    setPhase("pick")
    setStatusText("3つのドアから1つ選んでください。1つに車（当たり）、2つにヤギ（はずれ）が入っています。")
    setStatusVariant("normal")
  }, [])

  useEffect(() => { newGame() }, [newGame])

  // ── ドアを選ぶ ────────────────────────────────────────
  function onPick(idx: number) {
    if (phase !== "pick") return
    se.playSe(se.pi)
    const candidates = [0, 1, 2].filter(d => d !== idx && d !== carDoorRef.current)
    const opened = candidates[randInt(candidates.length)]
    pickedDoorRef.current = idx
    openedDoorRef.current = opened
    setPickedDoor(idx)
    setOpenedDoor(opened)
    setPhase("decide")
    setStatusText(`あなたはドア${idx + 1}を選びました。司会者はドア${opened + 1}（ヤギ）を開けました。`)
  }

  // ─��� 結果を開示 ────────────────────────────────────────
  function reveal(final: number, strategy: Strategy) {
    const won = final === carDoorRef.current
    setFinalDoor(final)
    setFinalResult(won ? "win" : "lose")
    setPhase("done")
    setTally(prev => ({
      ...prev,
      [strategy]: { win: prev[strategy].win + (won ? 1 : 0), total: prev[strategy].total + 1 },
    }))
    const label = strategy === "switch" ? "ドアを変えて" : "ドアを変えずに"
    if (won) {
      se.playSe(se.seikai2)
      setStatusText(`🎉 当たり！ ${label}ドア${final + 1}を選び、車を獲得！ 🎉`)
      setStatusVariant("win")
      launchConfetti()
    } else {
      se.playSe(se.alertSound)
      setStatusText(`😢 はずれ。${label}ドア${final + 1}を選びましたが、ヤギでした。`)
      setStatusVariant("lose")
    }
  }

  function onSwitch() {
    if (phase !== "decide") return
    se.playSe(se.set)
    const final = [0, 1, 2].find(d => d !== pickedDoorRef.current && d !== openedDoorRef.current)!
    reveal(final, "switch")
  }

  function onStay() {
    if (phase !== "decide") return
    se.playSe(se.set)
    reveal(pickedDoorRef.current, "stay")
  }

  // ── ドア表示ヘルパー ──────────────────────────────────
  function doorClasses(idx: number): string {
    const c: string[] = ["mh-door"]
    const isOpened    = (idx === openedDoor && phase !== "pick") || phase === "done"
    const isSelected  = phase === "decide" && idx === pickedDoor
    if (isOpened)   c.push("mh-door-open")
    if (isSelected) c.push("mh-door-selected")
    if (idx === finalDoor && finalResult === "win")  c.push("mh-door-win")
    if (idx === finalDoor && finalResult === "lose") c.push("mh-door-lose")
    return c.join(" ")
  }

  function doorContent(idx: number): "car" | "goat" | null {
    const isOpened = (idx === openedDoor && phase !== "pick") || phase === "done"
    if (!isOpened) return null
    return idx === carDoor ? "car" : "goat"
  }

  // ── シミュレーション実行 ──────────────────────────────
  function runSimulation() {
    if (simRunningRef.current) return
    se.playSe(se.set)
    let n = trialsRef.current
    if (!Number.isFinite(n) || n < 1) n = 1
    if (n > 1_000_000) n = 1_000_000
    trialsRef.current = n
    setTrialsValue(n)

    simRunningRef.current = true
    setSimBtnDisabled(true)
    setSimBtnText("実行中…")
    setLogHtml('<div class="mh-log-empty">検証中…</div>')

    const TARGET_FRAMES = 120
    const perFrame = Math.max(1, Math.ceil(n / TARGET_FRAMES))
    const LOG_CAP  = 200

    let done       = 0
    let switchWins = 0
    let stayWins   = 0
    const entries: LogEntry[] = []

    function step() {
      const end = Math.min(done + perFrame, n)
      for (; done < end; done++) {
        const car      = randInt(3)
        const pick     = randInt(3)
        const stayWin  = pick === car
        const switchWin = !stayWin
        if (switchWin) switchWins++; else stayWins++
        if (done >= n - LOG_CAP) entries.push({ num: done + 1, car, pick, switchWin, stayWin })
      }

      const d = done
      const mkPartial = (wins: number): SimPartial => ({
        rate:     d === 0 ? "0.0%" : (wins / d * 100).toFixed(1) + "%",
        detail:   `${wins.toLocaleString()} 勝 / ${d.toLocaleString()} 回`,
        barWidth: d === 0 ? 0 : wins / d * 100,
      })
      setSimSwitch(mkPartial(switchWins))
      setSimStay(mkPartial(stayWins))

      if (done < n) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        const sr  = (switchWins / n * 100).toFixed(1)
        const str = (stayWins   / n * 100).toFixed(1)
        const header = `<div class="mh-log-done">※ 検証完了！ 全${n.toLocaleString()}回の結果：【変更する】勝率 ${sr}% ｜ 【キープする】勝率 ${str}%</div>`
        const lines  = entries.slice().reverse().map(e => {
          const sw = e.switchWin
            ? '<span class="mh-log-win">勝ち🚗</span>'
            : '<span class="mh-log-lose">負け🐐</span>'
          const st = e.stayWin
            ? '<span class="mh-log-win">勝ち🚗</span>'
            : '<span class="mh-log-lose">負け🐐</span>'
          return `<div class="mh-log-line">[試行 #${e.num}] 車🚗:${e.car + 1}, 初期選択🚪:${e.pick + 1}　【変更戦略】：${sw} ｜ 【キープ戦略】：${st}</div>`
        }).join("")
        setLogHtml(header + lines)
        simRunningRef.current = false
        setSimBtnDisabled(false)
        setSimBtnText("シミュレーション実行")
      }
    }

    rafRef.current = requestAnimationFrame(step)
  }

  // アンマウント時に RAF をキャンセル
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // ── 描画 ───────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* アプリ固有スタイル */}
      <style>{MH_CSS}</style>

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-1">
        🚪 モンティホール問題シミュレーター
      </h1>
      <p className="mh-lead">
        ドアを選び、「変える」か「変えない」かで当たる確率がどう変わるか体験しよう。
      </p>

      {/* タブ */}
      <nav className="mh-tabs">
        <button
          className={`mh-tab ${activeTab === "play" ? "mh-tab-active" : ""}`}
          onClick={() => setActiveTab("play")}
        >
          手動プレイ
        </button>
        <button
          className={`mh-tab ${activeTab === "sim" ? "mh-tab-active" : ""}`}
          onClick={() => setActiveTab("sim")}
        >
          自動シミュレーション
        </button>
      </nav>

      {/* ─────────── 手動プレイ ─────────── */}
      {activeTab === "play" && (
        <section className="mh-panel">
          {/* ステータスメッセージ */}
          <p className={`mh-status ${
            statusVariant === "win"  ? "mh-status-win"  :
            statusVariant === "lose" ? "mh-status-lose" : ""
          }`}>
            {statusText}
          </p>

          {/* 3つのドア */}
          <div className="mh-doors">
            {[0, 1, 2].map(idx => {
              const content = doorContent(idx)
              return (
                <button
                  key={idx}
                  className={doorClasses(idx)}
                  onClick={() => onPick(idx)}
                  disabled={phase !== "pick"}
                  aria-label={`ドア${idx + 1}`}
                >
                  <span className="mh-door-number">{idx + 1}</span>
                  <span className="mh-door-content">
                    {content === "car"  && <CarSvg  />}
                    {content === "goat" && <GoatSvg />}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 変える / 変えない */}
          {phase === "decide" && (
            <div className="mh-actions" style={{ flexDirection: "column", gap: "0.5rem" }}>
              <p className="mh-status" style={{ marginBottom: 0, fontSize: "0.95rem" }}>
                最初の選択を「変えますか？」「変えませんか？」
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button className="mh-btn mh-btn-choice" onClick={onSwitch}>ドアを変える</button>
                <button className="mh-btn mh-btn-choice" onClick={onStay}>変えない</button>
              </div>
            </div>
          )}

          {/* もう一度プレイ */}
          {phase === "done" && (
            <div className="mh-actions">
              <button className="mh-btn" onClick={() => { se.playSe(se.reset); newGame() }}>もう一度プレイ</button>
            </div>
          )}

          {/* 累計集計 */}
          <div className="mh-tally">
            {(["switch", "stay"] as Strategy[]).map(s => (
              <div key={s} className="mh-tally-item">
                <span className="mh-tally-label">{s === "switch" ? "変えた" : "変えない"}</span>
                <span className="mh-tally-value">
                  <b>{tally[s].win}</b> 勝 / {tally[s].total} 回
                </span>
                <span className="mh-tally-rate">{pct(tally[s])}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────── 自動シミュレーション ─────────── */}
      {activeTab === "sim" && (
        <section className="mh-panel">
          <p className="mh-status" style={{ fontSize: "0.95rem" }}>
            指定した回数だけ自動でプレイし、2つの戦略の勝率を比べます。
          </p>

          {/* コントロール */}
          <div className="mh-sim-controls">
            <label htmlFor="mh-trials">試行回数</label>
            <input
              id="mh-trials"
              type="number"
              className="mh-trials-input"
              value={trialsValue}
              min={1}
              max={1_000_000}
              step={100}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                trialsRef.current = v
                setTrialsValue(v)
              }}
            />
            <button
              className="mh-btn mh-btn-primary"
              onClick={runSimulation}
              disabled={simBtnDisabled}
            >
              {simBtnText}
            </button>
          </div>

          {/* 結果カード */}
          <div className="mh-sim-results">
            {([
              { cls: "mh-card-switch", label: "戦略A：必ず変える", sim: simSwitch },
              { cls: "mh-card-stay",   label: "戦略B：変えない",   sim: simStay  },
            ] as const).map(({ cls, label, sim }) => (
              <div key={cls} className={`mh-result-card ${cls}`}>
                <h3>{label}</h3>
                <p className="mh-big-rate">{sim.rate}</p>
                <p className="mh-sub">{sim.detail}</p>
                <div className="mh-bar">
                  <div className="mh-bar-fill" style={{ width: `${sim.barWidth}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* シミュレーションログ */}
          <div className="mh-sim-log">
            <h3>最近のシミュレーションログ</h3>
            <div
              className="mh-log-box"
              dangerouslySetInnerHTML={{ __html: logHtml }}
            />
          </div>

          <p className="mh-theory">
            理論値：変える → <b>約66.7%</b>（2/3）、変えない → <b>約33.3%</b>（1/3）
          </p>
        </section>
      )}
    </div>
  )
}

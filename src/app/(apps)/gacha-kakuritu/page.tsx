// ======================================================
// ガチャ確率シミュレーター ページ
//
// URL: /gacha-kakuritu
// 対象: 中学・高校（確率・統計。1 − (1 − p)^N・二項分布・幾何分布）
// 移植元: https://github.com/jimitas/gacha-kakuritu（Vanilla JS 版）
//
// 機能:
//   - 当たり確率（1/分母 ⇔ %）と回数 N を決めてガチャを回す
//   - 「1セッション引く」… 1回ずつカプセルが出るアニメ
//   - 「まとめて」… S セッションを一気に回して集計がのびていく
//   - 結果を理論値と並べる（1回以上 / 当たり回数 / 初当たり）
//
// 実装:
//   計算はすべて _lib/ にある（jest でテスト済み）。ここは配線と rAF ループだけ。
//
//   集計器（stats）とアニメ中のセッション（cur）は毎フレーム書きかわるので
//   ref に置いて直接いじる。描画用には publish() で「浅いコピー」を state に渡す。
//   ヒストグラム本体（Uint32Array）はコピーしないので、S=10万でも軽い。
//   （レンダー中に ref を読むと react-hooks/refs に引っかかるため、この形にしている）
//
//   一括実行は件数ではなく「1フレーム 12ms」の時間予算で区切る。
//   N が大きいときでも画面が固まらない。
//
//   音は「終わった瞬間」だけ鳴らす。1回引くごとに鳴らすと 20x で破綻する。
// ======================================================

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as se from "@/lib/se"
import { Btn } from "@/components/parts/buttons/Btn"
import { addSession, createStats, runSession } from "./_lib/gachaMath"
import type { GachaStats } from "./_lib/gachaMath"
import { computeTheory } from "./_lib/chartData"
import { advanceSession, newSession } from "./_lib/session"
import type { CurrentSession } from "./_lib/session"
import { capSessions, denomFromPct, fmtInt, pctFromDenom, readSettings } from "./_lib/settings"
import type { SettingsForm } from "./_lib/settings"
import { Card } from "./_components/Card"
import { FormulaCard } from "./_components/FormulaCard"
import { ResultTabs } from "./_components/ResultTabs"
import { SessionStage } from "./_components/SessionStage"
import { SettingsPanel } from "./_components/SettingsPanel"
import type { Speed } from "./_components/SettingsPanel"

/** 1x のときの1秒あたりの回数 */
const PULLS_PER_SEC = 10
/** 一括実行で1フレームに使ってよい時間 */
const FRAME_BUDGET_MS = 12
/** プリセット（SettingsPanel の並びと同じ） */
const PRESETS = ["0.5", "1", "3", "5"]

const INITIAL_FORM: SettingsForm = { denom: "100", pct: "1", n: "100", s: "1000", pSource: "denom" }
const INITIAL_STATUS = "設定を決めて「1セッション引く」か「まとめて」を押してください。"

type Mode = "idle" | "anim" | "bulk"

export default function GachaKakurituPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  // 最後に正しく読めた設定。入力が不正なあいだも、これで表示を続ける
  const [params, setParams] = useState({ p: 0.01, N: 100, S: 1000 })
  const errors = readSettings(form).errors
  const valid = errors.length === 0
  const { p, N, S } = params
  const theory = useMemo(() => computeTheory(p, N), [p, N])

  const [statsView, setStatsView] = useState<GachaStats>(() => createStats(0.01, 100))
  const [curView, setCurView] = useState<CurrentSession | null>(null)
  const statsRef = useRef(statsView)
  const curRef = useRef<CurrentSession | null>(null)

  const [mode, setMode] = useState<Mode>("idle")
  const busy = mode !== "idle"
  const [speed, setSpeed] = useState<Speed>("1")
  const speedRef = useRef<Speed>("1")
  const [status, setStatus] = useState({ text: INITIAL_STATUS, warn: false })

  // rAF ループの管理。runId はリセット後に古いコールバックを無視するための世代番号
  const loop = useRef({ raf: 0, runId: 0, cancel: false })

  // ページを離れたらループを止める。
  // mode は戻さない。コンポーネントごと捨てられるので不要なため。
  // （保留 2026-09-26: state を残したまま effect だけ作り直す場面 ─ 開発中の Fast Refresh や
  //   将来 cacheComponents / <Activity> を入れたとき ─ では busy のまま固まりうる。
  //   本番の今の構成では起きないので対応していない）
  useEffect(() => {
    const l = loop.current
    return () => {
      l.runId++
      cancelAnimationFrame(l.raf)
    }
  }, [])

  /** ref の中身を描画用 state に写す（浅いコピー） */
  const publish = () => {
    setStatsView({ ...statsRef.current })
    setCurView(curRef.current ? { ...curRef.current } : null)
  }

  /**
   * 実行中に集計が作り直されていたら、そのループは打ち切る。
   * 古い p・N のセッションを新しい集計に足すと、ヒストグラムの範囲外への書き込みが
   * Uint32Array に黙って捨てられ、sessions だけが増えて合計が合わなくなるため。
   * いまの UI では実行中に設定もリセットも押せないので起きないが、
   * 入力欄の無効化だけに頼らず、ここでも止める。
   */
  const staleRun = (stats: GachaStats) => {
    if (statsRef.current === stats) return false
    setMode("idle")
    setStatus({ text: "集計が作り直されたため、実行を打ち切りました。", warn: true })
    return true
  }

  // ---- 設定 ----------------------------------------------------------------
  const applyForm = (next: SettingsForm) => {
    setForm(next)
    const r = readSettings(next)
    if (r.errors.length > 0) return
    setParams({ p: r.p, N: r.N, S: r.S })
    // p か N が変わったら集計を作り直す（分布が混ざるのを防ぐ）
    if (r.p !== p || r.N !== N) {
      const prev = statsRef.current.sessions
      statsRef.current = createStats(r.p, r.N)
      curRef.current = null
      publish()
      if (prev > 0) {
        setStatus({ text: `設定が変わったので集計をリセットしました（それまでの ${fmtInt(prev)} セッションは破棄）。`, warn: true })
      }
    }
  }
  const onDenom = (v: string) => applyForm({ ...form, denom: v, pct: pctFromDenom(v, form.pct), pSource: "denom" })
  const onPct = (v: string) => applyForm({ ...form, pct: v, denom: denomFromPct(v, form.denom), pSource: "pct" })
  const onN = (v: string) => applyForm({ ...form, n: v })
  const onS = (v: string) => applyForm({ ...form, s: v })
  const onSpeed = (s: Speed) => {
    setSpeed(s)
    speedRef.current = s // 実行中のアニメにもすぐ効かせる
  }
  const activePreset = (valid && PRESETS.find((v) => Math.abs(parseFloat(v) / 100 - p) < 1e-12)) || ""

  // ---- 1セッション（アニメ） ---------------------------------------------------
  const runOne = () => {
    if (busy || !valid) return
    const l = loop.current
    const myRun = ++l.runId
    l.cancel = false
    setMode("anim")
    const stats = statsRef.current
    const cur = newSession(N)
    curRef.current = cur
    publish()
    setStatus({ text: "引いています…", warn: false })

    let last = performance.now()
    let acc = 0
    const frame = (now: number) => {
      if (myRun !== l.runId) return
      if (staleRun(stats)) return
      if (l.cancel) {
        cur.aborted = true
        publish()
        setMode("idle")
        setStatus({ text: "中断しました。このセッションは集計に含めません。", warn: true })
        return
      }
      // タブ切り替えから戻ったときに一気に進まないよう上限を付ける
      const dt = Math.max(0, Math.min(now - last, 100))
      last = now
      const sp = speedRef.current
      if (sp === "instant") {
        advanceSession(cur, p, N - cur.k)
      } else {
        acc += (dt / 1000) * PULLS_PER_SEC * Number(sp)
        const n = Math.floor(acc)
        acc -= n
        if (n > 0) advanceSession(cur, p, n)
      }
      if (cur.done) {
        addSession(stats, cur)
        publish()
        setMode("idle")
        setStatus({
          text: cur.hits > 0
            ? `${fmtInt(N)} 回引いて当たり ${fmtInt(cur.hits)} 回（初当たりは ${fmtInt(cur.firstHit)} 回目）。集計に加えました。`
            : `${fmtInt(N)} 回引いて当たりは 0 回でした。集計に加えました。`,
          warn: false,
        })
        se.playSe(cur.hits > 0 ? se.seikai1 : se.cancel)
        return
      }
      publish()
      l.raf = requestAnimationFrame(frame)
    }
    l.raf = requestAnimationFrame(frame)
  }

  // ---- まとめて（S セッション） -------------------------------------------------
  const runBulk = () => {
    if (busy || !valid) return
    const target = capSessions(S, N)
    let note = ""
    if (target !== S) {
      setForm((f) => ({ ...f, s: String(target) }))
      setParams((pr) => ({ ...pr, S: target }))
      note = `（回数が多すぎるためセッション数を ${fmtInt(target)} に減らしました）`
    }
    const l = loop.current
    const myRun = ++l.runId
    l.cancel = false
    setMode("bulk")
    const stats = statsRef.current
    let done = 0

    const frame = () => {
      if (myRun !== l.runId) return
      if (staleRun(stats)) return
      // 停止が押されていたら、このフレームではもう回さない（押した瞬間に止まる）
      if (!l.cancel) {
        const start = performance.now()
        while (done < target && performance.now() - start < FRAME_BUDGET_MS) {
          addSession(stats, runSession(p, N))
          done++
        }
      }
      publish()
      if (done < target && !l.cancel) {
        setStatus({ text: `${fmtInt(done)} / ${fmtInt(target)} セッション実行中…`, warn: false })
        l.raf = requestAnimationFrame(frame)
        return
      }
      setMode("idle")
      // 最後のフレームと停止が重なっても、全部終わっていれば「完了」として扱う
      if (done >= target) {
        setStatus({ text: `${fmtInt(done)} セッションを集計に加えました。${note}`, warn: false })
        se.playSe(se.seikai2)
      } else {
        setStatus({ text: `停止しました。完了した ${fmtInt(done)} セッションは集計に含めています。`, warn: true })
      }
    }
    l.raf = requestAnimationFrame(frame)
  }

  const stop = () => {
    if (busy) loop.current.cancel = true
  }

  const resetStats = () => {
    if (busy) return
    se.playSe(se.reset)
    const l = loop.current
    l.runId++
    cancelAnimationFrame(l.raf)
    statsRef.current = createStats(p, N)
    curRef.current = null
    publish()
    setStatus({ text: "集計をリセットしました。", warn: false })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center mb-1 text-gray-800 dark:text-gray-100">
        ガチャ確率シミュレーター
      </h1>
      <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-5">
        当たり確率と回す回数を決めて、「本当にどれくらい当たるのか」を何千回も試して確かめよう
      </p>

      <div className="flex flex-col gap-4">
        <FormulaCard p={p} N={N} theory={theory} />

        <SettingsPanel
          form={form}
          onDenom={onDenom}
          onPct={onPct}
          onN={onN}
          onS={onS}
          activePreset={activePreset}
          speed={speed}
          onSpeed={onSpeed}
          errors={errors}
          busy={busy}
        />

        <div>
          <div className="flex flex-wrap gap-2">
            <Btn color="brand" onClick={runOne} disabled={busy || !valid} className="px-4 py-2 md:text-base">
              {mode === "anim" ? "実行中…" : "1セッション引く"}
            </Btn>
            <Btn color="brand" onClick={runBulk} disabled={busy || !valid} className="px-4 py-2 md:text-base">
              {mode === "bulk" ? "実行中…" : `${fmtInt(S)}セッションまとめて`}
            </Btn>
            <Btn color="danger" onClick={stop} disabled={!busy} className="px-4 py-2 md:text-base">
              ■ 停止
            </Btn>
            <Btn color="neutral" onClick={resetStats} disabled={busy} sound="none" className="px-4 py-2 md:text-base">
              集計リセット
            </Btn>
          </div>
          <p
            className={`mt-2 min-h-[1.7em] text-sm ${status.warn ? "text-warm-700 dark:text-warm-300" : "text-gray-600 dark:text-gray-300"}`}
            aria-live="polite"
          >
            {status.text}
          </p>
        </div>

        <SessionStage p={p} N={N} cur={curView} />

        <ResultTabs stats={statsView} theory={theory} cur={curView} />

        <Card>
          <details className="text-sm text-gray-700 dark:text-gray-200">
            <summary className="cursor-pointer font-bold text-accent-700 dark:text-accent-300">
              授業のヒント：この教材で何が分かる？
            </summary>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><b>1回以上</b>：1/100 を 100 回引いても当たる人は 63% ほど。<b>「100回引けば1回は出る」は間違い</b>。</li>
              <li><b>当たり回数</b>：平均は N × p 回だが、0 回の人も 2 回以上の人もかなりいる（ばらつき）。</li>
              <li><b>初当たり</b>：1% のガチャなら、半分の人は 69 回目までに当たるが、残り半分は 69 回を超える。平均（100回）と中央値（69回）は違う。</li>
              <li>セッション数 S を増やすと、シミュレーションの値が理論値に近づく（大数の法則）。</li>
            </ul>
          </details>
        </Card>
      </div>
    </div>
  )
}

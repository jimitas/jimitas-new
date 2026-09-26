// ======================================================
// いまのセッション — カウンタ4つとカプセル
//
// N が CAPSULE_CAP 以下なら N 個のカプセルを全部ならべる。
// それより多いと画面が埋まるので、進み具合のバー（金色の線 = 当たりの位置）と
// 直近 RECENT 回のカプセルに切り替える。
//
// 当たりは色（CUD の黄橙）＋ ★ で区別する。色だけに頼らないため。
// ======================================================

import { formatPercent } from "../_lib/gachaMath"
import { HIT, MISS, UNDRAWN } from "../_lib/session"
import type { CurrentSession } from "../_lib/session"
import { fmtInt } from "../_lib/settings"
import { Card } from "./Card"

/** これを超える N はバー表示に切り替える */
export const CAPSULE_CAP = 600
/** バー表示のときに下へならべる直近のカプセル数 */
export const RECENT = 60

interface Props {
  p: number
  N: number
  cur: CurrentSession | null
}

function Capsule({ v, small = false }: { v: number; small?: boolean }) {
  const base = "aspect-square rounded-full border flex items-center justify-center leading-none"
  if (v === HIT) {
    return (
      <span className={`${base} bg-[#f6aa00] border-[#b87a00] text-[#5a3a00] ${small ? "text-[0.5rem]" : "text-[0.6rem]"}`}>
        ★
      </span>
    )
  }
  if (v === MISS) return <span className={`${base} bg-gray-300 border-gray-400 dark:bg-gray-500 dark:border-gray-400`} />
  return <span className={`${base} bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600`} />
}

function Counter({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2">
      <span className="block text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-lg md:text-xl tabular-nums text-gray-800 dark:text-gray-100">{children}</span>
    </div>
  )
}

const B = "text-accent-700 dark:text-accent-300"

export function SessionStage({ p, N, cur }: Props) {
  const k = cur?.k ?? 0
  const first = !cur ? "―" : cur.firstHit ? `${fmtInt(cur.firstHit)}回目` : cur.done ? "出ず" : cur.aborted ? "―" : "まだ"
  const big = N > CAPSULE_CAP

  // 直近 RECENT 回（古い順）。まだ引いていない枠は UNDRAWN
  const recent: number[] = []
  if (big) {
    for (let i = 0; i < RECENT; i++) {
      const idx = k - RECENT + i
      recent.push(cur && idx >= 0 ? cur.outcomes[idx] : UNDRAWN)
    }
  }

  return (
    <Card title="いまのセッション">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <Counter label="引いた回数"><b className={B}>{fmtInt(k)}</b> / {fmtInt(N)}</Counter>
        <Counter label="当たり"><b className={B}>{fmtInt(cur?.hits ?? 0)}</b> 回</Counter>
        <Counter label={`当たり率（設定 ${formatPercent(p)}）`}>
          <b className={B}>{cur && k > 0 ? formatPercent(cur.hits / k) : "―"}</b>
        </Counter>
        <Counter label="初当たり"><b className={B}>{first}</b></Counter>
      </div>

      {!big ? (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(15px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(20px,1fr))] gap-[3px] sm:gap-1"
          aria-label="カプセル。金色の★が当たり、灰色がはずれ"
        >
          {cur
            ? Array.from(cur.outcomes, (v, i) => <Capsule key={i} v={v} />)
            : Array.from({ length: N }, (_, i) => <Capsule key={i} v={UNDRAWN} />)}
        </div>
      ) : (
        <div>
          <div className="relative h-[22px] rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden" aria-hidden="true">
            <div className="h-full rounded-full bg-accent-500" style={{ width: `${(k / N) * 100}%` }} />
            {cur?.ticks.map((t) => (
              <span key={t} className="absolute inset-y-0 w-0.5 bg-[#f6aa00]" style={{ left: `${(t / N) * 100}%` }} />
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            回数が多いので進み具合をバーで表示しています。金色の線が当たりの位置です。下は直近 {RECENT} 回。
          </p>
          <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(16px,1fr))] gap-[3px]" aria-label={`直近${RECENT}回のカプセル`}>
            {recent.map((v, i) => <Capsule key={i} v={v} small />)}
          </div>
        </div>
      )}
    </Card>
  )
}

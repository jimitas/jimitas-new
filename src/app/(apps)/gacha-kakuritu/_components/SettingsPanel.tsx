// ======================================================
// 設定欄 — 当たり確率（分母 ⇔ %）・プリセット・N・S・アニメの速さ
//
// 入力欄の値は文字列のまま親が持つ（途中入力の "0." などを壊さないため）。
// 数値への変換と検証は _lib/settings.ts の readSettings がする。
// ======================================================

import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { N_MAX, S_MAX, fmtInt } from "../_lib/settings"
import type { SettingsForm } from "../_lib/settings"
import { Card } from "./Card"

export type Speed = "1" | "5" | "20" | "instant"

const PRESETS = ["0.5", "1", "3", "5"] as const
const SPEEDS: { value: Speed; label: string }[] = [
  { value: "1", label: "1x" },
  { value: "5", label: "5x" },
  { value: "20", label: "20x" },
  { value: "instant", label: "一気に" },
]

interface Props {
  form: SettingsForm
  /** 分母を書いた */
  onDenom: (v: string) => void
  /** % を書いた（プリセットもここを通る） */
  onPct: (v: string) => void
  onN: (v: string) => void
  onS: (v: string) => void
  /** 今の p と一致するプリセット。無ければ "" */
  activePreset: string
  speed: Speed
  onSpeed: (s: Speed) => void
  errors: string[]
  /** 実行中は設定を変えられない（速さだけは変えられる） */
  busy: boolean
}

const INPUT =
  "rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 " +
  "px-2 py-1 text-gray-800 dark:text-gray-100 tabular-nums " +
  "disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
const LABEL = "block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1"

export function SettingsPanel(props: Props) {
  const { form, busy, errors } = props
  return (
    <Card title="設定">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <div className="sm:col-span-2">
          <label htmlFor="gk-denom" className={LABEL}>当たり確率</label>
          <div className="flex flex-wrap items-center gap-2 text-lg text-gray-800 dark:text-gray-100">
            <span className="shrink-0">1 /</span>
            <input
              id="gk-denom" type="number" inputMode="decimal" min={1} step="any" aria-label="分母"
              className={`${INPUT} w-24 sm:w-28`} value={form.denom} disabled={busy}
              onChange={(e) => props.onDenom(e.target.value)}
            />
            <span className="shrink-0">＝</span>
            <input
              type="number" inputMode="decimal" min={0} max={100} step="any" aria-label="パーセント"
              className={`${INPUT} w-24 sm:w-28`} value={form.pct} disabled={busy}
              onChange={(e) => props.onPct(e.target.value)}
            />
            <span className="shrink-0">%</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="確率のプリセット">
            {PRESETS.map((v) => (
              <BtnMode key={v} value={v} current={props.activePreset} onChange={props.onPct} disabled={busy} className="py-1">
                {v}%
              </BtnMode>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="gk-n" className={LABEL}>1セッションで回す回数 N</label>
          <input
            id="gk-n" type="number" inputMode="numeric" min={1} max={N_MAX} step={1}
            className={`${INPUT} w-36`} value={form.n} disabled={busy}
            onChange={(e) => props.onN(e.target.value)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">1〜{fmtInt(N_MAX)}</p>
        </div>

        <div>
          <label htmlFor="gk-s" className={LABEL}>まとめて回すセッション数 S</label>
          <input
            id="gk-s" type="number" inputMode="numeric" min={1} max={S_MAX} step={1}
            className={`${INPUT} w-36`} value={form.s} disabled={busy}
            onChange={(e) => props.onS(e.target.value)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">1〜{fmtInt(S_MAX)}</p>
        </div>

        <div className="sm:col-span-2">
          <span className={LABEL} id="gk-speed">アニメの速さ</span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="gk-speed">
            {SPEEDS.map((s) => (
              <BtnMode key={s.value} value={s.value} current={props.speed} onChange={props.onSpeed} className="py-1">
                {s.label}
              </BtnMode>
            ))}
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <p className="mt-3 rounded-lg bg-danger-50 dark:bg-danger-700 px-3 py-2 text-sm text-danger-700 dark:text-danger-50" aria-live="polite">
          {errors.join(" ")}
        </p>
      )}
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        確率 p か回数 N を変えると、それまでの集計はリセットされます（分布が混ざらないようにするため）。
      </p>
    </Card>
  )
}

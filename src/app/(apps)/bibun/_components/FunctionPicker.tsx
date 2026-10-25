// ======================================================
// 関数の選択（全タブ共通。選択はタブを切りかえても残る）
//
// プリセット5種（要件 §3.1）＋「自分で作る」（3次以下の多項式の係数を入力）。
// 係数の入力欄が空・範囲外のあいだは、前の正しい関数のまま（グラフを消さない）。
// ======================================================

"use client"

import { COEF_LIMIT, PRESETS, formatPoly } from "../_lib/polynomial"
import type { CoefText } from "../_lib/polynomial"

export const CUSTOM_ID = "custom"

interface Props {
  /** プリセットの id か CUSTOM_ID */
  choice: string
  /** 自分で作るときの係数の入力（c3, c2, c1, c0 の順の文字列） */
  coefText: CoefText
  onChoice: (id: string) => void
  onCoefText: (t: CoefText) => void
  /** 入力エラーの文言（なければ null） */
  error: string | null
  disabled?: boolean
}

const COEF_LABELS = ["x³ の係数", "x² の係数", "x の係数", "定数"]

export function FunctionPicker({ choice, coefText, onChoice, onCoefText, error, disabled = false }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <label htmlFor="bibun-fn" className="font-bold text-gray-700 dark:text-gray-200 shrink-0">関数</label>
      <select
        id="bibun-fn"
        value={choice}
        disabled={disabled}
        onChange={(e) => onChoice(e.target.value)}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-lg text-gray-800 dark:text-gray-100 disabled:opacity-50"
      >
        {PRESETS.map((p) => (
          <option key={p.id} value={p.id}>y = {formatPoly(p.poly)}</option>
        ))}
        <option value={CUSTOM_ID}>自分で作る（係数を入力）</option>
      </select>

      {choice === CUSTOM_ID && (
        <div className="flex flex-wrap items-center gap-1 text-lg text-gray-800 dark:text-gray-100">
          <span>y =</span>
          {(["x³ +", "x² +", "x +", ""] as const).map((suffix, i) => (
            <span key={i} className="flex items-center gap-1">
              <input
                type="number" inputMode="decimal" step="any" min={-COEF_LIMIT} max={COEF_LIMIT}
                aria-label={COEF_LABELS[i]}
                disabled={disabled}
                value={coefText[i]}
                onChange={(e) => {
                  const next: CoefText = [...coefText]
                  next[i] = e.target.value
                  onCoefText(next)
                }}
                className="w-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1 py-1 text-right tabular-nums"
              />
              {suffix && <span>{suffix}</span>}
            </span>
          ))}
        </div>
      )}
      {error && (
        <p className="w-full text-sm text-danger-700 dark:text-danger-300" aria-live="polite">{error}</p>
      )}
    </div>
  )
}

// ======================================================
// 方式のタブ（A方式 ／ B方式 ／ 必要なら「両方」）
//
// BtnMode と同じふるまい（押すと se.set・同じものをもう一度押しても何もしない）。
// 選択中の色を方式の色にしたいので、BtnMode の className 上書きではなくここで描く。
// （BtnMode は選択中の bg-brand-500 を持っていて、後から渡すクラスでは確実に消せないため）
// ======================================================

"use client"

import * as se from "@/lib/se"
import type { Method } from "../_lib/dice"
import { METHOD_LABEL, METHOD_RULE, METHOD_TAB_ACTIVE } from "./methodStyle"

export type MethodChoice = Method | "AB"

interface Props<T extends MethodChoice> {
  options: readonly T[]
  current: T
  onChange: (v: T) => void
  disabled?: boolean
}

export function MethodTabs<T extends MethodChoice>({ options, current, onChange, disabled = false }: Props<T>) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="方式">
      {options.map((o) => {
        const active = o === current
        const activeClass = o === "AB" ? "bg-gray-700 text-white border-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200" : METHOD_TAB_ACTIVE[o as Method]
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => {
              if (disabled || active) return
              se.playSe(se.set)
              onChange(o)
            }}
            className={`shrink-0 px-4 py-2 rounded-lg border-2 font-bold text-base text-left leading-tight transition-colors active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed
              ${active ? activeClass : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"}`}
          >
            {o === "AB" ? "A・B 両方" : METHOD_LABEL[o as Method]}
            {o !== "AB" && <span className="block text-xs font-normal">{METHOD_RULE[o as Method]}</span>}
          </button>
        )
      })}
    </div>
  )
}

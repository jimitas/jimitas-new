// ======================================================
// 数式の部品（分数・lim）
//
// KaTeX などのライブラリは入れず、HTML と CSS の縦積みで描く（2026-10-25 オーナー決定）。
// 扱う式は (f(a+h) − f(a))/h・lim・f'(a) 程度なので、これで足りる。
// ======================================================

import type { ReactNode } from "react"

/** 分数。分子の上に線を引かず、分母の上に線を引く（分子と分母の幅の広いほうに合わせて伸びる） */
export function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center align-middle mx-1 leading-tight">
      <span className="px-1">{num}</span>
      <span className="px-1 self-stretch text-center border-t-2 border-current">{den}</span>
    </span>
  )
}

/** lim（下に h → 0） */
export function Lim({ to = "h → 0" }: { to?: string }) {
  return (
    <span className="inline-flex flex-col items-center align-middle mx-1 leading-none">
      <span>lim</span>
      <span className="text-xs mt-0.5 whitespace-nowrap">{to}</span>
    </span>
  )
}

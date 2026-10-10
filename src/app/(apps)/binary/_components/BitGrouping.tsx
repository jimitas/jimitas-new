// ======================================================
// ビットのまとまり図解
//   GroupFromBinary … 2進数 → 8/16進数（右から3つ/4つずつまとめる）
//   ExpandToBinary  … 8/16進数 → 2進数（1桁を3ビット/4ビットに広げる）
//
// どちらも「ビットのまとまり」と「1桁」を縦に対応させて並べる。
// 左はしの意味のない0（補った0／取りのぞく0）は点線で薄く表示する。
// ======================================================

import { groupBits, expandDigits, bitsPerDigit } from "../_lib/explain"

/** 答えの行（「→ 12(8)」） */
function Result({ label, value, base }: { label: string; value: string; base: number }) {
  return (
    <p>
      {label} →{" "}
      <b className="font-mono text-xl text-accent-700 dark:text-accent-300 break-all">{value}</b>
      <span className="text-sm text-gray-400 dark:text-gray-500">({base})</span>
    </p>
  )
}

/** 1ビットのマス（既存の BitDisplay と同じ見た目）。faint は意味のない0 */
export function BitCell({ bit, faint = false }: { bit: string; faint?: boolean }) {
  return (
    <div
      className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm font-mono
        ${faint
          ? "border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
          : bit === "1"
            ? "bg-brand-400 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}
    >
      {bit}
    </div>
  )
}

interface Column {
  bits: string
  faint: number // 左から何ビットを薄くするか
  digit: string
}

/** まとまりの列を横に並べる。digitTop=true なら 1桁 → ビット の向き */
function Columns({ columns, digitTop }: { columns: Column[]; digitTop: boolean }) {
  return (
    // 狭い画面ではまとまりごと次の行へ折り返す（まとまりの途中では切らない）
    <div>
      <div className="flex flex-wrap gap-3 justify-center py-1">
        {columns.map((c, ci) => {
          const size = c.bits.length
          const bitsRow = (
            <div>
              {/* 位の重み（4 2 1 / 8 4 2 1） */}
              <div className="flex gap-0.5 mb-0.5">
                {c.bits.split("").map((_, i) => (
                  <div key={i} className="w-8 text-center text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                    {2 ** (size - 1 - i)}
                  </div>
                ))}
              </div>
              <div className="flex gap-0.5">
                {c.bits.split("").map((b, i) => <BitCell key={i} bit={b} faint={i < c.faint} />)}
              </div>
            </div>
          )
          const digit = (
            <div className="text-2xl font-bold font-mono text-accent-700 dark:text-accent-300">{c.digit}</div>
          )
          return (
            <div key={ci} className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 dark:bg-gray-900 px-2 py-2">
              {digitTop ? digit : bitsRow}
              <div className="text-gray-400 dark:text-gray-500 leading-none" aria-hidden>↓</div>
              {digitTop ? bitsRow : digit}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 2進数 → 8/16進数 */
export function GroupFromBinary({ binary, to }: { binary: string; to: 8 | 16 }) {
  const size = bitsPerDigit(to)
  const columns = groupBits(binary, size).map(g => ({ bits: g.bits, faint: g.padded, digit: g.digit }))
  const hasPad = columns[0].faint > 0
  return (
    <div className="space-y-2">
      <p>
        2進数を<b>右から{size}けたずつ</b>区切り、まとまりごとに{to}進数の1けたにする。
        {to === 16 && <>（10〜15 は A〜F）</>}
      </p>
      <Columns columns={columns} digitTop={false} />
      {hasPad && (
        <p className="text-xs text-gray-500 dark:text-gray-400">点線の 0 は、{size}けたにそろえるために左に足した 0</p>
      )}
      <Result label="並べると" value={columns.map(c => c.digit).join("")} base={to} />
    </div>
  )
}

/** 8/16進数 → 2進数 */
export function ExpandToBinary({ str, from }: { str: string; from: 8 | 16 }) {
  const size = bitsPerDigit(from)
  const columns = expandDigits(str, from)
  const hasLeadingZero = columns[0].faint > 0
  return (
    <div className="space-y-2">
      <p>{from}進数の<b>1けたを、2進数{size}けた</b>に直して並べる。</p>
      <Columns columns={columns} digitTop />
      {hasLeadingZero && (
        <p className="text-xs text-gray-500 dark:text-gray-400">点線の 0 は、いちばん左なので取りのぞく</p>
      )}
      <Result
        label={hasLeadingZero ? "左の0を取って並べると" : "並べると"}
        value={columns.map(c => c.bits.slice(c.faint)).join("")}
        base={2}
      />
    </div>
  )
}

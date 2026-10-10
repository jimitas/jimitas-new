// ======================================================
// わり算の筆算（すだれ算）: 10進数 → 2/8/16進数
//
//   2 ) 10
//   2 )  5 … 0   ↑
//   2 )  2 … 1   ↑ あまりを下から読む
//   2 )  1 … 0   ↑
//        0 … 1   ↑
//
// グリッド4列: [わる数][わられる数][あまり][↑の矢印]
// 矢印はあまりの行（2行目〜最後）にまたがる1本の線で描く。
// ======================================================

import { divisionSteps, ladderRows, readRemainders } from "../_lib/explain"
import type { Base } from "../_lib/converter"

const DIGIT = (n: number) => n.toString(16).toUpperCase()

export function DivisionLadder({ decimal, to }: { decimal: number; to: Base }) {
  const steps = divisionSteps(decimal, to)

  if (steps.length === 0) {
    return <p>0 は、どの進数でも <b className="font-mono">0</b> のまま。</p>
  }

  const n = steps.length
  const rows = ladderRows(steps)
  const result = readRemainders(steps)

  return (
    <div className="space-y-2">
      <p>
        <b>{to} でわり続けて</b>、あまりを右に書く。商が 0 になったら終わり。
      </p>
      <div className="overflow-x-auto">
        <div
          className="grid w-max mx-auto font-mono text-xl tabular-nums items-center gap-x-1"
          style={{ gridTemplateColumns: "auto auto auto auto" }}
        >
          {rows.map(({ value, remainder: r }, row) => {
            const isLast = row === n
            return (
              <div key={row} className="contents">
                {/* わる数 */}
                <div className="text-right pr-1 text-gray-500 dark:text-gray-400" style={{ gridRow: row + 1, gridColumn: 1 }}>
                  {isLast ? "" : to}
                </div>
                {/* わられる数（すだれの形: 左と下に線） */}
                <div
                  className={`text-right px-2 py-1 min-w-[3.5ch] text-gray-800 dark:text-gray-100
                    ${isLast ? "" : "border-l-2 border-b-2 border-gray-500 dark:border-gray-400"}`}
                  style={{ gridRow: row + 1, gridColumn: 2 }}
                >
                  {value}
                </div>
                {/* あまり */}
                <div className="pl-2 whitespace-nowrap" style={{ gridRow: row + 1, gridColumn: 3 }}>
                  {r !== null && (
                    <>
                      <span className="text-gray-400 dark:text-gray-500">…</span>
                      <b className="text-accent-700 dark:text-accent-300">{r}</b>
                      {r >= 10 && (
                        <span className="text-base text-gray-500 dark:text-gray-400">
                          {" "}→ <b className="text-accent-700 dark:text-accent-300">{DIGIT(r)}</b>
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
          {/* あまりを下から読む矢印 */}
          <div
            className="flex flex-col items-center self-stretch ml-2 text-accent-500"
            style={{ gridRow: `2 / ${n + 2}`, gridColumn: 4 }}
            aria-hidden
          >
            <div className="leading-none text-base">▲</div>
            <div className="flex-1 w-[3px] bg-accent-500 rounded" />
          </div>
        </div>
      </div>
      <p>
        あまりを<b>下から上へ</b>読むと →{" "}
        <b className="font-mono text-xl text-accent-700 dark:text-accent-300">{result}</b>
        <span className="text-sm text-gray-400 dark:text-gray-500">({to})</span>
      </p>
    </div>
  )
}

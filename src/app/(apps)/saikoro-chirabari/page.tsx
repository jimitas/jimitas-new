// ======================================================
// さいころの散らばりシミュレーター ページ
//
// URL: /saikoro-chirabari
// 対象: 高校 数学Ⅰ「データの分析」（後期スクーリング「平均が同じなら、同じデータ？」）
// 仕様: docs/要件定義書_さいころ散らばりシミュレータ.md
//
// 縦スクロール1ページ。授業ではセクション 1 → 3 の順に使い、2・4 は生徒が後から触る想定。
//   1 ふってみる                     … TrySection
//   2 A方式とB方式をくらべる          … CompareSection
//   3 10回だと、どれくらいブレる？    … SetsSection（中核）
//   4 自分の班のデータを入れてみる    … GroupSection
//
// 計算はすべて _lib/（jest でテスト済み）。ここはセクション3と4のつなぎだけを持つ。
// 乱数はボタンを押したときにだけ引く（初期 state に乱数を書くと SSR と食い違うため）。
// ======================================================

"use client"

import { useMemo, useState } from "react"
import type { Method } from "./_lib/dice"
import { readGroup } from "./_lib/input"
import { sd } from "./_lib/stats"
import { CompareSection } from "./_components/CompareSection"
import { EMPTY_CELLS, GroupSection } from "./_components/GroupSection"
import { SetsSection, useSets } from "./_components/SetsSection"
import { TrySection } from "./_components/TrySection"

const NAV = [
  { id: "furu", label: "① ふってみる" },
  { id: "kuraberu", label: "② A方式とB方式をくらべる" },
  { id: "bure", label: "③ 10回だと、どれくらいブレる？" },
  { id: "han", label: "④ 自分の班のデータ" },
]

export default function SaikoroChirabariPage() {
  const sets = useSets()
  const [groupMethod, setGroupMethod] = useState<Method>("A")
  const [cells, setCells] = useState<string[]>(EMPTY_CELLS)

  // 班のデータが10個そろったら、その標準偏差をセクション3のマーカーに渡す
  const group = useMemo(() => {
    const { values } = readGroup(cells, groupMethod)
    return values ? { method: groupMethod, sd: sd(values) } : null
  }, [cells, groupMethod])

  const showInSets = () => {
    sets.select(groupMethod)
    document.getElementById("bure")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-gray-100">
        さいころの散らばりシミュレーター
      </h1>
      <p className="mt-1 text-base sm:text-lg text-center text-gray-600 dark:text-gray-300">
        〜10回じゃ足りない？〜 平均が同じでも、散らばりはちがう。そして10回だと、標準偏差はブレる。
      </p>

      <nav aria-label="このページの中" className="my-4 flex flex-wrap justify-center gap-2">
        {NAV.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            className="rounded-full border-2 border-brand-300 dark:border-brand-700 px-3 py-1 text-sm font-bold text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900"
          >
            {n.label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-6">
        <TrySection />
        <CompareSection />
        <SetsSection sets={sets} group={group} />
        <GroupSection
          method={groupMethod}
          onMethod={setGroupMethod}
          cells={cells}
          onCells={setCells}
          onShowInSets={showInSets}
        />

        <footer className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-gray-800 dark:text-gray-100">
          <h2 className="text-lg font-bold">用語のおさらい</h2>
          <dl className="mt-2 grid gap-3 sm:grid-cols-3 text-base">
            <div>
              <dt className="font-bold">偏差</dt>
              <dd>それぞれの値 − 平均。偏差を全部たすと必ず 0 になる。</dd>
            </div>
            <div>
              <dt className="font-bold">分散</dt>
              <dd>偏差の2乗の平均。（偏差の2乗の合計）÷（データの個数）</dd>
            </div>
            <div>
              <dt className="font-bold">標準偏差</dt>
              <dd>√分散。データの散らばりを、もとの値と同じ単位で表したもの。</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            A方式：さいころ2個の合計。B方式：さいころ1個の目を2倍。どちらも得点は 2〜12、理論的には平均 7。
            理論的な標準偏差は A方式 約2.42、B方式 約3.42。
          </p>
        </footer>
      </div>
    </div>
  )
}

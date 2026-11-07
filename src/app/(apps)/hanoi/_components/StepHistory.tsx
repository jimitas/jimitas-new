// ======================================================
// ステップ⑤ 歴史と解き方（読みもの）。文言は _lib/textHistory.ts
// ======================================================

"use client"

import { Btn } from "@/components/parts/buttons/Btn"
import { initialPegs } from "../_lib/solve"
import { TIP_LINES, TIP_TITLE } from "../_lib/text"
import type { Tab } from "../_lib/text"
import * as T from "../_lib/textHistory"
import { HanoiBoard } from "./HanoiBoard"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2" aria-label={title}>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
      {children}
    </section>
  )
}

const li = "text-gray-700 dark:text-gray-200"

export function StepHistory({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  return (
    <div className="space-y-8">
      <p className={li}>{T.HISTORY_INTRO}</p>

      <Section title={T.RULE_TITLE}>
        <div className="max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
          <HanoiBoard pegs={initialPegs(3)} n={3} ariaLabel="はじめの状態（3枚）" />
        </div>
        <ul className="list-disc pl-5 space-y-1">
          {T.RULE_LINES.map((l) => (
            <li key={l} className={li}>{l}</li>
          ))}
        </ul>
      </Section>

      <Section title={T.STORY_TITLE}>
        <ul className="list-disc pl-5 space-y-1" data-story>
          {T.STORY_LINES.map((l) => (
            <li key={l} className={li}>{l}</li>
          ))}
        </ul>
      </Section>

      <Section title={T.IDEA_TITLE}>
        <ol className="list-decimal pl-5 space-y-1">
          {T.IDEA_LINES.map((l) => (
            <li key={l} className={li}>{l}</li>
          ))}
        </ol>
        <Btn color="accent" onClick={() => onGoTab(2)} className="px-4 py-2 shrink-0">{T.IDEA_LINK}</Btn>
      </Section>

      <Section title={TIP_TITLE}>
        <ul className="list-disc pl-5 space-y-1">
          {TIP_LINES.map((l) => (
            <li key={l} className={li}>{l}</li>
          ))}
        </ul>
      </Section>

      <Section title={T.FORMULA_TITLE}>
        <ul className="space-y-1">
          {T.FORMULA_LINES.map((l) => (
            <li key={l} className="text-xl font-bold text-gray-900 dark:text-gray-50">{l}</li>
          ))}
        </ul>
      </Section>

      <Section title={T.MORE_TITLE}>
        <ul className="list-disc pl-5 space-y-1" data-more>
          {T.MORE_LINES.map((l) => (
            <li key={l} className={li}>{l}</li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

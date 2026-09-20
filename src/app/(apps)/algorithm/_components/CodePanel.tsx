// ======================================================
// コード例（3言語）と行ハイライト
//
// Step 全体ではなく codeTag と lang だけを受け取る。
// 再生中は毎ステップ再レンダーされるので、渡すものを減らしておく。
//
// ハイライトする行は「行番号の表」ではなく、コード例の各行に
// 付いたタグから引く。行を足し引きしてもずれない。
// ======================================================

"use client"

import { memo, useEffect, useMemo, useRef } from "react"
import { Btn } from "@/components/parts/buttons/Btn"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { CODE_BOOK, LANG_LABEL, buildTagIndex } from "../_lib/codeSamples"
import type { AlgoId, CodeTag, LangId } from "../_lib/types"

const LANGS: LangId[] = ["python", "javascript", "kyotsu"]

type Props = {
  algoId: AlgoId
  lang: LangId
  onLangChange: (lang: LangId) => void
  /** いま光らせる行のラベル */
  codeTag: CodeTag
  /** 開いているか。状態は page.tsx が持つ */
  open: boolean
  onToggle: () => void
}

function CodePanelInner({ algoId, lang, onLangChange, codeTag, open, onToggle }: Props) {
  const sample = CODE_BOOK[algoId][lang]
  const index = useMemo(() => buildTagIndex(sample), [sample])
  const highlighted = new Set(index[codeTag] ?? [])
  const firstLine = index[codeTag]?.[0]

  // 光っている行が枠の外に出たら、枠の中だけをスクロールして見えるようにする。
  // ページ全体は動かさない（棒グラフが画面から消えてしまうため、
  // scrollIntoView は使わずに scrollTop を直接調整する）。
  const boxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = boxRef.current
    if (!open || box === null || firstLine === undefined) return
    const line = box.querySelector<HTMLElement>(`[data-line="${firstLine}"]`)
    if (line === null) return
    // offsetTop は「位置指定された祖先」からの距離なので、枠の基準にならない。
    // 画面上の矩形どうしの差で測る。
    const boxRect = box.getBoundingClientRect()
    const lineRect = line.getBoundingClientRect()
    const margin = 8
    if (lineRect.top < boxRect.top + margin) {
      box.scrollTop -= boxRect.top + margin - lineRect.top
    } else if (lineRect.bottom > boxRect.bottom - margin) {
      box.scrollTop += lineRect.bottom - (boxRect.bottom - margin)
    }
  }, [firstLine, open, lang, algoId])

  return (
    <section className="mt-4">
      {/*
        棒グラフと見くらべたいので、たたんだときの高さをできるだけ小さくする。
        見出しそのものを開閉ボタンにして、1行で済ませている。
      */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Btn color="neutral" onClick={onToggle} className="px-3 py-1.5">
          <span aria-hidden="true" className="mr-1">
            {open ? "▼" : "▶"}
          </span>
          プログラムの例
        </Btn>
        {open &&
          LANGS.map((id) => (
            <BtnMode key={id} value={id} current={lang} onChange={onLangChange}>
              {LANG_LABEL[id]}
            </BtnMode>
          ))}
      </div>

      {/*
        閉じているときは hidden で消す（アンマウントしない）。
        再生中に開閉しても、言語タブの選択や横スクロール位置が飛ばない。
      */}
      {/*
        高さに上限をつける。
        JavaScript は閉じ括弧のぶん行数が多く、この先のクイックソート・
        マージソートはもっと長くなる。上限が無いと 1024×768 で
        棒グラフとコードが同時に見えなくなってしまう。
      */}
      <div
        ref={boxRef}
        hidden={!open}
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-auto max-h-56"
      >
        {/*
          ハイライトはダークでベタ塗りにすると眩しいので、
          薄い面（/30）＋左の帯で「この行が動いている」を示す。
        */}
        <pre className="text-[13px] leading-6 py-2">
          {sample.map((line, i) => (
            <div
              key={i}
              data-line={i}
              className={`flex px-2 border-l-4 ${
                highlighted.has(i)
                  ? "bg-warm-100 dark:bg-warm-900/30 border-l-warm-400"
                  : "border-l-transparent"
              }`}
            >
              <span className="shrink-0 w-8 pr-2 text-right select-none text-gray-400 dark:text-gray-500 tabular-nums">
                {i + 1}
              </span>
              <code
                className={`whitespace-pre font-mono ${
                  highlighted.has(i)
                    ? "text-gray-900 dark:text-warm-200 font-bold"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {line.text || " "}
              </code>
            </div>
          ))}
        </pre>
      </div>

      {/*
        クイックソートだけ「関数の定義」を補っている。
        自分自身を呼ぶ形がアルゴリズムの本質なので書き方は変えず、
        公式の例示に載っていないことを画面に断る。
      */}
      {open && lang === "kyotsu" && algoId === "quick" && (
        <p className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-warm-400 bg-white dark:bg-gray-900 px-3 py-2 text-[11px] text-gray-700 dark:text-gray-200">
          <strong>関数の定義のしかたは、公式の例示には出ていません。</strong>
          クイックソートは「自分自身をもう一度よぶ」ことがしくみの中心なので、
          ここでは Python の書き方に合わせて{" "}
          <code className="font-mono">関数 名前(引数):</code> と書いています。
          共通テストでこの形が出るとはかぎりません。
        </p>
      )}

      {open && lang === "kyotsu" && (
        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
          大学入学共通テスト『情報Ⅰ』で使われる表記です。｜と⎿ が処理のまとまりを表し、
          ⎿ がそのまとまりの終わりを示します。配列の添字は 0 から始まります。
        </p>
      )}
    </section>
  )
}

export const CodePanel = memo(CodePanelInner)

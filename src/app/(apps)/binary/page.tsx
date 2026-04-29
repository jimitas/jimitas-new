"use client"
import { useState } from "react"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import * as se from "@/lib/se"
import { type Base, toBase, fromBase, isValidForBase } from "./_lib/converter"

const BASE_LABELS: Record<Base, string> = {
  2: "2進数",
  8: "8進数",
  10: "10進数",
  16: "16進数",
}

const BASES: Base[] = [2, 8, 10, 16]

// 2進数のビット表示
function BitDisplay({ decimal }: { decimal: number }) {
  if (isNaN(decimal) || decimal < 0 || decimal > 65535) return null
  const bits = decimal.toString(2).padStart(Math.max(4, Math.ceil(decimal.toString(2).length / 4) * 4), "0")
  // 4ビットずつグループ化
  const groups: string[] = []
  for (let i = 0; i < bits.length; i += 4) groups.push(bits.slice(i, i + 4))

  return (
    <div className="flex flex-wrap gap-1 justify-center mt-3">
      {groups.map((group, gi) => (
        <div key={gi} className="flex gap-0.5">
          {group.split("").map((bit, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm
                ${bit === "1" ? "bg-brand-400 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"}`}
            >
              {bit}
            </div>
          ))}
        </div>
      ))}
      <div className="w-full text-center text-xs text-gray-400 dark:text-gray-500 mt-1">
        {bits.length}ビット
      </div>
    </div>
  )
}

export default function BinaryPage() {
  const [inputBase, setInputBase] = useState<Base>(10)
  const [inputValue, setInputValue] = useState("")
  const [showBits, setShowBits] = useState(true)

  const decimal = inputValue === "" ? NaN : fromBase(inputValue, inputBase)
  const isValid = inputValue === "" || (!isNaN(decimal) && decimal >= 0)

  function handleInput(value: string) {
    if (value === "" || isValidForBase(value, inputBase)) {
      setInputValue(value.toUpperCase())
    }
  }

  function step(delta: 1 | -1) {
    const next = (isNaN(decimal) ? 0 : decimal) + delta
    if (next < 0) return
    se.playSe(se.pi)
    setInputValue(toBase(next, inputBase))
  }

  function handleBaseChange(newBase: Base) {
    if (!isNaN(decimal)) {
      setInputValue(toBase(decimal, newBase))
    } else {
      setInputValue("")
    }
    setInputBase(newBase)
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
        🔣 進数変換
      </h1>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
        2進数・8進数・10進数・16進数を じゆうに へんかんしよう
      </p>

      {/* 入力モード選択 */}
      <div className="mb-2 text-sm text-gray-500 dark:text-gray-400 text-center">入力する進数</div>
      <div className="flex gap-2 justify-center mb-4">
        {BASES.map(b => (
          <BtnMode key={b} value={b} current={inputBase} onChange={handleBaseChange}>
            {BASE_LABELS[b]}
          </BtnMode>
        ))}
      </div>

      {/* 入力フィールド */}
      <div className="bg-white dark:bg-gray-800 border-2 border-brand-400 rounded-xl p-4 mb-4">
        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
          {BASE_LABELS[inputBase]}で入力
        </label>
        <div className="flex items-stretch gap-2">
          <button
            onClick={() => step(-1)}
            disabled={isNaN(decimal) || decimal <= 0}
            className="px-3 rounded-lg text-2xl font-bold bg-accent-400 hover:bg-accent-500 active:bg-accent-600 text-white disabled:opacity-30 transition-colors select-none"
            aria-label="1減らす"
          >
            ▼
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={e => handleInput(e.target.value)}
            placeholder={`${BASE_LABELS[inputBase]}の数を入力`}
            className={`flex-1 text-2xl font-bold font-mono px-3 py-2 rounded-lg border-2 bg-gray-50 dark:bg-gray-900
              ${isValid ? "border-brand-300 dark:border-brand-700" : "border-danger-400"}`}
          />
          <button
            onClick={() => step(1)}
            className="px-3 rounded-lg text-2xl font-bold bg-accent-400 hover:bg-accent-500 active:bg-accent-600 text-white transition-colors select-none"
            aria-label="1増やす"
          >
            ▲
          </button>
        </div>
        {!isValid && inputValue && (
          <p className="text-danger-500 text-sm mt-1">{BASE_LABELS[inputBase]}では使えない文字が含まれています</p>
        )}
      </div>

      {/* 変換結果一覧 */}
      {!isNaN(decimal) && decimal >= 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {BASES.map(b => (
            <div
              key={b}
              onClick={() => { se.playSe(se.pi); setInputValue(toBase(decimal, b)); setInputBase(b) }}
              className={`rounded-xl border-2 p-3 cursor-pointer transition-all
                ${b === inputBase
                  ? "border-brand-400 bg-brand-50 dark:bg-brand-900/30"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300"}`}
            >
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{BASE_LABELS[b]}</div>
              <div className="text-xl font-bold font-mono text-gray-800 dark:text-gray-100 break-all">
                {toBase(decimal, b)}
                <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-0.5">({b})</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ビット表示（2進数ビジュアル） */}
      {!isNaN(decimal) && decimal >= 0 && decimal <= 65535 && (
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">2進数ビット表示</span>
            <button
              onClick={() => setShowBits(v => !v)}
              className="text-xs text-accent-500 hover:text-accent-600"
            >
              {showBits ? "隠す" : "表示"}
            </button>
          </div>
          {showBits && <BitDisplay decimal={decimal} />}
        </div>
      )}

      {/* 解説 */}
      <details className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-4">
        <summary className="px-4 py-3 cursor-pointer text-sm font-bold text-gray-600 dark:text-gray-300 select-none">
          ▼ 進数のしくみ
        </summary>
        <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 space-y-2 pt-2">
          <p><strong>2進数</strong>: 0と1だけを使う。コンピュータの基本。</p>
          <p><strong>8進数</strong>: 0〜7の8種類。2進数を3桁まとめると変換できる。</p>
          <p><strong>10進数</strong>: 私たちが普段使う0〜9の10種類。</p>
          <p><strong>16進数</strong>: 0〜9とA〜Fの16種類。2進数を4桁まとめると変換できる。</p>
          <p className="text-xs text-gray-400 mt-2">変換結果をクリックすると、その進数で入力モードに切り替わります。</p>
        </div>
      </details>
    </main>
  )
}

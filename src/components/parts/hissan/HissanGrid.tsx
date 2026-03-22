// ======================================================
// HissanGrid — 筆算グリッド表示コンポーネント
//
// Props:
//   rows         - 各行の定義（HissanRow[]）
//   selectedCell - 現在選択中のセル座標（null = 未選択）
//   onCellClick  - 編集可能セルをクリックしたときのコールバック
//
// 行・セルのスタイルはすべて HissanRow / HissanCell で制御し、
// このコンポーネントはビジネスロジックを持たない純粋な表示部品。
// ======================================================

// ── 型定義 ────────────────────────────────────────────

// セルのテキスト表示スタイル
export type TextStyle =
  | "normal"     // text-2xl font-bold text-gray-800（数字・記号）
  | "carry"      // text-sm text-red-500 font-semibold（くり上がり行）
  | "sign"       // text-2xl font-bold text-gray-800（＋ / － / ×）
  | "correct"    // text-2xl font-bold text-brand-600（正解時）
  | "red-small"  // text-sm text-red-500 font-semibold（くり下がり "10"）

export type HissanCell = {
  text: string              // セルに表示するメインテキスト
  strikeText?: string       // 取り消し線つきテキスト（ひき算くり下がり元の数字）
  reducedText?: string      // 取り消し線の右上に表示する小さいテキスト（-1後の数字）
  isEditable: boolean       // タップ可能か
  bg: "white" | "yellow"   // 背景色（white=白, yellow=amber-50）
  textStyle: TextStyle      // テキストのスタイル
}

export type HissanRow = {
  cells: HissanCell[]
  height: "sm" | "md"       // sm=h-8（くり上がり行）, md=h-14（通常行）
  hasBottomBorder?: boolean  // true → border-b-4 border-b-gray-700（筆算の横線）
}

interface HissanGridProps {
  rows: HissanRow[]
  selectedCell: { r: number; c: number } | null
  onCellClick: (r: number, c: number) => void
}

// ── テキストスタイルのクラス対応 ──────────────────────

const TEXT_STYLE_CLS: Record<TextStyle, string> = {
  normal:    "text-2xl font-bold text-gray-800",
  carry:     "text-sm text-red-500 font-semibold",
  sign:      "text-2xl font-bold text-gray-800",
  correct:   "text-2xl font-bold text-brand-600",
  "red-small": "text-sm text-red-500 font-semibold",
}

// ── コンポーネント ────────────────────────────────────

export function HissanGrid({ rows, selectedCell, onCellClick }: HissanGridProps) {
  return (
    <div className="inline-block">
      {rows.map((row, r) => (
        <div key={r} className="flex">
          {row.cells.map((cell, c) => {
            const isSelected = selectedCell?.r === r && selectedCell?.c === c
            const heightCls  = row.height === "sm" ? "h-8" : "h-14"
            const bgCls      = cell.bg === "yellow" ? "bg-amber-50" : "bg-white"
            const borderBCls = row.hasBottomBorder ? "border-b-4 border-b-gray-700" : ""
            // 編集可能 & 選択中のときリングを表示
            const ringCls    = (cell.isEditable && isSelected)
              ? "ring-2 ring-inset ring-brand-500 z-10 relative"
              : ""
            const cursorCls  = cell.isEditable ? "cursor-pointer" : ""
            const textCls    = TEXT_STYLE_CLS[cell.textStyle]

            return (
              <div
                key={c}
                data-row={r}
                data-col={c}
                {...(cell.isEditable ? { "data-editable": "true" } : {})}
                onClick={() => cell.isEditable && onCellClick(r, c)}
                className={`w-14 ${heightCls} flex items-center justify-center
                  border border-gray-400
                  ${bgCls} ${borderBCls} ${ringCls} ${cursorCls}`}
              >
                {/* くり下がり表示: 元の数字（取り消し線）+ 右上に減算後の数字 */}
                {cell.strikeText != null ? (
                  <span className="relative inline-flex items-center justify-center">
                    {/* 取り消し線つきの元の数字（グレー） */}
                    <span className="text-lg font-bold text-gray-400 line-through">
                      {cell.strikeText}
                    </span>
                    {/* 右上に小さく赤字で -1 後の数字 */}
                    <span className="absolute -top-1 -right-3 text-xs font-bold text-red-500">
                      {cell.reducedText}
                    </span>
                  </span>
                ) : (
                  <span className={textCls}>{cell.text}</span>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ======================================================
// HissanNumPad — 筆算用数字パレット
//
// Props:
//   digits    - 表示する数字の配列（[0..9] または [0..10]）
//   onDigit   - 数字ボタンを押したときのコールバック
//   onDelete  - ✕ボタンを押したときのコールバック
//   isActive  - false のときグレーアウト・操作不可
// ======================================================

interface HissanNumPadProps {
  digits: number[]
  onDigit: (n: number) => void
  onDelete: () => void
  isActive: boolean
}

export function HissanNumPad({ digits, onDigit, onDelete, isActive }: HissanNumPadProps) {
  return (
    <div className={`flex flex-wrap justify-center gap-2 ${!isActive ? "opacity-40 pointer-events-none" : ""}`}>
      {digits.map(n => (
        <button
          key={n}
          onClick={() => onDigit(n)}
          className="w-12 h-12 text-xl font-bold border-2 border-gray-300 rounded-lg
                     bg-white hover:bg-brand-50 hover:border-brand-400
                     active:scale-95 transition-all"
        >
          {n}
        </button>
      ))}
      {/* 削除ボタン */}
      <button
        onClick={onDelete}
        className="w-12 h-12 text-sm font-bold border-2 border-gray-300 rounded-lg
                   bg-white hover:bg-red-50 hover:border-red-400
                   active:scale-95 transition-all text-gray-500"
      >
        ✕
      </button>
    </div>
  )
}

// 進数変換ユーティリティ

export type Base = 2 | 8 | 10 | 16

/** 10進数 → 指定進数の文字列（大文字）*/
export function toBase(decimal: number, base: Base): string {
  if (isNaN(decimal) || decimal < 0) return ""
  return decimal.toString(base).toUpperCase()
}

/** 指定進数の文字列 → 10進数（不正な入力は NaN）*/
export function fromBase(str: string, base: Base): number {
  const n = parseInt(str, base)
  return isNaN(n) ? NaN : n
}

/**
 * 文字列が指定進数として有効か検証する
 * 大文字・小文字どちらも受け入れる
 */
export function isValidForBase(char: string, base: Base): boolean {
  const validChars = "0123456789ABCDEF".slice(0, base > 10 ? 16 : base)
  return [...char].every(c => validChars.includes(c.toUpperCase()))
}

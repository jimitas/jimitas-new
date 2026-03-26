// ======================================================
// 汎用ユーティリティ関数
// ======================================================

/**
 * 配列をシャッフルして新しい配列を返す（Fisher-Yates アルゴリズム）
 * 元の配列は変更しない。
 *
 * @example
 * const questions = shuffled([1, 2, 3, 4, 5]) // => [3,1,5,2,4] など
 */
export function shuffled<T>(arr: readonly T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

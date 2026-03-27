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

/**
 * クイズの選択肢を生成する（正解1つ＋ランダムな不正解3つ）
 *
 * @param correct   正解のアイテム
 * @param pool      選択肢を選ぶ母集団
 * @param isSame    正解と同じアイテムを除外するための比較関数
 * @returns シャッフルされた4択の配列
 *
 * @example
 * makeChoices(word, category.words, (a, b) => a.audioFile === b.audioFile)
 */
export function makeChoices<T>(
  correct: T,
  pool: T[],
  isSame: (a: T, b: T) => boolean
): T[] {
  const others = shuffled(pool.filter(item => !isSame(item, correct))).slice(0, 3)
  return shuffled([correct, ...others])
}

// 問題の重複チェック
// 元: duplicationCheck.js
// check値が配列に含まれていなければ true を返す

export function duplicationCheck(check: number, checkArray: number[]): boolean {
  return !checkArray.includes(check)
}

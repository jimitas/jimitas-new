// ======================================================
// A方式・B方式の見た目（色とラベル）
//
// 色は CUD 推奨色（2026-11-01 オーナー決定）。サイト共通のトークンには足さない。
//   A方式 = オレンジ #E69F00 ／ B方式 = ブルー #0072B2
// 文字に使うときは、白地で読めるように濃いめ（A）／ダークでは明るめ（B）にする。
// 色だけで区別しないよう、どこでも「A方式」「B方式」のラベルを必ず添える。
// ======================================================

import type { Method } from "../_lib/dice"

export const METHOD_LABEL: Record<Method, string> = { A: "A方式", B: "B方式" }
export const METHOD_RULE: Record<Method, string> = {
  A: "さいころ2個の合計",
  B: "さいころ1個の目を2倍",
}

/** 塗り（点・棒・折れ線） */
export const METHOD_FILL: Record<Method, string> = {
  A: "fill-[#E69F00]",
  B: "fill-[#0072B2] dark:fill-[#56B4E9]",
}
export const METHOD_STROKE: Record<Method, string> = {
  A: "stroke-[#E69F00]",
  B: "stroke-[#0072B2] dark:stroke-[#56B4E9]",
}
/** 文字 */
export const METHOD_TEXT: Record<Method, string> = {
  A: "text-[#9A6400] dark:text-[#F0B840]",
  B: "text-[#0072B2] dark:text-[#56B4E9]",
}
/** 見出しの左の帯・枠 */
export const METHOD_BORDER: Record<Method, string> = {
  A: "border-[#E69F00]",
  B: "border-[#0072B2] dark:border-[#56B4E9]",
}
/** 選択中のタブ */
export const METHOD_TAB_ACTIVE: Record<Method, string> = {
  A: "bg-[#E69F00] text-gray-900 border-[#E69F00]",
  B: "bg-[#0072B2] text-white border-[#0072B2]",
}

// ======================================================
// 円盤の色（要件 §3.1、2026-11-08 差しかえ）
//
// 色の意味は「円盤の色＝その円盤が動く」の1つだけ。ボタン・強調・グラフは円盤と同じ色を避けて中立色を使う。
// 円盤の色は「物の色」（授業で作った紙粘土・木）なので、サイトの配色トークンではなく生の色コードを使ってよい。
// ======================================================

/**
 * ①〜⑥：紙粘土の色。
 * ★ 紙粘土の色コードが届いたら、ここだけ差しかえる（ほかのファイルは触らない）。
 * それまでは仮の6色（①赤 ②オレンジ ③黄 ④緑 ⑤青 ⑥紫）。
 */
export const CLAY_COLORS: readonly string[] = ["#E8333A", "#F28C28", "#F5D800", "#2DA44E", "#2F6FDB", "#8A3FB8"]

/** ⑦〜⑩：茶系（木の色）。⑦明るいベージュ → ⑩こげ茶。大きいほど濃い */
export const WOOD_COLORS: readonly string[] = ["#E3CFA8", "#C49A62", "#8F5F33", "#4E3220"]

/** 円盤 d（1〜）の色。11 枚目以降は使わないが、最後の色を返す */
export function diskColor(d: number): string {
  const all = [...CLAY_COLORS, ...WOOD_COLORS]
  return all[Math.max(0, Math.min(all.length - 1, d - 1))]
}

/** #RRGGBB → 相対輝度（0〜1。WCAG の式） */
export function luminance(hex: string): number {
  const h = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 円盤の番号の文字色：明るい円盤には黒、暗い円盤には白（コントラストが大きいほうを選ぶ） */
export function labelColor(hex: string): "#FFFFFF" | "#111111" {
  const l = luminance(hex)
  const withWhite = 1.05 / (l + 0.05)
  const withBlack = (l + 0.05) / (0.0056 + 0.05)
  return withWhite >= withBlack ? "#FFFFFF" : "#111111"
}

/** 輪郭線（濃いグレー）の色と太さ */
export const DISK_STROKE = "#374151"
export const DISK_STROKE_WIDTH = 1.5

/** 台と棒（グレー。茶色の円盤とまぎれないように） */
export const BASE_COLOR = "#9CA3AF"
export const POLE_COLOR = "#6B7280"

/** 3つの区切り（F2-5）：前半＝濃いグレーの斜線、後半＝薄いグレー。中央は動く円盤の色 */
export const ZONE_FIRST = "#6B7280"
export const ZONE_LAST = "#D1D5DB"

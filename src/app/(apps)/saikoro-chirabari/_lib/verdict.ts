// ======================================================
// さいころの散らばり — 班の標準偏差が、くりかえした結果の中でどんな位置かを言う文
//
// 1つの文で全部の場合を言い切らない（極端な値にまで「何度も出る」と言うと嘘になるため）。
//   かなり珍しい … 小さいほうから 1% 未満、または 99% より大きい
//   珍しくない   … 真ん中80%の範囲の中
//   少し珍しい   … それ以外（範囲の外だが、1%〜99% の中）
// 「A・B 両方」では帯を描かないので、帯（範囲）を指す言い方をせず「真ん中80%」と文で言う。
// ======================================================

export type VerdictKind = "rare" | "inside" | "outside"

/** 1% 未満・99% 超を「かなり珍しい」とする境目 */
export const RARE_SHARE = 0.01

export function verdictKind(share: number, inside: boolean): VerdictKind {
  if (share < RARE_SHARE || share > 1 - RARE_SHARE) return "rare"
  return inside ? "inside" : "outside"
}

export function verdictText(kind: VerdictKind, bandShown: boolean): string {
  switch (kind) {
    case "rare":
      return "かなり珍しい値です。記録や計算にまちがいがないか確かめよう。"
    case "inside":
      return bandShown
        ? "珍しくない範囲です。理論値とズレていて当たり前。10回だとブレます。"
        : "真ん中80%に入る、珍しくない値です。理論値とズレていて当たり前。10回だとブレます。"
    case "outside":
      return "少し珍しいほうですが、くりかえすと何度も出てくる値です。10回だとブレます。"
  }
}

// あまりのあるわり算 ロジック

/** 商とあまりを求める */
export function calcAmari(hijosu: number, josu: number): { shou: number; amari: number } {
  return {
    shou:  Math.floor(hijosu / josu),
    amari: hijosu % josu,
  }
}

/**
 * 手動入力の妥当性チェック
 * わられる数: 2〜99、わる数: 2〜9、かつあまりが出ること
 */
export function isValidManualInput(h: number, j: number): boolean {
  return h >= 2 && h <= 99 && j >= 2 && j <= 9 && h % j !== 0
}

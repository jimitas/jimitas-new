// ======================================================
// 星の位置計算（natsu-no-hoshi アプリで使用）
//
// 星の「赤経・赤緯」（星図に書いてある、地球から見た星の住所）を、
// 観測する場所と日時に応じた「高度・方位」（空のどのあたりに見えるか）に変換する。
//
// 高度 alt … 地平線からの角度。0°=地平線、90°=真上（天頂）
// 方位 az  … 北を0°として東回りの角度。0°=北、90°=東、180°=南、270°=西
//
// UIを持たない純粋な計算のみ。描画は page.tsx 側で行う。
// ======================================================

/** 度 → ラジアン */
const rad = (deg: number) => (deg * Math.PI) / 180

/** ラジアン → 度 */
const deg = (r: number) => (r * 180) / Math.PI

/** 角度を 0〜360 の範囲に収める */
export function normalizeDeg(d: number): number {
  return ((d % 360) + 360) % 360
}

/**
 * 小数を指定けたで丸める
 *
 * sin / cos / atan2 などの計算結果は、Node.js（サーバー側）と
 * ブラウザ側で最後の1けただけ値がちがうことがある。
 * そのまま SVG の座標に使うと React が
 * 「サーバーとクライアントの HTML が一致しない」と警告を出すので、
 * ここで丸めて必ず同じ値になるようにしている。
 */
function round(v: number, digits: number): number {
  const k = 10 ** digits
  return Math.round(v * k) / k
}

// ── 観測地（京都市）─────────────────────────────────────
// 緯度 35.0°N / 経度 135.75°E（東経はプラス）
export const KYOTO = { lat: 35.0, lon: 135.75 }

/**
 * JavaScript の Date から「ユリウス日」を求める
 *
 * ユリウス日とは、紀元前4713年から数えた通し日数のこと。
 * 「何年何月何日」のままだと計算しにくいので、天文計算では
 * まずこの通し番号に直すのが定石。
 */
export function toJulianDay(date: Date): number {
  // getTime() は 1970-01-01 00:00 UTC からのミリ秒
  // 1970-01-01 00:00 UTC のユリウス日が 2440587.5
  return date.getTime() / 86400000 + 2440587.5
}

/**
 * 地方恒星時（LST）を求める［度］
 *
 * 恒星時とは「星から見た時刻」のこと。
 * 太陽の1日（24時間）より星の1日は約4分短いため、
 * 同じ時刻でも日が経つと星の位置がずれていく。
 * その「ずれ」がこの式に入っている。
 */
export function localSiderealTime(date: Date, lon: number): number {
  const jd = toJulianDay(date)
  // J2000.0（2000年1月1日12時UT）からの経過日数
  const d = jd - 2451545.0
  // グリニッジ恒星時［度］
  const gmst = 280.46061837 + 360.98564736629 * d
  // 観測地の経度を足すと、その土地の恒星時になる
  return normalizeDeg(gmst + lon)
}

/** 高度・方位の計算結果 */
export type HorizontalCoord = {
  /** 高度［度］0=地平線、90=天頂。マイナスは地平線の下 */
  alt: number
  /** 方位［度］0=北、90=東、180=南、270=西 */
  az: number
}

/**
 * 赤経・赤緯 → 高度・方位 に変換する
 *
 * @param ra   赤経［度］（0〜360）
 * @param dec  赤緯［度］（-90〜+90）
 * @param date 観測する日時
 * @param lat  観測地の緯度［度］
 * @param lon  観測地の経度［度］（東経がプラス）
 */
export function toHorizontal(
  ra: number,
  dec: number,
  date: Date,
  lat: number = KYOTO.lat,
  lon: number = KYOTO.lon,
): HorizontalCoord {
  // 時角 H … その星が南中（真南を通過）してから何度回ったか
  // マイナス = まだ南中前（東側）、プラス = 南中後（西側）
  const h = rad(normalizeDeg(localSiderealTime(date, lon) - ra))

  const decR = rad(dec)
  const latR = rad(lat)

  // 高度
  const sinAlt =
    Math.sin(decR) * Math.sin(latR) +
    Math.cos(decR) * Math.cos(latR) * Math.cos(h)
  const alt = deg(Math.asin(Math.max(-1, Math.min(1, sinAlt))))

  // 方位（いったん「南から西回り」で求めてから、北基準に直す）
  const a = Math.atan2(
    Math.sin(h),
    Math.cos(h) * Math.sin(latR) - Math.tan(decR) * Math.cos(latR),
  )
  const az = normalizeDeg(deg(a) + 180)

  return { alt: round(alt, 6), az: round(az, 6) }
}

/** 画面上の座標［px］ */
export type ScreenPoint = { x: number; y: number }

/**
 * 高度・方位 → 円形の全天ビューの画面座標 に変換する
 *
 * 「地面に寝ころんで空を見上げた図」を描く。
 *   円の中心 = 真上（天頂・高度90°）
 *   円のふち = 地平線（高度0°）
 * 中心からの距離が「天頂から何度離れているか」に比例する。
 *
 * 向きは、南を下・北を上にしたときの見え方に合わせる。
 * 見上げているので東西は地図と左右が逆になり、東が左・西が右になる。
 *   北(0°)=上 / 東(90°)=左 / 南(180°)=下 / 西(270°)=右
 *
 * @param cx     円の中心X［px］
 * @param cy     円の中心Y［px］
 * @param radius 円の半径［px］（= 地平線までの距離）
 */
export function toScreen(
  { alt, az }: HorizontalCoord,
  cx: number,
  cy: number,
  radius: number,
): ScreenPoint {
  // 天頂からの角度（0=真上、90=地平線）を半径に対応させる
  const r = ((90 - alt) / 90) * radius
  const azR = rad(az)
  return {
    x: round(cx - r * Math.sin(azR), 3),
    y: round(cy - r * Math.cos(azR), 3),
  }
}

/**
 * 「日本時間の年月日時分」から Date を作る
 *
 * new Date(2026, 7, 15, 21, 0) は実行環境のタイムゾーン依存になってしまうため、
 * JST（UTC+9）固定で Date を組み立てる。
 * これで、先生の PC の設定に関係なく同じ星空が表示される。
 */
export function jstDate(
  year: number,
  month: number, // 1〜12
  day: number,
  hour: number,
  minute: number = 0,
): Date {
  // JST は UTC より9時間進んでいるので、UTC に直すには9時間引く
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute))
}

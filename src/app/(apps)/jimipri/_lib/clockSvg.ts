// 時計SVG生成ヘルパー
// tokei アプリの Canvas 描画ロジックを SVG に変換
// じみぷりの nanji-1 / nanji-2 で使用（印刷対応）

// 数字の座標（tokei の NUM_X/NUM_Y を SVG用に流用）
const NUM_X = [260, 305, 325, 310, 265, 200, 140,  95,  75,  95, 135, 200]
const NUM_Y = [105, 150, 210, 275, 320, 335, 320, 270, 210, 150, 105,  85]

/**
 * 指定した時刻の時計SVGを生成する
 * @param hours 時（1〜12）
 * @param minutes 分（0〜59）
 * @param size 表示サイズ（mm単位のwidth指定、デフォルト30mm）
 */
export function clockSvg(hours: number, minutes: number, size = 30): string {
  const cx = 200
  const cy = 200
  const r = 150

  // 時間目盛り（12本）
  let hourMarks = ""
  for (let i = 0; i < 12; i++) {
    const rad = (Math.PI / 180) * (270 + i * 30)
    const x1 = cx + r * Math.cos(rad)
    const y1 = cy + r * Math.sin(rad)
    const x2 = cx + 140 * Math.cos(rad)
    const y2 = cy + 140 * Math.sin(rad)
    hourMarks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="2"/>`
  }

  // 分目盛り（60本）
  let minMarks = ""
  for (let i = 0; i < 60; i++) {
    const rad = (Math.PI / 180) * (270 + i * 6)
    const x1 = cx + r * Math.cos(rad)
    const y1 = cy + r * Math.sin(rad)
    const x2 = cx + 145 * Math.cos(rad)
    const y2 = cy + 145 * Math.sin(rad)
    minMarks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="0.5"/>`
  }

  // 1〜12 の数字
  let numbers = ""
  for (let i = 0; i < 12; i++) {
    // SVG textのyはベースライン基準。Canvas の alphabetic に近い位置に調整
    numbers += `<text x="${NUM_X[i]}" y="${NUM_Y[i]}" text-anchor="middle" font-size="30" font-family="sans-serif" fill="#000">${i + 1}</text>`
  }

  // 分針（青・長い）
  const minRad = (Math.PI / 180) * (270 + 6 * minutes)
  const minX = cx + 128 * Math.cos(minRad)
  const minY = cy + 128 * Math.sin(minRad)

  // 時針（赤・短い・分の影響を含む）
  const hourRad = (Math.PI / 180) * (270 + 30 * (hours + minutes / 60))
  const hourX = cx + 96 * Math.cos(hourRad)
  const hourY = cy + 96 * Math.sin(hourRad)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" style="width:${size}mm;height:${size}mm;display:inline-block;vertical-align:middle;">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#333" stroke-width="1.5"/>
  ${minMarks}
  ${hourMarks}
  ${numbers}
  <line x1="${cx}" y1="${cy}" x2="${minX.toFixed(1)}" y2="${minY.toFixed(1)}" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
  <line x1="${cx}" y1="${cy}" x2="${hourX.toFixed(1)}" y2="${hourY.toFixed(1)}" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="5" fill="#444"/>
</svg>`
}

// 時計の Canvas 描画（tokei アプリ・jimipri なんじ系で共通使用）
// 内部解像度: 400×400、中心: (200,200)、半径: 150

// 1〜12 の数字の座標（alphabetic ベースラインで設計）
const NUM_X = [260, 305, 325, 310, 265, 200, 140,  95,  75,  95, 135, 200]
const NUM_Y = [105, 150, 210, 275, 320, 335, 320, 270, 210, 150, 105,  85]

// ヒント1: 5分刻みの数字の座標（0, 5, 10, … 55）
const HINT1_X = [200, 280, 340, 360, 340, 280, 200, 120,  60,  40,  60, 120]
const HINT1_Y = [ 45,  65, 125, 205, 285, 345, 365, 345, 285, 205, 125,  65]

export type HintLevel = "" | "hint1" | "hint2"

/**
 * Canvas に時計を描画する
 * @param ctx - Canvas 2D コンテキスト
 * @param hour - 時（0〜12）
 * @param minute - 分（0〜59）
 * @param hint - ヒントレベル（省略時はヒントなし）
 */
export function drawClock(
  ctx: CanvasRenderingContext2D,
  hour: number,
  minute: number,
  hint: HintLevel = "",
): void {
  const C = 400
  ctx.clearRect(0, 0, C, C)

  // 外枠
  ctx.beginPath()
  ctx.arc(200, 200, 150, 0, Math.PI * 2)
  ctx.lineWidth = 1.5
  ctx.strokeStyle = "#333"
  ctx.stroke()

  // 分目盛り（60本・細め）
  for (let i = 0; i < 60; i++) {
    const rad = (Math.PI / 180) * (270 + i * 6)
    ctx.beginPath()
    ctx.moveTo(200 + 150 * Math.cos(rad), 200 + 150 * Math.sin(rad))
    ctx.lineTo(200 + 145 * Math.cos(rad), 200 + 145 * Math.sin(rad))
    ctx.lineWidth = 0.5
    ctx.strokeStyle = "#000"
    ctx.stroke()
  }

  // 時間目盛り（12本・太め）
  for (let i = 0; i < 12; i++) {
    const rad = (Math.PI / 180) * (270 + i * 30)
    ctx.beginPath()
    ctx.moveTo(200 + 150 * Math.cos(rad), 200 + 150 * Math.sin(rad))
    ctx.lineTo(200 + 140 * Math.cos(rad), 200 + 140 * Math.sin(rad))
    ctx.lineWidth = 2
    ctx.strokeStyle = "#000"
    ctx.stroke()
  }

  // 1〜12 の数字
  ctx.font = "30px 'ＭＳ ゴシック'"
  ctx.textAlign = "center"
  ctx.fillStyle = "#000"
  for (let i = 0; i < 12; i++) {
    ctx.fillText(String(i + 1), NUM_X[i], NUM_Y[i])
  }

  // ヒント1: 5分刻みの数字を外周に青で表示
  if (hint === "hint1") {
    ctx.font = "15px 'ＭＳ ゴシック'"
    ctx.fillStyle = "#2563eb"
    for (let i = 0; i < 12; i++) {
      ctx.fillText(String(i * 5), HINT1_X[i], HINT1_Y[i])
    }
  }

  // ヒント2: 1分刻みの全数字を放射状に緑で表示
  if (hint === "hint2") {
    ctx.font = "15px 'ＭＳ ゴシック'"
    ctx.fillStyle = "#16a34a"
    for (let i = 0; i < 60; i++) {
      const rad = (Math.PI / 180) * (270 + i * 6)
      ctx.fillText(
        String(i),
        200 + 160 * Math.cos(rad),
        205 + 160 * Math.sin(rad),
      )
    }
  }

  // 分針（青・長め）
  ctx.lineCap = "round"
  const minRad = (Math.PI / 180) * (270 + 6 * minute)
  ctx.beginPath()
  ctx.moveTo(200, 200)
  ctx.lineTo(200 + 128 * Math.cos(minRad), 200 + 128 * Math.sin(minRad))
  ctx.lineWidth = 3
  ctx.strokeStyle = "#2563eb"
  ctx.stroke()

  // 時針（赤・短め・分の影響を含む）
  const hourRad = (Math.PI / 180) * (270 + 30 * (hour + minute / 60))
  ctx.beginPath()
  ctx.moveTo(200, 200)
  ctx.lineTo(200 + 96 * Math.cos(hourRad), 200 + 96 * Math.sin(hourRad))
  ctx.lineWidth = 6
  ctx.strokeStyle = "#dc2626"
  ctx.stroke()

  // 中心の点
  ctx.beginPath()
  ctx.arc(200, 200, 5, 0, Math.PI * 2)
  ctx.fillStyle = "#444"
  ctx.fill()
}

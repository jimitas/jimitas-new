// ======================================================
// ステップ④ 速さと距離とくらべる（要件 §4.4）の計算
//
// 2つのグラフはどちらも「原点を通る直線 y = kx の下の三角形」。
//   左：速さ 2x（k = 2）の下の面積 ＝ ½ × x × 2x ＝ x²（距離）
//   右：円周 2πr（k = 2π）の下の面積 ＝ ½ × r × 2πr ＝ πr²（円の面積）
// 軸の名前がちがうだけで、やっていることは同じ（F4-4）。
//
// ■ 細い長方形の積み上げ（F4-3）
//   0〜X を n 等分し、i 本目の長方形の高さは、その幅のまん中での直線の高さ k·(i − ½)Δ にする。
//   右のグラフでは、これが ③ の帯1本（長さ ＝ 輪のまん中の円周 2π·rm、太さ Δ）とぴったり同じになる。
//   直線なので、まん中の高さの長方形の合計は、本数によらず三角形の面積とちょうど等しい
//   （はみ出す三角と足りない三角が打ち消し合う。要件 §5.2 の帯の面積の合計と同じ性質）。
// ======================================================

/** 左のグラフ：速さ 2x の傾き */
export const K_SPEED = 2
/** 右のグラフ：円周 2πr の傾き */
export const K_CIRCLE = 2 * Math.PI

/** 共通のスライダー（x ＝ r）の範囲と初期値（2026-10-25 オーナー決定：0〜4、初期値 2） */
export const X_MAX = 4
export const X_INIT = 2
export const X_STEP = 0.1

/** 細い長方形の本数の選択肢（F4-3：4〜64）と初期値 */
export const RECT_COUNTS = [4, 8, 16, 32, 64] as const
export const DEFAULT_RECTS = 8

/** 直線 y = kx の下、0〜X の三角形の面積 ½·X·kX */
export function triangleArea(k: number, x: number): number {
  return (k * x * x) / 2
}

/** 細い長方形1本（世界座標） */
export interface Rect {
  x0: number
  x1: number
  height: number
}

/** 0〜X を n 等分した、まん中の高さの長方形 */
export function midRects(k: number, x: number, n: number): Rect[] {
  const w = x / n
  return Array.from({ length: n }, (_, j) => ({ x0: j * w, x1: (j + 1) * w, height: k * (j + 0.5) * w }))
}

/** 長方形の面積の合計 */
export function rectsArea(rects: Rect[]): number {
  return rects.reduce((sum, r) => sum + (r.x1 - r.x0) * r.height, 0)
}

/**
 * グラフの表示範囲（世界座標）。スライダーの右はしでも直線の先と目盛りが収まるよう余らせる。
 * 横は x = 5 まで：横軸の名前（「時間 x（秒）」）は右はしに描かれ、共通の座標平面では中身より先に描くので、
 * x = 4 までの長方形と重なると隠れてしまう（2026-10-26 の画面確認で見つけた）。
 */
export const VIEW_X_MAX = X_MAX * 1.25

/**
 * ④ のグラフの縦横比（高さ ÷ 幅）。帯を重ねる動き（F4-5）で、x = 4 の帯の束（高さ n·w px）と
 * 回している途中の帯が、グラフの上はしで切れないよう 0.9 にした（0.8 だと x = 4 で上の帯が切れた。2026-10-27 レビュー指摘）
 */
export const COMPARE_ASPECT = 0.9
export function compareView(k: number): { xMin: number; xMax: number; yMin: number; yMax: number } {
  const top = k * X_MAX
  return { xMin: -0.3, xMax: VIEW_X_MAX, yMin: -top * 0.08, yMax: top * 1.12 }
}

// ---- ③ の帯を右のグラフへ重ねる（F4-5、P1） ---------------------------------------------
//
// ③ で積み上げた帯（横向き。いちばん外側＝いちばん長い帯がいちばん下）を、まとめて 90° 回すと、
// 右のグラフの細い長方形（縦向き。左ほど低い）にぴったり重なる。
// グラフは縦と横の縮尺がちがう（横 0〜5、縦 0〜28）ので、世界座標で回すと形がゆがむ。
// そこで画面の px で考える：長方形1本は幅 w px・高さ H_j px の箱で、横向きの帯は同じ箱を寝かせたもの。
// px の上では、帯の束全体を「原点のまわりに反時計回りに 90° 回して、右へ n·w ずらす」と、ちょうど重なる
// （y を上向きにとると (x, y) → (n·w − y, x)。ox, oy は原点の px。2026-10-27 推奨で決定）。
// 回すのとずらすのを同時に少しずつ行う（s：0〜1）。回す角度は 90°·s、右へずらす量は n·w·sin(90°·s)。
// ずらす量を回した分（sin）に合わせると、途中でも帯は縦軸より左・横軸より下に出ない
// （1点のまわりに回すと横軸の下へ、ずらす量を s に比例させると縦軸の左へはみ出して切れた。2026-10-27 レビュー指摘）。

/** 画面の箱（px。SVG の座標で、x, y は左上） */
export interface PxBox {
  x: number
  y: number
  w: number
  h: number
}

/** 回す前の帯 j（0 始まり、左の長方形から）：横向き。原点から右へ H_j、いちばん長い帯がいちばん下 */
export function lyingStrips(ox: number, oy: number, w: number, heights: number[]): PxBox[] {
  const n = heights.length
  return heights.map((hj, j) => ({ x: ox, y: oy - (n - j) * w, w: hj, h: w }))
}

/** 回したあとの長方形 j：縦向き。グラフの細い長方形と同じ場所 */
export function standingStrips(ox: number, oy: number, w: number, heights: number[]): PxBox[] {
  return heights.map((hj, j) => ({ x: ox + j * w, y: oy - hj, w, h: hj }))
}

/** 帯の束の動かし方。原点 (cx, cy) のまわりに deg 回し、原点を中心に scale 倍し、右へ dx ずらす */
export interface StripsMotion {
  dx: number
  deg: number
  cx: number
  cy: number
  scale: number
}

/**
 * 帯の束の動かし方（s：0 横向き 〜 1 縦向き）。
 * x が 4 に近いと、45° ほど傾いた帯の束の対角線がグラフの幅より長くなり、形を変えずに回すだけでは
 * 右へはみ出す（x = 4 で最大 58px）。lying と maxX を渡すと、右はしが maxX を越える途中だけ、
 * 原点を中心に越えない大きさまで縮める（s = 0 と s = 1 では縮めない。2026-10-27 レビュー指摘）。
 */
export function stripsMotion(
  ox: number, oy: number, w: number, n: number, s: number, lying: PxBox[] = [], maxX = Infinity,
): StripsMotion {
  const deg = -90 * s
  const base = n * w * Math.sin((Math.PI / 2) * s)
  // 原点のまわりに回したときの、右はしの原点からの距離
  let right = -Infinity
  for (const b of lying) {
    for (const [px, py] of [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]]) {
      right = Math.max(right, rotateAbout(px, py, ox, oy, deg).x - ox)
    }
  }
  const need = right + base
  const scale = Number.isFinite(maxX) && need > 0 ? Math.min(1, (maxX - ox) / need) : 1
  return { dx: base * scale, deg, cx: ox, cy: oy, scale }
}

/** SVG の transform 文字列。右に書いたものから順にかかる：回す → 原点を中心に縮める → 右へずらす */
export function stripsTransform(m: StripsMotion): string {
  return `translate(${m.dx} 0) translate(${m.cx} ${m.cy}) scale(${m.scale}) translate(${-m.cx} ${-m.cy}) rotate(${m.deg} ${m.cx} ${m.cy})`
}

/** 点 (x, y) に stripsTransform と同じ動かし方をかける（テスト・はみ出しの確認用） */
export function applyStripsMotion(x: number, y: number, m: StripsMotion): { x: number; y: number } {
  const q = rotateAbout(x, y, m.cx, m.cy, m.deg)
  return { x: m.cx + (q.x - m.cx) * m.scale + m.dx, y: m.cy + (q.y - m.cy) * m.scale }
}

/** 座標平面の世界座標 → px の変換（@/lib/graph/viewport の Transform のうち使うところ） */
interface ToPx {
  toPx: (x: number) => number
  toPy: (y: number) => number
}

/**
 * 帯を重ねる動きの px の形。原点 (ox, oy)・長方形の幅 w・高さ heights と、横向き・縦向きの箱。
 * 縦向き（standing）は、座標平面にふつうに描く細い長方形（midRects）と同じ px の箱になる（テストで固定）。
 */
export function stripsGeometry(t: ToPx, k: number, x: number, n: number) {
  const ox = t.toPx(0)
  const oy = t.toPy(0)
  const w = t.toPx(x / n) - ox
  const heights = midRects(k, x, n).map((r) => oy - t.toPy(r.height))
  return { ox, oy, w, heights, lying: lyingStrips(ox, oy, w, heights), standing: standingStrips(ox, oy, w, heights) }
}

/** SVG の rotate(deg, cx, cy) と同じ回し方で、点 (x, y) を回す（deg が負なら画面の上で反時計回り） */
export function rotateAbout(x: number, y: number, cx: number, cy: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180
  const dx = x - cx
  const dy = y - cy
  return { x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a) }
}

/** 帯を重ねる動きの長さ（ミリ秒） */
export const STRIPS_MS = 2500

// ======================================================
// 座標平面の表示範囲・座標変換・目盛り
//
// 計算だけを置く（jest でテストする）。描画は @/components/parts/graph/CoordinatePlane.tsx。
// 別のアプリ（積分など）でも使えるよう、微分のアプリ固有の事情は持ち込まない。
//
// 画面座標（px）は左上が原点で下向きが正、世界座標は数学のとおり上向きが正。
// ======================================================

/** 表示範囲（世界座標） */
export interface View {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

/** 世界座標 ↔ 画面座標（px） */
export interface Transform {
  width: number
  height: number
  toPx: (x: number) => number
  toPy: (y: number) => number
  fromPx: (px: number) => number
  fromPy: (py: number) => number
}

export function makeTransform(v: View, width: number, height: number): Transform {
  const sx = width / (v.xMax - v.xMin)
  const sy = height / (v.yMax - v.yMin)
  return {
    width,
    height,
    toPx: (x) => (x - v.xMin) * sx,
    toPy: (y) => (v.yMax - y) * sy,
    fromPx: (px) => v.xMin + px / sx,
    fromPy: (py) => v.yMax - py / sy,
  }
}

/**
 * 点 (cx, cy) を中心に r 倍の広さにする（r < 1 で拡大）。
 * 点 (cx, cy) は画面上の同じ位置にとどまる。ホイール・ピンチ・ボタンのズームで使う。
 */
export function zoomAbout(v: View, cx: number, cy: number, r: number): View {
  return {
    xMin: cx + (v.xMin - cx) * r,
    xMax: cx + (v.xMax - cx) * r,
    yMin: cy + (v.yMin - cy) * r,
    yMax: cy + (v.yMax - cy) * r,
  }
}

/**
 * 表示の幅・高さの下限と上限（世界座標）。
 * 拡大しすぎると浮動小数の精度が尽きて幅が 0 になり、座標変換が NaN になってグラフが消える
 * （2026-10-25 レビュー指摘）。追いかけズーム（h = 0.001）でも幅は 0.008 程度なので、下限には届かない。
 */
export const MIN_SPAN = 1e-6
export const MAX_SPAN = 1e6

/** zoomAbout と同じだが、幅・高さが MIN_SPAN〜MAX_SPAN に収まるよう倍率を抑える。ユーザー操作のズームはこちら */
export function zoomLimited(v: View, cx: number, cy: number, r: number): View {
  const w = v.xMax - v.xMin
  const h = v.yMax - v.yMin
  const lo = Math.max(MIN_SPAN / w, MIN_SPAN / h)
  const hi = Math.min(MAX_SPAN / w, MAX_SPAN / h)
  return zoomAbout(v, cx, cy, Math.min(hi, Math.max(lo, r)))
}

/** 世界座標で (dx, dy) だけずらす */
export function pan(v: View, dx: number, dy: number): View {
  return { xMin: v.xMin + dx, xMax: v.xMax + dx, yMin: v.yMin + dy, yMax: v.yMax + dy }
}

/** 画面上の点（px） */
export interface Pt {
  x: number
  y: number
}

/**
 * パン：始めたときの表示 start と指の位置 p0 から、いまの指の位置 p1 までの分だけずらす。
 * 毎回 start からの差で計算する（少しずつ足し込むと誤差がたまってずれる）。
 * 指の下にあった点が、いまも指の下に来る。
 */
export function panView(start: View, p0: Pt, p1: Pt, width: number, height: number): View {
  const t = makeTransform(start, width, height)
  return pan(start, t.fromPx(p0.x) - t.fromPx(p1.x), t.fromPy(p0.y) - t.fromPy(p1.y))
}

/**
 * ピンチ：始めたときの表示 start と2本の指 (a0, b0) から、いまの指 (a1, b1) への変化。
 * 始めの指のあいだの点を中心に、指の間隔の比で拡大し、その点がいまの指のあいだに来るようずらす。
 * 指が重なっている（間隔 1px 未満）ときは start のまま。
 */
export function pinchView(start: View, a0: Pt, b0: Pt, a1: Pt, b1: Pt, width: number, height: number): View {
  const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y)
  const d1 = Math.hypot(a1.x - b1.x, a1.y - b1.y)
  if (d0 < 1 || d1 < 1) return start
  const t = makeTransform(start, width, height)
  const wx = t.fromPx((a0.x + b0.x) / 2)
  const wy = t.fromPy((a0.y + b0.y) / 2)
  // 指を広げる（d1 > d0）と拡大（範囲は d0/d1 倍に狭まる）
  const zoomed = zoomLimited(start, wx, wy, d0 / d1)
  const tz = makeTransform(zoomed, width, height)
  return pan(zoomed, wx - tz.fromPx((a1.x + b1.x) / 2), wy - tz.fromPy((a1.y + b1.y) / 2))
}

/**
 * 点 (x, y) が表示の中にあるか。margin は表示の幅・高さに対する割合で、端からそれだけ内側を「中」とみなす
 * （端ぎりぎりの点は、指や点の大きさで見えにくいため）。
 */
export function contains(v: View, x: number, y: number, margin = 0.05): boolean {
  const mx = (v.xMax - v.xMin) * margin
  const my = (v.yMax - v.yMin) * margin
  return v.xMin + mx <= x && x <= v.xMax - mx && v.yMin + my <= y && y <= v.yMax - my
}

/** 表示の中心 */
export function centerOf(v: View): [number, number] {
  return [(v.xMin + v.xMax) / 2, (v.yMin + v.yMax) / 2]
}

/** 目盛りの間隔。1・2・5 × 10ⁿ のうち、目盛りが target 本くらいになるもの */
export function niceStep(span: number, target: number): number {
  const raw = span / target
  const p = 10 ** Math.floor(Math.log10(raw))
  const m = raw / p
  const nice = m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10
  return nice * p
}

/**
 * min〜max に入る目盛りの値。0.30000000000000004 のような誤差は丸めて返す。
 * 拡大しすぎて目盛りが作れないときは空配列。
 */
export function ticks(min: number, max: number, target: number): number[] {
  const step = niceStep(max - min, target)
  if (!(step > 0) || !Number.isFinite(step)) return []
  const decimals = decimalsOf(step)
  const out: number[] = []
  for (let i = Math.ceil(min / step); i * step <= max + step * 1e-9; i++) {
    out.push(Number((i * step).toFixed(decimals)))
    if (out.length > 200) break // 念のため
  }
  return out
}

/**
 * 小数点以下の桁数（0.25 → 2、0.1 → 1、5 → 0、1e-7 → 7）。
 * log10 で決めると 0.25 が 1 桁になり、丸めすぎる（2026-10-25 レビュー指摘）。
 */
export function decimalsOf(step: number): number {
  const [mantissa, exp] = step.toExponential().split("e")
  const frac = mantissa.split(".")[1]?.length ?? 0
  return Math.max(0, frac - Number(exp))
}

/** step 刻みにそろえる（0.1 刻みなら 2.3000000000000003 → 2.3、0.25 刻みなら 0.3 → 0.25） */
export function snap(x: number, step: number): number {
  const v = Number((Math.round(x / step) * step).toFixed(decimalsOf(step)))
  return v === 0 ? 0 : v // −0 にしない
}

// ---- 描画の決まりごと（テストで要件を固定するため、ここに置く） ----------------------

/** 目盛りの文字の大きさ（px）。微分の意味がわかるの要件 §6：グラフラベル 14px 以上 */
export const TICK_FONT = 14

/** ドラッグできる点の当たり判定の半径（px）。微分の意味がわかるの要件 §6：20px 以上 */
export const HIT_RADIUS = 22

/** 数字の文字列の、だいたいの幅（px）。数字・記号は文字の大きさの 0.6 倍くらい */
export function textWidth(s: string, fontSize: number): number {
  return s.length * fontSize * 0.6
}

/**
 * y の目盛りの数字を置く位置。
 *   y 軸の左に数字が収まるなら、軸の左に右寄せ（ふつうの置き方）
 *   y 軸が左の外にある・左端に近すぎるなら、グラフの内側の左端に左寄せ
 *   y 軸が右の外にあるなら、右端に右寄せ
 * 軸が外にあるときに数字の頭が切れて「4.002」が「.002」に見えるのを防ぐ（2026-10-25 レビュー指摘）。
 */
export function yLabelPlacement(axisPx: number, width: number, labelWidth: number): { x: number; anchor: "start" | "end" } {
  const GAP = 5
  if (axisPx > width) return { x: width - GAP, anchor: "end" }
  if (axisPx >= labelWidth + GAP * 2) return { x: axisPx - GAP, anchor: "end" }
  return { x: Math.max(0, axisPx) + GAP, anchor: "start" }
}

/**
 * x の範囲を決めて、関数がちょうど収まる縦の範囲をつける（全体表示）。
 * 上下に pad の割合だけ余白を足す。平らな関数でも縦が minSpan 以上になるようにする。
 */
export function fitView(fn: (x: number) => number, xMin: number, xMax: number, pad = 0.1, minSpan = 2): View {
  let lo = Infinity
  let hi = -Infinity
  const n = 200
  for (let i = 0; i <= n; i++) {
    const y = fn(xMin + ((xMax - xMin) * i) / n)
    lo = Math.min(lo, y)
    hi = Math.max(hi, y)
  }
  if (hi - lo < minSpan) {
    const mid = (hi + lo) / 2
    lo = mid - minSpan / 2
    hi = mid + minSpan / 2
  }
  const m = (hi - lo) * pad
  return { xMin, xMax, yMin: lo - m, yMax: hi + m }
}

/**
 * 曲線を折れ線にするための点（画面座標）。横 stepPx ごとに1点。
 * 画面から大きく外れた点は上下にそろえる（SVG に巨大な座標を渡さないため）。
 */
export function curvePoints(fn: (x: number) => number, t: Transform, stepPx = 2): [number, number][] {
  const n = Math.max(2, Math.ceil(t.width / stepPx))
  const limit = t.height * 10
  const pts: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const px = (t.width * i) / n
    const py = t.toPy(fn(t.fromPx(px)))
    pts.push([px, Math.min(t.height + limit, Math.max(-limit, py))])
  }
  return pts
}

/**
 * 点 (x0, y0) を通る傾き slope の直線を、表示の左端から右端まで引くときの両端（画面座標）。
 * 縦に大きくはみ出す分は、直線の上で画面の近くまで縮める（向きは変えない）。
 */
export function lineEnds(x0: number, y0: number, slope: number, t: Transform): [number, number, number, number] {
  const xl = t.fromPx(0)
  const xr = t.fromPx(t.width)
  const yl = y0 + slope * (xl - x0)
  const yr = y0 + slope * (xr - x0)
  return clipSegment(t.toPx(xl), t.toPy(yl), t.toPx(xr), t.toPy(yr), t.height)
}

/** 線分を、縦 −h〜2h の帯に入る部分に縮める */
function clipSegment(x1: number, y1: number, x2: number, y2: number, h: number): [number, number, number, number] {
  const lo = -h
  const hi = 2 * h
  if (y1 === y2) return [x1, y1, x2, y2] // 水平線は縮める必要がない（0 で割らない）
  const at = (y: number): [number, number] => [x1 + ((x2 - x1) * (y - y1)) / (y2 - y1), y]
  let a: [number, number] = [x1, y1]
  let b: [number, number] = [x2, y2]
  if (a[1] < lo) a = at(lo)
  else if (a[1] > hi) a = at(hi)
  if (b[1] < lo) b = at(lo)
  else if (b[1] > hi) b = at(hi)
  return [a[0], a[1], b[0], b[1]]
}

/**
 * 拡大ルーペの表示範囲（F2-11）。main（いまの表示）を mag 倍に拡大し、点 (cx, cy) を真ん中に置く。
 * 縦横比は main と同じ（ルーペの小窓も main と同じ縦横比で描く）。
 */
export function loupeView(main: View, cx: number, cy: number, mag: number): View {
  const hw = (main.xMax - main.xMin) / 2 / mag
  const hh = (main.yMax - main.yMin) / 2 / mag
  return { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh }
}

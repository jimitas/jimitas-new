// ======================================================
// ガチャ確率シミュレーター — 計算部分（DOM 非依存）
//
// 移植元: https://github.com/jimitas/gacha-kakuritu の math.js
// ロジックは原本のまま、型を付けただけ。page.tsx と jest が同じ関数を使う。
//
// 確率 p は 0 < p <= 1 の小数（1% なら 0.01）。N は 1 セッションで回す回数。
// ======================================================

/** 乱数関数の型。0 以上 1 未満を返す（テストでは決まった列を渡す） */
export type Rng = () => number

/** 1 セッションの結果。firstHit は初当たりの回数(1..N)、出なければ 0 */
export interface SessionResult {
  hits: number
  firstHit: number
}

/** 集計器。p・N が変わったら作り直す（分布が混ざるのを防ぐ） */
export interface GachaStats {
  p: number
  N: number
  sessions: number
  sessionsWithHit: number
  totalHits: number
  /** [k] = 当たりがちょうど k 回だったセッション数 */
  hitsHist: Uint32Array
  /** [i] = 初当たりが i 回目、[0] = N 回以内に出ず */
  firstHitHist: Uint32Array
}

// ---- 理論値 ------------------------------------------------------------

/** q^x = (1-p)^x を log1p で精度よく計算。p=1 のときは x=0 で 1、x>0 で 0 */
export function qpow(p: number, x: number): number {
  if (x === 0) return 1
  if (p >= 1) return 0
  return Math.exp(x * Math.log1p(-p))
}

/** N 回引いて 1 回も当たらない確率 (1-p)^N */
export function pNone(p: number, N: number): number {
  return qpow(p, N)
}

/** N 回引いて 1 回以上当たる確率 1-(1-p)^N */
export function pAtLeastOne(p: number, N: number): number {
  if (p >= 1) return N > 0 ? 1 : 0
  return -Math.expm1(N * Math.log1p(-p))
}

/**
 * 二項分布の確率質量関数。戻り値 pmf[k] = N 回中ちょうど k 回当たる確率。
 * log 領域の漸化式で計算し、N=10000 でもオーバーフローしない。
 */
export function binomialPmf(p: number, N: number): Float64Array {
  const pmf = new Float64Array(N + 1)
  if (p >= 1) { pmf[N] = 1; return pmf }
  if (p <= 0) { pmf[0] = 1; return pmf }
  const lp = Math.log(p)
  const lq = Math.log1p(-p)
  let logC = 0 // log C(N, k)
  for (let k = 0; k <= N; k++) {
    pmf[k] = Math.exp(logC + k * lp + (N - k) * lq)
    if (k < N) logC += Math.log(N - k) - Math.log(k + 1)
  }
  return pmf
}

/** 初当たりが k 回目以内に出る確率 F(k) = 1-(1-p)^k */
export function geometricCdf(p: number, k: number): number {
  return pAtLeastOne(p, k)
}

/** 初当たりまでの回数の中央値: F(k) >= 0.5 となる最小の k */
export function medianFirstHit(p: number): number {
  if (p >= 1) return 1
  // 浮動小数の誤差で 1.0000000002 → 2 にならないよう微小量を引く
  return Math.ceil(-Math.LN2 / Math.log1p(-p) - 1e-9)
}

/** 初当たりまでの回数の平均 1/p */
export function meanFirstHit(p: number): number {
  return 1 / p
}

// ---- バケット化（初当たり分布の表示用） ------------------------------------

/**
 * 1..N を幅 ceil(N/count) の区間に分ける。戻り値 [[a,b], ...]（両端含む）。
 * N が小さいときは区間数が count 未満になる（N=1 なら [[1,1]] のみ）。
 */
export function bucketEdges(N: number, count = 10): [number, number][] {
  const w = Math.ceil(N / count)
  const edges: [number, number][] = []
  for (let a = 1; a <= N; a += w) edges.push([a, Math.min(a + w - 1, N)])
  return edges
}

/** 各区間に初当たりが入る理論確率。P(a<=X<=b) = q^(a-1) - q^b */
export function geometricBucketMass(p: number, edges: [number, number][]): number[] {
  return edges.map(([a, b]) => qpow(p, a - 1) - qpow(p, b))
}

/** 観測ヒストグラム hist[1..N] を区間ごとに合計 */
export function bucketize(hist: ArrayLike<number>, edges: [number, number][]): number[] {
  return edges.map(([a, b]) => {
    let s = 0
    for (let i = a; i <= b; i++) s += hist[i]
    return s
  })
}

// ---- シミュレーション ---------------------------------------------------

/** 1 回引く。当たりなら true */
export function drawPull(p: number, rng: Rng = Math.random): boolean {
  return rng() < p
}

/** 1 セッション（N 回）を引き切る */
export function runSession(p: number, N: number, rng: Rng = Math.random): SessionResult {
  let hits = 0
  let firstHit = 0
  for (let i = 1; i <= N; i++) {
    if (drawPull(p, rng)) {
      hits++
      if (firstHit === 0) firstHit = i
    }
  }
  return { hits, firstHit }
}

/** 集計器を作る */
export function createStats(p: number, N: number): GachaStats {
  return {
    p,
    N,
    sessions: 0,
    sessionsWithHit: 0,
    totalHits: 0,
    hitsHist: new Uint32Array(N + 1),
    firstHitHist: new Uint32Array(N + 1),
  }
}

/** 完了した 1 セッションを集計に加える（アニメ・一括の両モードがここを通る） */
export function addSession(stats: GachaStats, { hits, firstHit }: SessionResult): void {
  stats.sessions++
  stats.totalHits += hits
  stats.hitsHist[hits]++
  stats.firstHitHist[firstHit]++
  if (hits > 0) stats.sessionsWithHit++
}

/** 観測された初当たり回数の中央値。半数に届かなければ 0 */
export function observedMedianFirstHit(stats: GachaStats): number {
  if (stats.sessions === 0) return 0
  let acc = 0
  for (let i = 1; i <= stats.N; i++) {
    acc += stats.firstHitHist[i]
    if (acc * 2 >= stats.sessions) return i
  }
  return 0
}

// ---- 表示用の整形 -------------------------------------------------------

/**
 * 0..1 の値を % 文字列にする。有効数字 2 桁以上を保証し、
 * 0.001% が "0.0%" に潰れないようにする。63.4% / 1.0% / 0.001%
 */
export function formatPercent(x: number): string {
  if (!Number.isFinite(x)) return "―"
  const v = x * 100
  if (v === 0) return "0%"
  const digits = Math.min(5, Math.max(1, Math.ceil(2 - Math.log10(Math.abs(v)))))
  let s = v.toFixed(digits)
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, ".0")
  return s + "%"
}

/** p を「1/100」または「約1/33.3」の形にする */
export function fractionLabel(p: number): string {
  if (p <= 0) return "―"
  const d = 1 / p
  const r = Math.round(d)
  if (Math.abs(d - r) < 1e-6 * Math.max(1, d)) return `1/${r}`
  return `約1/${d.toFixed(1)}`
}

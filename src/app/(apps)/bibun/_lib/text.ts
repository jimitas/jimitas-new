// ======================================================
// 画面の文言（微分の意味がわかる）
//
// ■ 用語の方針（要件 §1.1）
//   - 2点を通る直線は「2点を結ぶ直線」と呼ぶ。教科書の「割線」は生徒になじみがないので使わない。
//     「記号で」表示のときだけ、SECANT_NOTE を1か所に添える。
//     → jest（wording.test.ts）で、bibun の全ファイルを見て「割線」がここ1か所だけであることを固定している。
//   - 「平均変化率」は傾きの値の名前として使い、直線の名前にはしない
//     （「平均変化率が接線になる」という誤った言い方を避けるため）。
// ======================================================

/** 表示レベル：ことばで（初期値）／記号で */
export type Level = "words" | "symbols"

export const SECANT_NAME = "2点を結ぶ直線"
export const TANGENT_NAME = "接線"

/** 「記号で」表示のときだけ添える補足。画面上で「割線」が出るのはここだけ */
export const SECANT_NOTE = "（教科書では割線ともいう）"

// ---- 文脈ラベル（「x, y」⇔「時間（秒）, 距離（m）」。要件 §3.1 P1） --------------------------
//   スライド9（x 秒で x² m 進む）と結びつけるため、軸と主要な値の名前を速さのことばに言いかえる。
//   数学の用語が消えないよう、元の用語を（ ）で添える（2026-10-25 オーナー決定）。
//   引数 motion を省くと、ふつうの「x, y」の文言になる。

/** 軸の名前 */
export const axisLabels = (motion = false) => (motion ? { x: "時間（秒）", y: "距離（m）" } : { x: "x", y: "y" })

/** 平均変化率・微分係数の呼び方 */
export const avgRateName = (motion = false) => (motion ? "平均の速さ（平均変化率）" : "平均変化率")
export const coefName = (motion = false) => (motion ? "瞬間の速さ（微分係数）" : "微分係数")

/** グラフ上のラベル */
export const secantSlopeLabel = (v: string, motion = false) => `傾き＝${avgRateName(motion)} ${v}`
export const tangentSlopeLabel = (v: string, motion = false) => `傾き＝${coefName(motion)} ${v}`

/** h = 0 にしようとしたとき（F2-8） */
export const ZERO_H_MESSAGE =
  "2点が重なると Δx = 0 となり、割り算ができません。だから「h を 0 に近づけたときの行き先」を考えます。"

/** ステップ②のはじめの一言 */
export const STEP2_GUIDE =
  "点B を点A に近づけていくと、2点を結ぶ直線の傾き（平均変化率）はどうなるかな？"

/** 結論をまだ見せていないときの問いかけ（先に「どこへ行くか」を予想させる） */
export const PREDICT_PROMPT = "h を 0 に近づけると、平均変化率はどんな値に近づくかな？ 予想してから ▶ を押そう。"

/** 結論（ことばで）F2-9 */
export const conclusionWords = (value: string, a: string, motion = false) =>
  motion
    ? `h を 0 に近づけると、平均の速さ（平均変化率）は ${value} に近づく。これが ${a} 秒における瞬間の速さ（微分係数・接線の傾き）。`
    : `h を 0 に近づけると、平均変化率は ${value} に近づく。これが x = ${a} における微分係数（接線の傾き）。`

/** 右から・左から */
export const SIDE_LABEL = { 1: "右から（h > 0）", [-1]: "左から（h < 0）" } as const

/** 記録表の列（F2-4） */
export const TABLE_HEADERS = ["h", "x = a + h", "f(a + h) − f(a)", "平均変化率"] as const

/** 記録表の列（時間・距離では最後の列を「平均の速さ（平均変化率）」に。表の幅が足りないので見出しの中で折り返す） */
export const tableHeaders = (motion = false): readonly string[] =>
  motion ? [...TABLE_HEADERS.slice(0, 3), avgRateName(true)] : TABLE_HEADERS

// ---- ステップ① 平均変化率 ----------------------------------------------------------

/** はじめの一言と、F1-6 の気づかせる一文 */
export const STEP1_GUIDE = "点A・点B を動かして、2点を結ぶ直線の傾き（平均変化率）を調べよう。"
export const STEP1_NOTICE = "この傾きは、2点の位置によって変わります。"

/** 2点を重ねようとしたとき */
export const SAME_POINT_MESSAGE =
  "2点が重なると Δx = 0 となり、割り算ができません。② では、2点を重ねずに近づけていきます。"

/** Δx・Δy の呼び方（ことばで／記号で） */
export const DELTA_X = { words: "横の変化", symbols: "Δx", motion: "かかった時間" } as const
export const DELTA_Y = { words: "縦の変化", symbols: "Δy", motion: "進んだ距離" } as const

/** ② へのつなぎ */
export const TO_STEP2 = "点B を点A にどんどん近づけたら、傾きはどうなる？"

// ---- ステップ③ 導関数 --------------------------------------------------------------

export const STEP3_GUIDE =
  "点A を動かすと、接線の傾きが変わります。下のグラフに、x と、そこでの接線の傾きを点で打っていこう。"

/** 下のグラフの縦軸（ことばで／記号で） */
export const SLOPE_AXIS = { words: "接線の傾き", symbols: "f'(x)", motion: "瞬間の速さ" } as const

/**
 * 下のグラフの点の縦の値（凡例・数値の表示）。縦軸の名前は f'(x)、点の値は a での値なので f'(a)。
 * 「f'(x) = 4」と書くと「f'(x) は定数 4」と読めてしまうため（2026-10-25 レビュー指摘）。
 */
export const SLOPE_AT_A = { words: "接線の傾き", symbols: "f'(a)", motion: "瞬間の速さ" } as const

/** F3-4 の説明 */
export const DERIVATIVE_DEFINITION = "各点での接線の傾きを集めた関数を、導関数 f'(x) といいます。"

/** 例：「y = x² なら f'(x) = 2x（x = 1 なら 2、x = 2 なら 4、x = 3 なら 6）」 */
export const derivativeExample = (f: string, df: string, pairs: [string, string][]) =>
  `y = ${f} なら f'(x) = ${df}（${pairs.map(([x, v]) => `x = ${x} なら ${v}`).join("、")}）`

/** なぞる前の問いかけ */
export const SWEEP_PROMPT = "▶ なぞる を押すと、点A が左から右へ動きます。下の点の軌跡は、どんなグラフになるかな？"

/**
 * 時間・距離で表しているときに、負の速さ・負の時間が出たら添える注記（2026-10-25 オーナー決定）。
 * x³ − 3x や a < 0 などでは「瞬間の速さ −2.25」「−1 秒」が出て、物理のことばと食い違うため。
 */
export const NEGATIVE_NOTE =
  "※ 速さが負のときは、距離が減る向き（もどる向き）に動いていることを表します。時間が負のときは、0 秒より前の時刻です。"

/** 注記を出すか（時間・距離で表していて、出ている値に負のものがある） */
export const needsNegativeNote = (motion: boolean, values: number[]) => motion && values.some((v) => v < 0)

// ======================================================
// 画面の文言（円の面積と円周のひみつ）
//
// ■ 用語の方針（要件 §1.2）
//   「輪」「帯」「切れ目」「ほどく」「巻き戻す」「積み上げる」など、ロープの実演と同じ動詞を使う。
//   文言はここに集め、jest（src/__tests__/sekibun-en/step3.test.ts）で固定する。
//   動きによって当てはまらなくなる文言は、動きを引数で受け取って出し分ける（固定文が黙って嘘にならないように）。
// ======================================================

import type { Direction } from "./playback"
import { unrollPhase } from "./scene"

/** 表示レベル：ことばで（初期値）／記号で */
export type Level = "words" | "symbols"

// ---- ステップ③ 輪をほどいて積み上げる ------------------------------------------------

/** はじめの一言 */
export const STEP3_GUIDE =
  "円を細い輪に分けて、真下に切れ目を入れました。輪をほどいて積み上げると、どんな形になるかな？"

/** 再生ボタンの文字（はじめ・途中から・もう一度・動いているとき） */
export interface PlayLabels {
  start: string
  resume: string
  again: string
  pause: string
}

/** 再生ボタンの文字（③） */
export const PLAY_LABEL: PlayLabels = {
  start: "▶ ほどく",
  resume: "▶ 続ける",
  again: "▶ もう一度ほどく",
  pause: "⏸ 止める",
}

export const REWIND_LABEL = "◀ 巻き戻す"

/** 完成したときのラベル（F3-6） */
export const BASE_LABEL = "底辺 ＝ いちばん外側の輪の長さ ＝ 円周 2πr"
export const HEIGHT_LABEL = "高さ ＝ r"

/**
 * 図の下の一言。進み具合 t と、動いている向き moving（1：ほどく、−1：巻き戻す、null：止まっている）で出し分ける。
 * 全部の輪が同時にほどけるので「1本ずつ」とは言わない（F3-8 の「1本ずつほどく」と取り違えないように）。
 */
export function unrollMessage(t: number, moving: Direction): string {
  // 動いている向きを先に見る（巻き戻し始めの t > 0.98 で「積み上がりました」と出さない）
  if (moving === 1) return "輪がほどけて、まっすぐな帯にのびていきます。帯の長さは、それぞれの輪の円周です。"
  if (moving === -1) return "帯が曲がって、もとの輪にもどっていきます。"
  const phase = unrollPhase(t)
  if (phase === "done") return "外側の輪ほど長い帯になって、直角三角形に積み上がりました。"
  if (phase === "start") return "真下に切れ目を入れました。"
  return "途中で止めています。どの途中でも、帯の長さはそれぞれの輪の円周のままです。"
}

/** 結論（F3-6） */
export const STEP3_CONCLUSION = "三角形の面積 ＝ ½ × 2πr × r ＝ πr²　→　円の面積にもどった"

/** 結論をまだ見せていないときの問いかけ */
// ボタンの名前は入れない（ボタンは「▶ 続ける」などに変わるため）
export const STEP3_PREDICT = "輪を全部ほどいて積み上げてみよう。積み上げた形の面積は、もとの円の面積と同じはず。"

/** 輪の数を増やすと（F3-7） */
export const RING_COUNT_NOTE = "輪の数を増やすと、階段のでこぼこが小さくなって、なめらかな三角形に近づきます。"

// ---- ステップ② 輪を切り開く ----------------------------------------------------------

/**
 * 式の中の空白は改行しない空白（U+00A0）にする。
 * 「2π × 1.875 ≒ 11.78」の「≒」のあとで改行され、値だけが次の行に落ちるのを防ぐ（日本語の部分では折り返してよい）。
 */
const math = (s: string) => s.replace(/ /g, " ")

/** はじめの一言 */
export const STEP2_GUIDE =
  "円の中から輪を1本選んで、真下の切れ目から切り開いてみよう。輪はタップ（クリック）しても選べます。"

/** 再生ボタンの文字（②） */
export const CUT_LABEL: PlayLabels = {
  start: "▶ 切り開く",
  resume: "▶ 続ける",
  again: "▶ もう一度切り開く",
  pause: "⏸ 止める",
}

/** 輪を選ぶボタン */
export const PICK_INNER = "◀ 内側の輪"
export const PICK_OUTER = "外側の輪 ▶"

/** 選んでいる輪（例：「内側から 8 本目の輪（いちばん外側）」） */
export const pickedRingLabel = (i: number, n: number) =>
  `内側から ${i} 本目の輪${i === n ? "（いちばん外側）" : i === 1 ? "（いちばん内側）" : ""}`

/** 帯の長さ（F2-3）。例：「長さ ＝ 輪のまん中の円周 2π × 1.875 ≒ 11.78」 */
export const stripLengthText = (mid: string, length: string) => `長さ ＝ 輪のまん中の円周 ${math(`2π × ${mid} ≒ ${length}`)}`

/** 帯の太さ（F2-3） */
export const stripWidthText = (width: string) => `太さ ＝ ${width}（半径をのばした量）`

/** 輪の面積（F2-3） */
export const ringAreaText = (length: string, width: string, area: string) =>
  `輪の面積 ≒ 円周 × 太さ ＝ ${math(`${length} × ${width} ≒ ${area}`)}`

/** 図の上、帯のそばのラベル（切り開いたあと） */
export const stripTag = (mid: string) => `長さ ＝ 2π × ${mid}`

/** 切り開いたあとの一言 */
export const STEP2_DONE =
  "輪を切り開くと、長さが円周、太さがのばした量の、細長い帯になりました。帯はほとんど長方形なので、面積は 長さ × 太さ。"

/** 図の帯の下のラベル（切り開いたあと） */
export const stripWidthTag = (width: string) => `太さ ＝ ${width}`

// ---- ステップ① 面積の増え方 ----------------------------------------------------------

/** はじめの一言 */
export const STEP1_GUIDE =
  "半径 2 の円の半径を、h だけのばしてみよう。増えた面積は、まわりの細い輪1本。「1段ずつ」で h を小さくしていくと、増えた面積 ÷ h はどうなるかな？"

export const STEP_BUTTON = "1段ずつ"
export const RESET_BUTTON = "リセット"

/** 記録表の列（F1-3） */
export const GROWTH_HEADERS = ["のばした量 h", "増えた面積", "増えた面積 ÷ h"] as const

/** 目標の値（F1-3）。例：「半径 2 の円周 2π × 2 ＝ 12.57」 */
export const targetText = (r: string, c: string) => `半径 ${r} の円周 2π × ${r} ＝ ${c}`

/** 結論（F1-5）。まだ 0.001 まで行っていないときは問いかけ */
export const STEP1_PREDICT = "h を 0 に近づけると、増えた面積 ÷ h は、どんな値に近づくかな？ 「1段ずつ」で確かめよう。"
export const step1Conclusion = (c: string, r: string) =>
  `h を 0 に近づけると、増えた面積 ÷ h は ${c} に近づく。これは半径 ${r} の円周。面積の増え方 ＝ 円周`

/** h を 0 にしようとしたとき（スライダーの左はしは 0.001） */
export const H_MIN_NOTE = "h は 0 にはできません（0 だと輪がなくなって、÷ h もできない）。いちばん小さくて 0.001 です。"

/** 図のラベル */
export const radiusTag = (r: string) => `r = ${r}`
export const LOUPE_TAG = "輪の一部を拡大"

// ---- ステップ④ 速さと距離とくらべる ------------------------------------------------------

/** はじめの一言 */
export const STEP4_GUIDE =
  "左は「速さ 2x」のグラフ、右は「円周 2πr」のグラフ。スライダーで x（＝ r）を動かして、グラフの下の三角形の面積をくらべよう。"

/** グラフの軸（F4-1） */
export const SPEED_AXES = { x: "時間 x（秒）", y: "速さ 2x（m/秒）" } as const
export const CIRCLE_AXES = { x: "半径 r", y: "円周 2πr" } as const

/** グラフの見出し */
export const SPEED_TITLE = "速さと距離"
export const CIRCLE_TITLE = "円周と円の面積"

/**
 * 面積の式（F4-2）。2行に分ける（1行にすると「＝ x²」と「＝ 4」が別の行に割れて読みにくいため）。
 *   1行目：距離 ＝ 三角形の面積 ＝ ½ × 2 × 4
 *   2行目：x² ＝ 4（大きく）
 */
// 式には丸めた小数を出さず「½ × 3 × (2π × 3)」と書く（丸めた円周 18.85 を出すと、電卓で検算した 28.28 と
// 答えの 28.27 が合わなくなるため。2026-10-26 レビュー指摘）。「円周 2πr を積み上げる」ことも式で見える
export const distanceText = (x: string) => `距離 ＝ 三角形の面積 ＝ ${math(`½ × ${x} × (2 × ${x})`)}`
export const distanceResult = (area: string) => `x² ＝ ${area}`
export const circleAreaText = (r: string) => `円の面積 ＝ 三角形の面積 ＝ ${math(`½ × ${r} × (2π × ${r})`)}`
export const circleAreaResult = (area: string) => `πr² ＝ ${area}`

/** 細い長方形で塗る（F4-3） */
export const RECTS_TOGGLE = "細い長方形を積み上げて塗る"
export const RECTS_NOTE =
  "右の細い長方形1本は、③ でほどいた帯1本と同じ（長さ ＝ 輪のまん中の円周、太さ ＝ 長方形の幅）。本数を増やすと、階段がなめらかな三角形に近づきます。"

/** F4-4 の説明 */
export const SAME_SHAPE_NOTE =
  "軸の名前がちがうだけで、やっていることは同じ。速さを積み上げると距離、円周を積み上げると円の面積になります。"

/**
 * スライド24のまとめ表（F4-4）。行：微分・積分、列：運動・円。
 * スライドそのものは手元にないため、要件の「微分：取り出す／積分：積み上げる × 運動／円」から組み立てた（オーナー確認待ち）。
 */
export const SUMMARY = {
  cols: ["運動", "円"],
  rows: [
    { head: "微分（取り出す）", cells: ["距離 x² → 速さ 2x", "面積 πr² → 円周 2πr"] },
    { head: "積分（積み上げる）", cells: ["速さ 2x → 距離 x²", "円周 2πr → 面積 πr²"] },
  ],
} as const

// ---- 記号で（表示レベル。要件 §1.2・Q3：初期は「ことばで」） ---------------------------------

/** ① の結論（F1-5）：面積を微分すると円周 */
export const SYMBOL_DERIVATIVE = "(πr²)' = 2πr"
/** ③ の結論（F3-9）：円周を積分すると面積 */
export const SYMBOL_INTEGRAL = "∫₀ʳ 2πt dt = πr²"
/** F3-9：∫ のことばでの読み方 */
export const INTEGRAL_MEANING = "円周 2πt を、半径 t = 0 から r まで積み上げる"
/** ④：速さを積分すると距離 */
export const SYMBOL_INTEGRAL_SPEED = "∫₀ˣ 2t dt = x²"

/** 微分アプリへのリンク（要件 §7：相互リンク） */
export const TO_BIBUN = "微分の意味へ（微分の意味がわかる）→"

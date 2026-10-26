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

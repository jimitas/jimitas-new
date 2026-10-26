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

/** 再生ボタンの文字 */
export const PLAY_LABEL = {
  start: "▶ ほどく",
  resume: "▶ 続ける",
  again: "▶ もう一度ほどく",
  pause: "⏸ 止める",
} as const

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

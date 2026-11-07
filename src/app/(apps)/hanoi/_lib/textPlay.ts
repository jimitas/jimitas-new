// ======================================================
// ステップ① あそぶ の文言（text.ts の続き。「ことばで」では 漸化式・数学的帰納法・等比数列・再帰 を使わない）
// ======================================================

import type { Level } from "./text"

export const PLAY_INTRO = "棒をタップすると、いちばん上の円盤が持ち上がるよ。次に、置きたい棒をタップしてね（ドラッグでも動かせるよ）。"
export const MSG_BIG_ON_SMALL = "小さい円盤の上に大きい円盤はのせられないよ"
export const MSG_EMPTY = "その棒には円盤がないよ"
export const COUNT_LABEL = "動かした回数"
export const MIN_SHOW = "最少回数を見る"
export const MIN_HIDE = "最少回数をかくす"
export const BTN_UNDO = "1つもどす"
export const BTN_RESET = "最初から"
export const VERDICT_BEST = "最少回数でクリア！"
export const VERDICT_MORE = "もっと少なくできるかも？"
export const RECORD_TITLE = "記録表"
export const RECORD_HEAD = ["枚数", "あなたの回数", "最少回数（かくせる）"] as const
export const RECORD_EMPTY = "クリアすると、ここに記録されるよ"
export const LOG_TITLE = "動かした手順"
export const PLAY_KEYS = "キーボード：1・2・3 で A・B・C の棒を選べるよ"

/** 最少回数の表示（記号では式つき） */
export function minText(n: number, level: Level): string {
  const v = 2 ** n - 1
  return level === "symbols" ? `2ⁿ−1 ＝ ${v}回` : `${v}回`
}

/** クリア表示：「クリア！ 7回」 */
export function clearText(count: number): string {
  return `クリア！ ${count}回`
}

/** クリア画面の枚数・回数・日時（スクリーンショット用） */
export function clearStamp(n: number, count: number, d: Date): string {
  const p = (x: number) => String(x).padStart(2, "0")
  return `${n}枚　${count}回　${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

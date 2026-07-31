// ======================================================
// 夏の星カタログ（natsu-no-hoshi アプリ用）
//
// ra  … 赤経［度］（0〜360）※星図では「何時何分」で書かれることが多いが、
//       計算しやすいように度に直してある（1時間 = 15度）
// dec … 赤緯［度］（-90〜+90）北がプラス
// mag … 見かけの等級。数が小さいほど明るい（1等星 > 2等星 > …）
// color … 星の色。実際の星の色（表面温度のちがい）を子ども向けに5段階にまとめたもの
//
// 収録: こと座・はくちょう座・わし座（＝夏の大三角）＋さそり座＋北極星
// ======================================================

/** 星の色（表面温度が高い順）*/
export type StarColor = "青白" | "白" | "黄白" | "オレンジ" | "赤"

/** 色コード（SVG の塗りに使う）*/
// ※「物の色」なので raw な色指定。実際の星の色みに寄せている
export const STAR_COLOR_HEX: Record<StarColor, string> = {
  青白: "#bcd8ff",
  白: "#ffffff",
  黄白: "#fff4d6",
  オレンジ: "#ffcf9b",
  赤: "#ff9a76",
}

export type Star = {
  /** 一意のID（クイズの正誤判定に使う）*/
  id: string
  /** 表示名。空文字なら名前を出さない（星座の形を作るだけの星）*/
  name: string
  ra: number
  dec: number
  mag: number
  color: StarColor
  /** 1等星など、名前を覚えてほしい主役の星 */
  isMain?: boolean
  /** 【さがそう】モードで出す説明 */
  info?: string
}

// ── こと座（Lyra）──────────────────────────────────────
const LYRA: Star[] = [
  {
    id: "vega", name: "ベガ", ra: 279.234, dec: 38.784, mag: 0.03, color: "青白",
    isMain: true,
    info: "こと座の1等星。夏の大三角の中でいちばん明るく、青白くかがやく。七夕の「おりひめ星」だよ。",
  },
  { id: "lyr-zeta",  name: "", ra: 281.193, dec: 37.605, mag: 4.34, color: "白" },
  { id: "lyr-delta", name: "", ra: 283.626, dec: 36.899, mag: 4.30, color: "オレンジ" },
  { id: "lyr-beta",  name: "", ra: 282.520, dec: 33.363, mag: 3.52, color: "青白" },
  { id: "lyr-gamma", name: "", ra: 284.736, dec: 32.690, mag: 3.25, color: "青白" },
]

// ── はくちょう座（Cygnus）──────────────────────────────
const CYGNUS: Star[] = [
  {
    id: "deneb", name: "デネブ", ra: 310.358, dec: 45.280, mag: 1.25, color: "白",
    isMain: true,
    info: "はくちょう座の1等星。しっぽの部分にある。とても遠くにあるのに明るく見える、実はすごく大きな星。",
  },
  { id: "cyg-gamma", name: "", ra: 305.557, dec: 40.257, mag: 2.23, color: "黄白" },
  { id: "cyg-delta", name: "", ra: 296.243, dec: 45.131, mag: 2.87, color: "青白" },
  { id: "cyg-eps",   name: "", ra: 311.553, dec: 33.970, mag: 2.48, color: "オレンジ" },
  { id: "cyg-beta",  name: "", ra: 292.680, dec: 27.960, mag: 3.05, color: "オレンジ" },
]

// ── わし座（Aquila）────────────────────────────────────
const AQUILA: Star[] = [
  {
    id: "altair", name: "アルタイル", ra: 297.696, dec: 8.868, mag: 0.77, color: "白",
    isMain: true,
    info: "わし座の1等星。両どなりに星がならんでいるのが目じるし。七夕の「ひこ星」だよ。",
  },
  { id: "aql-gamma", name: "", ra: 296.565, dec: 10.613, mag: 2.72, color: "オレンジ" },
  { id: "aql-beta",  name: "", ra: 298.828, dec:  6.407, mag: 3.71, color: "黄白" },
  { id: "aql-zeta",  name: "", ra: 286.353, dec: 13.863, mag: 2.99, color: "白" },
  { id: "aql-delta", name: "", ra: 291.375, dec:  3.115, mag: 3.36, color: "黄白" },
  { id: "aql-theta", name: "", ra: 302.826, dec: -0.821, mag: 3.23, color: "青白" },
  { id: "aql-lambda",name: "", ra: 286.562, dec: -4.882, mag: 3.43, color: "青白" },
]

// ── さそり座（Scorpius）────────────────────────────────
const SCORPIUS: Star[] = [
  {
    id: "antares", name: "アンタレス", ra: 247.352, dec: -26.432, mag: 1.06, color: "赤",
    isMain: true,
    info: "さそり座の1等星。さそりの心ぞうの位置で、赤くかがやく。ベガとくらべると色のちがいがよく分かるよ。",
  },
  { id: "sco-beta",  name: "", ra: 241.359, dec: -19.805, mag: 2.62, color: "青白" },
  { id: "sco-delta", name: "", ra: 240.083, dec: -22.622, mag: 2.32, color: "青白" },
  { id: "sco-pi",    name: "", ra: 239.713, dec: -26.114, mag: 2.89, color: "青白" },
  { id: "sco-sigma", name: "", ra: 245.297, dec: -25.593, mag: 2.89, color: "青白" },
  { id: "sco-tau",   name: "", ra: 248.971, dec: -28.216, mag: 2.82, color: "青白" },
  { id: "sco-eps",   name: "", ra: 252.543, dec: -34.293, mag: 2.29, color: "オレンジ" },
  { id: "sco-mu",    name: "", ra: 252.967, dec: -38.048, mag: 3.00, color: "青白" },
  { id: "sco-zeta",  name: "", ra: 253.646, dec: -42.362, mag: 3.62, color: "オレンジ" },
  { id: "sco-eta",   name: "", ra: 258.038, dec: -43.239, mag: 3.32, color: "黄白" },
  { id: "sco-theta", name: "", ra: 264.330, dec: -42.998, mag: 1.86, color: "黄白" },
  { id: "sco-iota",  name: "", ra: 266.896, dec: -40.127, mag: 3.03, color: "黄白" },
  { id: "sco-kappa", name: "", ra: 265.622, dec: -39.030, mag: 2.41, color: "青白" },
  { id: "sco-lambda",name: "", ra: 263.402, dec: -37.104, mag: 1.62, color: "青白" },
  { id: "sco-ups",   name: "", ra: 262.691, dec: -37.296, mag: 2.69, color: "青白" },
]

// ── こぐま座（北極星）──────────────────────────────────
const POLARIS: Star[] = [
  {
    id: "polaris", name: "北極星", ra: 37.954, dec: 89.264, mag: 1.98, color: "黄白",
    isMain: true,
    info: "こぐま座の星で、ほぼ真北にある。時間がたっても動かないので、方角のめじるしになる。高さは、その土地のいどと同じになるよ。",
  },
]

/** 全ての星 */
export const STARS: Star[] = [
  ...LYRA, ...CYGNUS, ...AQUILA, ...SCORPIUS, ...POLARIS,
]

/** id から星を引く */
export const STAR_BY_ID: Record<string, Star> = Object.fromEntries(
  STARS.map(s => [s.id, s]),
)

// ── 星座の線 ────────────────────────────────────────────
// 子どもが形をつかみやすいように、教材向けに簡略化した線のつなぎ方。
export type Constellation = {
  id: string
  name: string
  /** 星ID のペアの配列（この2星を線で結ぶ）*/
  lines: [string, string][]
  /** 星座名を表示する位置の基準にする星 */
  labelStarId: string
}

export const CONSTELLATIONS: Constellation[] = [
  {
    id: "lyra", name: "こと座", labelStarId: "vega",
    lines: [
      ["vega", "lyr-zeta"],
      ["lyr-zeta", "lyr-delta"],
      ["lyr-delta", "lyr-gamma"],
      ["lyr-gamma", "lyr-beta"],
      ["lyr-beta", "lyr-zeta"],
    ],
  },
  {
    id: "cygnus", name: "はくちょう座", labelStarId: "deneb",
    lines: [
      // 大きな十字（北十字）
      ["deneb", "cyg-gamma"],
      ["cyg-gamma", "cyg-beta"],
      ["cyg-delta", "cyg-gamma"],
      ["cyg-gamma", "cyg-eps"],
    ],
  },
  {
    id: "aquila", name: "わし座", labelStarId: "altair",
    lines: [
      // アルタイルと両どなりの星（3つのならび）
      ["aql-gamma", "altair"],
      ["altair", "aql-beta"],
      // つばさ
      ["aql-zeta", "aql-gamma"],
      ["altair", "aql-delta"],
      ["aql-delta", "aql-lambda"],
      ["aql-beta", "aql-theta"],
    ],
  },
  {
    id: "scorpius", name: "さそり座", labelStarId: "antares",
    lines: [
      // あたま
      ["sco-beta", "sco-delta"],
      ["sco-delta", "sco-pi"],
      // からだ
      ["sco-delta", "sco-sigma"],
      ["sco-sigma", "antares"],
      ["antares", "sco-tau"],
      ["sco-tau", "sco-eps"],
      // しっぽ（Sの字にカーブする）
      ["sco-eps", "sco-mu"],
      ["sco-mu", "sco-zeta"],
      ["sco-zeta", "sco-eta"],
      ["sco-eta", "sco-theta"],
      ["sco-theta", "sco-iota"],
      ["sco-iota", "sco-kappa"],
      ["sco-kappa", "sco-lambda"],
      ["sco-lambda", "sco-ups"],
    ],
  },
]

/** 夏の大三角を作る3つの星 */
export const SUMMER_TRIANGLE = ["vega", "deneb", "altair"] as const

/** 【むすぼう】クイズで出題する星（名前を覚えてほしい星）*/
export const QUIZ_STAR_IDS = ["vega", "deneb", "altair", "antares", "polaris"] as const

/**
 * 等級 → 星を描く半径［px］
 *
 * 明るい星（等級が小さい）ほど大きく描く。
 * 0等星で約6px、4等星で約2px になるようにしている。
 */
export function magToRadius(mag: number): number {
  return Math.max(1.6, 6.2 - mag * 1.1)
}

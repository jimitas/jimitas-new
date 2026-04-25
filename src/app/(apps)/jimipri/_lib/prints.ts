// じみぷり 全39種のプリント定義データ
// Phase 1: tasu-1, hiku-1, tasu-2, hiku-2, kake-1 の5本を実装
// 残りは後続フェーズで generate 関数を差し替える

import { PrintDef, GradeGroup } from "./types"
import { generateTasu1 } from "./problems/tasu1"
import { generateHiku1 } from "./problems/hiku1"
import { generateTasu2 } from "./problems/tasu2"
import { generateHiku2 } from "./problems/hiku2"
import { generateKake1 } from "./problems/kake1"
import { generateKake2 } from "./problems/kake2"
import { generateWarizan } from "./problems/warizan"
import { generateWariAmari } from "./problems/wariAmari"
import { generateHyakuMade } from "./problems/hyakuMade"
import { generateMittuNo } from "./problems/mittuNo"
import { generateHissan1 } from "./problems/hissan1"
import { generateHissan2 } from "./problems/hissan2"
import { generateKakeHissan1 } from "./problems/kakeHissan1"
import { generateKakeHissan2 } from "./problems/kakeHissan2"
import { generateWariHissan1 } from "./problems/wariHissan1"
import { generateWariHissan2 } from "./problems/wariHissan2"
import { generateShousuKiso } from "./problems/shousuKiso"
import { generateShousuKake } from "./problems/shousuKake"
import { generateShousuWari } from "./problems/shousuWari"
import { generateSenMade } from "./problems/senMade"
import { generateManMade } from "./problems/manMade"
import { generateKasaNagasa } from "./problems/kasaNagasa"
import { generateJikoku } from "./problems/jikoku"
import { generateMonoHito } from "./problems/monoHito"
import { generateTasuHiku } from "./problems/tasuHiku"
import { generateTaiseki } from "./problems/taiseki"
import { generateTaniryou } from "./problems/taniryou"
import { generateHayasa } from "./problems/hayasa"
import { generateMojitoshiki } from "./problems/mojitoshiki"
import { generateHirei } from "./problems/hirei"
import { generateBunsuKiso } from "./problems/bunsuKiso"
import { generateBunsu1 } from "./problems/bunsu1"
import { generateBunsu2 } from "./problems/bunsu2"
import { generateBunsuKake } from "./problems/bunsuKake"
import { generateBunsuWari } from "./problems/bunsuWari"
import { generateNanbanme } from "./problems/nanbanme"
import { generateNanji1 } from "./problems/nanji1"
import { generateNanji2 } from "./problems/nanji2"
import { generateHyouGraph } from "./problems/hyouGraph"

// 未実装プリントのプレースホルダー
const notImplemented = () => ({ left: [], right: [], answers: [] })

// ======================================================
// 全プリント定義
// originalNumber は元ファイル番号（01〜39）に対応
// ======================================================
export const ALL_PRINTS: PrintDef[] = [
  // --- 1年生 ---
  { id: "nanbanme",   title: "なんばんめ",               originalNumber: 1,  grade: 1, operator: "", modes: [{ label: "なんばんめ", value: 0 }], generate: generateNanbanme, displayType: "custom" },
  { id: "tasu-1",     title: "たしざん（１）",           originalNumber: 2,  grade: 1, operator: "+", modes: [{ label: "10までのたしざん", value: 0 }], generate: generateTasu1, displayType: "oneLine" },
  { id: "hiku-1",     title: "ひきざん（１）",           originalNumber: 3,  grade: 1, operator: "-", modes: [{ label: "10までのひきざん", value: 0 }], generate: generateHiku1, displayType: "oneLine" },
  { id: "nanji-1",    title: "なんじ　なんじはん",       originalNumber: 4,  grade: 1, operator: "", modes: [{ label: "なんじ　なんじはん", value: 0 }], generate: generateNanji1, displayType: "custom" },
  { id: "3tuno",      title: "３つのかずのけいさん",     originalNumber: 5,  grade: 1, operator: "", modes: [{ label: "〇+〇+〇", value: 0 }, { label: "〇-〇-〇", value: 1 }, { label: "+と-のまじった", value: 2 }], generate: generateMittuNo, displayType: "threeLine" },
  { id: "tasu-2",     title: "たしざん（２）",           originalNumber: 6,  grade: 1, operator: "+", modes: [{ label: "20までのたしざん", value: 0 }], generate: generateTasu2, displayType: "oneLine" },
  { id: "hiku-2",     title: "ひきざん（２）",           originalNumber: 7,  grade: 1, operator: "-", modes: [{ label: "くりさがり あり", value: 0 }, { label: "１□-□", value: 1 }], generate: generateHiku2, displayType: "oneLine" },
  { id: "mono-hito",  title: "ものとひとのかず",         originalNumber: 8,  grade: 1, operator: "", modes: [{ label: "ものとひとのかず", value: 0 }], generate: generateMonoHito, displayType: "custom" },
  { id: "nanji-2",    title: "なんじ　なんぷん",         originalNumber: 9,  grade: 1, operator: "", modes: [{ label: "なんじなんぷん", value: 0 }], generate: generateNanji2, displayType: "custom" },
  { id: "tasu-hiku",  title: "たすのかな　ひくのかな",   originalNumber: 10, grade: 1, operator: "", modes: [{ label: "たすのかなひくのかな", value: 0 }], generate: generateTasuHiku, displayType: "custom" },
  { id: "100made",    title: "１００までのかずのけいさん", originalNumber: 11, grade: 1, operator: "", modes: [{ label: "〇0+〇0", value: 0 }, { label: "〇0-〇0", value: 1 }, { label: "〇〇+〇", value: 2 }, { label: "〇〇-〇", value: 3 }], generate: generateHyakuMade, displayType: "oneLine" },

  // --- 2年生 ---
  { id: "hyou-graph", title: "ひょう・グラフ",           originalNumber: 12, grade: 2, operator: "", modes: [{ label: "ひょう・グラフ", value: 0 }], generate: generateHyouGraph, displayType: "custom" },
  { id: "hissan-1",   title: "たし算とひき算のひっ算（１）", originalNumber: 13, grade: 2, operator: "", modes: [{ label: "+くり上がりなし", value: 0 }, { label: "+くり上がりあり", value: 1 }, { label: "-くりさがりなし", value: 2 }, { label: "-くりさがりあり", value: 3 }], generate: generateHissan1, displayType: "column" },
  { id: "1000made",   title: "１０００までの数",         originalNumber: 14, grade: 2, operator: "", modes: [{ label: "1000までの数", value: 0 }], generate: generateSenMade, displayType: "custom" },
  { id: "hissan-2",   title: "たし算とひき算のひっ算（２）", originalNumber: 15, grade: 2, operator: "", modes: [{ label: "100をこえるたし算", value: 0 }, { label: "99+99まで", value: 1 }, { label: "100をこえるひき算", value: 2 }, { label: "1○○-○○", value: 3 }], generate: generateHissan2, displayType: "column" },
  { id: "kake-1",     title: "かけ算（１）",             originalNumber: 16, grade: 2, operator: "×", modes: [{ label: "かけざん(2〜5)のだん", value: 0 }], generate: generateKake1, displayType: "oneLine" },
  { id: "kake-2",     title: "かけ算（２）",             originalNumber: 17, grade: 2, operator: "×", modes: [{ label: "かけざん(6〜9)のだん", value: 0 }, { label: "かけざん(2〜9)のだん", value: 1 }], generate: generateKake2, displayType: "oneLine" },
  { id: "10000made",  title: "１００００までの数",       originalNumber: 18, grade: 2, operator: "", modes: [{ label: "10000までの数", value: 0 }], generate: generateManMade, displayType: "custom" },
  { id: "kasa-nagasa", title: "かさ・長さのたんい",      originalNumber: 19, grade: 2, operator: "", modes: [{ label: "かさ・長さ", value: 0 }], generate: generateKasaNagasa, displayType: "custom" },

  // --- 3年生 ---
  { id: "warizan",    title: "わり算",                   originalNumber: 20, grade: 3, operator: "÷", modes: [{ label: "わり算", value: 0 }], generate: generateWarizan, displayType: "oneLine" },
  { id: "jikoku",     title: "時こくと時間",             originalNumber: 21, grade: 3, operator: "", modes: [{ label: "時こくと時間", value: 0 }], generate: generateJikoku, displayType: "custom" },
  { id: "wari-amari", title: "あまりのあるわり算",       originalNumber: 22, grade: 3, operator: "÷", modes: [{ label: "あまりのあるわり算", value: 0 }], generate: generateWariAmari, displayType: "oneLine" },
  { id: "kake-hissan1", title: "１けたをかけるかけ算の筆算", originalNumber: 23, grade: 3, operator: "×", modes: [{ label: "くり上がりなし", value: 0 }, { label: "くり上がり1回A", value: 1 }, { label: "くり上がり1回B", value: 2 }, { label: "くり上がり2回", value: 3 }], generate: generateKakeHissan1, displayType: "column" },
  { id: "kake-hissan2", title: "２けたをかけるかけ算の筆算", originalNumber: 24, grade: 3, operator: "×", modes: [{ label: "2けた×2けた", value: 0 }, { label: "3けた×2けた", value: 1 }], generate: generateKakeHissan2, displayType: "column" },

  // --- 4年生 ---
  { id: "wari-hissan1", title: "１けたでわるわり算の筆算", originalNumber: 25, grade: 4, operator: "÷", modes: [{ label: "2けた÷1けた", value: 0 }, { label: "3けた÷1けた", value: 1 }], generate: generateWariHissan1, displayType: "division" },
  { id: "wari-hissan2", title: "２けたでわるわり算の筆算", originalNumber: 26, grade: 4, operator: "÷", modes: [{ label: "2けた÷2けた", value: 0 }, { label: "3けた÷2けた", value: 1 }, { label: "4けた÷2けた", value: 2 }], generate: generateWariHissan2, displayType: "division" },
  { id: "shousu-kiso", title: "小数のかけ算やわり算",     originalNumber: 27, grade: 4, operator: "", modes: [{ label: "小数×1けた", value: 0 }, { label: "小数÷1けた", value: 1 }, { label: "小数×2けた", value: 2 }, { label: "小数÷2けた", value: 3 }], generate: generateShousuKiso, displayType: "custom" },
  { id: "bunsu-kiso", title: "分数",                     originalNumber: 28, grade: 4, operator: "", modes: [{ label: "分数の基礎", value: 0 }], generate: generateBunsuKiso, displayType: "custom" },

  // --- 5年生 ---
  { id: "taiseki",    title: "体積",                     originalNumber: 29, grade: 5, operator: "", modes: [{ label: "体積", value: 0 }], generate: generateTaiseki, displayType: "custom" },
  { id: "shousu-kake", title: "小数のかけ算",             originalNumber: 30, grade: 5, operator: "×", modes: [{ label: "整数×小数", value: 0 }, { label: "小数×小数", value: 1 }, { label: "小数×小数(2)", value: 2 }], generate: generateShousuKake, displayType: "decimalColumn" },
  { id: "shousu-wari", title: "小数のわり算",             originalNumber: 31, grade: 5, operator: "÷", modes: [{ label: "割り切れるまで", value: 0 }, { label: "四捨五入", value: 1 }, { label: "商とあまり", value: 2 }], generate: generateShousuWari, displayType: "division" },
  { id: "bunsu-1",    title: "分数（１）",               originalNumber: 32, grade: 5, operator: "", modes: [{ label: "分数(1)", value: 0 }], generate: generateBunsu1, displayType: "custom" },
  { id: "taniryou",   title: "単位量あたりの大きさ",     originalNumber: 33, grade: 5, operator: "", modes: [{ label: "単位量あたり", value: 0 }], generate: generateTaniryou, displayType: "custom" },
  { id: "bunsu-2",    title: "分数（２）",               originalNumber: 34, grade: 5, operator: "", modes: [{ label: "分数(2)", value: 0 }], generate: generateBunsu2, displayType: "custom" },
  { id: "hayasa",     title: "速さ",                     originalNumber: 35, grade: 5, operator: "", modes: [{ label: "速さ", value: 0 }], generate: generateHayasa, displayType: "custom" },

  // --- 6年生 ---
  { id: "mojitoshiki", title: "文字と式",                 originalNumber: 36, grade: 6, operator: "", modes: [{ label: "文字と式", value: 0 }], generate: generateMojitoshiki, displayType: "custom" },
  { id: "bunsu-kake", title: "分数×分数",                 originalNumber: 37, grade: 6, operator: "×", modes: [{ label: "分数×整数", value: 0 }, { label: "分数×分数", value: 1 }, { label: "帯分数×分数", value: 2 }, { label: "帯分数×帯分数", value: 3 }], generate: generateBunsuKake, displayType: "custom" },
  { id: "bunsu-wari", title: "分数÷分数",                 originalNumber: 38, grade: 6, operator: "÷", modes: [{ label: "分数÷整数", value: 0 }, { label: "分数÷分数", value: 1 }, { label: "帯分数÷分数", value: 2 }, { label: "帯分数÷帯分数", value: 3 }], generate: generateBunsuWari, displayType: "custom" },
  { id: "hirei",      title: "比例と反比例",             originalNumber: 39, grade: 6, operator: "", modes: [{ label: "比例と反比例", value: 0 }], generate: generateHirei, displayType: "custom" },
]

// プリントIDから定義を取得
export function getPrintDef(printId: string): PrintDef | undefined {
  return ALL_PRINTS.find(p => p.id === printId)
}

// 実装済みかどうか判定
export function isImplemented(print: PrintDef): boolean {
  return print.generate !== notImplemented
}

// 学年グループを取得
const GRADE_LABELS: Record<number, string> = {
  1: "１ねんせい",
  2: "２年生",
  3: "３年生",
  4: "４年生",
  5: "５年生",
  6: "６年生",
}

export function getGradeGroups(): GradeGroup[] {
  const groups: GradeGroup[] = []
  for (let g = 1; g <= 6; g++) {
    const prints = ALL_PRINTS.filter(p => p.grade === g)
    if (prints.length > 0) {
      groups.push({
        grade: g,
        label: GRADE_LABELS[g] || `${g}年生`,
        prints,
      })
    }
  }
  return groups
}

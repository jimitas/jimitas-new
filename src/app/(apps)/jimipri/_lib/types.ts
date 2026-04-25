// じみぷり 型定義

/** 1行式の問題データ（20問セット） */
export type OneLineResult = {
  left: number[]
  right: number[]
  answers: (number | string)[]
}

/** 3つの数の計算の問題データ（10問セット） */
export type ThreeLineResult = {
  left: number[]
  kigo1: string[]
  mid: number[]
  kigo2: string[]
  right: number[]
  answers: (number | string)[]
}

/** 問題生成関数の型 */
export type ProblemGenerator = (modeIndex: number) => OneLineResult | ThreeLineResult

/** モード（セレクトメニューの選択肢） */
export type PrintMode = {
  label: string
  value: number
}

/** プリント定義 */
export type PrintDef = {
  /** URLスラッグ（例: "tasu-1"） */
  id: string
  /** 表示タイトル（例: "10までのたしざん"） */
  title: string
  /** 元ファイル番号（例: 2 → 02_tasu_1.js） */
  originalNumber: number
  /** 対象学年 */
  grade: number
  /** 演算記号（+, -, ×, ÷） */
  operator: string
  /** モード選択肢 */
  modes: PrintMode[]
  /** 問題生成関数 */
  generate: ProblemGenerator
  /** 表示タイプ */
  displayType: "oneLine" | "threeLine" | "column" | "division" | "decimalColumn" | "custom"
}

/** 学年グループ */
export type GradeGroup = {
  grade: number
  label: string
  prints: PrintDef[]
}

// ======================================================
// ページ全体のキー操作（要件 §6 P1）と、大きく表示の倍率
//
// ■ キー
//   スペース          ② ▶ 再生／一時停止（③ では使わない。下の練習問題を操作しているときに「なぞる」が
//                     動いて、生徒が打った軌跡が消えるため。2026-10-25 オーナー決定）
//   → ・ PageDown     ② 1段ずつ（プレゼン用リモコンは → や PageDown を送るので、手元で1段ずつ進められる）
//   点・スライダーを Tab で選んでいるときの ←→ は、それぞれの部品が a・h を動かす（ここでは扱わない）。
//
// ■ 実演の流れに合わせる（2026-10-25 レビュー指摘・オーナー決定）
//   マウスで何かを押すと、そこに選択（フォーカス）が残る。そのたびにスペースや → が効かなくなると、
//   実演では「スペースで再生」がほとんど使えない。そこで：
//   - スペースは、ボタン・チェックボックスを選んでいても「再生」にする（ブラウザがそのボタンを押す動作は
//     usePageKeys で止める。止めないと二重に動く）
//   - 点・スライダーは、マウス・タッチで触り終えたら選択を外す（Display.tsx の blurAfterPointer）。
//     Tab で選んだときだけ選択が残り、←→ が a・h を動かす
//
// ■ 横取りしないとき（ownsKey）
//   文字を打つ欄・選択肢（どのキーも自分で使う）。
//   点（role="button"）は ←→ だけ、スライダー（range・role="slider"）は ←→・PageDown を自分で使う（スペースは使わない）。
//   修飾キー（Ctrl・Alt・⌘）つきのときも横取りしない（ブラウザのショートカットを壊さない）。
// ======================================================

/** キーの行き先 */
export type KeyAction = "play" | "step" | null

/** 横取りしない要素（タグ名・type・role で判定する。テストでは本物の DOM の代わりに同じ形のものを渡す） */
export interface KeyTarget {
  tagName?: string
  isContentEditable?: boolean
  getAttribute?: (name: string) => string | null
}

/** ボタンのように、スペースで押せる要素（ブラウザの押す動作を止める必要がある） */
export function isPressable(t: KeyTarget | null): boolean {
  if (!t || !t.tagName) return false
  const tag = t.tagName.toUpperCase()
  const type = (t.getAttribute?.("type") ?? "").toLowerCase()
  return tag === "BUTTON" || (tag === "INPUT" && (type === "checkbox" || type === "radio"))
}

/**
 * この要素を選んでいるときは、そのキーを横取りしない。
 * kind：space（スペース）・arrow（→）・page（PageDown）
 */
export function ownsKey(t: KeyTarget | null, kind: "space" | "arrow" | "page"): boolean {
  if (!t || !t.tagName) return false
  if (t.isContentEditable) return true
  const tag = t.tagName.toUpperCase()
  const type = (t.getAttribute?.("type") ?? "").toLowerCase()
  const role = t.getAttribute?.("role")
  if (tag === "TEXTAREA" || tag === "SELECT") return true
  if (isPressable(t)) return false
  // 点：←→ だけ自分で使う（a・h を動かす）。PageDown は使わないのでリモコンの1段ずつにする
  if (role === "button") return kind === "arrow"
  // スライダー：←→・PageDown（大きく動かす）は自分で使う。スペースは使わない
  if (role === "slider" || (tag === "INPUT" && type === "range")) return kind !== "space"
  // それ以外の input は文字を打つ欄
  return tag === "INPUT"
}

/** キー → 行き先 */
export function keyAction(e: { key: string; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean }, target: KeyTarget | null): KeyAction {
  if (e.ctrlKey || e.altKey || e.metaKey) return null
  if (e.key === " " || e.key === "Spacebar") return ownsKey(target, "space") ? null : "play"
  if (e.key === "ArrowRight") return ownsKey(target, "arrow") ? null : "step"
  if (e.key === "PageDown") return ownsKey(target, "page") ? null : "step"
  return null
}

// ---- 大きく表示 -------------------------------------------------------------------

/** 線の太さの倍率 */
export const BIG_LINE = 1.6
/** グラフの文字・点の大きさの倍率（目盛り 14px → 約 18px） */
export const BIG_FONT = 1.3

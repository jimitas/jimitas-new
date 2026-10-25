// 微分の意味がわかる — _lib/keys.ts（ページ全体のキー操作・大きく表示の倍率）のテスト
import * as K from "@/app/(apps)/bibun/_lib/keys"
import { TICK_FONT } from "@/app/(apps)/bibun/_lib/viewport"

/** テスト用の要素（本物の DOM の代わり） */
const el = (tagName: string, role?: string, type?: string): K.KeyTarget => ({
  tagName,
  getAttribute: (n) => (n === "role" ? role ?? null : n === "type" ? type ?? null : null),
})
const BODY = el("BODY")

describe("keyAction", () => {
  test("スペース → 再生（② の ▶ ／ ❚❚。③ では使わない）", () => expect(K.keyAction({ key: " " }, BODY)).toBe("play"))
  test("→ と PageDown → 1段ずつ（プレゼン用リモコンが送るキー）", () => {
    expect(K.keyAction({ key: "ArrowRight" }, BODY)).toBe("step")
    expect(K.keyAction({ key: "PageDown" }, BODY)).toBe("step")
  })
  test("ほかのキーは何もしない", () => {
    for (const key of ["ArrowLeft", "Enter", "a", "PageUp"]) expect(K.keyAction({ key }, BODY)).toBeNull()
  })
  test("修飾キーつきは横取りしない（ブラウザのショートカットを壊さない）", () => {
    expect(K.keyAction({ key: " ", ctrlKey: true }, BODY)).toBeNull()
    expect(K.keyAction({ key: "ArrowRight", altKey: true }, BODY)).toBeNull()
    expect(K.keyAction({ key: "ArrowRight", metaKey: true }, BODY)).toBeNull()
  })

  // 文字を打つ欄・選択肢は、どのキーも自分で使う
  test.each([
    ["数値の入力欄", el("INPUT", undefined, "number")],
    ["文字の入力欄（練習問題の答え）", el("INPUT", undefined, "text")],
    ["選択肢", el("SELECT")],
  ])("%s を選んでいるときは、スペースも → も横取りしない", (_, t) => {
    expect(K.keyAction({ key: " " }, t)).toBeNull()
    expect(K.keyAction({ key: "ArrowRight" }, t)).toBeNull()
  })

  // スライダーを Tab で選んでいるときの ←→・PageDown は、スライダーが h を動かす。
  // スペースは使わないので「再生」にする（2026-10-25 オーナー決定）
  test.each([
    ["スライダー（input range）", el("input", undefined, "range")],
    ["role=slider", el("DIV", "slider")],
  ])("%s を選んでいるときは、→・PageDown は横取りせず、スペースは再生", (_, t) => {
    expect(K.keyAction({ key: "ArrowRight" }, t)).toBeNull()
    expect(K.keyAction({ key: "PageDown" }, t)).toBeNull()
    expect(K.keyAction({ key: " " }, t)).toBe("play")
  })
  // 点は ←→ だけ使う。PageDown は使わないので、リモコンの1段ずつにする
  test("点（role=button の g）を選んでいるときは、→ は横取りせず、PageDown は1段ずつ・スペースは再生", () => {
    const t = el("g", "button")
    expect(K.keyAction({ key: "ArrowRight" }, t)).toBeNull()
    expect(K.keyAction({ key: "PageDown" }, t)).toBe("step")
    expect(K.keyAction({ key: " " }, t)).toBe("play")
  })

  // マウスでボタンを押すとそのボタンに選択が残る。実演では「何かを押してからスペース」がほぼ必ず起きるので、
  // ボタン・チェックボックスを選んでいてもスペースは再生、→ は1段ずつにする。
  // （ブラウザがそのボタンを押す動作は usePageKeys が止める。isPressable がその目印）
  test.each([
    ["ボタン", el("BUTTON")],
    ["チェックボックス", el("INPUT", undefined, "checkbox")],
  ])("%s を選んでいても、スペースは再生・→ は1段ずつ", (_, t) => {
    expect(K.keyAction({ key: " " }, t)).toBe("play")
    expect(K.keyAction({ key: "ArrowRight" }, t)).toBe("step")
    expect(K.keyAction({ key: "PageDown" }, t)).toBe("step")
    expect(K.isPressable(t)).toBe(true)
  })
  test("点・スライダー・ふつうの要素は isPressable ではない", () => {
    expect(K.isPressable(el("g", "button"))).toBe(false)
    expect(K.isPressable(el("INPUT", undefined, "range"))).toBe(false)
    expect(K.isPressable(el("DIV"))).toBe(false)
  })
  test("ふつうの要素を選んでいるときは横取りする", () => {
    expect(K.keyAction({ key: " " }, el("DIV"))).toBe("play")
    expect(K.keyAction({ key: " " }, null)).toBe("play")
  })
  test("編集できる要素では横取りしない", () =>
    expect(K.keyAction({ key: " " }, { tagName: "DIV", isContentEditable: true })).toBeNull())
})

describe("大きく表示の倍率", () => {
  test("目盛りの文字は 18px 以上になる（投影で読める大きさ）", () =>
    expect(TICK_FONT * K.BIG_FONT).toBeGreaterThanOrEqual(18))
  test("線は太くなる", () => expect(K.BIG_LINE).toBeGreaterThan(1))
})

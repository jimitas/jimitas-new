// ハノイの塔 — 言葉づかいの番人（要件 §1.2・§5.3）
//   ・「漸化式」「数学的帰納法」「等比数列」「再帰」は、ステップ⑤の「もっと知りたい人へ」（textHistory.ts）以外に書かない
//   ・歴史の記述に使う年号は 1883年 だけ（§5.3 の事実以外は書かない）
import * as fs from "fs"
import * as path from "path"

const ROOT = path.join(process.cwd(), "src", "app", "(apps)", "hanoi")

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? files(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : []
  })
}

const ALL = files(ROOT)
const NAMES = ["漸化式", "数学的帰納法", "等比数列", "再帰"]

describe("言葉づかい", () => {
  test("hanoi の読み込み対象が見つかっている（空振り防止）", () => {
    expect(ALL.length).toBeGreaterThan(15)
    expect(ALL.some((f) => f.endsWith("textHistory.ts"))).toBe(true)
  })
  test.each(NAMES)("「%s」は textHistory.ts 以外のファイル（コメントも含む）に出てこない", (word) => {
    const hits = ALL.filter((f) => !f.endsWith("textHistory.ts") && fs.readFileSync(f, "utf8").includes(word))
    expect(hits.map((f) => path.basename(f))).toEqual([])
  })
  test("textHistory.ts でも、4語は「もっと知りたい人へ」の2行にしか出ない", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const T = require("@/app/(apps)/hanoi/_lib/textHistory")
    const others = [...T.RULE_LINES, ...T.STORY_LINES, ...T.IDEA_LINES, ...T.FORMULA_LINES].join("\n")
    for (const w of NAMES) expect(others.includes(w)).toBe(false)
    expect(T.MORE_LINES.join("\n")).toContain("再帰")
  })
  test("歴史・伝説に出てくる年号は 1883年 だけ", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const T = require("@/app/(apps)/hanoi/_lib/textHistory")
    const years = (T.STORY_LINES.join("\n").match(/\d{4}年/g) ?? []) as string[]
    expect(years).toEqual(["1883年"])
  })
  test("伝説は創作と考えられていること・ハノイの由来は「考えられている」と書く（断定しない）", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const T = require("@/app/(apps)/hanoi/_lib/textHistory")
    const s = T.STORY_LINES.join("\n")
    expect(s).toContain("リュカの創作だと考えられている")
    expect(s).toContain("名前の由来だと考えられている")
  })
})

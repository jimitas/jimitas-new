// 微分の意味がわかる — 用語の方針（要件 §1.1）の番人
//
// 「割線」は生徒になじみがないので画面に出さない。例外は「記号で」表示の補足 SECANT_NOTE の1か所だけ。
// 文言を text.ts の外（コンポーネントの JSX）に直接書いても見つけられるよう、bibun の全ファイルを読む。
// コメントに書いても落ちる（書くなら「教科書の用語」などと言いかえる）。
import * as fs from "fs"
import * as path from "path"
import * as T from "@/app/(apps)/bibun/_lib/text"

const ROOT = path.join(__dirname, "../../app/(apps)/bibun")
const files = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : [])

describe("「割線」は SECANT_NOTE の1か所だけ", () => {
  test("bibun のファイルを10本以上読んでいる（検査が空回りしていない）", () =>
    expect(files(ROOT).length).toBeGreaterThanOrEqual(10))

  test("text.ts 以外のファイルには「割線」がない", () => {
    const hits = files(ROOT)
      .filter((f) => path.basename(f) !== "text.ts")
      .filter((f) => fs.readFileSync(f, "utf8").includes("割線"))
      .map((f) => path.relative(ROOT, f))
    expect(hits).toEqual([])
  })

  test("text.ts の文字列で「割線」を含むのは SECANT_NOTE だけ", () => {
    const strings = Object.entries(T).flatMap(([name, v]) => {
      if (typeof v === "string") return [[name, v]]
      // 文言を作る関数は、呼ばずにソース（テンプレート文字列）を調べる（引数の形が関数ごとに違うため）
      if (typeof v === "function") return [[name, String(v)]]
      if (v && typeof v === "object") return Object.values(v).map((s) => [name, String(s)])
      return []
    })
    expect(strings.filter(([, s]) => s.includes("割線")).map(([n]) => n)).toEqual(["SECANT_NOTE"])
  })

  // 「記号で」のときだけ出す（受け入れ基準10）。条件を外すとここで落ちる。
  // コンポーネントは jest（node 環境）で描画できないので、ソースの書き方で固定する：
  // {SECANT_NOTE} を使う行はちょうど1行で、同じ行に「!words &&」がある。
  test("SECANT_NOTE は1か所だけ、「記号で」の条件（!words &&）の中で使う", () => {
    const lines = files(ROOT)
      .filter((f) => path.basename(f) !== "text.ts")
      .flatMap((f) => fs.readFileSync(f, "utf8").split("\n"))
      .filter((l) => l.includes("{SECANT_NOTE}"))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/!words\s*&&.*\{SECANT_NOTE\}/)
  })
})

describe("用語", () => {
  test("平均変化率は傾きの値の名前（直線の名前にしない）", () => {
    expect(T.SECANT_NAME).toBe("2点を結ぶ直線")
    expect(T.secantSlopeLabel("4.1")).toBe("傾き＝平均変化率 4.1")
    expect(T.tangentSlopeLabel("4")).toBe("傾き＝微分係数 4")
  })
  test("結論（F2-9）", () =>
    expect(T.conclusionWords("4", "2")).toBe(
      "h を 0 に近づけると、平均変化率は 4 に近づく。これが x = 2 における微分係数（接線の傾き）。"))
  test("記録表の列（F2-4）", () =>
    expect(T.TABLE_HEADERS).toEqual(["h", "x = a + h", "f(a + h) − f(a)", "平均変化率"]))
})

// 文脈ラベル（時間・距離）：速さのことばに言いかえ、元の用語を（ ）で添える（2026-10-25 オーナー決定）
describe("文脈ラベル（時間・距離）", () => {
  test("軸の名前", () => {
    expect(T.axisLabels()).toEqual({ x: "x", y: "y" })
    expect(T.axisLabels(true)).toEqual({ x: "時間（秒）", y: "距離（m）" })
  })
  test("主要な値の名前は元の用語を添える", () => {
    expect(T.secantSlopeLabel("4.1", true)).toBe("傾き＝平均の速さ（平均変化率） 4.1")
    expect(T.tangentSlopeLabel("4", true)).toBe("傾き＝瞬間の速さ（微分係数） 4")
    expect(T.tableHeaders(true)[3]).toBe("平均の速さ（平均変化率）")
    expect(T.conclusionWords("4", "2", true)).toBe(
      "h を 0 に近づけると、平均の速さ（平均変化率）は 4 に近づく。これが 2 秒における瞬間の速さ（微分係数・接線の傾き）。")
  })
  test("引数を省くと、いままでの文言のまま", () => {
    expect(T.secantSlopeLabel("4.1")).toBe("傾き＝平均変化率 4.1")
    expect(T.tableHeaders()).toEqual(T.TABLE_HEADERS)
  })
  test("言いかえた文言にも「平均変化率」「微分係数」が残っている（数学の用語を消さない）", () => {
    for (const s of [T.avgRateName(true), T.secantSlopeLabel("1", true), T.tableHeaders(true)[3]]) expect(s).toContain("平均変化率")
    for (const s of [T.coefName(true), T.tangentSlopeLabel("1", true)]) expect(s).toContain("微分係数")
  })
})

describe("負の速さ・負の時間の注記（時間・距離で表すとき）", () => {
  test("時間・距離で表していて、負の値があるときだけ出す", () => {
    expect(T.needsNegativeNote(true, [2, 4.1, -2.25])).toBe(true)
    expect(T.needsNegativeNote(true, [-1, 4])).toBe(true)
    expect(T.needsNegativeNote(true, [2, 4.1, 0])).toBe(false)
    expect(T.needsNegativeNote(false, [-1, -2])).toBe(false) // x, y のときは出さない
  })
})

import { ALGOS, ALGO_ORDER } from "@/app/(apps)/algorithm/_lib/algorithms"
import { CODE_BOOK, buildTagIndex, tagsOf } from "@/app/(apps)/algorithm/_lib/codeSamples"
import type { LangId } from "@/app/(apps)/algorithm/_lib/types"
import { emittedTags } from "./helpers"

const LANGS: LangId[] = ["python", "javascript", "kyotsu"]

// =======================================================
// コード行ハイライトの生命線。
//
// ステップの codeTag とコード例の行タグがずれると、
// 「間違った行が光る」「どこも光らない」が**無言で**起きる。
// 画面を見ないと気づけないので、ここで双方向に固定する。
//
// 壊し方の例: コード例から1行消す / タグの綴りを変える /
//             生成器の codeTag を別のものに書きかえる
//
// ■ このテストで検出できないこと（意図的に書き残す）
//   同じタグが複数行に付いている場合、そのうち1行だけを消しても落ちない。
//   例: 二分探索の Python で「else:」と「migi = aida - 1」がどちらも
//       narrowLeft なので、後者だけ消してもタグは残っている。
//   ここが守っているのは「行ハイライトの対応が壊れていないこと」であって、
//   「コードの文面が正しいこと」ではない。文面の正しさは人のレビューで見る。
// =======================================================
describe.each(ALGO_ORDER)("コード例のタグ網羅: %s", (algoId) => {
  const emitted = emittedTags(algoId)

  test("生成されるタグが1つも欠けていない（どの言語にも対応する行がある）", () => {
    for (const lang of LANGS) {
      const inCode = tagsOf(CODE_BOOK[algoId][lang])
      const missing = [...emitted].filter((t) => !inCode.has(t))
      expect({ lang, missing }).toEqual({ lang, missing: [] })
    }
  })

  test("コードに書いたタグはすべて使われる（光らない死んだ行がない）", () => {
    for (const lang of LANGS) {
      const inCode = tagsOf(CODE_BOOK[algoId][lang])
      const unused = [...inCode].filter((t) => !emitted.has(t))
      expect({ lang, unused }).toEqual({ lang, unused: [] })
    }
  })

  test("索引を引くとその言語の行番号が返る", () => {
    for (const lang of LANGS) {
      const sample = CODE_BOOK[algoId][lang]
      const index = buildTagIndex(sample)
      for (const tag of emitted) {
        const lines = index[tag]
        expect(lines && lines.length).toBeGreaterThan(0)
        // 行番号は必ずそのコードの範囲内
        for (const l of lines!) expect(sample[l].tag).toBe(tag)
      }
    }
  })
})

// =======================================================
// 矢印（i / j / m …）とコード例の変数名の対応。
//
// 画面の凡例に「m … いまのところ いちばん小さい場所（コードの saisho）」と
// 出しているので、コード例の変数名を変えたのに pointerVars を直し忘れると、
// **画面が嘘をつく**。しかも誰も気づけない。ここで機械的に止める。
// =======================================================
describe.each(ALGO_ORDER)("矢印とコード例の変数名の対応: %s", (algoId) => {
  const vars = Object.entries(ALGOS[algoId].pointerVars) as [string, string][]

  test("凡例に出す変数名が3言語すべてのコードに実在する", () => {
    for (const [pointer, name] of vars) {
      // 英数字の変数名なので \b で単語として切り出せる（if の i などに誤反応しない）
      const token = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`)
      for (const lang of LANGS) {
        const found = CODE_BOOK[algoId][lang].some((line) => token.test(line.text))
        expect({ pointer, name, lang, found }).toEqual({ pointer, name, lang, found: true })
      }
    }
  })

  test("矢印の名前が1つ以上ひもづいている", () => {
    expect(vars.length).toBeGreaterThan(0)
  })
})

// =======================================================
// しくみの解説。空のまま登録されるのを防ぐ
// =======================================================
describe.each(ALGO_ORDER)("しくみの解説: %s", (algoId) => {
  test("手順とポイントが書かれている", () => {
    const { how, points } = ALGOS[algoId].explanation
    expect(how.length).toBeGreaterThan(0)
    expect(points.length).toBeGreaterThan(0)
    for (const line of [...how, ...points]) expect(line.trim().length).toBeGreaterThan(0)
  })
})

// =======================================================
// 共通テスト用プログラム表記の記法チェック。
//
// 罫線は ｜（U+FF5C 全角縦線）と ⎿（U+23BF）。
// 半角の | や └（U+2514）に置きかわっても見た目が似ているため
// 人の目では気づきにくい。出典は docs/共通テスト用プログラム表記.md。
// =======================================================
describe.each(ALGO_ORDER)("疑似言語の記法: %s", (algoId) => {
  const lines = CODE_BOOK[algoId].kyotsu

  test("罫線に半角の | や └ を使っていない", () => {
    for (const line of lines) {
      expect(line.text).not.toMatch(/[|└├│]/)
    }
  })

  test("罫線は ｜(U+FF5C) と ⎿(U+23BF) のみ", () => {
    for (const line of lines) {
      const leading = line.text.match(/^[｜⎿ ]*/)?.[0] ?? ""
      expect(leading).toMatch(/^(?:[｜⎿] )*$/)
    }
  })

  test("ブロックの深さと罫線の本数がつじつまが合う（深さは1ずつしか増えない）", () => {
    let prevDepth = 0
    for (const line of lines) {
      const depth = (line.text.match(/[｜⎿]/g) ?? []).length
      expect(depth - prevDepth).toBeLessThanOrEqual(1)
      prevDepth = depth
    }
  })

  test("ブロックを開く行（末尾が :）のあとは必ず深さが1つ増える", () => {
    for (let i = 0; i < lines.length - 1; i++) {
      if (!lines[i].text.trimEnd().endsWith(":")) continue
      const here = (lines[i].text.match(/[｜⎿]/g) ?? []).length
      const next = (lines[i + 1].text.match(/[｜⎿]/g) ?? []).length
      expect({ line: lines[i].text, next: next }).toEqual({ line: lines[i].text, next: here + 1 })
    }
  })
})

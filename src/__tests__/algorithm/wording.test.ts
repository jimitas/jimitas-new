// ======================================================
// 画面に出る日本語の文言を固定するテスト。
//
// 2026-09-21 の文言レビューで見つかった3種類の壊れ方を、
// 二度と無言で戻らないようにする。
//
//   1. 配列の名前が 実況文と コード例で ちがう（A[3] と Data[3]）
//   2. 解説文にマークダウンの ** を書いても、画面では
//      アスタリスクがそのまま出る（解釈するものが無い）
//   3. 探索なのに「どうやって並べる？」と出る
//   4. 説明文に書いた回数と、実際に数えた回数がちがう
//
// 1〜3 は画面を見ないと気づけない。4 は説明文と実装の二重管理なので、
// ここで機械的に同期を固定する。
// ======================================================

import {
  ALGOS,
  ALGO_ORDER,
  countOperations,
  generateSteps,
} from "@/app/(apps)/algorithm/_lib/algorithms"
import { CODE_BOOK } from "@/app/(apps)/algorithm/_lib/codeSamples"
import { POINTER_HELP, howTitle } from "@/app/(apps)/algorithm/_lib/describe"
import type { AlgoId, Step } from "@/app/(apps)/algorithm/_lib/types"
import { searchCases, sortCases } from "./helpers"

/** そのアルゴリズムが出しうるステップを全部集める */
function stepsOf(algoId: AlgoId): Step[] {
  const out: Step[] = []

  if (ALGOS[algoId].category !== "search") {
    for (const { input } of sortCases()) out.push(...generateSteps(algoId, input))
    return out
  }

  // 探索は「ある値」と「ない値」の両方を通さないと found / notfound がそろわない
  for (const input of searchCases()) {
    const targets =
      input.length > 0 ? [input[0], input[input.length - 1], 1000] : [1000]
    for (const target of targets) out.push(...generateSteps(algoId, input, { target }))
  }
  return out
}

/** そのアルゴリズムが出しうる実況文を全部集める */
function allMessages(algoId: AlgoId): string[] {
  return stepsOf(algoId).map((s) => s.message)
}

// =======================================================
// 1. 配列の名前
//
// 実況文とコード例は行ハイライトで結びついているので、
// 配列の呼び名がちがうと「Data[3] ってコードのどれ？」になる。
// 共通テスト用プログラム表記に合わせて Data に統一する。
//
// 壊し方: describe.ts の cell() を `A[${index}]` に戻す
// =======================================================
describe("実況文の配列の呼び名", () => {
  test.each(ALGO_ORDER)("%s は Data[ を使い、A[ を使わない", (algoId) => {
    const messages = allMessages(algoId)
    expect(messages.length).toBeGreaterThan(0)

    const wrong = messages.filter((m) => m.includes("A["))
    expect(wrong).toEqual([])
  })

  // 「A[ が無い」だけだと、添字つきの文が1つも無くても通ってしまう。
  // 実際に Data[ を含む文が出ていることを数えて、空振りを防ぐ。
  test("Data[ を含む実況文が どのアルゴリズムでも出ている", () => {
    const reached = ALGO_ORDER.filter((algoId) =>
      allMessages(algoId).some((m) => m.includes("Data[")),
    )
    expect(reached).toEqual([...ALGO_ORDER])
  })
})

// =======================================================
// 2. マークダウンは効かない
//
// AlgoExplain は {line} をそのまま描画する。
// マークダウンを解釈するものはこのアプリに無いので、
// ** を書くとアスタリスクが画面に出る。
//
// 強調したいときは、大事なことを文の先頭に置く。
//
// 壊し方: explanation の文字列を ** ではさむ
// =======================================================
describe("解説文にマークダウン記法を書かない", () => {
  test.each(ALGO_ORDER)("%s の解説に ** が無い", (algoId) => {
    const { how, points } = ALGOS[algoId].explanation
    const lines = [...how, ...points]
    expect(lines.length).toBeGreaterThan(0)

    const wrong = lines.filter((line) => line.includes("**"))
    expect(wrong).toEqual([])
  })
})

// =======================================================
// 3. 解説の見出し
//
// 壊し方: howTitle() を固定文字列に戻す
// =======================================================
describe("解説パネルの見出し", () => {
  test("ソートは「並べる」、探索は「さがす」", () => {
    expect(howTitle("sort")).toBe("どうやって並べる？")
    expect(howTitle("search")).toBe("どうやって さがす？")
  })

  test.each(ALGO_ORDER)("%s の見出しが category と合っている", (algoId) => {
    const title = howTitle(ALGOS[algoId].category)
    if (ALGOS[algoId].category === "search") {
      expect(title).not.toContain("並べる")
    } else {
      expect(title).toContain("並べる")
    }
  })
})

// =======================================================
// 5. 矢印の凡例
//
// 共通の説明にアルゴリズム固有の但し書きを足すと、関係の無い
// アルゴリズムにもその文が出る。実際、L / R の説明に
// 「（合体のときは 左がわの読み位置）」と書いてあったせいで、
// 合体をしないクイックソートと二分探索にも出ていた。
//
// 壊し方: POINTER_HELP の left / right に「合体」の但し書きを戻す
// =======================================================
describe("矢印の凡例", () => {
  // そのアルゴリズムの凡例に実際に出る文（差しかえがあればそちら）
  function helpLines(algoId: AlgoId): string[] {
    const algo = ALGOS[algoId]
    const names = Object.keys(algo.pointerVars) as (keyof typeof POINTER_HELP)[]
    return names.map((name) => algo.pointerHelp?.[name] ?? POINTER_HELP[name])
  }

  test("合体しないアルゴリズムの凡例に「合体」が出ない", () => {
    const wrong = ALGO_ORDER.filter(
      (algoId) => algoId !== "merge" && helpLines(algoId).some((s) => s.includes("合体")),
    )
    expect(wrong).toEqual([])
  })

  // 上の検査は「どの矢印も出ない」アルゴリズムがあると空振りする。
  // L / R を使う3本（クイック・マージ・二分探索）に届いていることを数える。
  test("L / R を使うアルゴリズムに届いている", () => {
    const usesLeftRight = ALGO_ORDER.filter(
      (algoId) => ALGOS[algoId].pointerVars.left !== undefined,
    )
    expect(usesLeftRight).toEqual(["quick", "merge", "binary"])
  })

  test("マージソートの L / R は「読んでいる場所」に差しかえてある", () => {
    expect(ALGOS.merge.pointerHelp?.left).toContain("読んでいる")
    expect(ALGOS.merge.pointerHelp?.right).toContain("読んでいる")
  })

  // 画面に出た矢印は、全部 凡例で説明されていないといけない。
  //
  // 凡例は pointerVars のキーで決まる（ArrayView の legendPointers）。
  // 生成器が pointerVars に無い矢印を出すと、**説明の無い文字が画面に立つ**。
  // 実際、マージの M（写すときの境目）と二分探索の i（見つかった場所）が
  // 説明されないまま出ていた。どちらも実機で気づいた。
  //
  // 壊し方: ALGOS のどれかの pointerVars からキーを1つ消す
  test.each(ALGO_ORDER)("%s は 出した矢印をすべて凡例で説明している", (algoId) => {
    const emitted = new Set<string>()
    for (const s of stepsOf(algoId)) {
      for (const [name, index] of Object.entries(s.pointers)) {
        if (index !== undefined) emitted.add(name)
      }
    }
    expect(emitted.size).toBeGreaterThan(0)

    const listed = new Set(Object.keys(ALGOS[algoId].pointerVars))
    const missing = [...emitted].filter((name) => !listed.has(name))
    expect(missing).toEqual([])
  })

  // 凡例は「L … コードの p」と言い切っている。
  // 画面の L 矢印は本体配列の位置を指すので、コードの p も本体と同じ添字で
  // 動かさないと hidari ぶんずれる（数のずれは目で見ても気づきにくい）。
  //
  // 壊し方: マージのコード例を p = 0 から始める形（作業用の中だけの添字）に戻す
  // 「p / q を本体の添字にする」は、コード例だけ直しても片手落ち。
  // 写したステップの矢印が p / q の初期値を指していないと、
  // そのステップだけ凡例が嘘になる（R が q ではなく範囲の右はしを指していた）。
  //
  // 壊し方: mergeSort.ts の copyToAux に right: hi を渡す
  test("マージの写すステップの L / R は p / q の初期値を指す", () => {
    let checked = 0
    for (const { input } of sortCases()) {
      const steps = generateSteps("merge", input)
      for (const [k, s] of steps.entries()) {
        // 合体のはじまり＝作業用を使い始めた最初のステップ
        if (s.aux === undefined || steps[k - 1]?.aux !== undefined) continue
        expect(s.pointers.left).toBe(s.aux.source.lo)
        expect(s.pointers.right).toBe((s.pointers.mid ?? -99) + 1)
        checked++
      }
    }
    // 早期リターンで1回も届かないまま緑になるのを防ぐ
    expect(checked).toBeGreaterThan(20)
  })

  test("マージのコード例の p / q は本体と同じ添字で動く", () => {
    for (const lang of ["python", "javascript", "kyotsu"] as const) {
      const text = CODE_BOOK.merge[lang].map((l) => l.text).join("\n")
      expect({ lang, absolute: /p = hidari/.test(text) }).toEqual({ lang, absolute: true })
      expect({ lang, relative: /p = 0\b/.test(text) }).toEqual({ lang, relative: false })
    }
  })
})

// =======================================================
// 4. 説明文に書いた回数と、実際の回数を合わせる
//
// バブルソートの解説は「『全部同じ』や すでに ならんでいるときは
// くらべる回数が n−1 回ですむ」と書いている。
// 早期終了を外すとこの説明が嘘になるので、数で固定する。
//
// （レビュー前は「『ほぼ順番』や『全部同じ』だと n−1 回」と書いてあった。
//   ほぼ順番は入れかえが残っているので必ず2巡目に入る。その誤りの再発防止も兼ねる）
//
// 壊し方: bubbleSort の koukan による早期終了を消す
// =======================================================
describe("バブルソートの早期終了（解説の数字と実測の同期）", () => {
  const n = 8
  const sorted = Array.from({ length: n }, (_, i) => i + 1)
  const same = Array<number>(n).fill(5)

  test("すでに ならんでいるときは n−1 回", () => {
    expect(countOperations("bubble", sorted).compares).toBe(n - 1)
  })

  test("全部同じときも n−1 回", () => {
    expect(countOperations("bubble", same).compares).toBe(n - 1)
  })

  test("ほぼ順番（1か所だけ入れかえ）は n−1 回では終わらない", () => {
    const nearly = [...sorted]
    ;[nearly[2], nearly[3]] = [nearly[3], nearly[2]]
    expect(countOperations("bubble", nearly).compares).toBeGreaterThan(n - 1)
  })

  test("ばらばらより ずっと少ない（ほぼ順番 < 逆順）", () => {
    const nearly = [...sorted]
    ;[nearly[2], nearly[3]] = [nearly[3], nearly[2]]
    const reverse = [...sorted].reverse()
    expect(countOperations("bubble", nearly).compares).toBeLessThan(
      countOperations("bubble", reverse).compares,
    )
  })
})

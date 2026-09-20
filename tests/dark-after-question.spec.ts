// ======================================================
// 「もんだい」を押したあとの状態で、ダークの見え方を検査する
//
// なぜ必要か:
//   既存の dark-readability.spec.ts には穴が2つあり、
//   **その2つが重なったところを1件すり抜けた。**
//
//   1. 初期表示しか見ていない
//   2. 文字しか見ていない（罫線・枠線は対象外）
//
//   2026-09-12、わり算の筆算の罫線が "solid black 2px" 固定で、
//   ダークモードの暗い地に黒い線となり見えなかった。
//   罫線は **問題を出したあとに引かれる** ので初期表示には存在せず、
//   さらに文字ではないので色の検査もかかっていなかった。
//   結果、191件グリーンのままオーナーの実機確認で見つかった。
//
//   片方だけ塞いでもあのバグは捕まらない。だからこの1本で両方を塞ぐ。
//
// 対象:
//   「もんだい」ボタンを持つアプリだけ（押せないアプリは意味がないので除外）。
//   全アプリに一律でクリックを入れると、誤検出と実行時間が両方増えるため。
//
// ⚠️ globals.css を編集したあとは dev サーバーを再起動すること
//    （.next を消してから npm run dev）。古い CSS のまま判定されると
//    壊したのに通ってしまう。dark-readability.spec.ts の注意書きと同じ。
// ======================================================

import { test, expect } from "@playwright/test"
import { apps } from "../src/data/apps"
import { scanUnreadable } from "./helpers/darkScan"

const targets = apps.filter(a => !a.disabled)

/**
 * 初期表示では「もんだい」ボタンが出ないアプリの前準備。
 *
 * この2本はモードを切りかえないと出題できず、長いあいだ未カバーだった。
 * 「ボタンが無いから skip」で済ませると、**カバーできていないことが
 * skip の数に埋もれて見えなくなる**ので、ここに明示的に書く。
 */
const SETUP: Record<string, (page: import("@playwright/test").Page) => Promise<void>> = {
  // 既定は「しらべる」（出題しないモード）。出題するモードに切りかえる
  tokei: async (page) => {
    await page.selectOption("select", "nanji")
  },
  // 最初に「はじめる！」のモーダルが覆っているので、まず閉じる。
  // そのあとモードを切りかえる（既定は mode 1 ＝ たしかめ のみ。出題は mode 2・3）
  "suuzu-block": async (page) => {
    const start = page.getByRole("button", { name: "はじめる！" })
    if (await start.count() > 0) await start.click()
    await page.getByRole("button", { name: "ならべたかずはいくつ？" }).click()
  },
}

test.describe("もんだいを出したあとのダーク表示", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("jimitas_dark", "true"))
  })

  for (const app of targets) {
    test(`[${app.id}] もんだい後も文字と罫線が見える`, async ({ page }) => {
      await page.goto(app.path)
      await page.waitForLoadState("networkidle")

      const theme = await page.evaluate(() => document.documentElement.dataset.theme)
      expect(theme, "ダークモードが適用されていない").toBe("dark")

      // 出題できる状態にする（必要なアプリだけ）
      const setup = SETUP[app.id]
      if (setup) {
        await setup(page)
        await page.waitForTimeout(300)
      }

      // 「もんだい」ボタンを探す。
      //
      // 前方一致（/^もんだい/）だと number-line の「？ もんだい」のように
      // 記号が前に付くラベルを取りこぼす。部分一致で拾う。
      // 「もんだい」を含むボタンは問題を出すボタンしかない（調査済み）。
      const btn = page.locator("button", { hasText: /もんだい/ }).first()
      if (await btn.count() === 0) {
        test.skip(true, "「もんだい」ボタンがないアプリ")
      }

      await btn.click()
      // 問題の描画（罫線の付与を含む）が終わるのを待つ
      await page.waitForTimeout(600)

      const describe = (found: Awaited<ReturnType<typeof scan>>) =>
        found
          .map(f => `  ${f.ratio}:1  [${f.kind}] <${f.tag}> "${f.text}"\n` +
                    `        色 ${f.fg} / 背景 ${f.bg}\n` +
                    (f.cls ? `        class: ${f.cls}\n` : ""))
          .join("")

      const scan = () => page.evaluate(scanUnreadable, { includeBorders: true })

      const afterQuestion = await scan()
      expect(
        afterQuestion.length,
        `もんだいを出したあと、背景に溶けている箇所が ${afterQuestion.length} 件:\n` +
        `${describe(afterQuestion)}\n` +
        `罫線が出ている場合、色に black を固定していないか確認する。\n` +
        `セルが透明なテーブルでは currentColor を使う（文字色に追従して明暗が揃う）。`
      ).toBe(0)

      // ── 答えを画面に出したあとも見る ──────────────────
      // 正誤の色分け・「せいかい！」の演出・ヒントの追記は
      // **こたえあわせ（または「こたえ」）を押してはじめて出る**ので、
      // もんだい直後の検査だけでは届かない。
      // 押せるアプリだけ続けて見る（無い・無効なら ここで終わり）。
      //
      // ⚠️ ラベルの表記ゆれを取りこぼさないこと。
      //    最初 /こたえあわせ|たしかめ/ だけで書いたところ、
      //    **筆算5本が1つも引っかからなかった。**
      //    わり算・かけ算2 は漢字の「答え合わせ」、
      //    たし算・ひき算・かけ算1 はそもそも合わせるボタンが無く「こたえ」だった。
      //    2026-09-12 のダーク罫線バグが出たのはその筆算で、
      //    **いちばん見たいアプリが静かに検査外になっていた。**
      //    そこで「正解を画面に出すボタン」まで広げて拾う。
      //    表記を数え直すコマンド:
      //      grep -rhoE "(こたえ|答え|たしかめ)[^<\"]{0,6}" "src/app/(apps)" --include=*.tsx | sort -u
      const check = page
        .locator("button", { hasText: /こたえ|答え合わせ|答えを見る|たしかめ/ })
        .first()
      if (await check.count() === 0 || await check.isDisabled()) return

      await check.click()
      await page.waitForTimeout(600)

      const afterCheck = await scan()
      expect(
        afterCheck.length,
        `こたえあわせのあと、背景に溶けている箇所が ${afterCheck.length} 件:\n` +
        `${describe(afterCheck)}\n` +
        `正誤の色分けや「せいかい！」の演出で、ダークに合わない色を使っていないか確認する。`
      ).toBe(0)
    })
  }
})

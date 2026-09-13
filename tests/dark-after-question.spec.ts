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

      const found = await page.evaluate(scanUnreadable, { includeBorders: true })

      const report = found
        .map(f => `  ${f.ratio}:1  [${f.kind}] <${f.tag}> "${f.text}"\n` +
                  `        色 ${f.fg} / 背景 ${f.bg}\n` +
                  (f.cls ? `        class: ${f.cls}\n` : ""))
        .join("")

      expect(
        found.length,
        `もんだいを出したあと、背景に溶けている箇所が ${found.length} 件:\n${report}\n` +
        `罫線が出ている場合、色に black を固定していないか確認する。\n` +
        `セルが透明なテーブルでは currentColor を使う（文字色に追従して明暗が揃う）。`
      ).toBe(0)
    })
  }
})

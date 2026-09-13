// ======================================================
// ダークモードで「文字が背景に溶けていないか」の全アプリ検査
//
// 検出するもの:
//   白い背景に白い文字（およびその逆の、暗い背景に暗い文字）。
//
// 典型的な発生経路:
//   パネルに bg-white を置いたが dark: を付けていない。
//   → 背景は白のまま、文字色は指定がないので body のダーク用文字色
//     （#f3f4f6）を継承する → 白地に白文字。
//   紙・ノート・盤面など「ダークでも白いままが正しい」領域で起きやすい。
//   この場合の直し方は背景を暗くすることではなく、文字色を固定すること。
//
// dark-contrast.spec.ts との違い:
//   あちらは「見出しが読みやすいか」という品質の基準（h1 が 4.5:1 以上）。
//   こちらは「壊れていないか」という検出。対象は全テキスト要素。
//
// dark-after-question.spec.ts との違い:
//   こちらは **初期表示の文字だけ**。
//   あちらは「もんだい」を押したあとの状態と、罫線・枠線の色まで見る。
//
// ⚠️ globals.css を編集したあとにこのテストを動かすときは、
//    dev サーバーを再起動すること（.next を消してから npm run dev）。
//    起動しっぱなしの dev サーバーは globals.css の変更を取り込まないことがあり、
//    古い CSS のまま判定されて **通るはずのないテストが通る**。
//    2026-09-12、実際に修正を外しても合格してしまい、
//    再起動して初めて13件の失敗が出た。結果を信用する前に再起動する。
// ======================================================

import { test, expect, type Page } from "@playwright/test"
import { apps } from "../src/data/apps"
import { scanUnreadable, type Finding } from "./helpers/darkScan"

const targets = apps.filter(a => !a.disabled)

// 色の判定そのものは helpers/darkScan.ts に移した（2026-09-13）。
// 罫線まで見る dark-after-question.spec.ts と同じロジックを使うため。
// 同じ内容のコピーを2つ持つと「直したつもりが片方だけ直っていない」が起きる。
//
// このファイルは従来どおり **文字だけ** を対象にする（includeBorders: false）。
async function findUnreadable(page: Page): Promise<Finding[]> {
  return page.evaluate(scanUnreadable, { includeBorders: false })
}

test.describe("ダークモードで文字が背景に溶けていないか", () => {
  test.beforeEach(async ({ page }) => {
    // ページを開く前からダークモードにしておく
    await page.addInitScript(() => localStorage.setItem("jimitas_dark", "true"))
  })

  for (const app of targets) {
    test(`[${app.id}] ダークで文字が読める`, async ({ page }) => {
      await page.goto(app.path)
      await page.waitForLoadState("networkidle")

      // ダークが効いていない状態で「問題なし」と言われても意味がないので先に確認
      const theme = await page.evaluate(() => document.documentElement.dataset.theme)
      expect(theme, "ダークモードが適用されていない").toBe("dark")

      const found = await findUnreadable(page)

      const report = found
        .map(f => `  ${f.ratio}:1  <${f.tag}> "${f.text}"\n` +
                  `        文字 ${f.fg} / 背景 ${f.bg}\n` +
                  (f.cls ? `        class: ${f.cls}\n` : ""))
        .join("")

      expect(
        found.length,
        `文字が背景に溶けている箇所が ${found.length} 件:\n${report}\n` +
        `直し方: 紙・ノート・盤面など「白いままが正しい」領域では、背景を暗くせず\n` +
        `文字色を固定する（例: text-gray-800 を明示して dark: を付けない）。`
      ).toBe(0)
    })
  }
})

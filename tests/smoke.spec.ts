// ======================================================
// スモークテスト — 全アプリのページロード確認
//
// 目的: アプリがクラッシュせずに表示されることを確認する。
// 機能の正確さは単体テスト（src/__tests__/）が担当する。
//
// チェック内容:
//   1. HTTP 200（ページがロードされる）
//   2. Next.js エラーオーバーレイが出ていない
//   3. <main> 要素が存在する
//   4. <h1> 要素が見える
// ======================================================

import { test, expect } from "@playwright/test"
import { apps } from "../src/data/apps"

// disabled: true のアプリは除外
const targets = apps.filter(a => !a.disabled)

for (const app of targets) {
  test(`[${app.id}] ページが表示される`, async ({ page }) => {
    const consoleErrors: string[] = []

    // JavaScript エラーを収集
    page.on("console", msg => {
      if (msg.type() === "error") consoleErrors.push(msg.text())
    })

    // ページ遷移（失敗したら即 throw）
    const response = await page.goto(app.path, {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
    })

    // 1. HTTP 200
    expect(response?.status(), `${app.id}: HTTP ステータス`).toBe(200)

    // 2. Next.js のクラッシュオーバーレイが出ていない
    const errorOverlay = page.locator("nextjs-portal, [data-nextjs-dialog]")
    await expect(errorOverlay, `${app.id}: Next.js エラーオーバーレイ`).not.toBeVisible()

    // 3. <main> 要素が存在する（レイアウトとページで2つある場合があるので first）
    await expect(page.locator("main").first(), `${app.id}: <main> 要素`).toBeVisible()

    // 4. <h1> が見える
    await expect(page.locator("h1").first(), `${app.id}: <h1> 要素`).toBeVisible()

    // console.error が出ていないことを確認
    // （外部フォント読み込み失敗など既知の無害なものは除外）
    const fatalErrors = consoleErrors.filter(msg =>
      !msg.includes("Failed to load resource") // 外部リソース読み込み失敗は許容
    )
    expect(fatalErrors, `${app.id}: JavaScript エラー`).toHaveLength(0)
  })
}

// トップページも確認（h1 はなく h2 でセクション見出しを構成している）
test("[index] トップページが表示される", async ({ page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" })
  expect(response?.status()).toBe(200)
  await expect(page.locator("main").first()).toBeVisible()
  await expect(page.locator("h2").first()).toBeVisible()
})

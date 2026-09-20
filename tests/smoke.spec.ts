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

// ハイドレーション完了を待つ（2026-09-20 に固定時間をやめた）
//
// 以前は「たぶんこれくらいで終わるだろう」という 600ms の固定待ちだった。
// 短ければエラーを見逃して緑になり、長ければ全アプリぶん遅くなる。
// 機械の速さに結果が左右されるのも良くなかった。
//
// いまは NoContextMenu（全ページ共通のクライアント部品）が
// ハイドレーション後の effect で <html data-hydrated="1"> を付けるので、
// **それを待てば「不整合のエラーは出そろった」と言い切れる。**
//
// そのあとの少しの待ちは、CDP がコンソールを運んでくるぶんの余裕。
// 判定の根拠は data-hydrated 側にあるので、この値は当てずっぽうではない。
const CONSOLE_DELIVERY_MS = 150

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

    // 5. ハイドレーションが済むまで待ってから console.error を見る
    //
    // ⚠️ この待ちを外さないこと。
    //    goto は domcontentloaded で返ってくるが、React のハイドレーションは
    //    そのあとに走る。待たずに判定すると、ハイドレーション不整合のエラーが
    //    届く前にテストが終わってしまい、**エラーが出ていても緑になる。**
    //    実際 nanbanme は不整合を出したまま191件グリーンを通過していた（2026-09-13）。
    //
    //    networkidle だけでは足りない。React 19 のハイドレーションはネットワークが
    //    静止したあとにも走り、実測すると **エラー到達が networkidle の前後にばらける**
    //    （561〜1151ms / networkidle は 1053〜1240ms）。待ちなしで3回試すと2回落ちて
    //    1回通る、という不安定なテストになる。静止後にもう少し待って確定させる。
    await page.waitForFunction(
      () => document.documentElement.dataset.hydrated === "1",
      undefined,
      { timeout: 20_000 },
    )
    await page.waitForTimeout(CONSOLE_DELIVERY_MS)

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

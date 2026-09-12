// ======================================================
// 本番（jimitas.com）に対して既存のテストを流すための設定
//
//   npm run test:prod                          … 全テストを本番で
//   npm run test:prod tests/dark-readability   … 特定のテストだけ
//
// 使いどころ: push 後に「本当に反映されたか」を目で探す代わりに使う。
//   - デプロイが反映されたかの確認
//   - 開発ビルドでは通るが本番ビルドで壊れる類（Tailwind のクラス検出漏れなど）の検出
//
// 通常の playwright.config.ts との違いは2つだけ。
//   - baseURL が本番
//   - dev サーバーを起動しない（webServer を持たない）
//
// ⚠️ 読み取り専用のテストだけを流すこと。
//    本番に書き込む操作を含むテストをここで動かさない。
// ======================================================
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 1,
  workers: 2,
  reporter: [["line"]],
  use: {
    baseURL: "https://jimitas.com",
    locale: "ja-JP",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } } }],
})

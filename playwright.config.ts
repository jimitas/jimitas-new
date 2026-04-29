import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1,
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:3000",
    // アニメーション抑制（テスト安定化）
    reducedMotion: "reduce",
    locale: "ja-JP",
    // スクリーンショットは失敗時のみ
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // タブレット想定（1024×768）
        viewport: { width: 1024, height: 768 },
      },
    },
  ],

  // dev server を自動起動（まだ起動していない場合）
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
})

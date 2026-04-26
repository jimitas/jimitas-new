// ======================================================
// 全アプリのスクリーンショットを一括撮影
//
// 使い方:
//   1. 別ターミナルで `npm run dev` を起動（http://localhost:3000）
//   2. このスクリプトを実行: `npm run screenshot`
//   3. 出力先: screenshots/<日付>/ に PNG が生成される
//
// 用途:
//   - 配色リファクタリング後の visual baseline として保存
//   - 大きな変更があった後にもう1回撮って差分確認
//   - claude code が画像を Read して目視チェック
//
// 環境変数:
//   BASE_URL : 対象 URL（デフォルト http://localhost:3000）
//   VIEWPORT : "tablet"（デフォルト 1024×768）または "mobile"（375×812）
// ======================================================

import { chromium, type BrowserContext } from "@playwright/test"
import { apps } from "../src/data/apps"
import path from "node:path"
import fs from "node:fs"

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000"
const VIEWPORT_NAME = process.env.VIEWPORT ?? "tablet"

const VIEWPORTS = {
  tablet: { width: 1024, height: 768 },
  mobile: { width: 375,  height: 812 },
} as const

const viewport = VIEWPORTS[VIEWPORT_NAME as keyof typeof VIEWPORTS] ?? VIEWPORTS.tablet

// 出力先: screenshots/YYYY-MM-DD/
const today = new Date().toISOString().slice(0, 10)
const OUTPUT_DIR = path.join("screenshots", today)

async function main() {
  console.log(`📸 スクリーンショット撮影開始`)
  console.log(`   ベース URL: ${BASE_URL}`)
  console.log(`   ビューポート: ${VIEWPORT_NAME} (${viewport.width}×${viewport.height})`)
  console.log(`   出力先: ${OUTPUT_DIR}`)

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport,
    // アニメーションを抑制（ストロボやフェード演出が止まった状態でスクショ）
    reducedMotion: "reduce",
    // タイムゾーン・ロケールを固定（再現性のため）
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  })

  // ── 1. トップページ ───────────────────────────────────
  await capturePage(context, "00_index", BASE_URL)

  // ── 2. 各アプリページ ────────────────────────────────
  // disabled は除外、apps.ts の並び順で撮影
  const targets = apps.filter(a => !a.disabled)
  let index = 1
  let successCount = 0
  let failCount = 0

  for (const app of targets) {
    const seq = String(index).padStart(2, "0")
    const ok = await capturePage(context, `${seq}_${app.id}`, `${BASE_URL}${app.path}`)
    if (ok) successCount++
    else failCount++
    index++
  }

  await browser.close()

  console.log(`\n✅ 完了: 成功 ${successCount + 1} / 失敗 ${failCount}`)
  console.log(`   ${path.resolve(OUTPUT_DIR)}`)
}

/**
 * 1 ページを開いてスクショ。失敗しても続行。
 */
async function capturePage(
  context: BrowserContext,
  fileName: string,
  url: string,
): Promise<boolean> {
  const page = await context.newPage()
  try {
    await page.goto(url, { timeout: 20_000, waitUntil: "domcontentloaded" })
    // 動的コンテンツ・画像のロードを待つ（最大 5 秒）
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => { /* timeout でも続行 */ })
    // 描画安定のため軽くウェイト
    await page.waitForTimeout(300)

    const filePath = path.join(OUTPUT_DIR, `${fileName}.png`)
    await page.screenshot({
      path: filePath,
      // viewport 全体を撮る（fullPage にすると縦に伸びすぎる場合があるので false）
      fullPage: false,
    })
    console.log(`✓ ${fileName}`)
    return true
  } catch (e) {
    console.error(`✗ ${fileName}: ${(e as Error).message}`)
    return false
  } finally {
    await page.close()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

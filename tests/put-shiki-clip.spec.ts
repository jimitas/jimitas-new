// ======================================================
// PutShiki の入力欄で2桁の数が見切れないかを検査する
//
// 背景: 入力欄の幅が 4vw・左右パディング 5px だったころ、
//       文字サイズ 2vw の2桁（例「18」）が入力欄からはみ出して
//       右端が切れていた。タブレット幅でも起きる。
//
// 検査の考え方: scrollWidth > clientWidth なら中身がはみ出している。
//       幅も文字サイズも vw 依存なので、複数の幅で確かめる必要がある。
//
// 対象: PutShiki を使う たしざん１ / ひきざん１ の2本
// ======================================================

import { test, expect } from "@playwright/test"

// 1000px 前後は max() の切り替わり点をまたぐので厚めに見る
const WIDTHS = [375, 768, 1000, 1020, 1024, 1280, 1920]
const PAGES = ["/tashizan-1", "/hikizan-1"]

for (const path of PAGES) {
  for (const width of WIDTHS) {
    test(`${path} @${width}px: 式の入力欄で2桁が見切れない`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(path)

      // 左の数・右の数・こたえ の3つ
      const inputs = page.locator('input[type="number"]')
      const count = await inputs.count()
      expect(count).toBe(3)

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i)
        await input.fill("18")
        const size = await input.evaluate((el: HTMLInputElement) => ({
          client: el.clientWidth,
          scroll: el.scrollWidth,
          offset: el.offsetWidth,
        }))
        expect(
          size.scroll,
          `${path} @${width}px の入力欄[${i}] ではみ出し: ${JSON.stringify(size)}`
        ).toBeLessThanOrEqual(size.client)
      }

      // 入力欄を広げたことで横スクロールが出ていないことも確かめる
      const doc = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }))
      expect(
        doc.scroll,
        `${path} @${width}px で横スクロールが出ている: ${JSON.stringify(doc)}`
      ).toBeLessThanOrEqual(doc.client)
    })
  }
}

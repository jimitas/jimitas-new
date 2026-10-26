// ======================================================
// 円の面積と円周のひみつ（/sekibun-en）— 画面での受け入れ基準
//
// 要件 docs/requirements-integral-circle-app.md §8 のうち、画面を操作しないと確かめられないものを固定する。
// 輪の座標・はみ出し・ラベルの位置などの計算は src/__tests__/sekibun-en/ の単体テストが担当する。
// ここで守るのは「ボタン・スライダー・キーの操作と、アニメの状態（動く・止まる・もどる）のつながり」。
//
//   基準3   ▶ ほどく → 約3秒で完成し、底辺・高さのラベルと結論が出る
//   基準4   ◀ 巻き戻す で円にもどる。進み具合スライダーで途中に止められる
//   ほか    ⏸ 止める（一時停止）・スライダーを動かすとアニメが止まる・スペースで再生（ボタンに選択が残っていても）
//           輪の数を動いている途中で切りかえても止まらない（F3-7）
//
// ⚠ スライダーは 0.001 刻みなので、巻き戻しの終わる少し前（t = 0.0004 など）でも値は "0" と表示される。
//   「巻き戻し終わり」はスライダーの値ではなく、ボタンの文字（▶ ほどく）で待つ（2026-10-26 の確認で分かった）。
// ======================================================

import { test, expect, type Page } from "@playwright/test"

/** ハイドレーション完了を待つ（smoke.spec.ts と同じ作法） */
async function open(page: Page) {
  await page.goto("/sekibun-en")
  await page.locator("html[data-hydrated='1']").waitFor()
}

const slider = (page: Page) => page.locator("#sekibun-t")
const progress = async (page: Page) => Number(await slider(page).inputValue())
/** 再生ボタン（▶ ほどく／▶ 続ける／▶ もう一度ほどく／⏸ 止める） */
const playButton = (page: Page) => page.getByRole("button", { name: /^(▶|⏸)/ })

test.describe("ステップ③ 輪をほどいて積み上げる", () => {
  test.beforeEach(async ({ page }) => open(page))

  test("基準3：▶ ほどく で約3秒かけて完成し、ラベルと結論が出る", async ({ page }) => {
    await expect(playButton(page)).toHaveText("▶ ほどく")
    const start = Date.now()
    await playButton(page).click()
    await expect(playButton(page)).toHaveText("⏸ 止める")
    // 2秒ではまだ完成していない
    await page.waitForTimeout(2000)
    expect(await progress(page)).toBeLessThan(1)
    await expect(playButton(page)).toHaveText("▶ もう一度ほどく", { timeout: 4000 })
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThan(2500)
    expect(elapsed).toBeLessThan(4500)
    expect(await progress(page)).toBe(1)
    await expect(page.getByText("底辺 ＝ いちばん外側の輪の長さ ＝ 円周 2πr")).toBeVisible()
    await expect(page.getByText("高さ ＝ r", { exact: true })).toBeVisible()
    await expect(page.getByText(/½ × 2πr × r ＝ πr²/)).toBeVisible()
  })

  test("基準4：◀ 巻き戻す で円にもどる", async ({ page }) => {
    await slider(page).fill("1")
    await expect(page.getByText(/½ × 2πr × r ＝ πr²/)).toBeVisible()
    await page.getByRole("button", { name: "◀ 巻き戻す" }).click()
    await expect(page.getByText("帯が曲がって、もとの輪にもどっていきます。")).toBeVisible()
    await expect(playButton(page)).toHaveText("▶ ほどく", { timeout: 5000 })
    expect(await progress(page)).toBe(0)
    await expect(page.getByText("底辺 ＝ いちばん外側の輪の長さ ＝ 円周 2πr")).toHaveCount(0)
  })

  test("基準4：スライダーで途中に止められる。動いている途中に触ると止まる", async ({ page }) => {
    await playButton(page).click()
    await page.waitForTimeout(500)
    await slider(page).fill("0.3")
    await page.waitForTimeout(500)
    expect(await progress(page)).toBe(0.3)
    await expect(playButton(page)).toHaveText("▶ 続ける")
    await expect(page.getByText(/途中で止めています/)).toBeVisible()
  })

  test("⏸ 止める で一時停止し、▶ 続ける で同じところから再開する", async ({ page }) => {
    await playButton(page).click()
    await page.waitForTimeout(1200)
    await playButton(page).click()
    await expect(playButton(page)).toHaveText("▶ 続ける")
    const stopped = await progress(page)
    expect(stopped).toBeGreaterThan(0)
    await page.waitForTimeout(500)
    expect(await progress(page)).toBe(stopped)
    await playButton(page).click()
    await expect.poll(() => progress(page)).toBeGreaterThan(stopped)
  })

  test("スペースで再生・一時停止（輪の数のボタンに選択が残っていても）", async ({ page }) => {
    await page.getByRole("button", { name: "16", exact: true }).click()
    await page.keyboard.press(" ")
    await expect(playButton(page)).toHaveText("⏸ 止める")
    await page.waitForTimeout(800)
    await page.keyboard.press(" ")
    // 「▶ 続ける」になっていれば、スペースが再生ボタンとして1回ずつだけ効いている
    // （ボタンの押す動作と二重に効くと、止める→すぐ再開 になって「⏸ 止める」のまま）
    await expect(playButton(page)).toHaveText("▶ 続ける")
  })

  test("F3-7：動いている途中で輪の数を変えても、アニメは止まらない", async ({ page }) => {
    await playButton(page).click()
    await page.waitForTimeout(800)
    await page.getByRole("button", { name: "64", exact: true }).click()
    await expect(playButton(page)).toHaveText("⏸ 止める")
    await expect(playButton(page)).toHaveText("▶ もう一度ほどく", { timeout: 4000 })
  })
})

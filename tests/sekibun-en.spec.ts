// ======================================================
// 円の面積と円周のひみつ（/sekibun-en）— 画面での受け入れ基準
//
// 要件 docs/requirements-integral-circle-app.md §8 のうち、画面を操作しないと確かめられないものを固定する。
// 輪の座標・はみ出し・ラベルの位置などの計算は src/__tests__/sekibun-en/ の単体テストが担当する。
// ここで守るのは「ボタン・スライダー・キーの操作と、アニメの状態（動く・止まる・もどる）のつながり」。
//
//   基準2   ② 選んだ輪が帯になり、帯の長さの表示がその輪の円周（2π × まん中の半径）と一致する
//           輪はボタンでも、図のタップでも選び直せる（F2-1）
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

test.describe("ステップ② 輪を切り開く", () => {
  test.beforeEach(async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "② 輪を切り開く" }).click()
  })

  const lengthText = (page: Page) => page.getByTestId("strip-length")

  /**
   * 図の輪の線（polyline）の形。選んだ輪はいちばん最後に描く（RingDisk.tsx）。
   * straight：点がすべて同じ高さ（まっすぐな帯）、width：左右の幅、closed：始めと終わりの点が同じ（円のまま）
   */
  async function ringShapes(page: Page) {
    return page.locator("svg[role='img'] polyline").evaluateAll((els) =>
      els.map((el) => {
        const pts = (el.getAttribute("points") ?? "").trim().split(" ").map((p) => p.split(",").map(Number))
        const xs = pts.map((p) => p[0])
        const ys = pts.map((p) => p[1])
        const [first, last] = [pts[0], pts[pts.length - 1]]
        return {
          straight: Math.max(...ys) - Math.min(...ys) < 0.01,
          width: Math.max(...xs) - Math.min(...xs),
          closed: Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.5,
          opacity: el.getAttribute("opacity"),
        }
      }))
  }

  // 基準2の前半「選んだ輪（だけ）が帯になる」。全部の輪がほどける・別の輪がほどける・選んだ輪が薄い、を見つける
  test("基準2：切り開くと、選んだ輪だけがまっすぐな帯になり、ほかの輪は円のまま薄く残る", async ({ page }) => {
    for (let k = 0; k < 4; k++) await page.getByRole("button", { name: "◀ 内側の輪" }).click() // 内側から 4 本目
    await playButton(page).click()
    await expect(playButton(page)).toHaveText("▶ もう一度切り開く", { timeout: 4000 })
    const shapes = await ringShapes(page)
    expect(shapes).toHaveLength(8)
    const picked = shapes[shapes.length - 1]
    expect(picked.straight).toBe(true)
    // 帯の幅 ＝ 2π × まん中の半径（px）。4 本目のまん中は 3.5 × (80 / 8) = 35px
    expect(picked.width).toBeCloseTo(2 * Math.PI * 35, 0)
    expect(picked.opacity).toBe("1")
    for (const other of shapes.slice(0, -1)) {
      expect(other.closed).toBe(true)
      expect(other.straight).toBe(false)
      expect(other.opacity).toBe("0.25")
    }
    // 帯の上に長さ、下に太さ（F2-3）
    await expect(page.locator("svg text", { hasText: "長さ ＝ 2π × 0.875" })).toBeVisible()
    await expect(page.locator("svg text", { hasText: "太さ ＝ 0.25" })).toBeVisible()
  })

  test("F2-3：画面の式を電卓で確かめても合う（内側から4本目：5.50 × 0.25 ≒ 1.38）", async ({ page }) => {
    for (let k = 0; k < 4; k++) await page.getByRole("button", { name: "◀ 内側の輪" }).click()
    await expect(page.getByText(/5\.50\s×\s0\.25\s≒\s1\.38/)).toBeVisible()
  })

  test("基準2：いちばん外側の輪を切り開くと、帯の長さ ＝ 円周 2π × 1.875 ≒ 11.78", async ({ page }) => {
    await expect(page.getByText("内側から 8 本目の輪（いちばん外側）")).toBeVisible()
    await expect(lengthText(page)).toHaveText("長さ ＝ 輪のまん中の円周 2π × 1.875 ≒ 11.78")
    await playButton(page).click()
    await expect(playButton(page)).toHaveText("⏸ 止める")
    await expect(playButton(page)).toHaveText("▶ もう一度切り開く", { timeout: 4000 })
    // 図の帯のそばにも同じ長さ
    await expect(page.locator("svg text", { hasText: "長さ ＝ 2π × 1.875" })).toBeVisible()
    await expect(page.getByText(/輪を切り開くと、長さが円周/)).toBeVisible()
  })

  test("F2-1：ボタンで内側の輪を選ぶと、長さの表示が変わり、帯は円にもどる", async ({ page }) => {
    await playButton(page).click()
    await expect(playButton(page)).toHaveText("▶ もう一度切り開く", { timeout: 4000 })
    await page.getByRole("button", { name: "◀ 内側の輪" }).click()
    await expect(page.getByText("内側から 7 本目の輪", { exact: true })).toBeVisible()
    await expect(lengthText(page)).toHaveText("長さ ＝ 輪のまん中の円周 2π × 1.625 ≒ 10.21")
    await expect(playButton(page)).toHaveText("▶ 切り開く")
    await expect(page.getByRole("button", { name: "外側の輪 ▶" })).toBeEnabled()
  })

  test("F2-1：図の輪をタップして選べる（中心のすぐ横はいちばん内側）", async ({ page }) => {
    const svg = page.locator("svg[role='img']").first()
    const box = (await svg.boundingBox())!
    const k = box.width / 660 // viewBox 660×430（scene.ts）
    await page.mouse.click(box.x + (120 + 3) * k, box.y + 300 * k)
    await expect(page.getByText("内側から 1 本目の輪（いちばん内側）")).toBeVisible()
    await expect(lengthText(page)).toHaveText("長さ ＝ 輪のまん中の円周 2π × 0.125 ≒ 0.79")
    await expect(page.getByRole("button", { name: "◀ 内側の輪" })).toBeDisabled()
  })

  test("キーボード：いちばん内側に着いてボタンが押せなくなったら、選択は「外側の輪 ▶」へ移る", async ({ page }) => {
    await page.getByRole("button", { name: "◀ 内側の輪" }).focus()
    for (let k = 0; k < 7; k++) await page.keyboard.press("Enter")
    await expect(page.getByText("内側から 1 本目の輪（いちばん内側）")).toBeVisible()
    await expect(page.getByRole("button", { name: "外側の輪 ▶" })).toBeFocused()
  })
})

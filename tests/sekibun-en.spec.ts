// ======================================================
// 円の面積と円周のひみつ（/sekibun-en）— 画面での受け入れ基準
//
// 要件 docs/requirements-integral-circle-app.md §8 のうち、画面を操作しないと確かめられないものを固定する。
// 輪の座標・はみ出し・ラベルの位置などの計算は src/__tests__/sekibun-en/ の単体テストが担当する。
// ここで守るのは「ボタン・スライダー・キーの操作と、アニメの状態（動く・止まる・もどる）のつながり」。
//
//   基準1   ① はじめは ①。1段ずつ ×5 → 増えた面積 ÷ h が 15.71 → 14.14 → 12.88 → 12.60 → 12.57（→ キーでも）
//   基準2   ② 選んだ輪が帯になり、帯の長さの表示がその輪の円周（2π × まん中の半径）と一致する
//           輪はボタンでも、図のタップでも選び直せる（F2-1）
//   基準6   ④ x = r = 2 で左 4、右 12.57。スライダーで両方のグラフが同時に変わる。細い長方形で塗れる（F4-3）
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
  test.beforeEach(async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "③ 輪をほどいて積み上げる" }).click()
  })

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

  /** 図の輪の線の形（描く順：外側の輪から）。straight：まっすぐな帯、closed：円のまま */
  async function ringLines(page: Page) {
    return page.locator("svg[role='img'] polyline").evaluateAll((els) =>
      els.map((el) => {
        const pts = (el.getAttribute("points") ?? "").trim().split(" ").map((p) => p.split(",").map(Number))
        const ys = pts.map((p) => p[1])
        const [first, last] = [pts[0], pts[pts.length - 1]]
        return {
          straight: Math.max(...ys) - Math.min(...ys) < 0.01,
          closed: Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.5,
        }
      }))
  }

  test("F3-8：外側から1本ずつ。進み具合 1/8 で、いちばん外側の輪だけが帯になる", async ({ page }) => {
    await page.getByRole("button", { name: "外側から1本ずつ" }).click()
    await slider(page).fill("0.125")
    const lines = await ringLines(page)
    expect(lines).toHaveLength(8)
    expect(lines[0].straight).toBe(true) // いちばん外側（最初に描く）
    for (const l of lines.slice(1)) expect(l.closed).toBe(true)
  })

  test("F3-8：内側から1本ずつ。進み具合 1/8 で、いちばん内側の輪だけが帯になる", async ({ page }) => {
    await page.getByRole("button", { name: "内側から1本ずつ" }).click()
    await slider(page).fill("0.125")
    const lines = await ringLines(page)
    expect(lines[lines.length - 1].straight).toBe(true) // いちばん内側（最後に描く）
    for (const l of lines.slice(0, -1)) expect(l.closed).toBe(true)
  })

  test("F3-8：ほどき方を切りかえると、止まって円にもどる（途中で図が跳ばない）", async ({ page }) => {
    await slider(page).fill("0.6")
    await page.getByRole("button", { name: "外側から1本ずつ" }).click()
    expect(await progress(page)).toBe(0)
    await expect(playButton(page)).toHaveText("▶ ほどく")
    const lines = await ringLines(page)
    for (const l of lines) expect(l.closed).toBe(true)
  })

  // 輪ごとのイーズインアウト：外側から・8本・t = 0.156 で、2本目の輪（rm = 65px）の進み具合は約 0.25 → イーズインで約 0.06。
  // ほどけ始めたばかりなので、線の両はしの間は 0.42 × rm 程度（イーズインがないと 1.89 × rm まで開く）
  test("F3-8：1本ずつのとき、輪ごとになめらかにほどけ始める", async ({ page }) => {
    await page.getByRole("button", { name: "外側から1本ずつ" }).click()
    await slider(page).fill("0.156") // 0.001 刻みのスライダーなので 1.25/8 = 0.15625 は入らない
    const gap = await page.locator("svg[role='img'] polyline").nth(1).evaluate((el) => {
      const pts = (el.getAttribute("points") ?? "").trim().split(" ").map((p) => p.split(",").map(Number))
      const [a, b] = [pts[0], pts[pts.length - 1]]
      return Math.hypot(a[0] - b[0], a[1] - b[1])
    })
    expect(gap).toBeGreaterThan(5)
    expect(gap).toBeLessThan(0.6 * 65)
  })

  test("F3-8：内側から1本ずつのとき、外側の輪がまだほどけていないうちは切れ目が残る", async ({ page }) => {
    await page.getByRole("button", { name: "内側から1本ずつ" }).click()
    await slider(page).fill("0.15")
    // 線があるだけでなく、くっきり見えている（包んでいる g の濃さが 1。透明でも要素は残るので濃さで見る）
    const cut = page.locator("svg[role='img'] line.stroke-warm-600")
    await expect(cut).toHaveCount(1)
    expect(await cut.evaluate((el) => el.parentElement?.getAttribute("opacity"))).toBe("1")
    await slider(page).fill("0.95") // 最後の輪（いちばん外側）がほどけ始めたら消える
    await expect(page.locator("svg[role='img'] line.stroke-warm-600")).toHaveCount(0)
    // 最後の輪がまだほどけ終わっていないので、完成のラベルは出ない
    await expect(page.getByText("底辺 ＝ いちばん外側の輪の長さ ＝ 円周 2πr")).toHaveCount(0)
  })

  test("F3-8：1本ずつは約6秒で全部ほどける（全部いっしょの3秒より長い）", async ({ page }) => {
    await page.getByRole("button", { name: "外側から1本ずつ" }).click()
    const start = Date.now()
    await playButton(page).click()
    await page.waitForTimeout(3500)
    expect(await progress(page)).toBeLessThan(1)
    await expect(playButton(page)).toHaveText("▶ もう一度ほどく", { timeout: 5000 })
    expect(Date.now() - start).toBeGreaterThan(5000)
  })

  test("F3-10：ロープで表示にすると、どの輪にもねじれの縞が重なる。もどすと消える", async ({ page }) => {
    await expect(page.locator("polyline.rope-twist")).toHaveCount(0)
    await page.getByLabel(/ロープで表示/).check()
    await expect(page.locator("polyline.rope-twist")).toHaveCount(8)
    // 縞は破線（ねじれに見せる）、下の線は縄の色
    expect(await page.locator("polyline.rope-twist").first().getAttribute("stroke-dasharray")).toBe("6 6")
    // ほどいても縞はついてくる（縞の線は、下の縄の線とまったく同じ位置を通る）
    await slider(page).fill("1")
    await expect(page.locator("polyline.rope-twist")).toHaveCount(8)
    const same = await page.locator("svg[role='img'] g:has(> polyline.rope-twist)").evaluateAll((gs) =>
      gs.map((g) => { const [base, twist] = g.querySelectorAll("polyline"); return base.getAttribute("points") === twist.getAttribute("points") }))
    expect(same).toEqual(Array(8).fill(true))
    // 縞の始まりは輪ごとに交互にずれている（縦一列にそろわない）
    const offsets = await page.locator("polyline.rope-twist").evaluateAll((els) => els.map((el) => el.getAttribute("stroke-dashoffset")))
    expect(new Set(offsets).size).toBe(2)
    await page.getByLabel(/ロープで表示/).uncheck()
    await expect(page.locator("polyline.rope-twist")).toHaveCount(0)
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
          // 薄さは輪ごとの <g> にかけている（ロープ表示で縞の線を重ねるため。2026-10-27）
          opacity: el.parentElement?.getAttribute("opacity"),
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

test.describe("ステップ① 面積の増え方", () => {
  test.beforeEach(async ({ page }) => open(page))

  /** 記録表の列 col（0：h、1：増えた面積、2：÷ h）の、書かれた値 */
  const column = (page: Page, col: number) =>
    page.locator("table tbody tr").evaluateAll((trs, c) =>
      trs.map((tr) => tr.querySelectorAll("td")[c].textContent ?? "").filter(Boolean), col)

  test("基準1：はじめは ①。1段ずつ ×5 で 15.71 → 14.14 → 12.88 → 12.60 → 12.57、6回目は押せない", async ({ page }) => {
    await expect(page.getByRole("button", { name: "① 面積の増え方" })).toHaveClass(/bg-brand/)
    const step = page.getByRole("button", { name: "1段ずつ" })
    const want = ["15.71", "14.14", "12.88", "12.60", "12.57"]
    for (let k = 0; k < 5; k++) {
      await step.click()
      // 行が書かれるのは段の動き（0.5秒）が終わったとき。それを待ってから次を押す
      await expect.poll(() => column(page, 2)).toEqual(want.slice(0, k + 1))
    }
    expect(await column(page, 0)).toEqual(["1", "0.5", "0.1", "0.01", "0.001"])
    expect(await column(page, 1)).toEqual(["15.7", "7.07", "1.29", "0.126", "0.0126"])
    await expect(step).toBeDisabled()
    await expect(page.getByText("目標：半径 2 の円周 2π × 2 ＝ 12.57")).toBeVisible()
    await expect(page.getByText(/面積の増え方 ＝ 円周/)).toBeVisible()
  })

  test("→ キー（リモコン）でも1段ずつ進む", async ({ page }) => {
    for (let k = 0; k < 3; k++) {
      await page.keyboard.press("ArrowRight")
      await expect.poll(() => column(page, 2)).toHaveLength(k + 1)
      await page.waitForTimeout(600) // 段のあいだの動き（0.5秒）が終わるのを待つ
    }
    expect(await column(page, 2)).toEqual(["15.71", "14.14", "12.88"])
  })

  test("h は 0 にできない（スライダーの右はしで 0.001 とメッセージ）。リセットで記録表が消える", async ({ page }) => {
    await page.getByRole("button", { name: "1段ずつ" }).click()
    await page.locator("#sekibun-h").fill("1")
    await expect(page.getByText(/h は 0 にはできません/)).toBeVisible()
    await expect(page.getByText("h = 0.001", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "リセット" }).click()
    expect(await column(page, 2)).toEqual([])
    await expect(page.getByText("h = 1", { exact: true })).toBeVisible()
  })

  // 動いている途中のリセットで、取り残されたアニメが記録表に書き戻さないこと（2026-10-26 レビュー指摘）
  test("1段ずつで動いている途中にリセットしても、記録表は空のまま", async ({ page }) => {
    const step = page.getByRole("button", { name: "1段ずつ" })
    await step.click() // 1行目（動かない）
    await expect.poll(() => column(page, 2)).toHaveLength(1)
    await step.click() // 2段目へ動き始める（0.5秒）
    await page.getByRole("button", { name: "リセット" }).click()
    await page.waitForTimeout(800) // 動きが終わるはずだった時刻を過ぎても
    expect(await column(page, 2)).toEqual([])
    await expect(page.getByText("h = 1", { exact: true })).toBeVisible()
  })

  test("キーボード：Enter で続けて押せる。5段目まで行ったら、選択はリセットへ移る", async ({ page }) => {
    const step = page.getByRole("button", { name: "1段ずつ" })
    await step.focus()
    for (let k = 0; k < 5; k++) {
      await page.keyboard.press("Enter")
      await expect.poll(() => column(page, 2)).toHaveLength(k + 1)
      await page.waitForTimeout(600)
    }
    await expect(step).toBeDisabled()
    await expect(page.getByRole("button", { name: "リセット" })).toBeFocused()
  })

  test("F1-6：r = 4 にすると記録表が消え、1段ずつで 25.14 まで。目標 25.13 との食いちがいに一言を添える", async ({ page }) => {
    await page.getByRole("button", { name: "1段ずつ" }).click()
    await expect.poll(() => column(page, 2)).toHaveLength(1)
    await page.locator("#sekibun-r").fill("4")
    expect(await column(page, 2)).toEqual([])
    await expect(page.getByText(/半径 4 の円の半径を/)).toBeVisible()
    for (let k = 0; k < 5; k++) {
      await page.getByRole("button", { name: "1段ずつ" }).click()
      await expect.poll(() => column(page, 2)).toHaveLength(k + 1)
    }
    expect((await column(page, 2)).at(-1)).toBe("25.14")
    await expect(page.getByText("目標：半径 4 の円周 2π × 4 ＝ 25.13")).toBeVisible()
    await expect(page.getByText("（h = 0.001 ではまだ 25.14。h をもっと小さくすると 25.13 に近づく）")).toBeVisible()
  })

  // 動いている途中に r を変えたとき、取り残されたアニメが新しい r の記録表に書き込まないこと（2026-10-27 レビュー指摘）
  test("F1-6：1段ずつで動いている途中に r を変えても、記録表は空のまま", async ({ page }) => {
    const step = page.getByRole("button", { name: "1段ずつ" })
    await step.click() // 1行目（動かない）
    await expect.poll(() => column(page, 2)).toHaveLength(1)
    await step.click() // 2段目へ動き始める（0.5秒）
    await page.locator("#sekibun-r").fill("3")
    await page.waitForTimeout(800) // 動きが終わるはずだった時刻を過ぎても
    expect(await column(page, 2)).toEqual([])
    await expect(page.getByText("h = 1", { exact: true })).toBeVisible()
  })

  test("F1-6：r = 2 では一言は出ない（12.57 で一致する）", async ({ page }) => {
    for (let k = 0; k < 5; k++) {
      await page.getByRole("button", { name: "1段ずつ" }).click()
      await expect.poll(() => column(page, 2)).toHaveLength(k + 1)
    }
    await expect(page.getByText(/h をもっと小さくすると/)).toHaveCount(0)
  })
})

test.describe("ステップ④ 速さと距離とくらべる", () => {
  test.beforeEach(async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "④ 速さと距離とくらべる" }).click()
  })

  const speed = (page: Page) => page.getByTestId("area-speed")
  const circle = (page: Page) => page.getByTestId("area-circle")
  /** グラフ i（0：左、1：右）の塗りの多角形の数 */
  const polygons = (page: Page, i: number) => page.locator("figure").nth(i).locator("polygon").count()

  test("基準6：x = r = 2 で左 4、右 12.57", async ({ page }) => {
    await expect(speed(page)).toHaveText(/x² ＝ 4$/)
    await expect(circle(page)).toHaveText(/πr² ＝ 12\.57$/)
  })

  test("F4-2：スライダーで両方のグラフが同時に変わる（x = 3 で 9 と 28.27）", async ({ page }) => {
    await page.locator("#sekibun-x").fill("3")
    await expect(speed(page)).toHaveText(/x² ＝ 9$/)
    await expect(circle(page)).toHaveText(/πr² ＝ 28\.27$/)
  })

  test("F4-3：細い長方形で塗ると、両方のグラフが同じ本数の長方形になる", async ({ page }) => {
    expect(await polygons(page, 0)).toBe(1) // 三角形1つ
    await page.getByLabel("細い長方形を積み上げて塗る").check()
    await expect.poll(() => polygons(page, 0)).toBe(8)
    expect(await polygons(page, 1)).toBe(8)
    await page.getByRole("button", { name: "16", exact: true }).click()
    await expect.poll(() => polygons(page, 1)).toBe(16)
    await expect(page.getByText(/③ でほどいた帯1本と同じ/)).toBeVisible()
    // 長方形にしても面積の値は変わらない（まん中の高さの長方形の合計は三角形と同じ）
    await expect(circle(page)).toHaveText(/πr² ＝ 12\.57$/)
  })

  test("F4-5：③ の帯を重ねる。横向きの帯の束が回って、右のグラフの長方形に置きかわる", async ({ page }) => {
    await page.getByRole("button", { name: "▶ ③ の帯を重ねる" }).click()
    // 長方形の塗りに切りかわり、右のグラフには帯の束（回している途中）が出る
    await expect(page.getByLabel("細い長方形を積み上げて塗る")).toBeChecked()
    const overlay = page.getByTestId("strips-overlay")
    await expect(overlay).toHaveCount(1)
    expect(await overlay.locator("rect").count()).toBe(8)
    await expect(page.getByText(/まとめて 90° 回すと、右のグラフの細い長方形にぴったり重なる/)).toBeVisible()
    // 終わると帯の束は消え、グラフの長方形 8 本になる（面積の表示は変わらない）
    await expect(overlay).toHaveCount(0, { timeout: 5000 })
    expect(await polygons(page, 1)).toBe(8)
    await expect(circle(page)).toHaveText(/πr² ＝ 12\.57$/)
  })

  test("F4-5：重ねている途中は ⏸ で止められ、▶ 続ける で再開できる（② ③ と同じ）", async ({ page }) => {
    await page.getByRole("button", { name: "▶ ③ の帯を重ねる" }).click()
    await page.getByRole("button", { name: "⏸ 止める" }).click()
    await expect(page.getByRole("button", { name: "▶ 続ける" })).toBeVisible()
    await page.waitForTimeout(3000) // 止めているので、帯の束は残ったまま
    await expect(page.getByTestId("strips-overlay")).toHaveCount(1)
    await page.getByRole("button", { name: "▶ 続ける" }).click()
    await expect(page.getByTestId("strips-overlay")).toHaveCount(0, { timeout: 5000 })
    await expect(page.getByRole("button", { name: "▶ もう一度重ねる" })).toBeVisible()
  })

  test("F4-5：重ねている途中で x を動かすと、帯の束は消える（途中の帯が残らない）", async ({ page }) => {
    await page.getByRole("button", { name: "▶ ③ の帯を重ねる" }).click()
    await expect(page.getByTestId("strips-overlay")).toHaveCount(1)
    await page.locator("#sekibun-x").fill("3")
    // 動き（2.5 秒）が自然に終わるより十分早く消えていること（消す処理を外しても、待てば消えてしまうため）
    await expect(page.getByTestId("strips-overlay")).toHaveCount(0, { timeout: 300 })
    expect(await polygons(page, 1)).toBe(8)
  })

  test("F4-4：説明とまとめ表", async ({ page }) => {
    await expect(page.getByText(/軸の名前がちがうだけで、やっていることは同じ/)).toBeVisible()
    await expect(page.getByRole("cell", { name: "円周 2πr → 面積 πr²" })).toBeVisible()
  })

  // iPad 縦・スマホでは、x = 4 の塗りが横軸の名前の位置まで届く。名前は塗りの上（DOM で後）に描く（2026-10-26 レビュー指摘）
  test("横軸の名前「時間 x（秒）」は、細い長方形の塗りより上に描かれる", async ({ page }) => {
    await page.locator("#sekibun-x").fill("4")
    await page.getByLabel("細い長方形を積み上げて塗る").check()
    const order = await page.locator("figure").first().locator("svg").evaluate((svg) => {
      const label = [...svg.querySelectorAll("text")].find((t) => t.textContent === "時間 x（秒）")
      const polys = svg.querySelectorAll("polygon")
      const last = polys[polys.length - 1]
      if (!label || !last) return "missing"
      return last.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING ? "label-on-top" : "label-under"
    })
    expect(order).toBe("label-on-top")
  })
})

test.describe("ページ全体（表示レベル・リンク）", () => {
  test.beforeEach(async ({ page }) => open(page))

  test("はじめは「ことばで」。「記号で」にすると ① の結論に (πr²)' = 2πr が出る", async ({ page }) => {
    // 「1段ずつ」は動いている途中も押せる（押しても何もしない）ので、行が増えるのを待ってから次を押す
    for (let k = 0; k < 5; k++) {
      await page.getByRole("button", { name: "1段ずつ" }).click()
      await expect(page.locator("table tbody tr[data-filled='true']")).toHaveCount(k + 1, { timeout: 2000 })
    }
    await expect(page.getByText(/面積の増え方 ＝ 円周/)).toBeVisible()
    await expect(page.getByTestId("symbol")).toHaveCount(0)
    await page.getByRole("button", { name: "記号で" }).click()
    await expect(page.getByTestId("symbol")).toHaveText("(πr²)' = 2πr")
  })

  test("「記号で」は ③ に切りかえても残り、完成すると ∫₀ʳ 2πt dt = πr² が出る", async ({ page }) => {
    await page.getByRole("button", { name: "記号で" }).click()
    await page.getByRole("button", { name: "③ 輪をほどいて積み上げる" }).click()
    await page.locator("#sekibun-t").fill("1")
    await expect(page.getByTestId("symbol")).toContainText("∫₀ʳ 2πt dt = πr²")
  })

  // 「ことばで」のときは記号を出さない（③ ④ も。2026-10-26 レビュー指摘）
  test("③：ことばでのときは、完成しても ∫ を出さない", async ({ page }) => {
    await page.getByRole("button", { name: "③ 輪をほどいて積み上げる" }).click()
    await page.locator("#sekibun-t").fill("1")
    await expect(page.getByText(/円の面積にもどった/)).toBeVisible()
    await expect(page.getByTestId("symbol")).toHaveCount(0)
  })

  test("④：ことばでのときは ∫ を出さず、記号でにすると 2つのグラフの下に出る", async ({ page }) => {
    await page.getByRole("button", { name: "④ 速さと距離とくらべる" }).click()
    await expect(page.getByTestId("area-circle")).toBeVisible()
    await expect(page.getByTestId("symbol")).toHaveCount(0)
    await page.getByRole("button", { name: "記号で" }).click()
    await expect(page.getByTestId("symbol")).toHaveText(["∫₀ˣ 2t dt = x²", "∫₀ʳ 2πt dt = πr²"])
  })

  test("微分の意味がわかる へのリンク", async ({ page }) => {
    await expect(page.getByRole("link", { name: /微分の意味へ/ })).toHaveAttribute("href", "/bibun")
  })
})

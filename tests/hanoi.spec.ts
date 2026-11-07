// ======================================================
// ハノイの塔（/hanoi）— 画面での受け入れ基準
//
// 要件 docs/requirements-hanoi-app.md §8 のうち、画面を操作しないと確かめられないものを固定する。
// 手順・計算そのものは src/__tests__/hanoi/ の単体テストが担当する。
//
//   基準1  ① n=3 を最少手順の7回でクリア →「最少回数でクリア！」。ルール違反は回数に数えない。最少回数は初期で出ていない
//   基準2  ② n=4 で最後まで → 15手、「7 ＋ 1 ＋ 7 ＝ 15」、円盤ごとの回数 ④1・③2・②4・①8
//   基準3  ② 進み具合スライダーで k 手目へ飛んだ盤面 ＝ 1手ずつ k 回すすめた盤面
//   基準4  ③ 表・ブロック図（ステップ③を作ったあとで追加）
//   基準5  ④ 64枚（ステップ④を作ったあとで追加）
// ======================================================

import { test, expect, type Page } from "@playwright/test"
import { solveTo } from "../src/app/(apps)/hanoi/_lib/solve"

/** ハイドレーション完了を待つ（smoke.spec.ts と同じ作法） */
async function open(page: Page) {
  await page.goto("/hanoi")
  await page.locator("html[data-hydrated='1']").waitFor()
}

const hit = (page: Page, peg: string) => page.locator(`[data-hit="${peg}"]`)
const playCount = async (page: Page) => Number(await page.locator("[data-play-count]").innerText())

/** 盤の円盤の並び（棒ごとの円盤番号）を文字列にする */
async function boardState(page: Page): Promise<string> {
  return page.locator("[data-board] g[data-disk][data-peg]").evaluateAll((els) =>
    els.map((e) => `${e.getAttribute("data-peg")}${e.getAttribute("data-disk")}`).join(","),
  )
}

test.describe("ステップ① あそぶ", () => {
  test.beforeEach(async ({ page }) => {
    await open(page)
  })

  test("基準1：初期は ①・n=3・最少回数はかくれている", async ({ page }) => {
    await expect(page.getByRole("button", { name: "① あそぶ" })).toHaveClass(/bg-brand-500/)
    await expect(page.locator("[data-n]")).toHaveText("3")
    await expect(page.locator("[data-min-text]")).toHaveCount(0)
    await page.getByRole("button", { name: "最少回数を見る" }).click()
    await expect(page.locator("[data-min-text]")).toContainText("7回")
    await page.getByRole("button", { name: "最少回数をかくす" }).click()
    await expect(page.locator("[data-min-text]")).toHaveCount(0)
  })

  test("基準1：最少手順どおり7回でクリア → 最少回数でクリア！・記録表に入る", async ({ page }) => {
    for (const m of solveTo(3, "C")) {
      await hit(page, m.from).click()
      await hit(page, m.to).click()
    }
    await expect(page.locator("[data-clear]")).toBeVisible()
    await expect(page.locator("[data-clear]")).toContainText("クリア！ 7回")
    await expect(page.locator("[data-verdict]")).toHaveText("最少回数でクリア！")
    await expect(page.locator("[data-stamp]")).toContainText("3枚")
    const row = page.locator('[data-record-row="3"]')
    await expect(row).toContainText("7")
    await expect(row.locator("[data-record-min]")).toHaveText("？") // 最少回数はかくれたまま
  })

  test("基準1：ルール違反は置けず、回数に数えない", async ({ page }) => {
    await hit(page, "A").click() // ① を持ち上げる
    await hit(page, "B").click() // ① を B へ（1回）
    expect(await playCount(page)).toBe(1)
    const before = await boardState(page)
    await hit(page, "A").click() // ② を持ち上げる
    await hit(page, "B").click() // ① の上に ② は置けない
    await expect(page.locator("[data-play-message]")).toContainText("小さい円盤の上に大きい円盤はのせられないよ")
    expect(await playCount(page)).toBe(1)
    expect(await boardState(page)).toBe(before)
  })

  test("同じ棒をもう一度タップで取り消し。1つもどす・最初から", async ({ page }) => {
    await hit(page, "A").click()
    await hit(page, "A").click()
    expect(await playCount(page)).toBe(0)
    await hit(page, "A").click()
    await hit(page, "C").click()
    expect(await playCount(page)).toBe(1)
    await page.getByRole("button", { name: "1つもどす" }).click()
    expect(await playCount(page)).toBe(0)
    await hit(page, "A").click()
    await hit(page, "C").click()
    await page.getByRole("button", { name: "最初から" }).click()
    expect(await playCount(page)).toBe(0)
  })

  test("ドラッグ＆ドロップでも動かせる", async ({ page }) => {
    const a = (await hit(page, "A").boundingBox())!
    const b = (await hit(page, "B").boundingBox())!
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
    await page.mouse.down()
    await page.mouse.move(b.x + b.width / 2 - 40, b.y + b.height / 2, { steps: 8 })
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 })
    await page.mouse.up()
    expect(await playCount(page)).toBe(1)
    expect(await boardState(page)).toContain("B1")
  })

  test("キー 1・2・3 で棒を選べる", async ({ page }) => {
    await page.keyboard.press("1")
    await page.keyboard.press("3")
    expect(await playCount(page)).toBe(1)
    expect(await boardState(page)).toContain("C1")
  })

  test("移動先 B でもクリアできる", async ({ page }) => {
    await page.getByRole("button", { name: "B", exact: true }).click()
    for (const m of solveTo(3, "B")) {
      await hit(page, m.from).click()
      await hit(page, m.to).click()
    }
    await expect(page.locator("[data-verdict]")).toHaveText("最少回数でクリア！")
  })

  test("最少より多い回数でクリアすると「もっと少なくできるかも？」", async ({ page }) => {
    // n=1：A→B→C と遠回り（2回）
    await page.locator("#hanoi-n").fill("1")
    await hit(page, "A").click()
    await hit(page, "B").click()
    await hit(page, "B").click()
    await hit(page, "C").click()
    await expect(page.locator("[data-verdict]")).toHaveText("もっと少なくできるかも？")
  })
})

test.describe("ステップ② 自動で解く", () => {
  test.beforeEach(async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "② 自動で解く" }).click()
    await page.locator("#hanoi-n").fill("4")
  })

  test("基準2：n=4 で最後へ → 15手・7 ＋ 1 ＋ 7 ＝ 15・円盤ごとの回数", async ({ page }) => {
    await page.getByRole("button", { name: "最後へ" }).click()
    await expect(page.locator("[data-progress]")).toContainText("いま 15 手目")
    await expect(page.locator("[data-progress]")).toContainText("ぜんぶで 15 手")
    await expect(page.locator("[data-segment-sum]")).toContainText("7 ＋ 1 ＋ 7 ＝ 15")
    for (const [d, c] of [[4, 1], [3, 2], [2, 4], [1, 8]]) {
      await expect(page.locator(`[data-count="${d}"]`)).toHaveText(String(c))
    }
    await expect(page.locator("[data-count-sum]")).toContainText("8＋4＋2＋1＝15")
    await expect(page.locator("[data-binary]")).toHaveAttribute("data-binary", "1111")
  })

  test("手順の帯：マス数が 2ⁿ−1・色の並びが手順の円盤と一致・今の手が強調される", async ({ page }) => {
    const strip = page.locator("[data-strip]")
    await expect(strip).toHaveAttribute("data-cells", "15")
    await expect(strip).toHaveAttribute("data-disks", solveTo(4, "C").map((m) => m.disk).join(","))
    await expect(page.locator("[data-strip] [data-current]")).toHaveCount(0)
    await page.getByRole("button", { name: "1手すすむ" }).click()
    await expect(page.locator("[data-strip] [data-current]")).toHaveCount(1)
  })

  test("基準3：スライダーで k 手目へ飛んだ盤面 ＝ 1手ずつ k 回すすめた盤面", async ({ page }) => {
    for (const k of [1, 5, 8, 12, 15]) {
      await page.locator("#hanoi-progress").fill(String(k))
      const jumped = await boardState(page)
      await page.locator("#hanoi-progress").fill("0")
      for (let i = 0; i < k; i++) await page.getByRole("button", { name: "1手すすむ" }).click()
      expect(await boardState(page)).toBe(jumped)
    }
  })

  test("3つの区切り：前半をクリックすると 3 ＋ 1 ＋ 3 に分かれる", async ({ page }) => {
    await expect(page.locator("[data-seg]")).toHaveCount(3)
    await page.locator('[data-seg="first"]').click()
    await expect(page.locator("[data-seg]")).toHaveCount(6)
    await expect(page.locator('[data-seg="first.first"]')).toContainText("3手")
    await expect(page.locator('[data-seg="first.middle"]')).toContainText("1手")
  })

  test("スペースで再生・一時停止（ボタンを選んだままでも）", async ({ page }) => {
    await page.getByRole("button", { name: "最後へ" }).click()
    await page.getByRole("button", { name: "最初へ" }).click()
    await page.keyboard.press("Space")
    await expect(page.getByRole("button", { name: /^⏸/ })).toBeVisible()
    await page.keyboard.press("Space")
    await expect(page.getByRole("button", { name: /^▶/ })).toBeVisible()
  })

  test("速さ最大（0.02秒）で最後まで再生すると完成", async ({ page }) => {
    await page.locator("#hanoi-speed").fill("6")
    await page.getByRole("button", { name: /^▶ 再生/ }).click()
    await expect(page.getByText("完成！")).toBeVisible({ timeout: 5000 })
    await expect(page.locator("[data-progress]")).toContainText("いま 15 手目")
  })

  test("枚数 n を変えても円盤の枚数が共有される（①に戻ると同じ枚数）", async ({ page }) => {
    await page.getByRole("button", { name: "① あそぶ" }).click()
    await expect(page.locator("[data-n]")).toHaveText("4")
  })
})

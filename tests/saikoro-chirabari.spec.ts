// ======================================================
// さいころの散らばりシミュレーター（/saikoro-chirabari）— 画面での受け入れ条件
//
// 要件 docs/要件定義書_さいころ散らばりシミュレータ.md §10 のうち、画面を操作しないと確かめられないものを固定する。
// 平均・分散・標準偏差の値そのものは src/__tests__/saikoro-chirabari/ の単体テストが担当する。
//
//   条件4   ドットプロットの横軸は 2〜12 の11列で固定。回数を変えても目盛りの位置が動かない
//   条件5   班の10個を入れると、偏差の合計が 0.0 と表示される
//   条件7   スマホ縦画面で横スクロールが出ない（全セクションを動かしたあとで測る）
//   ほか    100回までは点、1,000回からは棒。班のデータが ③ のヒストグラムに ▼ で立つ
//           B方式に奇数を入れると計算しない
// ======================================================

import { test, expect, type Page } from "@playwright/test"

async function open(page: Page) {
  await page.goto("/saikoro-chirabari")
  await page.locator("html[data-hydrated='1']").waitFor()
}

/** セクション1のドットプロットの目盛り（2〜12）の x 座標 */
async function axisXs(page: Page) {
  const svg = page.locator("#furu svg").first()
  return svg.locator("text").evaluateAll((els) =>
    els
      .filter((e) => /^(1[0-2]|[2-9])$/.test(e.textContent ?? "") && e.getAttribute("font-size") === "17")
      .map((e) => `${e.textContent}@${e.getAttribute("x")}`),
  )
}

test("条件4：横軸は 2〜12 の11列で、回数を変えても動かない／100回までは点・1,000回は棒", async ({ page }) => {
  await open(page)
  const s1 = page.locator("#furu")
  const before = await axisXs(page)
  expect(before).toHaveLength(11)
  expect(before[0].startsWith("2@")).toBe(true)
  expect(before[10].startsWith("12@")).toBe(true)

  await s1.getByRole("button", { name: "10回", exact: true }).click()
  // アニメで1個ずつ積み上がり、10個そろう
  await expect(s1.locator("svg").first().locator("circle")).toHaveCount(10, { timeout: 5000 })
  await expect(s1.getByText("1回を1つの点で表示")).toBeVisible()

  await s1.getByRole("button", { name: "1,000回" }).click()
  await expect(s1.getByText("回数が多いので棒で表示", { exact: false })).toBeVisible()
  expect(await axisXs(page)).toEqual(before)

  await s1.getByRole("button", { name: "もう10回ふる" }).click()
  await expect(s1.getByText("1,010")).toBeVisible({ timeout: 5000 })
})

test("条件5：班の10個を入れると偏差の合計が 0.0／③ に ▼ が立つ", async ({ page }) => {
  await open(page)
  const s4 = page.locator("#han")
  const inputs = s4.locator("input")
  // 1つめの欄に区切って貼り付けると10個に配られる
  await inputs.first().fill("7,5,9,6,8,7,4,10,7,6")
  await expect(inputs.nth(9)).toHaveValue("6")
  await expect(s4.getByTestId("dev-sum")).toHaveText("0.0")
  await expect(s4.getByText("1.70")).toBeVisible()

  await s4.getByRole("button", { name: /ヒストグラムで位置を見る/ }).click()
  const s3 = page.locator("#bure")
  await expect(s3.getByText("班の標準偏差（A方式）")).toBeVisible()
  // ▼（三角の path）がヒストグラムの図の中にある。
  // 凡例の ▼ も svg の path なので、ヒストグラムの svg に絞って数える（凡例だけ出ていても緑にならないように）
  const hist = s3.locator('svg[aria-label*="ヒストグラム"]')
  await expect(hist.locator("path")).toHaveCount(1)

  // 両方を重ねたときは、▼ がどちらの方式の値かを図の中にも書く
  await s3.getByRole("button", { name: "A・B 両方" }).click()
  await expect(hist.locator("path")).toHaveCount(1)
  await expect(hist.getByText("班（A）")).toBeVisible()
})

test("貼り付けで入りきらない値は、黙って捨てずに知らせる", async ({ page }) => {
  await open(page)
  const s4 = page.locator("#han")
  await s4.locator("input").nth(1).fill("7,5,9,6,8,7,4,10,7,6")
  await expect(s4.getByText("最後の「6」は入れていません", { exact: false })).toBeVisible()
  // 次に普通に入力したら消える
  await s4.locator("input").first().fill("7")
  await expect(s4.getByText("入れていません", { exact: false })).toHaveCount(0)
})

test("B方式に奇数を入れると計算しない", async ({ page }) => {
  await open(page)
  const s4 = page.locator("#han")
  await s4.getByRole("button", { name: /B方式/ }).click()
  await s4.locator("input").first().fill("2,4,6,8,10,12,2,4,6,7")
  await expect(s4.getByText("B方式は偶数だけです")).toBeVisible()
  await expect(s4.getByTestId("dev-sum")).toHaveCount(0)
})

test.describe("スマホ縦画面", () => {
  test.use({ viewport: { width: 390, height: 844 } })
  test("条件7：全セクションを動かしても横スクロールが出ない", async ({ page }) => {
    await open(page)
    await page.locator("#furu").getByRole("button", { name: "10,000回" }).click()
    await page.locator("#kuraberu").getByRole("button", { name: "10,000回" }).click()
    await page.locator("#bure").getByRole("button", { name: "A・B 両方" }).click()
    await page.locator("#han").getByRole("button", { name: "例を入れる" }).click()
    await expect(page.locator("#bure").getByText("組にして比べると", { exact: false })).toBeVisible()
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
    expect(sw).toBeLessThanOrEqual(iw)
  })
})

// ======================================================
// 「こたえをみる」を押したあとにコインがもらえないことを検査する
//
// 背景: たしざん１・ひきざん１ の showAnswer は答え欄に正解を書き込むだけで
//       問題を終了させていなかった。そのため答えを見てから「こたえあわせ」を
//       押すと、ふつうの正解としてコインが1枚もらえてしまっていた。
//       他の4本（tokei・amari・number-line）はもともと問題を終了させている。
//
// 検査の考え方: 判定に入る経路は「こたえあわせ」ボタン・Enter キー・数字ボタン
//       の3つある。どれか1つだけ塞いでも穴が残るので、3つとも試してから
//       コインが増えていないことを確かめる。
//
//       あわせて「ふつうに正解すればコインは増える」ことも検査する。
//       これがないと、コインが常に増えない実装になってもこの検査は緑のままになる。
// ======================================================

import { test, expect, type Page } from "@playwright/test"

const APPS = [
  { path: "/tashizan-1", name: "たしざん１", answerOf: (l: number, r: number) => l + r },
  { path: "/hikizan-1",  name: "ひきざん１", answerOf: (l: number, r: number) => l - r },
]

/** localStorage のコイン数を直接読む（表示ではなく保存された値で判定する） */
function readCoins(page: Page) {
  return page.evaluate(() => Number(localStorage.getItem("jimitas_coins") ?? 0))
}

/** コインを 0 に戻す */
function clearCoins(page: Page) {
  return page.evaluate(() => localStorage.setItem("jimitas_coins", "0"))
}

/** 式の左の数・右の数を読み取って、その問題の正解を求める */
async function currentAnswer(page: Page, answerOf: (l: number, r: number) => number) {
  const inputs = page.locator('input[type="number"]')
  const left = Number(await inputs.nth(0).inputValue())
  const right = Number(await inputs.nth(1).inputValue())
  return answerOf(left, right)
}

for (const { path, name, answerOf } of APPS) {
  test(`${name}: こたえをみた あとは どの経路でもコインが増えない`, async ({ page }) => {
    await page.goto(path)
    await clearCoins(page)

    await page.getByRole("button", { name: "もんだい" }).click()
    await page.getByRole("button", { name: "こたえをみる" }).click()

    const answer = await currentAnswer(page, answerOf)

    // 答え欄に正解が表示されていること（「こたえをみる」自体は働いている）
    await expect(page.locator('input[type="number"]').nth(2)).toHaveValue(String(answer))

    // 判定に入りうる3経路をすべて試す
    await page.getByRole("button", { name: "こたえあわせ" }).click()
    await page.keyboard.press("Enter")
    await page.locator(`button[value="${answer}"]`).click()
    await page.waitForTimeout(300)

    expect(await readCoins(page), "こたえを見たのにコインが増えている").toBe(0)
  })

  test(`${name}: ふつうに正解すればコインは増える`, async ({ page }) => {
    await page.goto(path)
    await clearCoins(page)

    await page.getByRole("button", { name: "もんだい" }).click()
    const answer = await currentAnswer(page, answerOf)

    await page.locator(`button[value="${answer}"]`).click()
    await page.waitForTimeout(300)

    expect(await readCoins(page), "正解してもコインが増えていない").toBe(1)
  })
}

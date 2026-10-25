// ======================================================
// 微分の意味がわかる（/bibun）— 画面での受け入れ基準
//
// 要件 docs/requirements-derivative-app.md §8 のうち、画面を操作しないと確かめられないものを固定する。
// 計算の値そのもの（5, 4.5, … など）は src/__tests__/bibun/ の単体テストが担当する。
// ここで守るのは「ボタンを押した回数・操作と、画面に出る値・状態のつながり」。
//
//   基準1   ② 1段ずつ ×4 → 5, 4.5, 4.1, 4.01、5回目で 4.001、接線が実線で出る
//   基準2   左から → 3, 3.5, 3.9, 3.99, 3.999
//   基準3   ▶ 近づけてみる → 約5秒で記録表5行・h = 0.001・追いかけズームで拡大・接線が実線
//   基準5   h を 0 にしようとしても 0 にならず、メッセージが出る
//   基準8   自分で作る 2x + 1 → いつも 2
//   基準10  「ことばで」では「割線」が出ない
//   ほか    ② の点A をドラッグしても指から逃げない（2026-10-25 レビューで見つかった不具合の番人）
//           → ・PageDown で1段ずつ（ボタンに選択が残っていても）
// ======================================================

import { test, expect, type Page } from "@playwright/test"

/** ハイドレーション完了を待つ（smoke.spec.ts と同じ作法） */
async function open(page: Page) {
  await page.goto("/bibun")
  await page.locator("html[data-hydrated='1']").waitFor()
}

/** 記録表 i 番目（0：右から、1：左から）の「平均変化率」の列 */
async function rateColumn(page: Page, i: number): Promise<string[]> {
  return page.locator("table").nth(i).locator("tbody tr").evaluateAll((trs) =>
    trs.map((tr) => tr.querySelectorAll("td")[3].textContent ?? "").filter(Boolean))
}

const legend = (page: Page) => page.locator("ul").filter({ hasText: "2点を結ぶ直線" })

test.describe("ステップ② 微分係数", () => {
  test.beforeEach(async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "② 微分係数（接線の傾き）" }).click()
  })

  test("基準1・2：1段ずつ（右から・左から）", async ({ page }) => {
    const step = page.getByRole("button", { name: "1段ずつ" })
    for (let i = 0; i < 4; i++) { await step.click(); await expect(step).toBeEnabled() }
    await expect.poll(() => rateColumn(page, 0)).toEqual(["5", "4.5", "4.1", "4.01"])
    await expect(legend(page)).not.toContainText("接線")
    await step.click()
    await expect.poll(() => rateColumn(page, 0)).toEqual(["5", "4.5", "4.1", "4.01", "4.001"])
    await expect(legend(page)).toContainText("━ 接線：傾き＝微分係数 4")
    await expect(step).toBeDisabled()

    await page.getByRole("button", { name: "左から（h < 0）" }).click()
    for (let i = 0; i < 5; i++) { await step.click(); await page.waitForTimeout(650) }
    await expect.poll(() => rateColumn(page, 1)).toEqual(["3", "3.5", "3.9", "3.99", "3.999"])
    expect(await rateColumn(page, 0)).toHaveLength(5) // 右からの表も残る（並べてくらべられる）
  })

  test("基準3：▶ 近づけてみる（約5秒・5行・拡大・接線が実線）", async ({ page }) => {
    const before = await page.locator("svg[role=group] g[font-size] text").allTextContents()
    const t0 = Date.now()
    await page.getByRole("button", { name: "▶ 近づけてみる" }).click()
    await expect(page.getByRole("button", { name: "❚❚ 一時停止" })).toBeVisible()
    await expect(page.getByRole("button", { name: "▶ 近づけてみる" })).toBeVisible({ timeout: 10_000 })
    const sec = (Date.now() - t0) / 1000
    expect(sec).toBeGreaterThan(4.5)
    expect(sec).toBeLessThan(7)
    expect(await rateColumn(page, 0)).toEqual(["5", "4.5", "4.1", "4.01", "4.001"])
    await expect(page.locator('label[for="bibun-h"]')).toContainText("h = 0.001")
    await expect(legend(page)).toContainText("━ 接線：傾き＝微分係数 4")
    // 追いかけズーム：目盛りが細かく（1.998 のような小数第3位まで）なっている
    const after = await page.locator("svg[role=group] g[font-size] text").allTextContents()
    expect(after).not.toEqual(before)
    expect(after.some((s) => /^\d\.\d{3}$/.test(s))).toBe(true)
  })

  test("基準5：h を 0 にしようとしても 0 にならない", async ({ page }) => {
    await page.locator("#bibun-h").fill("0")
    await expect(page.getByText("2点が重なると Δx = 0")).toBeVisible()
    expect(Number(await page.locator("#bibun-h").inputValue())).not.toBe(0)
  })

  test("→・PageDown で1段ずつ（マウスで押したボタンに選択が残っていても）", async ({ page }) => {
    await page.getByRole("button", { name: "1段ずつ" }).click()
    await page.keyboard.press("ArrowRight")
    await page.waitForTimeout(650)
    await page.keyboard.press("PageDown")
    await expect.poll(() => rateColumn(page, 0)).toEqual(["5", "4.5", "4.1"])
  })

  // ドラッグ中に表示を作り直すと、指の下で座標がずれて点が先へ走る（2026-10-25 に一度入った不具合）
  test("点A をドラッグしても、点は指の下にある", async ({ page }) => {
    const svg = page.locator("svg[role=group]")
    await svg.scrollIntoViewIfNeeded()
    const box = (await svg.boundingBox())!
    const dot = page.locator('g[aria-label="点A"] circle').last()
    const x0 = box.x + Number(await dot.getAttribute("cx"))
    const y0 = box.y + Number(await dot.getAttribute("cy"))
    await page.mouse.move(x0, y0)
    await page.mouse.down()
    await page.mouse.move(x0 - 120, y0, { steps: 20 })
    const xDuring = box.x + Number(await dot.getAttribute("cx"))
    await page.mouse.up()
    // 0.1 刻みにそろえる分（1目盛りの半分ほど）のずれは許す
    expect(Math.abs(xDuring - (x0 - 120))).toBeLessThan(15)
  })
})

test.describe("用語・関数", () => {
  test("基準8：自分で作る 2x + 1 では、いつも 2", async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "② 微分係数（接線の傾き）" }).click()
    await page.locator("#bibun-fn").selectOption("custom")
    const step = page.getByRole("button", { name: "1段ずつ" })
    for (let i = 0; i < 5; i++) { await step.click(); await page.waitForTimeout(650) }
    await expect.poll(() => rateColumn(page, 0)).toEqual(["2", "2", "2", "2", "2"])
  })

  test("基準10：「ことばで」では「割線」が出ず、「記号で」では1か所だけ", async ({ page }) => {
    await open(page)
    for (const tab of ["① 平均変化率", "② 微分係数（接線の傾き）", "③ 導関数"]) {
      await page.getByRole("button", { name: tab }).click()
      expect(await page.locator("body").textContent()).not.toContain("割線")
    }
    await page.getByRole("button", { name: "② 微分係数（接線の傾き）" }).click()
    await page.getByRole("button", { name: "記号で" }).click()
    const text = (await page.locator("body").textContent()) ?? ""
    expect(text.match(/割線/g)).toHaveLength(1)
  })
})

// 基準9：練習問題。答えは「答えを見る」まで出さず、自動採点で正答・誤答を正しく判定する
test.describe("練習問題", () => {
  /** 問題文の式「2x³ − 3x + 1」→ [c0, c1, c2, c3]（テスト用の簡単な読み取り） */
  function parse(s: string): number[] {
    const c = [0, 0, 0, 0]
    const terms = s.replace(/−/g, "-").replace(/\s+/g, "").replace(/-/g, "+-").split("+").filter(Boolean)
    for (const term of terms) {
      const m = term.match(/^(-?\d*)(x([²³])?)?$/)!
      const k = m[2] ? (m[3] === "³" ? 3 : m[3] === "²" ? 2 : 1) : 0
      c[k] += m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1])
    }
    return c
  }

  test("基準9：正答・誤答の判定、答えを見た問題は数えない", async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "③ 導関数" }).click()
    const prac = page.locator("section").filter({ hasText: "練習問題" }).last()
    const score = prac.locator("p[aria-live]")
    await prac.getByRole("button", { name: "3次まで" }).click()
    await prac.getByRole("button", { name: "もんだい" }).click()
    await expect(prac.getByText("答え", { exact: true })).toHaveCount(0) // 問題と答えを同時に出さない

    const c = parse((await prac.locator("p.text-xl b").first().textContent()) ?? "")
    const d = [c[1], 2 * c[2], 3 * c[3]]
    // わざと定数をまちがえる → 「定数がちがいます」・連続 0
    await prac.getByLabel("x² の係数").fill(String(d[2]))
    await prac.getByLabel("x の係数").fill(String(d[1]))
    await prac.getByLabel("定数").fill(String(d[0] + 1))
    await prac.getByRole("button", { name: "こたえあわせ" }).click()
    await expect(prac.getByText("定数がちがいます")).toBeVisible()
    await expect(score).toHaveText(/正解 0 問\s*連続 0 問/)
    // 直して正解 → 正解 1
    await prac.getByLabel("定数").fill(d[0] === 0 ? "" : String(d[0]))
    await prac.getByRole("button", { name: "こたえあわせ" }).click()
    await expect(prac.getByText("せいかい！🎉")).toBeVisible()
    await expect(score).toHaveText(/正解 1 問\s*連続 1 問/)

    // 次の問題で答えを見てから正解しても数えない
    await prac.getByRole("button", { name: "もんだい" }).click()
    await prac.getByRole("button", { name: "こたえをみる" }).click()
    const answer = (await prac.getByText(/^f'\(x\) = /).textContent()) ?? ""
    const ad = parse(answer.replace(/^f'\(x\) = /, ""))
    await prac.getByLabel("x² の係数").fill(String(ad[2]))
    await prac.getByLabel("x の係数").fill(String(ad[1]))
    await prac.getByLabel("定数").fill(String(ad[0]))
    await prac.getByRole("button", { name: "こたえあわせ" }).click()
    // 採点は「合っている」（読み違えて不正解になったのではないことを確かめる）。せいかいの演出は出さない
    await expect(prac.getByText("合っています（答えを見たので、正解の数には入りません）")).toBeVisible()
    await expect(prac.getByText("せいかい！🎉")).toBeHidden()
    await expect(score).toHaveText(/正解 1 問\s*連続 0 問/)

    // タブを切りかえても、正解数・問題は消えない
    const problemText = await prac.locator("p.text-xl").first().textContent()
    await page.getByRole("button", { name: "② 微分係数（接線の傾き）" }).click()
    await page.getByRole("button", { name: "③ 導関数" }).click()
    await expect(score).toHaveText(/正解 1 問\s*連続 0 問/)
    await expect(prac.locator("p.text-xl").first()).toHaveText(problemText ?? "")
  })

  test("F3-7：微分係数の問題。正しい値でせいかい、答えでは接線のグラフを出す", async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "③ 導関数" }).click()
    const prac = page.locator("section").filter({ hasText: "練習問題" }).last()
    await prac.getByRole("button", { name: "微分係数を求める" }).click()
    await prac.getByRole("button", { name: "もんだい" }).click()
    const [polyText, aText] = await prac.locator("p.text-xl b").allTextContents()
    const c = parse(polyText)
    const a = Number(aText.replace("−", "-"))
    const v = c[1] + 2 * c[2] * a + 3 * c[3] * a * a
    await prac.getByLabel("微分係数").fill(String(v))
    await prac.getByRole("button", { name: "こたえあわせ" }).click()
    await expect(prac.getByText("せいかい！🎉")).toBeVisible()
    await prac.getByRole("button", { name: "こたえをみる" }).click()
    await expect(prac.locator("svg[role=group]")).toBeVisible()
    await expect(prac.getByText(/における接線の傾きが/)).toBeVisible()
  })
})

// 大きく表示・キー操作（実演向け）。仕組みを外したら落ちるよう、見た目の値と状態の変化で確かめる
test.describe("実演向け", () => {
  test.beforeEach(async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "② 微分係数（接線の傾き）" }).click()
  })

  test("大きく表示：線が太く、目盛りの文字が 18px 以上になる", async ({ page }) => {
    const curve = page.locator("svg[role=group] path").first()
    const ticks = page.locator("svg[role=group] g[font-size]").first()
    const w0 = Number(await curve.getAttribute("stroke-width"))
    await page.getByLabel("大きく表示").check()
    await expect.poll(async () => Number(await curve.getAttribute("stroke-width"))).toBeGreaterThan(w0)
    expect(Number(await ticks.getAttribute("font-size"))).toBeGreaterThanOrEqual(18)
  })

  // マウスで押したボタン・チェックボックスに選択が残っていても、スペースは再生になる（2026-10-25 オーナー決定）
  test("ボタン・チェックボックスを押したあとでも、スペースで再生・一時停止", async ({ page }) => {
    await page.getByRole("button", { name: "1段ずつ" }).click()
    await page.waitForTimeout(650)
    await page.keyboard.press(" ")
    await expect(page.getByRole("button", { name: "❚❚ 一時停止" })).toBeVisible()
    // 再生中にチェックボックスを押してからスペース → 一時停止。チェックボックスは切りかわらない
    const big = page.getByLabel("大きく表示")
    await big.check()
    await page.keyboard.press(" ")
    await expect(page.getByRole("button", { name: "▶ 続ける" })).toBeVisible()
    await expect(big).toBeChecked()
  })

  // マウスで触った点に選択が残ると、リモコンの → が点A を動かして記録表を消してしまう
  test("点A をマウスで触ったあとの → は1段ずつ（点A は動かない）", async ({ page }) => {
    const svg = page.locator("svg[role=group]")
    await svg.scrollIntoViewIfNeeded()
    const box = (await svg.boundingBox())!
    const dot = page.locator('g[aria-label="点A"] circle').last()
    await page.mouse.click(box.x + Number(await dot.getAttribute("cx")), box.y + Number(await dot.getAttribute("cy")))
    await page.keyboard.press("ArrowRight")
    await expect.poll(() => rateColumn(page, 0)).toEqual(["5"])
    await expect(page.locator('label[for="bibun-a"]')).toHaveText(/a = 2$/)
  })
})

test.describe("拡大ルーペ・文脈ラベル", () => {
  test("F2-11：拡大ルーペは点A を真ん中に 10 倍で出し、全体図は動かさない（追いかけズームとはどちらか一方）", async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "② 微分係数（接線の傾き）" }).click()
    const planes = page.locator("svg[role=group]")
    await expect(planes).toHaveCount(1)
    await page.getByLabel("拡大ルーペ").check()
    await expect(planes).toHaveCount(2)
    await expect(page.getByText("拡大 ×10")).toBeVisible()
    await expect(page.getByLabel("追いかけズーム")).not.toBeChecked() // ルーペを付けると追いかけズームは外れる
    // ルーペの中の点A（最後に描く点）が小窓の真ん中にある
    const loupe = planes.nth(1)
    const box = (await loupe.boundingBox())!
    const dotA = loupe.locator("circle").last()
    expect(Math.abs(Number(await dotA.getAttribute("cx")) - box.width / 2)).toBeLessThan(2)
    expect(Math.abs(Number(await dotA.getAttribute("cy")) - box.height / 2)).toBeLessThan(2)
    // ▶ のあとも全体図の目盛りは変わらない（全体図は寄らない）。ルーペは出たまま
    const ticks = async () => (await planes.first().locator("g[font-size] text").allTextContents()).join(",")
    const before = await ticks()
    await page.getByRole("button", { name: "▶ 近づけてみる" }).click()
    await expect(page.getByRole("button", { name: "▶ 近づけてみる" })).toBeVisible({ timeout: 10_000 })
    await expect(planes).toHaveCount(2)
    expect(await ticks()).toBe(before)
    // 追いかけズームを付けるとルーペは消える
    await page.getByLabel("追いかけズーム").check()
    await expect(planes).toHaveCount(1)
  })

  test("時間・距離で表す：軸と主要な値の名前を言いかえ、元の用語を添える", async ({ page }) => {
    await open(page)
    await page.getByLabel("時間・距離で表す").check()
    // ① 軸・凡例・式
    const svg = page.locator("svg[role=group]").first()
    await expect(svg).toContainText("時間（秒）")
    await expect(svg).toContainText("距離（m）")
    await expect(page.getByText("傾き＝平均の速さ（平均変化率） 5")).toBeVisible()
    await expect(svg).toContainText("かかった時間 = 1")
    // ② 記録表の見出し・結論
    await page.getByRole("button", { name: "② 微分係数（接線の傾き）" }).click()
    await expect(page.locator("table").first()).toContainText("平均の速さ（平均変化率）")
    const step = page.getByRole("button", { name: "1段ずつ" })
    for (let i = 0; i < 5; i++) { await step.click(); await page.waitForTimeout(650) }
    await expect(page.getByText(/これが 2 秒における瞬間の速さ（微分係数・接線の傾き）/)).toBeVisible()
    // ③ 下のグラフの縦軸
    await page.getByRole("button", { name: "③ 導関数" }).click()
    await expect(page.locator("svg[role=group]").nth(1)).toContainText("瞬間の速さ")
  })
})

/** 2つの矩形が重なっているか */
const overlaps = (p: { x: number; y: number; width: number; height: number }, q: { x: number; y: number; width: number; height: number }) =>
  p.x < q.x + q.width && q.x < p.x + p.width && p.y < q.y + q.height && q.y < p.y + p.height

// 軸の名前は、軸が画面の外にあっても見える場所に出す（ズームボタン・凡例に隠れない）。2026-10-25 レビュー指摘
test.describe("軸の名前が隠れない", () => {
  test("寄って横軸が上の外に出ても、「時間（秒）」がズームボタン・凡例と重ならない", async ({ page }) => {
    await open(page)
    await page.locator("#bibun-fn").selectOption("x3-3x")
    await page.getByLabel("時間・距離で表す").check()
    await page.getByRole("button", { name: "② 微分係数（接線の傾き）" }).click()
    await page.locator("#bibun-a").fill("0.5") // f(0.5) < 0 なので、寄ると横軸（y = 0）が上の外に出る
    await page.getByRole("button", { name: "▶ 近づけてみる" }).click()
    await expect(page.getByRole("button", { name: "▶ 近づけてみる" })).toBeVisible({ timeout: 10_000 })
    const svg = (await page.locator("svg[role=group]").first().boundingBox())!
    const label = (await page.locator("svg[role=group]").first().locator("text", { hasText: "時間（秒）" }).boundingBox())!
    // グラフの見える範囲の中にある（上の外に出て見えない、を防ぐ）
    expect(label.y).toBeGreaterThanOrEqual(svg.y)
    expect(label.y + label.height).toBeLessThanOrEqual(svg.y + svg.height)
    for (const name of ["拡大", "縮小", "全体表示に戻す"]) {
      expect(overlaps(label, (await page.getByRole("button", { name, exact: true }).boundingBox())!)).toBe(false)
    }
    expect(overlaps(label, (await page.locator("ul").filter({ hasText: "2点を結ぶ直線" }).boundingBox())!)).toBe(false)
  })

  test("① の「距離（m）」は、グラフに重ねた凡例の下に出る", async ({ page }) => {
    await open(page)
    await page.getByLabel("時間・距離で表す").check()
    const label = (await page.locator("svg[role=group]").first().locator("text", { hasText: "距離（m）" }).boundingBox())!
    const legend = (await page.getByText(/^━ 2点を結ぶ直線/).boundingBox())!
    expect(overlaps(label, legend)).toBe(false)
  })
})

test.describe("キー操作（つづき）", () => {
  test.beforeEach(async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: "② 微分係数（接線の傾き）" }).click()
  })

  // スライダーに選択が残ると、リモコンの PageDown でスライダーが大きく動いてしまう
  test("h のスライダーをマウスで触ったあとの PageDown は1段ずつ", async ({ page }) => {
    const slider = page.locator("#bibun-h")
    const box = (await slider.boundingBox())!
    await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2)
    await page.keyboard.press("PageDown")
    await expect.poll(() => rateColumn(page, 0)).toEqual(["5"])
  })

  test("Tab で点B を選ぶと、← で h を動かせる", async ({ page }) => {
    await page.locator(`g[aria-label="点B"]`).focus()
    await page.keyboard.press("ArrowLeft")
    await expect(page.locator(`label[for="bibun-h"]`)).toContainText("h = 0.9")
  })
})

test("時間・距離で表すとき、負の速さ・負の時間が出たら注記を添える", async ({ page }) => {
  await open(page)
  await page.getByLabel("時間・距離で表す").check()
  await page.getByRole("button", { name: "② 微分係数（接線の傾き）" }).click()
  const note = page.getByText(/速さが負のときは、距離が減る向き/)
  await expect(note).toHaveCount(0)
  await page.locator("#bibun-a").fill("-1")
  await expect(note).toBeVisible()
})

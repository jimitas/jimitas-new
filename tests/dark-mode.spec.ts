// ======================================================
// ダークモード永続化テスト
//
// 目的: 「ダークにした設定がリロード・直リンクで黙って忘れられる」
//       バグ（docs/known-issues.md）の再発を検出する。
//
// 重要な設計方針:
//   html の class や data 属性など「実装の形」ではなく、
//   **body の実際の背景色**を見る。
//   こうしておけば、将来 class 方式 / data属性方式 / 別の方式に
//   変えても、テストは「ユーザーに見えているもの」を守り続ける。
//   逆に、CSS の配線だけ外れて属性はついている、という
//   「静かに壊れる」パターンもこのテストなら検出できる。
// ======================================================

import { test, expect, type Page } from "@playwright/test"

// ------------------------------------------------------
// 色の「明るさ」で判定する理由
//
// ブラウザが返す背景色の形式は一定ではない。
//   ライト: bg-gray-50（Tailwind v4 の oklch 由来）→ "lab(98.25 ...)"
//   ダーク: globals.css の手書きフォールバック    → "rgb(17, 24, 39)"
// 形式が違うだけで色そのものは正しいので、文字列の完全一致で比べると
// 中身が正しくてもテストが落ちる。
// そこで「明るさ（0=黒, 100=白）」に正規化して、暗いか明るいかで判定する。
// 配色を多少調整してもテストが壊れず、かつ「暗くなっていない」ことは確実に捕まえられる。
// ------------------------------------------------------

/** css の色文字列を 0（黒）〜100（白）の明るさに正規化する */
function lightness(color: string): number {
  const nums = color.match(/-?[\d.]+/g)?.map(Number) ?? []

  // lab(L a b) / oklab(L a b) / oklch(L C H)：先頭が明度
  if (color.startsWith("lab(")) return nums[0]
  if (color.startsWith("oklab(") || color.startsWith("oklch(")) return nums[0] * 100

  // rgb(r g b) / rgba(...)：知覚的な明るさに換算
  if (color.startsWith("rgb")) {
    const [r, g, b] = nums
    return ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * 100
  }

  throw new Error(`想定外の色形式: ${color}`)
}

const isDark = (c: string) => lightness(c) < 30
const isLight = (c: string) => lightness(c) > 90

/** body に実際に適用されている背景色を取得する */
async function bodyBg(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor)
}

/** body が暗くなっているか（テスト失敗時に実際の色が出るよう文字列を返す） */
async function bodyTheme(page: Page): Promise<"dark" | "light" | string> {
  const c = await bodyBg(page)
  if (isDark(c)) return "dark"
  if (isLight(c)) return "light"
  return `判定不能(${c})`
}

/** ヘッダーのダークモード切り替えボタンを押す */
async function toggleTheme(page: Page) {
  await page.getByRole("button", { name: "ライトモード／ダークモードを切り替え" }).click()
}

test.describe("ダークモードの永続化", () => {
  test("トグルするとダークになる", async ({ page }) => {
    await page.goto("/")
    await expect.poll(() => bodyTheme(page)).toBe("light")

    await toggleTheme(page)
    await expect.poll(() => bodyTheme(page)).toBe("dark")
  })

  test("リロードしてもダークが維持される", async ({ page }) => {
    await page.goto("/")
    await toggleTheme(page)
    await expect.poll(() => bodyTheme(page)).toBe("dark")

    await page.reload()

    // ハイドレーション完了後も維持されていることを確かめたいので、
    // React が動き切るのを待ってから判定する
    await page.waitForLoadState("networkidle")
    expect(await bodyTheme(page)).toBe("dark")
  })

  test("URL直接アクセスでもダークが維持される", async ({ page }) => {
    await page.goto("/")
    await toggleTheme(page)
    await expect.poll(() => bodyTheme(page)).toBe("dark")

    // トップ以外のページへ直接アクセス（クライアント遷移ではない）
    await page.goto("/apps/tokei")
    await page.waitForLoadState("networkidle")
    expect(await bodyTheme(page)).toBe("dark")
  })

  test("アプリページ間をリンク遷移してもダークが維持される", async ({ page }) => {
    await page.goto("/")
    await toggleTheme(page)
    await expect.poll(() => bodyTheme(page)).toBe("dark")

    await page.goto("/apps/tokei")
    await page.waitForLoadState("networkidle")
    // ヘッダーのロゴからトップへ戻る（クライアントサイド遷移）
    await page.locator("header a").first().click()
    await page.waitForLoadState("networkidle")
    expect(await bodyTheme(page)).toBe("dark")
  })

  test("ダークを解除するとライトに戻り、リロードしてもライトのまま", async ({ page }) => {
    await page.goto("/")
    await toggleTheme(page)
    await expect.poll(() => bodyTheme(page)).toBe("dark")

    // もう一度押してライトへ
    await toggleTheme(page)
    await expect.poll(() => bodyTheme(page)).toBe("light")

    await page.reload()
    await page.waitForLoadState("networkidle")
    expect(await bodyTheme(page)).toBe("light")
  })

  test("ダーク時にヘッダー・フッターも一緒に暗くなる", async ({ page }) => {
    await page.goto("/")
    await toggleTheme(page)
    await expect.poll(() => bodyTheme(page)).toBe("dark")

    const headerBg = await page.evaluate(
      () => getComputedStyle(document.querySelector("header")!).backgroundColor
    )
    const footerBg = await page.evaluate(
      () => getComputedStyle(document.querySelector("footer")!).backgroundColor
    )

    // 白いままなら CSS の配線が外れている（body だけ暗い＝ちぐはぐな見た目）
    expect(isDark(headerBg), `header が暗くない: ${headerBg}`).toBe(true)
    expect(isDark(footerBg), `footer が暗くない: ${footerBg}`).toBe(true)
  })

  // ----------------------------------------------------
  // 上の body / header / footer のテストだけでは不十分な理由:
  //
  // この3要素は globals.css に手書きのフォールバックCSSがあるため、
  // Tailwind の dark: プレフィックス（@custom-variant の設定）が
  // 壊れていても暗いままになってしまう。
  // つまり「全アプリの dark: クラスが一斉に効かなくなる」という
  // 一番こわい壊れ方を、上のテストは検出できない。
  //
  // そこで dark: プレフィックスそのものが効いているかを直接確かめる。
  // 素材にはダークモード切替ボタンのアイコンを使う。
  //   ライト時: 🌙 が見える（dark:hidden）
  //   ダーク時: ☀️ が見える（hidden dark:inline）
  // ----------------------------------------------------
  test("dark: プレフィックス自体が効いている（アイコンが切り替わる）", async ({ page }) => {
    await page.goto("/")

    const moon = page.getByText("🌙")
    const sun = page.getByText("☀️")

    // ライト時
    await expect(moon).toBeVisible()
    await expect(sun).toBeHidden()

    // ダーク時
    await toggleTheme(page)
    await expect.poll(() => bodyTheme(page)).toBe("dark")
    await expect(sun).toBeVisible()
    await expect(moon).toBeHidden()

    // リロードしても維持される
    await page.reload()
    await page.waitForLoadState("networkidle")
    await expect(sun).toBeVisible()
    await expect(moon).toBeHidden()
  })
})

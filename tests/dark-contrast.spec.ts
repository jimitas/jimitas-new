// ======================================================
// ダークモードの文字コントラスト検査
//
// 目的:
//   ダークモードで見出しが背景に溶けて読めないアプリを機械的に検出する。
//
// なぜ必要か:
//   2026-09-12 以前は「ダークにしてもリロードでライトに戻る」バグがあり、
//   ダーク表示のまま使われる機会がほとんどなかった。そのため
//   dark: 指定が抜けていても誰も困らず、静かに溜まっていた。
//   バグを直してダークが正しく維持されるようになった今、
//   この抜けがそのままユーザーに見える。
//   同じことを新しいアプリで繰り返さないよう、テストで固定する。
//
// 判定方法:
//   実際に画面に出ている色をキャンバスで sRGB に変換し、
//   WCAG のコントラスト比を計算する。
//   ブラウザが返す色の形式（lab / oklab / rgb）に依存しない。
// ======================================================

import { test, expect, type Page } from "@playwright/test"
import { apps } from "../src/data/apps"

const targets = apps.filter(a => !a.disabled)

// 見出しは大きい文字なので WCAG AA の大文字基準は 3:1。
// ただし「読める」だけでなく「気持ちよく読める」ところを狙って 4.5:1 を基準にする。
// （ライトモードの text-gray-800 on gray-50 は約 12:1 あり、余裕で満たす水準）
const MIN_CONTRAST = 4.5

/**
 * ページ内で h1 の文字色と、その背後に実際にある背景色を調べ、
 * WCAG コントラスト比を返す。
 */
async function measureH1Contrast(page: Page) {
  return page.evaluate(() => {
    const h1 = document.querySelector("h1")
    if (!h1) return null

    // --- どんな CSS 色表記でも sRGB の数値にする ---
    // lab() や oklch() など新しい表記をそのまま解釈しようとすると
    // 表記ごとの変換式が必要になる。キャンバスに1px塗って読み戻せば、
    // ブラウザ自身が「実際に画面に出す色」に変換してくれる。
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext("2d")!

    const toRgb = (css: string): [number, number, number] => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = "#000"
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2]]
    }

    // --- 背景は透明なことが多いので、不透明な祖先までさかのぼる ---
    const isTransparent = (c: string) =>
      c === "transparent" || c === "rgba(0, 0, 0, 0)" || /,\s*0\)$/.test(c)

    let bgEl: Element | null = h1
    let bgColor = ""
    while (bgEl) {
      const c = getComputedStyle(bgEl).backgroundColor
      if (!isTransparent(c)) { bgColor = c; break }
      bgEl = bgEl.parentElement
    }
    if (!bgColor) bgColor = getComputedStyle(document.body).backgroundColor

    const fgColor = getComputedStyle(h1).color

    // --- WCAG 相対輝度 ---
    const luminance = ([r, g, b]: [number, number, number]) => {
      const f = (v: number) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }

    const l1 = luminance(toRgb(fgColor))
    const l2 = luminance(toRgb(bgColor))
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

    return {
      text: h1.textContent?.trim() ?? "",
      fgColor,
      bgColor,
      ratio: Math.round(ratio * 100) / 100,
    }
  })
}

test.describe("ダークモードの見出しコントラスト", () => {
  // 全テストで、ページを開く前からダークモードにしておく
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("jimitas_dark", "true")
    })
  })

  for (const app of targets) {
    test(`[${app.id}] ダークで見出しが読める`, async ({ page }) => {
      await page.goto(app.path)
      await page.waitForLoadState("networkidle")

      // ダークが効いていることを先に確認する
      // （効いていないのに「コントラストOK」と言われても意味がないため）
      const theme = await page.evaluate(() => document.documentElement.dataset.theme)
      expect(theme, "ダークモードが適用されていない").toBe("dark")

      const result = await measureH1Contrast(page)
      if (!result) test.skip(true, "h1 がないページ")

      expect(
        result!.ratio,
        `見出し「${result!.text}」のコントラストが不足\n` +
        `  文字色: ${result!.fgColor}\n` +
        `  背景色: ${result!.bgColor}\n` +
        `  比率: ${result!.ratio}:1（必要: ${MIN_CONTRAST}:1）`
      ).toBeGreaterThanOrEqual(MIN_CONTRAST)
    })
  }
})

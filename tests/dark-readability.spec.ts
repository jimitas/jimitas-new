// ======================================================
// ダークモードで「文字が背景に溶けていないか」の全アプリ検査
//
// 検出するもの:
//   白い背景に白い文字（およびその逆の、暗い背景に暗い文字）。
//
// 典型的な発生経路:
//   パネルに bg-white を置いたが dark: を付けていない。
//   → 背景は白のまま、文字色は指定がないので body のダーク用文字色
//     （#f3f4f6）を継承する → 白地に白文字。
//   紙・ノート・盤面など「ダークでも白いままが正しい」領域で起きやすい。
//   この場合の直し方は背景を暗くすることではなく、文字色を固定すること。
//
// dark-contrast.spec.ts との違い:
//   あちらは「見出しが読みやすいか」という品質の基準（h1 が 4.5:1 以上）。
//   こちらは「壊れていないか」という検出。対象は全テキスト要素。
//
// ⚠️ globals.css を編集したあとにこのテストを動かすときは、
//    dev サーバーを再起動すること（.next を消してから npm run dev）。
//    起動しっぱなしの dev サーバーは globals.css の変更を取り込まないことがあり、
//    古い CSS のまま判定されて **通るはずのないテストが通る**。
//    2026-09-12、実際に修正を外しても合格してしまい、
//    再起動して初めて13件の失敗が出た。結果を信用する前に再起動する。
// ======================================================

import { test, expect, type Page } from "@playwright/test"
import { apps } from "../src/data/apps"

const targets = apps.filter(a => !a.disabled)

type Finding = {
  text: string
  tag: string
  fg: string
  bg: string
  ratio: number
  cls: string
}

async function findUnreadable(page: Page): Promise<Finding[]> {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext("2d")!

    // どんな CSS 色表記（lab / oklch / rgb …）でも、
    // ブラウザ自身に「実際に画面へ出す色」へ変換させる。
    const toRgb = (css: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = "#000"
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2], d[3]]
    }

    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }

    const contrast = (a: number[], b: number[]) => {
      const l1 = lum(a), l2 = lum(b)
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    }

    // 背後に実際に見えている色を求める。
    // 半透明の背景をそのまま不透明として扱うと誤検出する
    // （13%の黄色が暗い背景の上にあれば、合成結果は暗いので白文字でも読める）。
    // 祖先を上へたどりながら重ね合わせる。
    //
    // グラデーションや背景画像があったら null を返して「判定不能」にする。
    // CSS のグラデーションは background-image であって backgroundColor には出ない。
    // そのため色だけを見ると、グラデーションの要素を透明とみなして
    // さらに奥の色を拾ってしまい、まったく違う判定になる。
    // （monty-hall のドアは茶色のグラデーションだが、色としては透明に見えるので
    //   奥の白いパネルを拾って「白地にクリーム文字」と誤検出していた）
    // 判定できないものを無理に判定するより、黙って見送るほうが安全。
    const effectiveBg = (el: Element): [number, number, number] | null => {
      const layers: number[][] = []
      let e: Element | null = el
      while (e) {
        const style = getComputedStyle(e)
        if (style.backgroundImage && style.backgroundImage !== "none") return null
        const [r, g, b, a] = toRgb(style.backgroundColor)
        if (a > 0) {
          layers.push([r, g, b, a / 255])
          if (a >= 255) break
        }
        e = e.parentElement
      }
      const last = layers[layers.length - 1]
      if (!last || last[3] < 1) {
        const [r, g, b] = toRgb(getComputedStyle(document.body).backgroundColor)
        layers.push([r, g, b, 1])
      }
      let [R, G, B] = layers[layers.length - 1]
      for (let i = layers.length - 2; i >= 0; i--) {
        const [r, g, b, a] = layers[i]
        R = r * a + R * (1 - a)
        G = g * a + G * (1 - a)
        B = b * a + B * (1 - a)
      }
      return [Math.round(R), Math.round(G), Math.round(B)]
    }

    const out: Finding[] = []
    const seen = new Set<string>()

    for (const el of Array.from(document.querySelectorAll("body *"))) {
      // 自分が直接持っている文字だけを見る（親要素で二重に数えない）
      const text = Array.from(el.childNodes)
        .filter(n => n.nodeType === 3)
        .map(n => (n.textContent || "").trim())
        .join("")
        .trim()
      if (!text) continue

      const cs = getComputedStyle(el)
      if (cs.visibility === "hidden" || cs.display === "none") continue
      if (Number(cs.opacity) < 0.1) continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 4 || rect.height < 4) continue

      const fg = toRgb(cs.color)
      if (fg[3] < 10) continue

      const bg = effectiveBg(el)
      if (!bg) continue          // 背景画像・グラデーションがあり判定できない
      const ratio = contrast(fg, bg)

      // 低コントラストを無条件に拾うと、配色設計どおりの白抜きボタン
      // （bg-danger-400 に白文字 = 2.69:1）が大量に混ざって信号が埋もれる。
      // あれは意図的なデザインなので対象外。
      // 本当に読めないのは「文字も背景も明るい」か「文字も背景も暗い」ケース。
      const fgLum = lum(fg), bgLum = lum(bg)
      const bothLight = fgLum > 0.5 && bgLum > 0.5
      const bothDark = fgLum < 0.08 && bgLum < 0.08
      if (!(bothLight || bothDark)) continue
      if (ratio >= 3) continue

      const bgCss = `rgb(${bg.join(", ")})`
      const key = `${text.slice(0, 24)}|${cs.color}|${bgCss}`
      if (seen.has(key)) continue
      seen.add(key)

      out.push({
        text: text.slice(0, 30),
        tag: el.tagName.toLowerCase(),
        fg: cs.color,
        bg: bgCss,
        ratio: Math.round(ratio * 100) / 100,
        cls: (typeof el.className === "string" ? el.className : "").slice(0, 100),
      })
    }
    return out.sort((a, b) => a.ratio - b.ratio)
  })
}

test.describe("ダークモードで文字が背景に溶けていないか", () => {
  test.beforeEach(async ({ page }) => {
    // ページを開く前からダークモードにしておく
    await page.addInitScript(() => localStorage.setItem("jimitas_dark", "true"))
  })

  for (const app of targets) {
    test(`[${app.id}] ダークで文字が読める`, async ({ page }) => {
      await page.goto(app.path)
      await page.waitForLoadState("networkidle")

      // ダークが効いていない状態で「問題なし」と言われても意味がないので先に確認
      const theme = await page.evaluate(() => document.documentElement.dataset.theme)
      expect(theme, "ダークモードが適用されていない").toBe("dark")

      const found = await findUnreadable(page)

      const report = found
        .map(f => `  ${f.ratio}:1  <${f.tag}> "${f.text}"\n` +
                  `        文字 ${f.fg} / 背景 ${f.bg}\n` +
                  (f.cls ? `        class: ${f.cls}\n` : ""))
        .join("")

      expect(
        found.length,
        `文字が背景に溶けている箇所が ${found.length} 件:\n${report}\n` +
        `直し方: 紙・ノート・盤面など「白いままが正しい」領域では、背景を暗くせず\n` +
        `文字色を固定する（例: text-gray-800 を明示して dark: を付けない）。`
      ).toBe(0)
    })
  }
})

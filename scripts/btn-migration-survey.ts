// ======================================================
// ボタン集約 段階3 の「本当の残り」を数える
//
// 角丸の実測（radius-survey）は「画面に出ている 8px のボタン」を数えるが、
// そこには **すでに Btn / 名前付き部品から出ているボタン**も含まれる。
// 移行の残りを知るには、そこを引かないといけない。
//
// Btn が出したボタンは BTN_SHAPE_CLASS の並びで見分けられる。
//
// 使い方:
//   1. 別ターミナルで npm run dev
//   2. npx tsx scripts/btn-migration-survey.ts
// ======================================================

import { chromium } from "@playwright/test"
import { apps } from "../src/data/apps"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"

/** Btn が出したボタンの目印（BTN_SHAPE_CLASS の一部） */
const BTN_MARK = "active:translate-y-0.5"
const BTN_MARK2 = "shrink-0"

type Row = { app: string; text: string; cls: string }

async function main() {
  const targets = apps.filter((a) => !a.disabled)
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } })
  const page = await ctx.newPage()

  const handwritten: Row[] = []
  const fromBtn: Row[] = []
  const toggles: Row[] = []
  let total8px = 0

  for (const app of targets) {
    await page.goto(`${BASE}${app.path}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(150)

    const rows = await page.evaluate(() => {
      const out: { text: string; cls: string; radius: string; bg: string }[] = []
      document.querySelectorAll("button").forEach((el) => {
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return
        // 透明な包みボタン（画像・セル）は角丸の議論の対象外
        if (cs.backgroundColor === "rgba(0, 0, 0, 0)") return
        out.push({
          text: (el.textContent ?? "").trim().slice(0, 12),
          cls: el.className,
          radius: cs.borderRadius,
          bg: cs.backgroundColor,
        })
      })
      return out
    })

    for (const r of rows) {
      if (r.radius !== "8px") continue
      total8px++
      const row = { app: app.id, text: r.text, cls: r.cls }
      if (r.cls.includes(BTN_MARK) && r.cls.includes(BTN_MARK2)) fromBtn.push(row)
      // 条件で色が変わるトグルは BtnMode の仕事（Btn への移行対象ではない）
      else if (r.cls.includes("border-brand-300") || r.cls.includes("bg-brand-500")) toggles.push(row)
      else handwritten.push(row)
    }
  }

  await browser.close()

  console.log(`\n=== 8px のボタン ${total8px}個の内訳（${targets.length}アプリ・タブレット幅・初期表示）===`)
  console.log(`  すでに Btn / 名前付き部品から出ている : ${fromBtn.length}個 ← 移行ずみ`)
  console.log(`  BtnMode 相当のトグル                 : ${toggles.length}個 ← Btn の対象外`)
  console.log(`  手書きのまま                         : ${handwritten.length}個 ← ★ 残りの実対象`)

  const byApp = new Map<string, number>()
  for (const r of handwritten) byApp.set(r.app, (byApp.get(r.app) ?? 0) + 1)
  console.log(`\n=== 手書きが残っているアプリ（多い順）===`)
  for (const [app, n] of [...byApp].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${app.padEnd(22)} ${n}個`)
  }
}

main()

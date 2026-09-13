// ======================================================
// 全アプリのボタンの角丸を実測して集計する
//
// 用途: docs/07_角丸の方針.md の根拠データを取り直す。
//       段階3（手書きボタンの共通部品への移行）の進捗確認にも使う。
//
// 使い方: 別ターミナルで npm run dev → npx tsx scripts/radius-survey.ts
//
// なぜソースの grep ではなく実測か:
//   クラス名を数えるとパネル・カード・入力欄の角丸が混ざる。
//   実際に画面へ出ているボタンだけを見ないと判断を誤る
//   （実際、当初「三つ巴」と見えていたものは用途ごとの塊だった）。
// ======================================================
import { chromium } from "@playwright/test"
import { apps } from "../src/data/apps"
import fs from "node:fs"

import os from "node:os"
import path from "node:path"
const OUT = process.env.OUT_FILE ?? path.join(os.tmpdir(), "jimitas-radius.json")

type Btn = { app: string; radius: string; text: string; w: number; h: number; cls: string }

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } })
  const page = await ctx.newPage()
  const all: Btn[] = []

  for (const app of apps.filter(a => !a.disabled)) {
    await page.goto(`http://localhost:3000${app.path}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(250)
    const found = await page.evaluate(() => {
      const out: Record<string, unknown>[] = []
      // ヘッダー・フッターは全ページ共通なので除く（アプリ側の判断ではない）
      const main = document.querySelector("main") ?? document.body
      for (const el of Array.from(main.querySelectorAll("button"))) {
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        if (r.width < 4 || r.height < 4) continue
        if (cs.visibility === "hidden" || cs.display === "none") continue
        const bg = cs.backgroundColor
        const bare = bg === "transparent" || bg === "rgba(0, 0, 0, 0)"
        out.push({
          radius: cs.borderRadius,
          text: (el.textContent ?? "").trim().slice(0, 14),
          w: Math.round(r.width),
          h: Math.round(r.height),
          bare,
          cls: (typeof el.className === "string" ? el.className : "").slice(0, 120),
        })
      }
      return out
    })
    found.forEach(f => all.push({ app: app.id, ...(f as object) } as Btn))
  }

  await browser.close()
  fs.writeFileSync(OUT, JSON.stringify(all, null, 1))

  // ── 集計 ──────────────────────────────────────
  const norm = (r: string) => {
    const px = parseFloat(r)
    if (r.includes("%") || px > 1000) return "full（完全な丸）"
    if (px === 0) return "0px（角丸なし）"
    return `${px}px`
  }

  // 背景色のないボタン（画像やセルを包むだけの透明ボタン）は
  // 「角丸をどうするか」という論点の対象外。分けて数える。
  const styled = all.filter(b => !(b as Btn & { bare: boolean }).bare)
  const bare = all.length - styled.length
  console.log(`\n=== 内訳 ===`)
  console.log(`  背景色のある「ボタンらしいボタン」: ${styled.length}個`)
  console.log(`  透明な包みボタン（画像・セル等）  : ${bare}個 ← 角丸の議論の対象外`)

  const byRadius = new Map<string, number>()
  const byApp = new Map<string, Set<string>>()
  for (const b of styled) {
    const k = norm(b.radius)
    byRadius.set(k, (byRadius.get(k) ?? 0) + 1)
    if (!byApp.has(b.app)) byApp.set(b.app, new Set())
    byApp.get(b.app)!.add(k)
  }

  console.log(`ボタン総数: ${all.length}（${apps.filter(a => !a.disabled).length}アプリ・タブレット幅・初期表示）\n`)
  console.log("=== 角丸の分布 ===")
  ;[...byRadius.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
    console.log(`  ${k.padEnd(16)} ${String(v).padStart(4)}個  ${(v / styled.length * 100).toFixed(1)}%`))

  const mixed = [...byApp.entries()].filter(([, s]) => s.size >= 2)
  console.log(`\n=== 1画面に複数の角丸が同居しているアプリ: ${mixed.length} / ${byApp.size} ===`)
  mixed.sort((a, b) => b[1].size - a[1].size).slice(0, 20).forEach(([app, s]) =>
    console.log(`  ${app.padEnd(20)} ${s.size}種類: ${[...s].join(" / ")}`))
}
main()

// ======================================================
// 「見た目を変えない」リファクタリングの照合スクリプト
//
// className の文字列を比べると、Tailwind クラスの並び順が変わっただけで
// 差分が出て、見た目が変わったのか書き方が変わっただけなのか区別できない。
// そこで**実際に画面に出ている値**（位置・大きさ・計算済みスタイル）と
// 全画面スクショを、変更の前後で撮って比べる。
//
// 使い方:
//   1. 別ターミナルで npm run dev
//   2. 変更前の状態で   npx tsx scripts/layout-compare.ts before
//   3. コードを変更する
//   4.                 npx tsx scripts/layout-compare.ts after
//   5.                 npx tsx scripts/layout-compare.ts diff
//
// 環境変数:
//   APPS    : 対象アプリをカンマ区切りで指定（既定は下の DEFAULT_APPS）
//   OUT_DIR : 出力先（既定は OS の一時ディレクトリ）
//   BASE_URL: 既定 http://localhost:3000
//
// ⚠️ 先に「変更なしで before と after を2回撮って差分ゼロ」を確認すること。
//    ベースラインが揺れるなら、変更後の「差分ゼロ」は何も証明しない。
//    実例: nanbanme は useState(() => shuffled(...)) が SSR でも走るため、
//    読み込むたびに絵の並びが変わる。Math.random を固定しても直らない
//    （サーバー側の乱数まではブラウザから固定できない）。
// ======================================================

import { chromium } from "@playwright/test"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const LABEL = process.argv[2] ?? "before"
const ROOT = process.env.OUT_DIR ?? path.join(os.tmpdir(), "jimitas-layout-compare")
const OUT = path.join(ROOT, LABEL)

// 既定は Btn.tsx（共通ボタン）の定義が効くアプリすべて。
//   前半10本 … centerWrapper 付きだった部品を使うアプリ
//   後半8本  … BtnConfirm / BtnStart / BtnStop / BtnShuffle 経由で
//              BTN_SHAPE_CLASS を共有しているアプリ
const DEFAULT_APPS = [
  "amari", "hikizan-1", "ikutu", "kazoeyou", "kazu",
  "nanbanme", "number-line", "suuzu-block", "tashizan-1", "tokei",
  "eawase", "fushi-dukuri", "hiku-renshu", "kuku-hyo",
  "masu-nuri", "nandemo", "sakusen-board", "tasu-renshu",
]
const APPS = process.env.APPS ? process.env.APPS.split(",") : DEFAULT_APPS

const VIEWPORTS = [
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 375, height: 812 },
]

// 位置が動いていないかを見たい要素。
// div は入れない。ラッパー div の撤去のような構造変更で個数が変わり、
// 「構造が変わった」と「見た目が変わった」が混ざってしまうため。
const SELECTOR = "button, select, input, h1, h2, p, span, canvas, svg, img, table, td, li"

async function measure() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: "reduce",
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
    })
    // 乱数を固定する。
    // nanbanme はマウント時に shuffled([0..9]) でボタンの描画順を変えるため、
    // 固定しないと「同じコードで2回撮っただけ」でも差分が出て、
    // 変更後の「差分ゼロ」が何も証明しなくなる。
    await ctx.addInitScript(() => {
      let seed = 12345
      Math.random = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648
        return seed / 2147483648
      }
    })

    const page = await ctx.newPage()

    for (const app of APPS) {
      await page.goto(`${BASE}/${app}`, { waitUntil: "networkidle" })
      // フォント・レイアウト確定待ち
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(400)

      const data = await page.evaluate((sel) => {
        // ⚠️ ここで名前付き関数（const f = () => ...）を作らないこと。
        //    tsx/esbuild の keepNames が __name を注入して
        //    ブラウザ側で ReferenceError になる。
        const items: Record<string, unknown>[] = []
        document.querySelectorAll(sel).forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.width === 0 && r.height === 0) return
          const cs = getComputedStyle(el)
          items.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent ?? "").trim().slice(0, 24),
            x: Math.round(r.x * 100) / 100,
            y: Math.round((r.y + window.scrollY) * 100) / 100,
            w: Math.round(r.width * 100) / 100,
            h: Math.round(r.height * 100) / 100,
            color: cs.color,
            bg: cs.backgroundColor,
            font: `${cs.fontSize}/${cs.fontWeight}`,
            radius: cs.borderRadius,
            border: `${cs.borderWidth} ${cs.borderColor}`,
            shadow: cs.boxShadow,
            margin: cs.margin,
            padding: cs.padding,
            display: cs.display,
            gap: cs.gap,
          })
        })
        return items
      }, SELECTOR)

      fs.writeFileSync(
        path.join(OUT, `${app}_${vp.name}.json`),
        JSON.stringify(data, null, 1),
      )
      await page.screenshot({
        path: path.join(OUT, `${app}_${vp.name}.png`),
        fullPage: true,
      })
      console.log(`  ${app} (${vp.name}): ${data.length} 要素`)
    }
    await ctx.close()
  }
  await browser.close()
  console.log(`\n✅ ${LABEL} を ${OUT} に保存`)
}

function diff() {
  const A = path.join(ROOT, "before")
  const B = path.join(ROOT, "after")
  let total = 0
  for (const f of fs.readdirSync(A).filter((f) => f.endsWith(".json"))) {
    const a = JSON.parse(fs.readFileSync(path.join(A, f), "utf8")) as Record<string, unknown>[]
    const b = JSON.parse(fs.readFileSync(path.join(B, f), "utf8")) as Record<string, unknown>[]
    // 多重集合として比べる。
    // 描画順が乱数で変わるアプリ（nanbanme）があるため、配列の並び順に依存しない。
    // 「A にしかない要素」「B にしかない要素」を出す。位置・大きさ・色が
    // 1つでも動けば、その要素が両方に現れる。
    const count = new Map<string, number>()
    a.forEach((it) => count.set(JSON.stringify(it), (count.get(JSON.stringify(it)) ?? 0) + 1))
    b.forEach((it) => count.set(JSON.stringify(it), (count.get(JSON.stringify(it)) ?? 0) - 1))
    const diffs: string[] = []
    if (a.length !== b.length) diffs.push(`要素数 ${a.length} → ${b.length}`)
    for (const [key, n] of count) {
      if (n === 0) continue
      const it = JSON.parse(key) as Record<string, unknown>
      diffs.push(
        `${n > 0 ? "変更前のみ" : "変更後のみ"} ×${Math.abs(n)}  ` +
        `${it.tag}"${it.text}" (${it.x},${it.y}) ${it.w}×${it.h} ` +
        `bg=${it.bg} radius=${it.radius} margin=${it.margin}`,
      )
    }
    if (diffs.length) {
      total += diffs.length
      console.log(`\n❌ ${f} — ${diffs.length}件`)
      diffs.slice(0, 30).forEach((d) => console.log(`   ${d}`))
      if (diffs.length > 30) console.log(`   ...他 ${diffs.length - 30}件`)
    } else {
      console.log(`✅ ${f} — 差分なし`)
    }
  }
  console.log(`\n合計差分: ${total}件`)

  // スクショのピクセル一致も見る。
  // 計算済みスタイルは「測った項目」しか見ていないので、
  // 測り漏らした変化（描画だけ変わる類）はこちらで拾う。
  const shots = fs.readdirSync(A).filter((f) => f.endsWith(".png"))
  const mismatched = shots.filter(
    (f) => !fs.readFileSync(path.join(A, f)).equals(fs.readFileSync(path.join(B, f))),
  )
  console.log(`スクショのピクセル完全一致: ${shots.length - mismatched.length} / ${shots.length}`)
  if (mismatched.length) console.log(`  不一致: ${mismatched.join(", ")}`)
}

if (LABEL === "diff") diff()
else measure()

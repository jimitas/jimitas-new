// ======================================================
// 同じ行にならんだボタンの高さがそろっているか
//
// なぜこれが要るか:
//   layout-compare は「変更前 → 変更後」を比べる道具なので、
//   **変更後にとなりとずれている**ことは原理的に検出できない。
//   ダークモード検査は文字と地のコントラストしか見ない。
//   スクショの目視は数px のずれには気づけない。
//
//   2026-09-20 のボタン集約で、この穴から2件すり抜けた。
//     kanji-test  保存(Btn 31.56px) と 読込(label 28px) が 3.56px ちがう
//     BtnMode     選択中だけ枠線が無く、押すと 1.78px 縮む（全アプリ）
//
// 検出の考え方:
//   「大きくちがう」のは意図した設計（小さいアイコンボタンと大きな実行ボタン等）。
//   **ほぼ同じ大きさなのに数pxだけちがう**のが事故のかたち。
//   なので差が 1px以上 TOLERANCE以下 のときだけ落とす。
// ======================================================

import { test, expect } from "@playwright/test"
import { apps } from "../src/data/apps"

/** この幅までの差を「事故」とみなす。これより大きい差は意図した設計とみなす */
const TOLERANCE = 6

/** 同じ行とみなす上端のずれ（px） */
const ROW_TOLERANCE = 2

const VIEWPORTS = [
  { name: "タブレット", width: 1024, height: 768 },
  { name: "スマホ", width: 375, height: 812 },
]

const targets = apps.filter((a) => !a.disabled)

type Item = { text: string; top: number; height: number; radius: string }

for (const app of targets) {
  for (const vp of VIEWPORTS) {
    test(`[${app.id}] ${vp.name}: 同じ行のボタンの高さがそろっている`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(app.path, { waitUntil: "domcontentloaded", timeout: 20_000 })
      await page.evaluate(() => document.fonts.ready)
      // ハイドレーションとレイアウト確定を待つ
      await page.waitForTimeout(600)

      const items: Item[] = await page.evaluate(() => {
        // ⚠ ここで名前付き関数を作らないこと（tsx の keepNames が __name を注入する）
        const out: { text: string; top: number; height: number; radius: string }[] = []
        document.querySelectorAll("button, label").forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) return
          const cs = getComputedStyle(el)
          // 背景のない「包みボタン」（画像・セル）は対象外
          if (cs.backgroundColor === "rgba(0, 0, 0, 0)") return
          out.push({
            text: (el.textContent ?? "").trim().slice(0, 12) || "(無題)",
            top: Math.round(r.top * 100) / 100,
            // 高さは offsetHeight（レイアウト上の箱）で測る。
            // getBoundingClientRect は transform 後の見た目の大きさなので、
            // 「選んだものを scale-110 で少し大きく見せる」という意図した演出まで
            // 差分として拾ってしまう（masu-nuri の色スウォッチ）。
            height: (el as HTMLElement).offsetHeight,
            radius: cs.borderRadius,
          })
        })
        return out
      })

      // 上端が近いものを同じ行としてまとめる
      const rows: Item[][] = []
      for (const item of [...items].sort((a, b) => a.top - b.top)) {
        const last = rows[rows.length - 1]
        if (last && Math.abs(last[0].top - item.top) <= ROW_TOLERANCE) last.push(item)
        else rows.push([item])
      }

      const problems: string[] = []
      for (const row of rows) {
        if (row.length < 2) continue
        // 角丸がちがうものは種類がちがうボタンなので比べない
        //（カード 12px / マス目 0px / 小さい操作 4px が同じ行に来ることがある）
        const byRadius = new Map<string, Item[]>()
        for (const item of row) {
          const list = byRadius.get(item.radius) ?? []
          list.push(item)
          byRadius.set(item.radius, list)
        }

        for (const [radius, list] of byRadius) {
          if (list.length < 2) continue
          const heights = list.map((x) => x.height)
          const gap = Math.max(...heights) - Math.min(...heights)
          if (gap === 0 || gap > TOLERANCE) continue
          problems.push(
            `角丸${radius} の行で ${gap.toFixed(2)}px ちがう: ` +
              list.map((x) => `${x.text}=${x.height}`).join(" / "),
          )
        }
      }

      expect(problems).toEqual([])
    })
  }
}

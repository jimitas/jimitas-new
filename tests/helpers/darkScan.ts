// ======================================================
// ダークモードで「見えなくなっている箇所」を探す共通スキャナ
//
// dark-readability.spec.ts と dark-after-question.spec.ts の両方が使う。
// 色の判定（sRGB 正規化・WCAG 比・半透明の重ね合わせ）は間違えやすく、
// コピーを増やすと「直したつもりが片方だけ直っていない」が起きるため1箇所にまとめる。
//
// ⚠️ この関数は page.evaluate に渡してブラウザ側で実行される。
//    **外側のスコープのものを一切参照しないこと**（型注釈だけは消えるのでOK）。
//    import したものを使うと、ブラウザ側で ReferenceError になる。
// ======================================================

export type Finding = {
  text: string
  tag: string
  fg: string
  bg: string
  ratio: number
  cls: string
  kind: "text" | "border"
}

export type ScanOptions = {
  /** 罫線・枠線の色も検査する（既定は文字だけ） */
  includeBorders: boolean
}

/**
 * ページ内を走査して「背景に溶けている」箇所を返す。
 *
 * 拾う条件は「文字（または線）と背景がどちらも明るい」か「どちらも暗い」場合のみ。
 * 低コントラストを無条件に拾うと、配色設計どおりの白抜きボタン
 * （bg-danger-400 に白文字 = 2.69:1）が大量に混ざって信号が埋もれるため。
 */
export function scanUnreadable(opts: ScanOptions): Finding[] {
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

  // 「溶けている」の判定（文字用）。
  // どちらも明るい / どちらも暗い ときだけ拾う（意図的な白抜きを除くため）。
  const isInvisible = (fg: number[], bg: number[]) => {
    const fgLum = lum(fg), bgLum = lum(bg)
    const bothLight = fgLum > 0.5 && bgLum > 0.5
    const bothDark = fgLum < 0.08 && bgLum < 0.08
    if (!(bothLight || bothDark)) return false
    return contrast(fg, bg) < 3
  }

  // 「溶けている」の判定（罫線・枠線用）。
  //
  // 線には**文字と違う事情**がある。区切り線は意図的に控えめに引かれるため、
  // コントラストの低さだけで拾うと header / footer / nav の区切り線が
  // 全ページで引っかかり、本物が埋もれる（実際に61アプリ×3件のノイズになった）。
  //
  // 効くのは「明るさの向き」。
  //   暗い背景の上では、線は**背景より明るい**ことで見える。
  //   背景より暗い線は、原理的に見えない。
  //   明るい背景の上ではその逆。
  //
  // わり算の罫線バグは black(輝度0) が rgb(17,24,39)(輝度0.0087) の上にあり、
  // **背景より暗い**。一方、意図的な区切り線 gray-700(0.051) は
  // gray-800(0.025) の上にあり**背景より明るい**。ここで綺麗に分かれる。
  const isLineInvisible = (line: number[], bg: number[]) => {
    const lineLum = lum(line), bgLum = lum(bg)
    if (contrast(line, bg) >= 3) return false
    const onDark = bgLum < 0.08
    const onLight = bgLum > 0.5
    if (onDark) return lineLum <= bgLum   // 暗い地に、地より暗い線
    if (onLight) return lineLum >= bgLum  // 明るい地に、地より明るい線
    return false
  }

  const out: Finding[] = []
  const seen = new Set<string>()

  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const cs = getComputedStyle(el)
    if (cs.visibility === "hidden" || cs.display === "none") continue
    if (Number(cs.opacity) < 0.1) continue
    const rect = el.getBoundingClientRect()
    if (rect.width < 4 || rect.height < 4) continue

    const className = (typeof el.className === "string" ? el.className : "").slice(0, 100)

    // ── 文字 ────────────────────────────────────────
    // 自分が直接持っている文字だけを見る（親要素で二重に数えない）
    const text = Array.from(el.childNodes)
      .filter(n => n.nodeType === 3)
      .map(n => (n.textContent || "").trim())
      .join("")
      .trim()

    // 絵文字だけの要素は色の検査をしない。
    // カラー絵文字はフォント自身が色を持っていて、CSS の color を無視して描画される。
    // 「白い文字色 × 明るい背景」でも実際には見えるため、拾うと誤検出になる。
    // （katakana の 🍌 が、もんだいを出したあと 1.02:1 として出た）
    //
    // ⚠️ ここで \p{Emoji_Component} を使わないこと。
    //    **半角数字 0-9 が Emoji_Component に含まれる**（1️⃣ のようなキーキャップの
    //    部品として定義されているため）。使うと「数字だけの要素」が
    //    絵文字扱いになって検査から外れる。
    //    実際に wari-hissan の数字パレットの検出が静かに1件消えた。
    const stripped = text
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/[\u{1F3FB}-\u{1F3FF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}]/gu, "")
      .replace(/\s/g, "")
    const hasRealText = stripped.length > 0

    if (text && hasRealText) {
      const fg = toRgb(cs.color)
      if (fg[3] >= 10) {
        const bg = effectiveBg(el)
        if (bg && isInvisible(fg, bg)) {
          const bgCss = `rgb(${bg.join(", ")})`
          const key = `text|${text.slice(0, 24)}|${cs.color}|${bgCss}`
          if (!seen.has(key)) {
            seen.add(key)
            out.push({
              text: text.slice(0, 30),
              tag: el.tagName.toLowerCase(),
              fg: cs.color,
              bg: bgCss,
              ratio: Math.round(contrast(fg, bg) * 100) / 100,
              cls: className,
              kind: "text",
            })
          }
        }
      }
    }

    // ── 罫線・枠線 ──────────────────────────────────
    // 文字だけを見ていると、問題を出したあとに引かれる罫線のような
    // 「文字ではないが見えないと困る線」を取りこぼす。
    // 2026-09-12 のわり算の筆算の罫線がこれで、実機確認でしか見つからなかった。
    if (opts.includeBorders) {
      const sides = [
        ["top", cs.borderTopWidth, cs.borderTopStyle, cs.borderTopColor],
        ["right", cs.borderRightWidth, cs.borderRightStyle, cs.borderRightColor],
        ["bottom", cs.borderBottomWidth, cs.borderBottomStyle, cs.borderBottomColor],
        ["left", cs.borderLeftWidth, cs.borderLeftStyle, cs.borderLeftColor],
      ] as const

      for (const [side, width, style, color] of sides) {
        if (style === "none" || style === "hidden") continue
        if (parseFloat(width) < 1) continue

        const line = toRgb(color)
        if (line[3] < 10) continue

        // 線の背後の色。線は要素の境界に描かれ、既定では自分の背景が下に敷かれる。
        const bg = effectiveBg(el)
        if (!bg || !isLineInvisible(line, bg)) continue

        const bgCss = `rgb(${bg.join(", ")})`
        const key = `border|${el.tagName}|${color}|${bgCss}`
        if (seen.has(key)) continue
        seen.add(key)

        out.push({
          text: `${side} の罫線`,
          tag: el.tagName.toLowerCase(),
          fg: color,
          bg: bgCss,
          ratio: Math.round(contrast(line, bg) * 100) / 100,
          cls: className,
          kind: "border",
        })
      }
    }
  }

  return out.sort((a, b) => a.ratio - b.ratio)
}

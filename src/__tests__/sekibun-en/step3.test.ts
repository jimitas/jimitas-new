// 円の面積と円周のひみつ — ステップ③の見せ方（_lib/playback.ts・_lib/scene.ts・_lib/text.ts）のテスト
// 受け入れ基準（要件 §8）の 3・4 の「約3秒」「途中で描画領域からはみ出さない（ラベルも）」をここで固定する。
import * as P from "@/app/(apps)/sekibun-en/_lib/playback"
import * as S from "@/app/(apps)/sekibun-en/_lib/scene"
import * as T from "@/app/(apps)/sekibun-en/_lib/text"
import { BIG_FONT } from "@/lib/graph/keys"

describe("durationFor（▶ ほどく の長さ。F3-2：約3秒）", () => {
  test("全部ほどくと 3 秒、巻き戻しも同じ", () => {
    expect(P.durationFor(0, 1, false)).toBe(3000)
    expect(P.durationFor(1, 0, false)).toBe(3000)
  })
  test("途中からなら残りの割合だけ", () => expect(P.durationFor(0.25, 1, false)).toBe(2250))
  test("動きを減らす設定では短く（0 にはしない。ほどける途中を見せるため）", () => {
    expect(P.durationFor(0, 1, true)).toBe(P.REDUCED_MS)
    expect(P.REDUCED_MS).toBeGreaterThan(0)
    expect(P.REDUCED_MS).toBeLessThan(P.UNROLL_MS)
  })
  test("もう目標にいれば 0（動かさない）", () => expect(P.durationFor(1, 1, false)).toBe(0))
})

describe("tweenT（イーズインアウト）", () => {
  test("はじめと終わりは from・to ちょうど", () => {
    expect(P.tweenT(0.2, 1, 0)).toBe(0.2)
    expect(P.tweenT(0.2, 1, 1)).toBe(1)
    expect(P.tweenT(1, 0, 1)).toBe(0)
  })
  test("ゆっくり動き出す（はじめの 1/10 の時間では 1/10 より進まない）", () =>
    expect(P.tweenT(0, 1, 0.1)).toBeLessThan(0.1))
  test("途中も from と to のあいだで、時間とともに進む", () => {
    let prev = 0
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const t = P.tweenT(0, 1, u)
      expect(t).toBeGreaterThanOrEqual(prev)
      expect(t).toBeLessThanOrEqual(1)
      prev = t
    }
  })
})

describe("playLabel（再生ボタンの文字）", () => {
  test("動いていれば、向きによらず ⏸ 止める（一時停止できる）", () => {
    expect(P.playLabel(0.5, 1)).toBe(T.PLAY_LABEL.pause)
    expect(P.playLabel(0.5, -1)).toBe(T.PLAY_LABEL.pause)
  })
  test("はじめ・途中・ほどき終わり", () => {
    expect(P.playLabel(0, null)).toBe("▶ ほどく")
    expect(P.playLabel(0.4, null)).toBe("▶ 続ける")
    expect(P.playLabel(1, null)).toBe("▶ もう一度ほどく")
  })
})

describe("見せ方（ガイド・切れ目・完成時）", () => {
  test("ガイドの三角形は t = 0 で見えず、ほどき始めると出てきて、t = 2/3 で濃さ1", () => {
    expect(S.guideOpacity(0)).toBe(0)
    expect(S.guideOpacity(0.1)).toBeGreaterThan(0)
    expect(S.guideOpacity(2 / 3)).toBeCloseTo(1, 12)
    expect(S.guideOpacity(1)).toBe(1)
  })
  test("切れ目は t = 0 でくっきり、ほどき始めに消える", () => {
    expect(S.cutOpacity(0)).toBe(1)
    expect(S.cutOpacity(S.CUT_FADE_END / 2)).toBeCloseTo(0.5, 12)
    expect(S.cutOpacity(S.CUT_FADE_END)).toBe(0)
    expect(S.cutOpacity(1)).toBe(0)
  })
  test("段階：はじめ → 途中 → 完成（ほどき終わりは完成）", () => {
    expect(S.unrollPhase(0)).toBe("start")
    expect(S.unrollPhase(0.5)).toBe("moving")
    expect(S.unrollPhase(1)).toBe("done")
    expect(S.unrollPhase(S.DONE_T)).toBe("moving")
  })
})

// ラベルの位置は scene.ts の labelLayout で決め、RingDisk.tsx も同じ関数で描く（式を2か所に書かない。2026-10-26 レビュー指摘）。
// 輪の形は unroll.test.ts で検査している。ここは完成時の文字（底辺・高さ）の分。
// フェーズ2では viewBox の高さを 390 に縮めても輪の検査が通ってしまったので、底辺のラベルで守る。
describe("完成時のラベルが viewBox に収まる（受け入れ基準3）", () => {
  const MARGIN = 2
  test.each([1, BIG_FONT])("文字の倍率 %p", (scale) => {
    const { font, base, height } = S.labelLayout(scale)
    // 底辺のラベル：まん中寄せ。下は文字の下はし（ベースラインから 0.25em ほど）
    const bw = S.labelWidth(T.BASE_LABEL, font)
    expect(base.x - bw / 2).toBeGreaterThanOrEqual(MARGIN)
    expect(base.x + bw / 2).toBeLessThanOrEqual(S.VIEW_W - MARGIN)
    expect(base.y + font * 0.25).toBeLessThanOrEqual(S.VIEW_H - MARGIN)
    // 底辺の線とは重ならない（文字の上はしが底辺より下）
    expect(base.y - font).toBeGreaterThan(S.BASE_Y)
    // 高さのラベル：切れ目の左に右寄せ。三角形の高さの範囲に入る
    const hw = S.labelWidth(T.HEIGHT_LABEL, font)
    expect(height.x - hw).toBeGreaterThanOrEqual(MARGIN)
    expect(height.x).toBeLessThan(S.X0)
    expect(height.y).toBeGreaterThan(S.BASE_Y - S.R_PX)
    expect(height.y).toBeLessThan(S.BASE_Y)
  })
  test("底辺のラベルは三角形の底辺のまん中", () => {
    const [a, b] = S.triangleGuide(S.SCENE)
    expect(S.labelLayout(1).base.x).toBeCloseTo((a[0] + b[0]) / 2, 9)
  })
  test("labelWidth は全角を1文字ぶん、半角を 0.6 文字ぶんで見積もる", () => {
    expect(S.labelWidth("高さ", 10)).toBe(20)
    // π（U+03C0）は 0xff を超えるので全角あつかい（多めに見積もる側なのでよい）
    expect(S.labelWidth("2πr", 10)).toBeCloseTo(6 + 10 + 6, 9)
  })
})

describe("文言（要件 §1.2・F3-6）", () => {
  test("完成時のラベル", () => {
    expect(T.BASE_LABEL).toBe("底辺 ＝ いちばん外側の輪の長さ ＝ 円周 2πr")
    expect(T.HEIGHT_LABEL).toBe("高さ ＝ r")
  })
  test("結論は ½ × 2πr × r ＝ πr² で、円の面積にもどったことを言う", () => {
    expect(T.STEP3_CONCLUSION).toContain("½ × 2πr × r ＝ πr²")
    expect(T.STEP3_CONCLUSION).toContain("円の面積にもどった")
  })
  test("結論の前の問いかけにボタンの名前を入れない（ボタンは「▶ 続ける」などに変わるため）", () =>
    expect(T.STEP3_PREDICT).not.toContain("▶"))
  test("ロープの実演と同じ動詞（ほどく・巻き戻す・積み上げる）を使う", () => {
    expect(T.PLAY_LABEL.start).toContain("ほどく")
    expect(T.REWIND_LABEL).toContain("巻き戻す")
    expect(T.STEP3_GUIDE).toContain("積み上げる")
  })
})

// 全ケース共通の固定文にすると、巻き戻し中や止めているあいだに「のびていきます」と嘘になる（2026-10-26 レビュー指摘）
describe("unrollMessage（図の下の一言は、見えている動きと合う）", () => {
  test("ほどいているあいだ：のびていく（「1本ずつ」とは言わない。全部の輪が同時にほどけるため）", () => {
    const m = T.unrollMessage(0.5, 1)
    expect(m).toContain("のびていきます")
    expect(m).not.toContain("1本ずつ")
  })
  test("巻き戻しているあいだ：もどっていく。巻き戻し始め（t > 0.98）でも「積み上がりました」と言わない", () => {
    expect(T.unrollMessage(0.5, -1)).toContain("もどっていきます")
    expect(T.unrollMessage(0.99, -1)).toContain("もどっていきます")
  })
  test("止まっているとき：はじめ・途中・完成で出し分ける", () => {
    expect(T.unrollMessage(0, null)).toContain("切れ目")
    expect(T.unrollMessage(0.5, null)).toContain("止めています")
    expect(T.unrollMessage(1, null)).toContain("直角三角形に積み上がりました")
  })
  test("どの言い方にも「のびていきます」が出るのは、ほどいているときだけ", () => {
    for (const t of [0, 0.3, 0.7, 1]) {
      expect(T.unrollMessage(t, -1)).not.toContain("のびていきます")
      expect(T.unrollMessage(t, null)).not.toContain("のびていきます")
    }
  })
})

describe("記号で（表示レベル。F1-5・F3-9）", () => {
  test("① 面積を微分すると円周、③ 円周を積分すると面積", () => {
    expect(T.SYMBOL_DERIVATIVE).toBe("(πr²)' = 2πr")
    expect(T.SYMBOL_INTEGRAL).toBe("∫₀ʳ 2πt dt = πr²")
    expect(T.SYMBOL_INTEGRAL_SPEED).toBe("∫₀ˣ 2t dt = x²")
  })
  test("∫ にはことばの読み方を添える（円周を 0 から r まで積み上げる）", () => {
    expect(T.INTEGRAL_MEANING).toContain("積み上げる")
    expect(T.INTEGRAL_MEANING).toContain("0 から r まで")
  })
})


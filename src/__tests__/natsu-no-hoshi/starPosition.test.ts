// ======================================================
// 星の位置計算のテスト
//
// 天文の計算はまちがっていても画面上は「それっぽく」見えてしまうので、
// 理科の教科書レベルで確かめられる事実を使って検算する。
// ======================================================

import { toHorizontal, toScreen, jstDate, KYOTO } from "@/lib/starPosition"
import { STAR_BY_ID } from "@/data/summerStars"

const vega = STAR_BY_ID["vega"]
const polaris = STAR_BY_ID["polaris"]
const altair = STAR_BY_ID["altair"]

describe("toHorizontal（赤経赤緯 → 高度・方位）", () => {
  test("北極星の高度は、その土地の緯度とほぼ同じになる", () => {
    // 4年〜中学で習う代表的な事実。京都（北緯35度）なら高度も約35度
    for (const hour of [19, 21, 23]) {
      const { alt } = toHorizontal(polaris.ra, polaris.dec, jstDate(2026, 8, 15, hour))
      expect(alt).toBeGreaterThan(KYOTO.lat - 1)
      expect(alt).toBeLessThan(KYOTO.lat + 1)
    }
  })

  test("北極星はほぼ真北（方位0度）にある", () => {
    const { az } = toHorizontal(polaris.ra, polaris.dec, jstDate(2026, 8, 15, 21))
    // 0度をまたぐので、359度台も「ほぼ0度」として扱う
    const diff = Math.min(az, 360 - az)
    expect(diff).toBeLessThan(2)
  })

  test("北極星は時間がたってもほとんど動かない", () => {
    const a = toHorizontal(polaris.ra, polaris.dec, jstDate(2026, 8, 15, 19))
    const b = toHorizontal(polaris.ra, polaris.dec, jstDate(2026, 8, 15, 23))
    expect(Math.abs(a.alt - b.alt)).toBeLessThan(1)
  })

  test("ベガの南中高度は 90 -（緯度 - 赤緯）になる", () => {
    // ベガの赤緯(38.8度)は京都の緯度(35度)より大きいので、天頂より少し北で南中する
    // 南中高度 = 90 - |緯度 - 赤緯| = 90 - 3.78 = 約86.2度
    const expected = 90 - Math.abs(KYOTO.lat - vega.dec)
    // 2026年8月15日 21時ごろ、京都でベガはほぼ南中する
    const { alt } = toHorizontal(vega.ra, vega.dec, jstDate(2026, 8, 15, 21))
    expect(alt).toBeCloseTo(expected, 0)
  })

  test("星は時間がたつと東から西へ動く（方位が大きくなる）", () => {
    // アルタイルは南中前（東側）→ 南中後（西側）へ移る
    const t1 = toHorizontal(altair.ra, altair.dec, jstDate(2026, 8, 15, 20))
    const t2 = toHorizontal(altair.ra, altair.dec, jstDate(2026, 8, 15, 23))
    expect(t1.az).toBeLessThan(180)  // 20時は南より東側
    expect(t2.az).toBeGreaterThan(180) // 23時は南より西側
  })

  test("同じ時こくでも、日がたつと星は西へずれる", () => {
    // 星の1日は太陽の1日より約4分短いため、1か月で約2時間ぶん先に進む
    const aug = toHorizontal(altair.ra, altair.dec, jstDate(2026, 8, 15, 20))
    const sep = toHorizontal(altair.ra, altair.dec, jstDate(2026, 9, 15, 20))
    expect(sep.az).toBeGreaterThan(aug.az)
  })

  test("地平線の下にある星は高度がマイナスになる", () => {
    // さそり座は昼から夕方にかけて南の空。真夜中すぎには沈んでいる
    const antares = STAR_BY_ID["antares"]
    const { alt } = toHorizontal(antares.ra, antares.dec, jstDate(2026, 8, 15, 25))
    expect(alt).toBeLessThan(0)
  })
})

describe("toScreen（高度・方位 → 円形の全天ビュー）", () => {
  const CX = 100, CY = 100, R = 90

  test("天頂（高度90度）は円の中心にくる", () => {
    const p = toScreen({ alt: 90, az: 123 }, CX, CY, R)
    expect(p.x).toBeCloseTo(CX, 5)
    expect(p.y).toBeCloseTo(CY, 5)
  })

  test("見上げた図なので、北=上・東=左・南=下・西=右になる", () => {
    // 高度0度（地平線）＝円のふち
    const north = toScreen({ alt: 0, az: 0 },   CX, CY, R)
    const east  = toScreen({ alt: 0, az: 90 },  CX, CY, R)
    const south = toScreen({ alt: 0, az: 180 }, CX, CY, R)
    const west  = toScreen({ alt: 0, az: 270 }, CX, CY, R)

    expect(north.y).toBeCloseTo(CY - R, 3)  // 上
    expect(east.x).toBeCloseTo(CX - R, 3)   // 左
    expect(south.y).toBeCloseTo(CY + R, 3)  // 下
    expect(west.x).toBeCloseTo(CX + R, 3)   // 右
  })

  test("高度が低い星ほど円のふちに近づく", () => {
    const high = toScreen({ alt: 60, az: 180 }, CX, CY, R)
    const low  = toScreen({ alt: 20, az: 180 }, CX, CY, R)
    const distHigh = Math.hypot(high.x - CX, high.y - CY)
    const distLow = Math.hypot(low.x - CX, low.y - CY)
    expect(distLow).toBeGreaterThan(distHigh)
  })
})

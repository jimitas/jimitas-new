"use client"

// ======================================================
// 三角比学習アプリ
//
// 高校数学の三角比 (sin/cos/tan) を視覚的に学習する3モード構成:
//   1. 三角比を求める  : 角度 θ → sin/cos/tan の値
//   2. 辺を求める      : 角度 θ + 1辺の長さ → 残り2辺
//   3. 角度を求める    : 2辺の長さ → 角度 θ
//
// SVGで直角三角形をリアルタイム描画する。
// 旧 https://triangle-ratio.vercel.app/ からの移植。
// ======================================================

import { useState, useMemo } from "react"

type Mode = "ratio" | "side" | "angle"
type BaseSide = "hypotenuse" | "adjacent" | "opposite"
type Combination = "adj-opp" | "hyp-adj" | "hyp-opp"

const SPECIAL_ANGLES: Record<number, string> = {
  30: "sin 30° = 1/2, cos 30° = √3/2, tan 30° = √3/3",
  45: "sin 45° = √2/2, cos 45° = √2/2, tan 45° = 1",
  60: "sin 60° = √3/2, cos 60° = 1/2, tan 60° = √3",
}

export default function TriangleRatioPage() {
  // 共通: 現在の角度（モード3では計算結果を反映）
  const [mode, setMode] = useState<Mode>("ratio")
  const [angle, setAngle] = useState(45)

  // モード2: 辺を求める
  const [baseSide, setBaseSide] = useState<BaseSide>("hypotenuse")
  const [sideLength, setSideLength] = useState(10)

  // モード3: 角度を求める
  const [combination, setCombination] = useState<Combination>("adj-opp")
  const [side1, setSide1] = useState(5)
  const [side2, setSide2] = useState(5)

  // -----------------------------------------------------
  // 計算ロジック
  // -----------------------------------------------------
  const angleRad = (angle * Math.PI) / 180
  const sin = Math.sin(angleRad)
  const cos = Math.cos(angleRad)
  const tan = Math.tan(angleRad)

  // モード2: 辺の計算
  const sideResults = useMemo(() => {
    let hypotenuse = 0, adjacent = 0, opposite = 0
    switch (baseSide) {
      case "hypotenuse":
        hypotenuse = sideLength
        adjacent = hypotenuse * cos
        opposite = hypotenuse * sin
        break
      case "adjacent":
        adjacent = sideLength
        hypotenuse = adjacent / cos
        opposite = adjacent * tan
        break
      case "opposite":
        opposite = sideLength
        hypotenuse = opposite / sin
        adjacent = opposite / tan
        break
    }
    return { hypotenuse, adjacent, opposite }
  }, [baseSide, sideLength, sin, cos, tan])

  // モード3: 角度の逆算
  const angleResult = useMemo(() => {
    let computedAngle = 0
    let formula = ""
    let error: string | null = null

    if (combination === "adj-opp") {
      computedAngle = (Math.atan(side2 / side1) * 180) / Math.PI
      const ratio = (side2 / side1).toFixed(4)
      formula = `tan θ = ${side2} ÷ ${side1} = ${ratio} より θ = arctan(${ratio})`
    } else if (combination === "hyp-adj") {
      if (side2 >= side1) {
        error = "斜辺は他の辺より長くなければなりません"
      } else {
        computedAngle = (Math.acos(side2 / side1) * 180) / Math.PI
        const ratio = (side2 / side1).toFixed(4)
        formula = `cos θ = ${side2} ÷ ${side1} = ${ratio} より θ = arccos(${ratio})`
      }
    } else if (combination === "hyp-opp") {
      if (side2 >= side1) {
        error = "斜辺は他の辺より長くなければなりません"
      } else {
        computedAngle = (Math.asin(side2 / side1) * 180) / Math.PI
        const ratio = (side2 / side1).toFixed(4)
        formula = `sin θ = ${side2} ÷ ${side1} = ${ratio} より θ = arcsin(${ratio})`
      }
    }

    return { computedAngle, formula, error }
  }, [combination, side1, side2])

  // モード3: 計算結果の角度を SVG 表示用に反映
  // （ユーザーが mode 3 にいるときだけ）
  const displayAngle = mode === "angle" && !angleResult.error
    ? angleResult.computedAngle
    : angle

  const specialAngleMessage = mode === "ratio" ? SPECIAL_ANGLES[Math.round(angle)] : null

  // -----------------------------------------------------
  // SVG三角形の頂点座標を計算
  //   右下が直角、左下に角度θ、右上が斜辺の頂点
  // -----------------------------------------------------
  const triangleSvg = useMemo(() => {
    const baseWidth = 400
    const angleRadDisplay = (displayAngle * Math.PI) / 180
    const rawHeight = baseWidth * Math.tan(angleRadDisplay)
    const maxHeight = Math.min(rawHeight, 300)
    const scale = rawHeight === 0 ? 1 : maxHeight / rawHeight
    const w = baseWidth * scale
    const h = maxHeight

    const x1 = 450, y1 = 350           // 右下（直角）
    const x2 = x1 - w, y2 = y1         // 左下（θ）
    const x3 = x1, y3 = y1 - h         // 右上

    // θ の弧
    const arcRadius = 30
    const arcStartX = x2 + arcRadius
    const arcStartY = y2
    const arcEndX = x2 + arcRadius * Math.cos(angleRadDisplay)
    const arcEndY = y2 - arcRadius * Math.sin(angleRadDisplay)
    const arcPath = `M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 0 0 ${arcEndX} ${arcEndY}`

    return {
      points: `${x1},${y1} ${x2},${y2} ${x3},${y3}`,
      arcPath,
      labels: {
        c: { x: (x2 + x3) / 2 - 20, y: (y2 + y3) / 2 - 10 },
        b: { x: (x1 + x2) / 2,      y: y1 + 20 },
        a: { x: x1 + 15,             y: (y1 + y3) / 2 },
        theta: { x: x2 + 35,         y: y2 - 10 },
      },
    }
  }, [displayAngle])

  // -----------------------------------------------------
  // 入力ハンドラー
  // -----------------------------------------------------
  const handleAngleChange = (val: number) => {
    if (val >= 1 && val <= 89) setAngle(val)
  }

  const handleSideLengthChange = (val: number) => {
    if (val > 0 && val <= 9999) setSideLength(val)
  }

  const handleSide1Change = (val: number) => {
    if (val > 0 && val <= 9999) setSide1(val)
  }

  const handleSide2Change = (val: number) => {
    if (val > 0 && val <= 9999) setSide2(val)
  }

  // モード3 の辺ラベル
  const combinationLabels = {
    "adj-opp": { label1: "底辺 (b)", label2: "高さ (a)" },
    "hyp-adj": { label1: "斜辺 (c)", label2: "底辺 (b)" },
    "hyp-opp": { label1: "斜辺 (c)", label2: "高さ (a)" },
  }[combination]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        三角比 (sin / cos / tan)
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        高校数学の三角比を視覚的に学習しよう。スライダーや数値入力で直角三角形が動きます。
      </p>

      {/* タブ切替 */}
      <div className="flex gap-1 border-b-2 border-gray-200 dark:border-gray-700 mb-6">
        {[
          { id: "ratio" as Mode,  label: "三角比を求める" },
          { id: "side"  as Mode,  label: "辺を求める" },
          { id: "angle" as Mode,  label: "角度を求める" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              mode === t.id
                ? "bg-brand-500 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG三角形（左カラム） */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex justify-center">
          <svg viewBox="0 0 500 400" className="w-full max-w-md h-auto">
            <polygon
              points={triangleSvg.points}
              stroke="currentColor"
              strokeWidth={2}
              fill="rgba(74, 144, 226, 0.1)"
              className="text-gray-700 dark:text-gray-300"
            />
            {/* 直角記号 */}
            <path
              d="M 435,350 L 435,335 L 450,335"
              stroke="currentColor"
              strokeWidth={1}
              fill="none"
              className="text-gray-700 dark:text-gray-300"
            />
            {/* θの弧 */}
            <path
              d={triangleSvg.arcPath}
              stroke="currentColor"
              strokeWidth={2}
              fill="none"
              className="text-brand-500"
            />
            {/* 辺ラベル */}
            <text x={triangleSvg.labels.c.x} y={triangleSvg.labels.c.y} className="fill-warm-500 font-bold" fontSize="20">c</text>
            <text x={triangleSvg.labels.b.x} y={triangleSvg.labels.b.y} className="fill-warm-500 font-bold" fontSize="20">b</text>
            <text x={triangleSvg.labels.a.x} y={triangleSvg.labels.a.y} className="fill-warm-500 font-bold" fontSize="20">a</text>
            <text x={triangleSvg.labels.theta.x} y={triangleSvg.labels.theta.y} className="fill-brand-500 font-bold" fontSize="22">θ</text>
          </svg>
        </section>

        {/* 入力＋結果（右カラム） */}
        <section className="space-y-4">
          {/* ===== モード1: 三角比を求める ===== */}
          {mode === "ratio" && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-3">角度を入力</h2>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  角度 θ:
                </label>
                <input
                  type="range"
                  min={1}
                  max={89}
                  step={1}
                  value={angle}
                  onChange={(e) => handleAngleChange(parseFloat(e.target.value))}
                  className="w-full"
                  style={{ accentColor: "var(--color-brand-500, #3b82f6)" }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>0°</span>
                  <span>90°</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0.1}
                    max={89.9}
                    step={0.1}
                    value={angle}
                    onChange={(e) => handleAngleChange(parseFloat(e.target.value))}
                    className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-gray-700 dark:text-gray-300">°</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-3">計算結果</h2>
                <div className="space-y-2">
                  <ResultRow label="sin θ =" value={sin.toFixed(4)} />
                  <ResultRow label="cos θ =" value={cos.toFixed(4)} />
                  <ResultRow label="tan θ =" value={angle === 90 ? "定義なし" : tan.toFixed(4)} />
                </div>
                {specialAngleMessage && (
                  <div className="mt-3 p-3 rounded-lg bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 text-warm-800 dark:text-warm-200 text-sm">
                    💡 きれいな値です！ {specialAngleMessage}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== モード2: 辺を求める ===== */}
          {mode === "side" && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">角度と基準の辺を入力</h2>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">角度 θ:</label>
                  <input
                    type="range"
                    min={1}
                    max={89}
                    step={1}
                    value={angle}
                    onChange={(e) => handleAngleChange(parseFloat(e.target.value))}
                    className="w-full"
                    style={{ accentColor: "var(--color-brand-500, #3b82f6)" }}
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={0.1}
                      max={89.9}
                      step={0.1}
                      value={angle}
                      onChange={(e) => handleAngleChange(parseFloat(e.target.value))}
                      className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <span className="text-gray-700 dark:text-gray-300">°</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">基準となる辺:</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: "hypotenuse" as BaseSide, label: "斜辺 (c)" },
                      { v: "adjacent"   as BaseSide, label: "底辺 (b)" },
                      { v: "opposite"   as BaseSide, label: "高さ (a)" },
                    ].map(opt => (
                      <label key={opt.v} className={`px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                        baseSide === opt.v
                          ? "bg-brand-500 text-white border-brand-500"
                          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="base-side"
                          value={opt.v}
                          checked={baseSide === opt.v}
                          onChange={() => setBaseSide(opt.v)}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">辺の長さ:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.1}
                      max={9999}
                      step={0.1}
                      value={sideLength}
                      onChange={(e) => handleSideLengthChange(parseFloat(e.target.value))}
                      className="w-32 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <span className="text-gray-700 dark:text-gray-300">cm</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-3">計算結果</h2>
                <div className="space-y-2">
                  <ResultRow label="斜辺 c =" value={`${sideResults.hypotenuse.toFixed(3)} cm`} />
                  <ResultRow label="底辺 b =" value={`${sideResults.adjacent.toFixed(3)} cm`} />
                  <ResultRow label="高さ a =" value={`${sideResults.opposite.toFixed(3)} cm`} />
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">参考: 三角比の値</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span>sin θ = {sin.toFixed(4)}</span>
                    <span>cos θ = {cos.toFixed(4)}</span>
                    <span>tan θ = {tan.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== モード3: 角度を求める ===== */}
          {mode === "angle" && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">2つの辺の長さを入力</h2>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">辺の組み合わせ:</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: "adj-opp" as Combination, label: "底辺と高さ" },
                      { v: "hyp-adj" as Combination, label: "斜辺と底辺" },
                      { v: "hyp-opp" as Combination, label: "斜辺と高さ" },
                    ].map(opt => (
                      <label key={opt.v} className={`px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                        combination === opt.v
                          ? "bg-brand-500 text-white border-brand-500"
                          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="side-combination"
                          value={opt.v}
                          checked={combination === opt.v}
                          onChange={() => setCombination(opt.v)}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{combinationLabels.label1}:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0.1}
                        max={9999}
                        step={0.1}
                        value={side1}
                        onChange={(e) => handleSide1Change(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-gray-700 dark:text-gray-300">cm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{combinationLabels.label2}:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0.1}
                        max={9999}
                        step={0.1}
                        value={side2}
                        onChange={(e) => handleSide2Change(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-gray-700 dark:text-gray-300">cm</span>
                    </div>
                  </div>
                </div>

                {angleResult.error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
                    ⚠ {angleResult.error}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-3">計算結果</h2>
                <ResultRow label="角度 θ =" value={angleResult.error ? "—" : `${angleResult.computedAngle.toFixed(2)}°`} highlight />
                {!angleResult.error && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {angleResult.formula}
                  </p>
                )}
                {!angleResult.error && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">参考: すべての三角比</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <span>sin θ = {Math.sin((angleResult.computedAngle * Math.PI) / 180).toFixed(4)}</span>
                      <span>cos θ = {Math.cos((angleResult.computedAngle * Math.PI) / 180).toFixed(4)}</span>
                      <span>tan θ = {Math.tan((angleResult.computedAngle * Math.PI) / 180).toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

// -----------------------------------------------------
// 結果1行表示コンポーネント
// -----------------------------------------------------
function ResultRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`font-bold tabular-nums ${
        highlight
          ? "text-2xl text-warm-600 dark:text-warm-400"
          : "text-lg text-gray-900 dark:text-gray-100"
      }`}>
        {value}
      </span>
    </div>
  )
}

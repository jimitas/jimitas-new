// ======================================================
// 三原色学習 ページ
//
// URL: /sangenshoku
// 対象: 小学4〜6年生（図工・理科）
//
// 機能:
//   左パネル: 光の三原色 RGB（加法混色）
//   右パネル: 色の三原色 CMY / 絵の具の三原色（減法混色）
//   - スライダーでリアルタイム混色
//   - 色番号（HEX/rgb）入力で色指定
//   - 解説ボタン5種類
//   - 絵の具モードで赤・青・黄の混色を体験
// ======================================================

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import * as se from "@/lib/se";

// ── 色計算（純粋関数）────────────────────────────────

/** RGB値をそのまま返す（加法混色） */
function calcRGB(r: number, g: number, b: number) {
  return { r, g, b };
}

/** CMY → RGB（減法混色） */
function calcCMY(c: number, m: number, y: number) {
  return {
    r: Math.round(255 * (1 - c / 100)),
    g: Math.round(255 * (1 - m / 100)),
    b: Math.round(255 * (1 - y / 100)),
  };
}

/** 絵の具モード: 赤・青・黄の混色（加重平均 + 減法効果） */
function calcPaint(red: number, blue: number, yellow: number) {
  const paintRed    = { r: 230, g: 57,  b: 70  }; // #E63946
  const paintBlue   = { r: 0,   g: 119, b: 190 }; // #0077BE
  const paintYellow = { r: 255, g: 215, b: 0   }; // #FFD700

  const rs = red / 100, bs = blue / 100, ys = yellow / 100;
  const total = rs + bs + ys;

  if (total === 0) return { r: 255, g: 255, b: 255 };

  let r = (paintRed.r * rs + paintBlue.r * bs + paintYellow.r * ys) / total;
  let g = (paintRed.g * rs + paintBlue.g * bs + paintYellow.g * ys) / total;
  let b = (paintRed.b * rs + paintBlue.b * bs + paintYellow.b * ys) / total;

  // 混ぜるほど少し暗くなる（減法混色の効果）
  const darken = Math.min(total / 2, 0.85) * 0.15;
  r = Math.max(0, Math.min(255, Math.round(r * (1 - darken))));
  g = Math.max(0, Math.min(255, Math.round(g * (1 - darken))));
  b = Math.max(0, Math.min(255, Math.round(b * (1 - darken))));

  return { r, g, b };
}

/** RGB → HEX */
function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

/** RGB → CMY（表示用） */
function rgbToCMY(r: number, g: number, b: number) {
  return {
    c: Math.round((1 - r / 255) * 100),
    m: Math.round((1 - g / 255) * 100),
    y: Math.round((1 - b / 255) * 100),
  };
}

// ── 解説テキスト ────────────────────────────────────
type ExplKey = "cmy" | "rgb" | "paint" | "mixing" | "codes";

const EXPLANATIONS: Record<ExplKey, { title: string; body: string }> = {
  rgb: {
    title: "光の三原色とは？",
    body: `光（ひかり）の三原色（さんげんしょく）は、Red（赤）・Green（緑）・Blue（青）の3つの光です。

テレビやスマホの画面は、この3色の光を混ぜていろいろな色を作っています。

光を混ぜると、混ぜるほど明るくなり、全部混ぜると白になります。

これを「加法混色（かほうこんしょく）」といいます。コンピュータでは「RGB」と呼ばれています。`,
  },
  cmy: {
    title: "色の三原色とは？",
    body: `色の三原色は、シアン（水色）・マゼンタ（ピンク）・イエロー（黄色）の3つです。

絵の具やインクなど、色がついたものを混ぜると、混ぜるほど暗い色になります。全部混ぜると黒に近づきます。

プリンタのインクカートリッジは、シアン（C）・マゼンタ（M）・イエロー（Y）・黒（K）の4色が使われています。

これを「減法混色（げんぽうこんしょく）」といいます。`,
  },
  paint: {
    title: "絵の具の三原色について",
    body: `絵の具の三原色は、赤・青・黄色です。

理科で習う「色の三原色」とは少し違います。理科ではシアン・マゼンタ・イエローですが、実際の絵の具では赤・青・黄が使われます。

このアプリでは、チェックボックスで切り替えて、両方試すことができます！`,
  },
  mixing: {
    title: "混色の原理",
    body: `混色には2つの種類があります。

■ 加法混色（光を混ぜる）
混ぜるほど明るくなります。
テレビやスマホの画面で使われています。

■ 減法混色（色のついたものを混ぜる）
混ぜるほど暗くなります。
絵の具や印刷で使われています。

同じ色でも、混ぜ方が違うと結果が変わるんです！`,
  },
  codes: {
    title: "色番号の見方",
    body: `色番号は、色を数字で表す方法です。

■ RGB表記
例: rgb(255, 0, 0) = 赤
・R は赤（0〜255）
・G は緑（0〜255）
・B は青（0〜255）

■ HEX表記
例: #FF0000 = 赤
・# の後に6桁の英数字
・最初の2桁が赤、次が緑、最後が青

この番号があれば、どんなコンピュータでも同じ色を表示できます！`,
  },
};

// ── スライダー1本分のコンポーネント ──────────────────
type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
};

function ColorSlider({ label, value, min, max, color, onChange }: SliderProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs font-medium w-32 shrink-0"
        style={{ color }}
      >
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <span className="text-xs font-mono w-8 text-right text-gray-600">
        {value}
      </span>
    </div>
  );
}

// ── 色情報テキスト ─────────────────────────────────
function ColorInfo({ r, g, b }: { r: number; g: number; b: number }) {
  const hex = rgbToHex(r, g, b);
  const cmy = rgbToCMY(r, g, b);
  return (
    <div className="text-xs font-mono text-gray-500 space-y-0.5">
      <div>HEX: {hex}</div>
      <div>RGB: rgb({r}, {g}, {b})</div>
      <div>CMY: C:{cmy.c}% M:{cmy.m}% Y:{cmy.y}%</div>
    </div>
  );
}

// ── ページ本体 ────────────────────────────────────────
export default function SangenshokuPage() {
  // RGB（光の三原色）スライダー値
  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
  // CMY（色/絵の具の三原色）スライダー値
  const [cmy, setCmy] = useState({ c: 0, m: 0, y: 0 });
  // 絵の具モード
  const [isPaintMode, setIsPaintMode] = useState(false);

  // 色番号入力フィールドの値
  const [rgbInput, setRgbInput] = useState("#000000");
  const [cmyInput, setCmyInput] = useState("#FFFFFF");

  // 解説モーダル
  const [explanation, setExplanation] = useState<ExplKey | null>(null);

  // トースト
  const [toast, setToast] = useState<string | null>(null);

  // ── 混色結果を計算 ──────────────────────────────────
  const rgbResult = calcRGB(rgb.r, rgb.g, rgb.b);
  // isPaintMode: m=赤, c=青, y=黄 として calculatePaint へ渡す
  const cmyResult = isPaintMode
    ? calcPaint(cmy.m, cmy.c, cmy.y)
    : calcCMY(cmy.c, cmy.m, cmy.y);

  // ── 入力フィールドをスライダー結果に同期 ──────────
  useEffect(() => {
    setRgbInput(rgbToHex(rgbResult.r, rgbResult.g, rgbResult.b));
  }, [rgbResult.r, rgbResult.g, rgbResult.b]);

  useEffect(() => {
    setCmyInput(rgbToHex(cmyResult.r, cmyResult.g, cmyResult.b));
  }, [cmyResult.r, cmyResult.g, cmyResult.b]);

  // ── トースト表示 ────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── 色番号を適用（RGB側）──────────────────────────
  const applyRgbInput = () => {
    const val = rgbInput.trim();
    const hexMatch = val.match(/^#?([0-9A-Fa-f]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      setRgb({
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      });
      showToast(`RGB側に適用: #${hex.toUpperCase()}`);
      return;
    }
    const rgbMatch = val.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgbMatch) {
      setRgb({
        r: Math.max(0, Math.min(255, parseInt(rgbMatch[1]))),
        g: Math.max(0, Math.min(255, parseInt(rgbMatch[2]))),
        b: Math.max(0, Math.min(255, parseInt(rgbMatch[3]))),
      });
      showToast("RGB側に適用しました");
      return;
    }
    showToast("形式エラー: #FF5733 または rgb(255, 87, 51)");
  };

  // ── 色番号を適用（CMY側）──────────────────────────
  const applyCmyInput = () => {
    const val = cmyInput.trim();
    const hexMatch = val.match(/^#?([0-9A-Fa-f]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      setCmy(rgbToCMY(r, g, b));
      showToast(`CMY側に適用: #${hex.toUpperCase()}`);
      return;
    }
    const rgbMatch = val.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgbMatch) {
      const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1])));
      const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2])));
      const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3])));
      setCmy(rgbToCMY(r, g, b));
      showToast("CMY側に適用しました");
      return;
    }
    showToast("形式エラー: #00FFFF または rgb(0, 255, 255)");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* タイトル */}
      <h1 className="text-2xl font-bold text-center mb-1 text-gray-800">
        三原色学習
      </h1>
      <p className="text-sm text-center text-gray-500 mb-6">
        スライダーを動かして、光と色・絵の具の混色を比べてみよう
      </p>

      {/* 2パネル */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* ── 左パネル: 光の三原色 RGB ── */}
        <div className="bg-gray-900 rounded-xl p-4 text-white">
          <h2 className="text-base font-bold mb-3 text-center">
            🔦 光の三原色（RGB）
          </h2>

          {/* 参考画像 */}
          <div className="flex justify-center mb-3">
            <Image
              src="/images/sangenshoku/hikari.jpg"
              alt="光の三原色のイメージ"
              width={240}
              height={140}
              className="rounded-lg object-cover"
            />
          </div>

          {/* スライダー */}
          <div className="space-y-2 mb-3">
            <ColorSlider
              label="Red（赤）"
              value={rgb.r} min={0} max={255}
              color="#ff6666"
              onChange={(v) => { se.playSe(se.kako); setRgb(p => ({ ...p, r: v })); }}
            />
            <ColorSlider
              label="Green（緑）"
              value={rgb.g} min={0} max={255}
              color="#66ff66"
              onChange={(v) => { se.playSe(se.kako); setRgb(p => ({ ...p, g: v })); }}
            />
            <ColorSlider
              label="Blue（青）"
              value={rgb.b} min={0} max={255}
              color="#6699ff"
              onChange={(v) => { se.playSe(se.kako); setRgb(p => ({ ...p, b: v })); }}
            />
          </div>

          {/* 混色結果バー */}
          <div
            className="w-full h-12 rounded-lg mb-2 border border-white/20"
            style={{ backgroundColor: `rgb(${rgbResult.r},${rgbResult.g},${rgbResult.b})` }}
          />

          {/* 色情報 */}
          <div className="mb-3">
            <ColorInfo r={rgbResult.r} g={rgbResult.g} b={rgbResult.b} />
          </div>

          {/* 色番号入力 */}
          <div className="flex gap-1">
            <input
              type="text"
              value={rgbInput}
              onChange={(e) => setRgbInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyRgbInput()}
              placeholder="#RRGGBB"
              className="flex-1 text-xs font-mono bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white placeholder-white/40 focus:outline-none focus:border-white/50"
            />
            <button
              onClick={applyRgbInput}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 font-bold transition-colors"
            >
              適用
            </button>
          </div>
        </div>

        {/* ── 右パネル: 色/絵の具の三原色 CMY ── */}
        <div className="bg-gray-100 rounded-xl p-4">
          {/* タイトル + 絵の具モードチェック */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">
              {isPaintMode ? "🎨 絵の具の三原色" : "🖨️ 色の三原色（CMY）"}
            </h2>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPaintMode}
                onChange={(e) => {
                  se.playSe(se.set);
                  setIsPaintMode(e.target.checked);
                  setCmy({ c: 0, m: 0, y: 0 });
                }}
                className="w-4 h-4 accent-brand-500"
              />
              <span className="text-xs text-gray-600 font-medium">絵の具モード</span>
            </label>
          </div>

          {/* ビジュアル表示 */}
          <div className="flex justify-center mb-3">
            {isPaintMode ? (
              /* 絵の具モード: 3つの円が重なる */
              <div
                className="relative w-40 h-36"
                style={{ mixBlendMode: "multiply" }}
              >
                {/* 左下: 赤 */}
                <div
                  className="absolute w-20 h-20 rounded-full"
                  style={{
                    backgroundColor: "rgba(230,57,70,0.85)",
                    bottom: 0, left: "10%",
                  }}
                />
                {/* 上中央: 黄 */}
                <div
                  className="absolute w-20 h-20 rounded-full"
                  style={{
                    backgroundColor: "rgba(255,215,0,0.85)",
                    top: 0, left: "50%", transform: "translateX(-50%)",
                  }}
                />
                {/* 右下: 青 */}
                <div
                  className="absolute w-20 h-20 rounded-full"
                  style={{
                    backgroundColor: "rgba(0,119,190,0.85)",
                    bottom: 0, right: "10%",
                  }}
                />
              </div>
            ) : (
              /* CMYモード: 参考画像 */
              <Image
                src="/images/sangenshoku/iro.jpg"
                alt="色の三原色のイメージ"
                width={240}
                height={140}
                className="rounded-lg object-cover"
              />
            )}
          </div>

          {/* スライダー */}
          <div className="space-y-2 mb-3">
            {isPaintMode ? (
              <>
                <ColorSlider
                  label="赤（Red）"
                  value={cmy.m} min={0} max={100}
                  color="#E63946"
                  onChange={(v) => { se.playSe(se.kako); setCmy(p => ({ ...p, m: v })); }}
                />
                <ColorSlider
                  label="黄（Yellow）"
                  value={cmy.y} min={0} max={100}
                  color="#c4a000"
                  onChange={(v) => { se.playSe(se.kako); setCmy(p => ({ ...p, y: v })); }}
                />
                <ColorSlider
                  label="青（Blue）"
                  value={cmy.c} min={0} max={100}
                  color="#0077BE"
                  onChange={(v) => { se.playSe(se.kako); setCmy(p => ({ ...p, c: v })); }}
                />
              </>
            ) : (
              <>
                <ColorSlider
                  label="Cyan（シアン）"
                  value={cmy.c} min={0} max={100}
                  color="#00aaaa"
                  onChange={(v) => { se.playSe(se.kako); setCmy(p => ({ ...p, c: v })); }}
                />
                <ColorSlider
                  label="Magenta（マゼンタ）"
                  value={cmy.m} min={0} max={100}
                  color="#cc44cc"
                  onChange={(v) => { se.playSe(se.kako); setCmy(p => ({ ...p, m: v })); }}
                />
                <ColorSlider
                  label="Yellow（イエロー）"
                  value={cmy.y} min={0} max={100}
                  color="#c4a000"
                  onChange={(v) => { se.playSe(se.kako); setCmy(p => ({ ...p, y: v })); }}
                />
              </>
            )}
          </div>

          {/* 混色結果バー */}
          <div
            className="w-full h-12 rounded-lg mb-2 border border-gray-300"
            style={{ backgroundColor: `rgb(${cmyResult.r},${cmyResult.g},${cmyResult.b})` }}
          />

          {/* 色情報 */}
          <div className="mb-3">
            <ColorInfo r={cmyResult.r} g={cmyResult.g} b={cmyResult.b} />
          </div>

          {/* 色番号入力 */}
          <div className="flex gap-1">
            <input
              type="text"
              value={cmyInput}
              onChange={(e) => setCmyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyCmyInput()}
              placeholder="#RRGGBB"
              className="flex-1 text-xs font-mono bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-brand-400"
            />
            <button
              onClick={applyCmyInput}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 font-bold transition-colors"
            >
              適用
            </button>
          </div>
        </div>
      </div>

      {/* 解説ボタン */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-600 mb-3">💡 解説を読む</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["rgb",    "光の三原色とは？"],
              ["cmy",    "色の三原色とは？"],
              ["paint",  "絵の具の三原色"],
              ["mixing", "混色の原理"],
              ["codes",  "色番号の見方"],
            ] as [ExplKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { se.playSe(se.seikai1); setExplanation(key); }}
              className="text-xs px-3 py-2 rounded-lg bg-white border border-accent-200 text-accent-600 hover:bg-accent-50 font-medium transition-colors active:scale-95"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 解説モーダル */}
      {explanation && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setExplanation(null); }}
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base font-bold text-gray-800">
                {EXPLANATIONS[explanation].title}
              </h3>
              <button
                onClick={() => setExplanation(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-2"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {EXPLANATIONS[explanation].body}
            </p>
            <button
              onClick={() => setExplanation(null)}
              className="mt-4 w-full py-2 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-full text-sm font-medium shadow-lg z-50">
          {toast}
        </div>
      )}

    </div>
  );
}

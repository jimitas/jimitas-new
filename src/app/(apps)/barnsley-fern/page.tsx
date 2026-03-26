// ======================================================
// バーンズリーのシダ ページ
//
// URL: /barnsley-fern
// 対象: 全学年（観賞用フラクタルアプリ）
//
// 機能:
//   - IFS（確率的反復関数系）でシダの葉を描画
//   - 開始/停止/リセット
//   - 速度スライダー（10〜1000点/フレーム）
//   - カラーテーマ5種類
//   - キーボードショートカット（Space: 開始/停止, R: リセット）
//
// アルゴリズム:
//   4つのアフィン変換を確率的に選んで点を打ち続けると
//   自然なシダの葉の形が現れる（バーンズリーのシダ）。
// ======================================================

"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ── IFS変換の定義 ─────────────────────────────────────
// 各変換: 新座標 = [[a,b],[c,d]] * [x,y] + [e,f]
// p: 選択確率
const TRANSFORMS = [
  { a: 0,     b: 0,     c: 0,     d: 0.16,  e: 0,    f: 0,    p: 0.01 }, // 茎
  { a: 0.85,  b: 0.04,  c: -0.04, d: 0.85,  e: 0,    f: 1.6,  p: 0.85 }, // 主葉
  { a: 0.2,   b: -0.26, c: 0.23,  d: 0.22,  e: 0,    f: 1.6,  p: 0.07 }, // 左葉
  { a: -0.15, b: 0.28,  c: 0.26,  d: 0.24,  e: 0,    f: 0.44, p: 0.07 }, // 右葉
] as const;

// ── カラーテーマ ──────────────────────────────────────
type ThemeKey = "classic" | "autumn" | "ocean" | "monochrome" | "rainbow";

const THEMES: Record<ThemeKey, { label: string; color: string | null; alpha: number }> = {
  classic:    { label: "クラシック緑",  color: "#90EE90", alpha: 0.8 },
  autumn:     { label: "秋の紅葉",      color: "#FF6B35", alpha: 0.8 },
  ocean:      { label: "オーシャン",    color: "#4A90E2", alpha: 0.8 },
  monochrome: { label: "モノクローム",  color: "#FFFFFF", alpha: 0.6 },
  rainbow:    { label: "レインボー",    color: null,      alpha: 0.8 },
};

// ── ページ本体 ────────────────────────────────────────
export default function BarnsleyFernPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed]         = useState(100);
  const [theme, setTheme]         = useState<ThemeKey>("classic");
  const [pointCount, setPointCount] = useState(0);
  const [showModal, setShowModal] = useState(true);

  // アニメーション制御用 ref（closure で最新値を参照するため）
  const animationIdRef  = useRef<number | null>(null);
  const isRunningRef    = useRef(false);
  const speedRef        = useRef(100);
  const themeRef        = useRef<ThemeKey>("classic");
  const pointCountRef   = useRef(0);
  const xRef            = useRef(0);
  const yRef            = useRef(0);
  // キャンバス描画パラメータ
  const scaleRef        = useRef(50);
  const centerXRef      = useRef(450);
  const centerYRef      = useRef(540);

  // state が変わったら ref も更新
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  // ── キャンバスサイズ初期化 ──────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;
    const maxWidth  = Math.min(900, (container?.clientWidth ?? 900) - 20);
    const maxHeight = Math.min(600, window.innerHeight * 0.6);
    const isMobile  = window.innerWidth <= 768;

    if (isMobile) {
      canvas.width  = maxWidth;
      canvas.height = Math.max(400, maxHeight);
      scaleRef.current   = 32;
      centerXRef.current = canvas.width / 2;
      centerYRef.current = canvas.height - 50;
    } else {
      canvas.width  = 900;
      canvas.height = 600;
      scaleRef.current   = 50;
      centerXRef.current = 450;
      centerYRef.current = 540;
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle   = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ── 次の点を計算（IFS変換）────────────────────────
  const getNextPoint = useCallback(() => {
    const rand = Math.random();
    let cumP = 0;
    let t: typeof TRANSFORMS[number] = TRANSFORMS[0];

    for (const transform of TRANSFORMS) {
      cumP += transform.p;
      if (rand <= cumP) { t = transform; break; }
    }

    const nx = t.a * xRef.current + t.b * yRef.current + t.e;
    const ny = t.c * xRef.current + t.d * yRef.current + t.f;
    xRef.current = nx;
    yRef.current = ny;
    return { x: nx, y: ny };
  }, []);

  // ── 点を描画 ──────────────────────────────────────
  const drawPoint = useCallback((px: number, py: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sx = centerXRef.current + px * scaleRef.current;
    const sy = centerYRef.current - py * scaleRef.current;

    if (sx >= 0 && sx < canvas.width && sy >= 0 && sy < canvas.height) {
      const t = THEMES[themeRef.current];
      ctx.globalAlpha = t.alpha;

      if (themeRef.current === "rainbow") {
        const hue = (pointCountRef.current * 0.1) % 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      } else {
        ctx.fillStyle = t.color!;
      }

      ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, 2);
      pointCountRef.current++;
    }
  }, []);

  // ── アニメーションループ ──────────────────────────
  const animate = useCallback(() => {
    if (!isRunningRef.current) return;

    for (let i = 0; i < speedRef.current; i++) {
      const p = getNextPoint();
      drawPoint(p.x, p.y);
    }

    // 100フレームに1回だけ React state を更新（DOM更新コストを抑える）
    if (pointCountRef.current % (speedRef.current * 10) < speedRef.current) {
      setPointCount(pointCountRef.current);
    }

    animationIdRef.current = requestAnimationFrame(animate);
  }, [getNextPoint, drawPoint]);

  // ── 開始 ─────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsRunning(true);
    animate();
  }, [animate]);

  // ── 停止 ─────────────────────────────────────────
  const handleStop = useCallback(() => {
    isRunningRef.current = false;
    setIsRunning(false);
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    // 停止時に点数を確定表示
    setPointCount(pointCountRef.current);
  }, []);

  // ── リセット ──────────────────────────────────────
  const handleReset = useCallback(() => {
    handleStop();
    xRef.current = 0;
    yRef.current = 0;
    pointCountRef.current = 0;
    setPointCount(0);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [handleStop]);

  // ── 初期化 ────────────────────────────────────────
  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // ── リサイズ対応 ──────────────────────────────────
  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout>;
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const dw = Math.abs(window.innerWidth  - lastW);
        const dh = Math.abs(window.innerHeight - lastH);
        if (dw > 50 || dh > 100) {
          lastW = window.innerWidth;
          lastH = window.innerHeight;
          const wasRunning = isRunningRef.current;
          if (wasRunning) handleStop();
          initCanvas();
          if (wasRunning) handleStart();
        }
      }, 300);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initCanvas, handleStart, handleStop]);

  // ── キーボードショートカット ──────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // モーダルが開いているときは無効
      if (showModal) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isRunningRef.current) handleStop(); else handleStart();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        handleReset();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showModal, handleStart, handleStop, handleReset]);

  // ── アンマウント時にアニメーション停止 ────────────
  useEffect(() => {
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* タイトル */}
      <h1 className="text-2xl font-bold text-center mb-1 text-gray-800">
        バーンズリーのシダ
      </h1>
      <p className="text-sm text-center text-gray-500 mb-4">
        4つの変換式をランダムに繰り返すと、シダの葉が現れてくるよ
      </p>

      {/* キャンバスエリア */}
      <div className="relative flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          className="rounded-xl border-2 border-white/30 shadow-xl"
          style={{ background: "#000" }}
        />
        {/* 点数カウンター */}
        <div className="absolute top-3 right-3 bg-black/60 text-green-300 text-xs font-mono px-3 py-1 rounded-lg pointer-events-none">
          点数: {pointCount.toLocaleString()}
        </div>
      </div>

      {/* コントロールパネル */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">

        {/* 開始/停止/リセット */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            ▶ 開始
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            ⏸ 停止
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-white border-2 border-gray-300 text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
          >
            ↺ リセット
          </button>
        </div>

        {/* 速度スライダー + テーマ */}
        <div className="flex flex-wrap gap-6 items-center">
          {/* 速度 */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">
              速度：<span className="font-bold text-brand-600">{speed}</span> 点/フレーム
            </label>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-32 accent-brand-500"
            />
          </div>

          {/* カラーテーマ */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">テーマ：</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeKey)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-brand-400"
            >
              {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
                <option key={key} value={key}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ショートカットヒント */}
        <p className="text-xs text-gray-400">
          キーボード: <kbd className="bg-gray-200 px-1 rounded">Space</kbd> 開始/停止
          <kbd className="bg-gray-200 px-1 rounded">R</kbd> リセット
        </p>
      </div>

      {/* ウェルカムモーダル */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              🌿 バーンズリーのシダとは？
            </h2>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              4つの簡単な計算式を、ランダムに選んで繰り返すだけで<br />
              本物のシダの葉にそっくりな形が現れます。
            </p>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              これを <strong>フラクタル</strong>（自己相似図形）といいます。<br />
              自然界にはこのような規則が隠れています。
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 mb-5 font-mono space-y-1">
              <div>茎　（確率 1%）</div>
              <div>主葉（確率 85%）← ここがシダの本体</div>
              <div>左葉（確率 7%）</div>
              <div>右葉（確率 7%）</div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-colors"
            >
              描いてみる
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

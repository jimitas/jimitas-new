// ======================================================
// コッホ曲線 ページ
//
// URL: /koch-curve
// 対象: 全学年（中学・高校でも使える数学可視化ツール）
//
// 機能:
//   - レベル0〜5でコッホ曲線の複雑さを段階的に変化
//   - 内側／外側モードで突起の向きを切り替え
//   - 1辺拡大モードで1本の辺だけを詳細表示
//   - アニメーション描画（一筆書き風）
//
// 実装:
//   Canvas API で描画。フラクタルアルゴリズムは再帰的に
//   線分を3等分して正三角形を追加する方法（コッホ変換）。
// ======================================================

"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ── 型定義 ────────────────────────────────────────────
type Point = { x: number; y: number };
type Level = 0 | 1 | 2 | 3 | 4 | 5;

// ── コッホ曲線の計算関数（純粋関数として定義）────────────

/** 六角形の6頂点を返す */
function getHexagonPoints(cx: number, cy: number, radius: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // -90度から開始
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return points;
}

/**
 * コッホ変換を再帰的に適用する
 * @param start 始点
 * @param end   終点
 * @param level 残りの再帰レベル
 * @param isOutward true=外側突起 / false=内側突起
 */
function applyKochTransform(
  start: Point,
  end: Point,
  level: number,
  isOutward: boolean
): Point[] {
  if (level === 0) {
    return [start, end];
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // 線分を3等分
  const p1: Point = { x: start.x + dx / 3, y: start.y + dy / 3 };
  const p3: Point = { x: start.x + (2 * dx) / 3, y: start.y + (2 * dy) / 3 };

  // 正三角形の頂点（内側/外側で符号が変わる）
  const dir = isOutward ? -1 : 1;
  const p2: Point = {
    x: p1.x + (p3.x - p1.x) * 0.5 - (p3.y - p1.y) * (Math.sqrt(3) / 2) * dir,
    y: p1.y + (p3.y - p1.y) * 0.5 + (p3.x - p1.x) * (Math.sqrt(3) / 2) * dir,
  };

  const seg1 = applyKochTransform(start, p1, level - 1, isOutward);
  const seg2 = applyKochTransform(p1, p2, level - 1, isOutward);
  const seg3 = applyKochTransform(p2, p3, level - 1, isOutward);
  const seg4 = applyKochTransform(p3, end, level - 1, isOutward);

  // 重複点を除いて結合
  return [
    ...seg1.slice(0, -1),
    ...seg2.slice(0, -1),
    ...seg3.slice(0, -1),
    ...seg4,
  ];
}

/**
 * 描画する全点列を生成する
 * @param canvasSize キャンバスサイズ（正方形）
 * @param level      コッホレベル
 * @param isOutward  突起の向き
 * @param isSingleEdge 1辺拡大モード
 */
function generateAllPoints(
  canvasSize: number,
  level: number,
  isOutward: boolean,
  isSingleEdge: boolean
): Point[] {
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const radius = canvasSize * 0.40;

  if (isSingleEdge) {
    // 1辺拡大モード: 横一直線の1本の辺だけ表示
    const start: Point = { x: canvasSize * 0.05, y: cy };
    const end: Point = { x: canvasSize * 0.95, y: cy };
    return applyKochTransform(start, end, level, isOutward);
  }

  // 通常モード: 正六角形の全辺にコッホ変換を適用
  const hexPoints = getHexagonPoints(cx, cy, radius);
  let allPoints: Point[] = [];

  for (let i = 0; i < 6; i++) {
    const start = hexPoints[i];
    const end = hexPoints[(i + 1) % 6];
    const edgePoints = applyKochTransform(start, end, level, isOutward);

    if (i === 0) {
      allPoints = [...edgePoints];
    } else {
      // 重複する終点/始点を除いて結合
      allPoints = [...allPoints.slice(0, -1), ...edgePoints];
    }
  }

  return allPoints;
}

/** レベルに応じた線の太さ */
function getLineWidth(level: Level | null): number {
  if (level === null) return 2;
  if (level <= 1) return 2;
  if (level <= 3) return 1.5;
  return 0.7;
}

// ── ページ本体 ────────────────────────────────────────
export default function KochCurvePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 現在選択中のレベル（null = 未選択）
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  // 突起の方向
  const [isOutward, setIsOutward] = useState(false);
  // 1辺拡大モード
  const [isSingleEdge, setIsSingleEdge] = useState(false);
  // アニメーション中フラグ
  const [isAnimating, setIsAnimating] = useState(false);
  // トーストメッセージ
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // アニメーションID（キャンセル用）
  const animationIdRef = useRef<number | null>(null);

  // トーストを表示する
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // ── キャンバスサイズ計算 ──────────────────────────────
  function calcCanvasSize(): number {
    const availableHeight = window.innerHeight - 300;
    let maxSize: number;
    if (window.innerWidth > 768) {
      maxSize = Math.min(600, window.innerWidth - 100, availableHeight);
    } else {
      maxSize = Math.min(availableHeight, window.innerWidth - 60);
    }
    return Math.max(300, maxSize);
  }

  // ── 静的描画 ──────────────────────────────────────────
  const drawStatic = useCallback(
    (level: Level, outward: boolean, singleEdge: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);

      const points = generateAllPoints(size, level, outward, singleEdge);

      ctx.strokeStyle = "#2c3e50";
      ctx.lineWidth = getLineWidth(level);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    },
    []
  );

  // ── アニメーション描画 ────────────────────────────────
  const drawAnimated = useCallback(
    (level: Level, outward: boolean, singleEdge: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);

      const points = generateAllPoints(size, level, outward, singleEdge);
      const totalPoints = points.length;
      // 1辺モードは3秒、通常は5秒
      const duration = singleEdge ? 3000 : 5000;
      const startTime = Date.now();

      ctx.strokeStyle = "#2c3e50";
      ctx.lineWidth = getLineWidth(level);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      setIsAnimating(true);
      let currentIdx = 0;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const targetIdx = Math.floor(progress * (totalPoints - 1));

        if (targetIdx > currentIdx) {
          ctx.beginPath();
          for (let i = currentIdx; i <= targetIdx; i++) {
            if (i === currentIdx) {
              ctx.moveTo(points[i].x, points[i].y);
            } else {
              ctx.lineTo(points[i].x, points[i].y);
            }
          }
          ctx.stroke();
          currentIdx = targetIdx;
        }

        if (progress < 1) {
          animationIdRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          animationIdRef.current = null;
        }
      };

      animationIdRef.current = requestAnimationFrame(animate);
    },
    []
  );

  // ── キャンバスサイズをセットアップ ──────────────────────
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = calcCanvasSize();
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
  }, []);

  // 初期化
  useEffect(() => {
    setupCanvas();
    const timer = setTimeout(() => {
      showToast("レベルボタン（0〜5）を押してください");
    }, 1000);
    return () => clearTimeout(timer);
  }, [setupCanvas, showToast]);

  // リサイズ対応
  useEffect(() => {
    const handleResize = () => {
      setupCanvas();
      if (currentLevel !== null) {
        drawStatic(currentLevel, isOutward, isSingleEdge);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas, drawStatic, currentLevel, isOutward, isSingleEdge]);

  // ── レベル選択 ─────────────────────────────────────────
  const handleSelectLevel = (level: Level) => {
    if (isAnimating) {
      showToast("描画中です。お待ちください...");
      return;
    }
    // アニメーションをキャンセルしてから開始
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
    }
    setCurrentLevel(level);
    drawAnimated(level, isOutward, isSingleEdge);
  };

  // ── 方向トグル ─────────────────────────────────────────
  const handleToggleDirection = () => {
    if (isAnimating) {
      showToast("描画中です。お待ちください...");
      return;
    }
    setIsOutward((prev) => !prev);
    setCurrentLevel(null);
    // キャンバスをクリア
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    showToast("レベルボタン（0〜5）を押してください");
  };

  // ── 1辺モード切り替え ──────────────────────────────────
  const handleToggleSingleEdge = () => {
    if (isAnimating) {
      showToast("描画中です。お待ちください...");
      return;
    }
    setIsSingleEdge((prev) => !prev);
    setCurrentLevel(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    showToast("レベルボタン（0〜5）を押してください");
  };

  // ── レベルボタンのスタイル ─────────────────────────────
  const levelBtnCls = (level: Level) =>
    `px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 border-2 ${
      currentLevel === level
        ? "bg-brand-500 text-white border-brand-600 shadow-lg scale-105"
        : "bg-white border-brand-200 text-brand-600 hover:bg-brand-50"
    }`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* タイトル */}
      <h1 className="text-2xl font-bold text-center mb-1 text-gray-800">
        六角形コッホ曲線
      </h1>
      <p className="text-sm text-center text-gray-500 mb-6">
        レベルを上げると、六角形の辺がどんどん複雑な形になっていくよ！
      </p>

      {/* コントロールパネル */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-4">

        {/* レベルボタン */}
        <div>
          <p className="text-sm text-gray-600 mb-2 font-medium">レベルを選択：</p>
          <div className="flex flex-wrap gap-2">
            {([0, 1, 2, 3, 4, 5] as Level[]).map((lv) => (
              <button
                key={lv}
                className={levelBtnCls(lv)}
                onClick={() => handleSelectLevel(lv)}
              >
                {lv}
              </button>
            ))}
          </div>
        </div>

        {/* 方向切り替え + 1辺モード */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* 内側/外側トグル */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">突起の向き：</span>
            <button
              onClick={handleToggleDirection}
              className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all active:scale-95 ${
                isOutward
                  ? "bg-accent-500 text-white border-accent-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {isOutward ? "外側" : "内側"}
            </button>
          </div>

          {/* 1辺拡大モード */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSingleEdge}
              onChange={handleToggleSingleEdge}
              className="w-4 h-4 accent-brand-500"
            />
            <span className="text-sm text-gray-600 font-medium">
              1辺を拡大表示
            </span>
          </label>
        </div>
      </div>

      {/* キャンバスエリア */}
      <div className="flex justify-center bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <canvas
          ref={canvasRef}
          className="rounded"
          style={{ imageRendering: "auto" }}
        />
      </div>

      {/* 説明文 */}
      <p className="text-xs text-gray-400 text-center mt-3">
        レベルが上がるにつれ、辺の数が4倍に増えていきます（フラクタル図形）
      </p>

      {/* トースト通知 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-5 py-3 rounded-full text-sm font-medium shadow-lg z-50 transition-opacity">
          {toastMsg}
        </div>
      )}

    </div>
  );
}

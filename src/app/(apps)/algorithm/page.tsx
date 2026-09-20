// ======================================================
// アルゴリズムシミュレーター ページ
//
// URL: /algorithm
// 対象: 中学・高校（高校「情報Ⅰ」のアルゴリズム分野）
//
// 機能:
//   - ソート・探索の動きをアニメーションで見る
//   - くらべた回数・入れかえた回数を実測し、理論計算量と並べる
//   - 要素数 n と、データの並び方を自由に変えられる
//   - Python / JavaScript / 共通テスト用プログラム表記 の
//     コード例を、いまのステップに合わせて行ハイライトする
//
// 実装:
//   アルゴリズムを実行しながら描画するのではなく、_lib/ 側で
//   「ステップ列」を先に全部作り、ここではその添字を進めるだけ。
//   再生・一時停止・コマ送り・速度変更がすべて添字の操作になる。
//
//   再生は setInterval ではなく requestAnimationFrame ＋ 経過時間の
//   積算。速度を変えても effect を貼り直さずに済む（speedRef を読むだけ）。
//
// 現状: 段階1a（選択ソートのみ）。
// ======================================================

"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BtnMode } from "@/components/parts/buttons/BtnMode";
import { AlgoExplain } from "./_components/AlgoExplain";
import { ArrayView } from "./_components/ArrayView";
import { CodePanel } from "./_components/CodePanel";
import { PlayerControls, N_MAX, N_MIN } from "./_components/PlayerControls";
import { StatsPanel } from "./_components/StatsPanel";
import { ALGOS, ALGO_ORDER, generateSteps } from "./_lib/algorithms";
import { makeData } from "./_lib/random";
import type { AlgoId, DataKind, LangId } from "./_lib/types";

// 初期状態は決め打ち。
// "use client" でも SSR されるので、初期 state に Math.random() を書くと
// サーバとクライアントで配列が食い違う。乱数はシード固定で作る。
const INITIAL_SEED = 20260920;
const INITIAL_N = 12;
const INITIAL_SPEED_MS = 350;

export default function AlgorithmPage() {
  const [algoId, setAlgoId] = useState<AlgoId>("selection");
  const [n, setN] = useState(INITIAL_N);
  const [dataKind, setDataKind] = useState<DataKind>("random");
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [lang, setLang] = useState<LangId>("python");
  const [speedMs, setSpeedMs] = useState(INITIAL_SPEED_MS);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  // コード例の開閉。動きとコードを見くらべるのが主目的なので、はじめは開いておく
  const [codeOpen, setCodeOpen] = useState(true);
  // しくみの解説の開閉。こちらは補足なので、はじめは たたんでおく
  const [explainOpen, setExplainOpen] = useState(false);

  const input = useMemo(() => makeData(n, dataKind, seed), [n, dataKind, seed]);
  const steps = useMemo(() => generateSteps(algoId, input), [algoId, input]);

  // steps が入れかわった直後の1レンダーだけ、添字が範囲外になりうる
  const safeIndex = Math.min(stepIndex, steps.length - 1);
  const step = steps[safeIndex];
  const maxValue = useMemo(() => Math.max(1, ...input), [input]);
  const algo = ALGOS[algoId];

  // ── 再生エンジン ───────────────────────────────
  // state はそのままだと RAF ループから読めないので ref に写す。
  const rafRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const speedRef = useRef(speedMs);
  const stepIndexRef = useRef(0);
  const stepCountRef = useRef(steps.length);
  const lastTimeRef = useRef(0);
  const carryRef = useRef(0);
  // tick が自分自身を呼ぶので、宣言前アクセスを避けるために ref 経由にする
  const tickRef = useRef<(time: number) => void>(() => {});

  useEffect(() => {
    speedRef.current = speedMs;
  }, [speedMs]);
  useEffect(() => {
    stepCountRef.current = steps.length;
  }, [steps.length]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, stepCountRef.current - 1));
    stepIndexRef.current = clamped;
    setStepIndex(clamped);
  }, []);

  const tick = useCallback(
    (time: number) => {
      if (!isPlayingRef.current) return;

      // 1フレーム＝1ステップにはしない。
      // n=50 で数千ステップになるので、最速側では1フレームに複数すすめる。
      const delta = lastTimeRef.current === 0 ? 0 : time - lastTimeRef.current;
      lastTimeRef.current = time;
      carryRef.current += delta;

      const last = stepCountRef.current - 1;
      let index = stepIndexRef.current;
      while (carryRef.current >= speedRef.current && index < last) {
        carryRef.current -= speedRef.current;
        index++;
      }
      // タブが裏に回っていた分の時間をためこまない
      if (carryRef.current > speedRef.current) carryRef.current = speedRef.current;

      if (index !== stepIndexRef.current) {
        stepIndexRef.current = index;
        setStepIndex(index);
      }

      if (index >= last) {
        pause();
        return;
      }
      rafRef.current = requestAnimationFrame(tickRef.current);
    },
    [pause],
  );

  // レンダー中ではなく useLayoutEffect で差し替える（react-hooks/refs 対策）
  useLayoutEffect(() => {
    tickRef.current = tick;
  });

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    if (stepCountRef.current === 0) return;
    // 最後まで見たあとに押されたら、はじめから
    if (stepIndexRef.current >= stepCountRef.current - 1) goTo(0);
    isPlayingRef.current = true;
    setIsPlaying(true);
    lastTimeRef.current = 0;
    carryRef.current = 0;
    rafRef.current = requestAnimationFrame(tickRef.current);
  }, [goTo]);

  // アンマウント時に必ず止める。忘れるとコンソールエラーになる
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── 操作 ────────────────────────────────────
  // 条件を変えるとステップ列が作り直される。そのたびに最初へ戻して止める。
  // これは effect ではなくハンドラー側でやる（effect 内の setState は
  // 連鎖レンダーになるため。react-hooks/set-state-in-effect）。
  const resetPlayback = useCallback(() => {
    pause();
    goTo(0);
  }, [pause, goTo]);

  const handleTogglePlay = () => (isPlayingRef.current ? pause() : play());
  const handleStepBack = () => {
    pause();
    goTo(stepIndexRef.current - 1);
  };
  const handleStepForward = () => {
    pause();
    goTo(stepIndexRef.current + 1);
  };
  const handleRestart = () => {
    pause();
    goTo(0);
  };
  const handleAlgoChange = (id: AlgoId) => {
    resetPlayback();
    setAlgoId(id);
  };
  const handleNChange = (next: number) => {
    resetPlayback();
    setN(Math.max(N_MIN, Math.min(N_MAX, next)));
  };
  const handleDataKindChange = (kind: DataKind) => {
    resetPlayback();
    setDataKind(kind);
  };
  const handleShuffle = () => {
    resetPlayback();
    setSeed((s) => s + 1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center mb-1 text-gray-800 dark:text-gray-100">
        アルゴリズムシミュレーター
      </h1>
      <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-5">
        ソートと探索のしくみを、動きと計算量の両方から確かめよう
      </p>

      {/* アルゴリズムの切り替え */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {ALGO_ORDER.map((id) => (
          <BtnMode key={id} value={id} current={algoId} onChange={handleAlgoChange}>
            {ALGOS[id].label}
          </BtnMode>
        ))}
      </div>

      {/*
        しくみの解説はタブと棒グラフのあいだ。
        はじめは たたんでおく（まず動きを見せたいので、棒グラフを下へ押しやらない）。
      */}
      <AlgoExplain
        algo={algo}
        open={explainOpen}
        onToggle={() => setExplainOpen((v) => !v)}
      />

      <ArrayView step={step} maxValue={maxValue} pointerVars={algo.pointerVars} />

      <PlayerControls
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStepBack={handleStepBack}
        onStepForward={handleStepForward}
        onRestart={handleRestart}
        stepIndex={safeIndex}
        stepCount={steps.length}
        speedMs={speedMs}
        onSpeedChange={setSpeedMs}
        n={n}
        onNChange={handleNChange}
        dataKind={dataKind}
        onDataKindChange={handleDataKindChange}
        onShuffle={handleShuffle}
      />

      {/*
        コード例は操作パネルのすぐ下に置く。
        棒グラフの動きとコードの行を見くらべたいのに、
        あいだに計算量の表がはさまると1画面に収まらないため。
      */}
      <CodePanel
        algoId={algoId}
        lang={lang}
        onLangChange={setLang}
        codeTag={step.codeTag}
        open={codeOpen}
        onToggle={() => setCodeOpen((v) => !v)}
      />

      <StatsPanel
        algo={algo}
        message={step.message}
        compares={step.compares}
        swaps={step.swaps}
        n={n}
      />
    </div>
  );
}

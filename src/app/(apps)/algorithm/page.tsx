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
import { ComplexityChart } from "./_components/ComplexityChart";
import {
  PlayerControls,
  N_MAX,
  N_MIN,
  SPEED_MAX,
  SPEED_MIN,
} from "./_components/PlayerControls";
import { StatsPanel } from "./_components/StatsPanel";
import { ALGOS, ALGO_ORDER, generateSteps } from "./_lib/algorithms";
import { makeData, pickTarget, sortedCopy } from "./_lib/random";
import type { AlgoId, DataKind, LangId } from "./_lib/types";

// 初期状態は決め打ち。
// "use client" でも SSR されるので、初期 state に Math.random() を書くと
// サーバとクライアントで配列が食い違う。乱数はシード固定で作る。
// localStorage も同じ理由で、初期値には使わずマウント後に読み込む。
const INITIAL_SEED = 20260920;
const INITIAL_N = 12;
const INITIAL_SPEED_MS = 350;

// 保存する設定（state の構造を変えたらバージョンを上げる）
const STORAGE_KEY = "jimitas_algorithm_v1";

type SavedSettings = {
  algoId?: AlgoId;
  n?: number;
  dataKind?: DataKind;
  lang?: LangId;
  speedMs?: number;
  codeOpen?: boolean;
  explainOpen?: boolean;
  chartOpen?: boolean;
};

const DATA_KINDS: DataKind[] = ["random", "nearly", "reverse", "same"];
const LANG_IDS: LangId[] = ["python", "javascript", "kyotsu"];

export default function AlgorithmPage() {
  const [algoId, setAlgoId] = useState<AlgoId>("selection");
  const [n, setN] = useState(INITIAL_N);
  const [dataKind, setDataKind] = useState<DataKind>("random");
  const [seed, setSeed] = useState(INITIAL_SEED);
  // 探索でさがす値。null なら「配列の中にある値」を自動で選ぶ
  const [targetValue, setTargetValue] = useState<number | null>(null);
  // 「ある値／ない値」を押すたびに別の値を出すためのカウンタ
  const [targetNonce, setTargetNonce] = useState(0);
  const [lang, setLang] = useState<LangId>("python");
  const [speedMs, setSpeedMs] = useState(INITIAL_SPEED_MS);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  // コード例の開閉。動きとコードを見くらべるのが主目的なので、はじめは開いておく
  const [codeOpen, setCodeOpen] = useState(true);
  // しくみの解説の開閉。こちらは補足なので、はじめは たたんでおく
  const [explainOpen, setExplainOpen] = useState(false);
  // 計算量グラフの開閉と、見くらべる相手。こちらも補足なので たたんでおく
  const [chartOpen, setChartOpen] = useState(false);
  const [compareWith, setCompareWith] = useState<AlgoId[]>([]);
  // localStorage の復元が済んだか。済むまで書き戻さない（初期値で上書きしてしまうため）
  const [loaded, setLoaded] = useState(false);

  // 二分探索はならんでいる配列にしか使えないので、自動でならべる。
  // _lib 側にもガードがあり、ならんでいない配列を渡すと例外になる。
  const requiresSorted = ALGOS[algoId].requiresSorted;
  const input = useMemo(() => {
    const base = makeData(n, dataKind, seed);
    return requiresSorted ? sortedCopy(base) : base;
  }, [n, dataKind, seed, requiresSorted]);

  // 探索でさがす値。使う側が選んでいなければ「配列の中にある値」を既定にする。
  // Math.random() は使わない（SSR で食いちがうため）。
  const isSearch = ALGOS[algoId].category === "search";
  const target = targetValue ?? pickTarget(input, true, seed);

  const steps = useMemo(
    () => generateSteps(algoId, input, { target }),
    [algoId, input, target],
  );

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

  // ── 設定の保存と復元 ────────────────────────────
  // SSR 後のハイドレーションが終わってから読む。
  // 初期 state に localStorage を使うとサーバ側と食いちがう。
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as SavedSettings;
        // 壊れた値・古い値でアプリが動かなくならないよう、1つずつ検査する
        if (data.algoId && ALGO_ORDER.includes(data.algoId)) setAlgoId(data.algoId);
        if (typeof data.n === "number" && data.n >= N_MIN && data.n <= N_MAX) setN(data.n);
        if (data.dataKind && DATA_KINDS.includes(data.dataKind)) setDataKind(data.dataKind);
        if (data.lang && LANG_IDS.includes(data.lang)) setLang(data.lang);
        if (typeof data.speedMs === "number" && data.speedMs >= SPEED_MIN && data.speedMs <= SPEED_MAX) {
          setSpeedMs(data.speedMs);
        }
        if (typeof data.codeOpen === "boolean") setCodeOpen(data.codeOpen);
        if (typeof data.explainOpen === "boolean") setExplainOpen(data.explainOpen);
        if (typeof data.chartOpen === "boolean") setChartOpen(data.chartOpen);
      }
    } catch {
      // 破損データは無視する
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const data: SavedSettings = {
        algoId,
        n,
        dataKind,
        lang,
        speedMs,
        codeOpen,
        explainOpen,
        chartOpen,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 容量超過などは無視（次回の保存で再試行される）
    }
  }, [loaded, algoId, n, dataKind, lang, speedMs, codeOpen, explainOpen, chartOpen]);

  // ── 操作 ────────────────────────────────────
  // 条件を変えるとステップ列が作り直される。そのたびに最初へ戻して止める。
  // これは effect ではなくハンドラー側でやる（effect 内の setState は
  // 連鎖レンダーになるため。react-hooks/set-state-in-effect）。
  const resetPlayback = useCallback(() => {
    pause();
    goTo(0);
  }, [pause, goTo]);

  const handleTogglePlay = useCallback(
    () => (isPlayingRef.current ? pause() : play()),
    [pause, play],
  );
  const handleStepBack = useCallback(() => {
    pause();
    goTo(stepIndexRef.current - 1);
  }, [pause, goTo]);
  const handleStepForward = useCallback(() => {
    pause();
    goTo(stepIndexRef.current + 1);
  }, [pause, goTo]);
  const handleRestart = useCallback(() => {
    pause();
    goTo(0);
  }, [pause, goTo]);

  // ── キーボード操作 ─────────────────────────────
  // スペース＝再生/一時停止、← →＝コマ送り、R＝さいしょへ。
  // スライダーやボタンにフォーカスがあるときは何もしない。
  // スライダーの上で ← → を押したら値を変えたいし、ボタンの上でスペースを
  // 押すとブラウザがクリックを起こすので、二重に反応してしまう。
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handleTogglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleStepBack();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleStepForward();
          break;
        case "r":
        case "R":
          e.preventDefault();
          handleRestart();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleTogglePlay, handleStepBack, handleStepForward, handleRestart]);
  const handleAlgoChange = (id: AlgoId) => {
    resetPlayback();
    setAlgoId(id);
  };
  // 配列の中身が変わると、選んでいた「さがす値」がもう入っていないかもしれない。
  // 意図しない「見つかりません」になるのを避けるため、いったん自動選択に戻す。
  const handleNChange = (next: number) => {
    resetPlayback();
    setTargetValue(null);
    setN(Math.max(N_MIN, Math.min(N_MAX, next)));
  };
  const handleDataKindChange = (kind: DataKind) => {
    resetPlayback();
    setTargetValue(null);
    setDataKind(kind);
  };
  const handleShuffle = () => {
    resetPlayback();
    setTargetValue(null);
    setSeed((s) => s + 1);
  };
  const handleToggleCompare = (id: AlgoId) =>
    setCompareWith((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const handlePickTarget = (hit: boolean) => {
    resetPlayback();
    // seed は動かさない。動かすと配列そのものが変わってしまい、
    // せっかく選んだ「ある値」が新しい配列に入っていないことになる。
    // 押すたびに別の値が出るよう、別のカウンタでずらす。
    const nonce = targetNonce + 1;
    setTargetNonce(nonce);
    setTargetValue(pickTarget(input, hit, seed + nonce * 7919));
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

      <ArrayView
        step={step}
        maxValue={maxValue}
        pointerVars={algo.pointerVars}
        usesHand={algo.usesHand}
        usesPending={algoId === "quick"}
      />

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
        target={isSearch ? target : undefined}
        onPickTarget={isSearch ? handlePickTarget : undefined}
        autoSorted={requiresSorted}
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

      <ComplexityChart
        algoId={algoId}
        dataKind={dataKind}
        seed={seed}
        compareWith={compareWith}
        onToggleCompare={handleToggleCompare}
        open={chartOpen}
        onToggle={() => setChartOpen((v) => !v)}
      />
    </div>
  );
}

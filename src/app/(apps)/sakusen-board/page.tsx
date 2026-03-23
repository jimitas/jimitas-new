// ======================================================
// 作戦ボード ページ
//
// URL: /sakusen-board
// 対象: 先生・全学年（体育のボールゲーム用）
//
// 機能:
//   - コート上に選手・矢印・ボールを自由配置（ドラッグ）
//   - 「回転」ボタンで選手マーカーを横向きに切り替え
//   - 作戦名セレクト
//   - スクリーンショットでロイロノート等に記録
//
// ドラッグ実装:
//   react-draggable は React 19 非対応のため使わず、
//   Pointer Events（onPointerDown/Move/Up）で自作。
//   各ピースの位置は translate(x, y) で管理する。
// ======================================================

"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import * as se from "@/lib/se";

// ── 作戦名の選択肢 ────────────────────────────────────
const STRATEGY_OPTIONS = [
  "チームの作戦名は？",
  "ガンガン行こうぜ！",
  "バッチリがんばれ！",
  "わたしにまかせて！",
  "守りを大事に！",
  "つないで行こう",
  "声をかけあって行こう",
  "指示を守って行こう",
  "マークして行こう",
  "落ち着いて行こう",
  "はげましあって行こう",
  "あきらめないで行こう！",
  "作戦A",
  "作戦B",
  "作戦C",
];

// ── ピースの種類 ──────────────────────────────────────
// 矢印: ピンク系(1〜4)・青系(5〜8) を各2枚ずつ
const PINK_ARROWS = [1, 1, 2, 2, 3, 3, 4, 4];
const BLUE_ARROWS = [5, 5, 6, 6, 7, 7, 8, 8];
const PLAYER_NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ── ドラッグ開始時に記録する情報 ─────────────────────
type DragInfo = {
  id: string;
  startPx: number; // ポインターのクライアント座標（開始時）
  startPy: number;
  startOx: number; // ピースのオフセット座標（開始時）
  startOy: number;
};

// ── ページ本体 ────────────────────────────────────────
export default function SakusenBoardPage() {

  // ── 各ピースの位置（ID → {x, y} のオフセット） ─────
  // 初期値はすべて {x:0, y:0}（コントロールパネルの元の場所）
  // ドラッグすると transform: translate(x, y) で動く
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  // ── ドラッグ中のピースID（z-index 制御に使う） ──────
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // ── ドラッグ開始情報（useRef でレンダリングを起こさない） ──
  const dragInfo = useRef<DragInfo | null>(null);

  // ── 選手マーカーの回転フラグ ──────────────────────
  // false: 通常（丸）、true: 横向き（赤=右90°、青=左90°）
  const [isRotated, setIsRotated] = useState(false);

  // ── ドラッグ開始 ────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    // このポインターをこの要素に「捕捉」する。
    // 指が要素の外にはみ出しても onPointerMove が届くようになる。
    e.currentTarget.setPointerCapture(e.pointerId);
    se.playSe(se.move1); // ピースをつかんだとき
    const cur = positions[id] ?? { x: 0, y: 0 };
    dragInfo.current = {
      id,
      startPx: e.clientX,
      startPy: e.clientY,
      startOx: cur.x,
      startOy: cur.y,
    };
    setDraggingId(id);
  };

  // ── ドラッグ中（指/カーソルが動くたびに呼ばれる） ──
  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragInfo.current) return;
    // 開始点からの差分 + 開始時のオフセット = 新しい位置
    const dx = e.clientX - dragInfo.current.startPx;
    const dy = e.clientY - dragInfo.current.startPy;
    setPositions(prev => ({
      ...prev,
      [dragInfo.current!.id]: {
        x: dragInfo.current!.startOx + dx,
        y: dragInfo.current!.startOy + dy,
      },
    }));
  };

  // ── ドラッグ終了 ────────────────────────────────────
  const handlePointerUp = () => {
    if (dragInfo.current) se.playSe(se.move2); // ピースを置いたとき
    dragInfo.current = null;
    setDraggingId(null);
  };

  // ── ピース共通のスタイル・イベントハンドラを返す ───
  // 各ピースの JSX でスプレッド（{...pieceProps(id)}）して使う
  const pieceProps = (id: string) => {
    const pos = positions[id] ?? { x: 0, y: 0 };
    return {
      style: {
        // ドラッグ量だけ視覚的にずらす（元のDOMの位置は変わらない）
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        // ドラッグ中は最前面に出す
        zIndex: draggingId === id ? 50 : 1,
        // touch-action:none でブラウザのスクロール・ズームより先にポインターイベントを受け取る
        touchAction: "none" as const,
        cursor: draggingId === id ? "grabbing" : "grab",
        position: "relative" as const,
        display: "inline-block",
      },
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => handlePointerDown(e, id),
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    };
  };

  // ── 選手の回転スタイル（外側のドラッグ translateとは別要素に適用） ──
  const playerRotationStyle = (team: "red" | "blue"): React.CSSProperties => ({
    transition: "transform 0.3s ease",
    transform: !isRotated ? "rotate(0deg)"
      : team === "red" ? "rotate(90deg)"
      : "rotate(-90deg)",
  });

  // ── 選手マーカー（丸に番号） ─────────────────────────
  const PlayerCircle = ({ num, team }: { num: number; team: "red" | "blue" }) => {
    const id = `${team}-${num}`;
    return (
      <div {...pieceProps(id)}>
        <div style={{
          ...playerRotationStyle(team),
          width: "min(5vw, 30px)",
          height: "min(5vw, 30px)",
          fontSize: "min(3vw, 14px)",
          lineHeight: "min(5vw, 30px)",
          backgroundColor: team === "red" ? "#DC2626" : "#1D4ED8",
          borderRadius: "50%",
          border: "2px solid white",
          textAlign: "center",
          color: "white",
          fontWeight: 600,
          margin: 2,
        }}>
          {num}
        </div>
      </div>
    );
  };

  // ── 矢印ピース ────────────────────────────────────────
  const ArrowPiece = ({ type, uid }: { type: number; uid: string }) => (
    <div {...pieceProps(uid)}>
      <Image
        src={`/images/sakusen-board/arrow_${type}.png`}
        alt={`矢印${type}`}
        width={30}
        height={30}
        draggable={false}
        style={{ width: "min(5vw, 30px)", height: "min(5vw, 30px)" }}
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-2 py-4 space-y-3">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800">
        作戦ボード
      </h1>

      {/* ── 作戦名セレクト + ヒント ─────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <select
          className="text-sm font-bold text-gray-800 border border-brand-400 rounded-lg px-3 py-1 bg-white cursor-pointer"
          onChange={() => se.playSe(se.piron)} // 作戦名を変えたとき
        >
          {STRATEGY_OPTIONS.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          スクリーンショットをとって、ロイロノートなどに残そう
        </p>
      </div>

      {/* ── コート ───────────────────────────────────── */}
      {/*
        ゴールはコートの外側（左右）に飛び出す配置のため、
        外側に少し余白をとった div で囲む（ゴールが切れないように）
      */}
      <div className="flex justify-center">
        <div style={{ padding: "0 min(6vw, 60px)" }}>
          <div style={{
            position: "relative",
            width: "min(80vw, 800px)",
            height: "min(40vw, 400px)",
            // オレンジ：赤・青どちらとも混同しないUD配色（野外視認性も高い）
            backgroundColor: "#F59E0B",
            // 外枠を濃い茶色にしてページ背景（白系）との同化を防ぐ
            border: "5px solid #92400e",
          }}>

            {/* 左ゴール（赤チーム側・自陣は近く） */}
            <div style={{
              position: "absolute",
              width: "min(5vw, 50px)",
              height: "min(20vw, 200px)",
              top: "calc(50% - min(10vw, 100px))",
              left: "min(-5vw, -50px)",
              backgroundColor: "#DC2626",
              // ゴール枠も外枠と統一（白だとフィールド内ラインと混同しやすい）
              border: "5px solid #92400e",
            }} />

            {/* 右ゴール（青チーム側・自陣は近く） */}
            <div style={{
              position: "absolute",
              width: "min(5vw, 50px)",
              height: "min(20vw, 200px)",
              top: "calc(50% - min(10vw, 100px))",
              right: "min(-5vw, -50px)",
              backgroundColor: "#1D4ED8",
              border: "5px solid #92400e",
            }} />

            {/* 左縦ライン */}
            <div style={{
              position: "absolute",
              left: "5vw", top: 0,
              width: 5, height: "100%",
              backgroundColor: "white",
            }} />

            {/* センターライン */}
            <div style={{
              position: "absolute",
              left: "calc(50% - 2.5px)", top: 0,
              width: 5, height: "100%",
              backgroundColor: "white",
            }} />

            {/* 右縦ライン */}
            <div style={{
              position: "absolute",
              right: "5vw", top: 0,
              width: 5, height: "100%",
              backgroundColor: "white",
            }} />

          </div>
        </div>
      </div>

      {/* ── コントロールパネル（ピース置き場） ─────────
          画面幅が狭いときは折り返す（flex-wrap）
      */}
      <div className="flex flex-wrap justify-center gap-1 py-2">

        {/* 赤プレイヤー（1〜10） */}
        <div className="flex flex-wrap" style={{ width: "min(21vw, 210px)" }}>
          {PLAYER_NUMS.map(num => (
            <PlayerCircle key={`red-${num}`} num={num} team="red" />
          ))}
        </div>

        {/* ピンク矢印（1〜4 を各2枚） */}
        <div className="flex flex-wrap" style={{ width: "min(21vw, 210px)" }}>
          {PINK_ARROWS.map((type, i) => (
            <ArrowPiece key={`pink-${i}`} type={type} uid={`pink-arrow-${i}`} />
          ))}
        </div>

        {/* ボール + 回転ボタン */}
        <div className="flex flex-col items-center gap-2" style={{ width: "min(10vw, 100px)" }}>
          {/* ボール */}
          {(() => {
            const id = "ball";
            return (
              <div {...pieceProps(id)}>
                <Image
                  src="/images/sakusen-board/ball.png"
                  alt="ボール"
                  width={48}
                  height={48}
                  draggable={false}
                  style={{ width: "min(8vw, 48px)", height: "min(8vw, 48px)" }}
                />
              </div>
            );
          })()}

          {/* 回転ボタン: 赤=右90°・青=左90° に切り替え */}
          <button
            onClick={() => { se.playSe(se.set); setIsRotated(prev => !prev); }} // 回転ボタン
            className="text-xs font-bold rounded border transition-all active:scale-95"
            style={{
              width: "min(8vw, 80px)",
              padding: "2px 4px",
              backgroundColor: isRotated ? "#2563eb" : "white",
              color: isRotated ? "white" : "#2563eb",
              borderColor: "#2563eb",
            }}
          >
            回転
          </button>
        </div>

        {/* 青矢印（5〜8 を各2枚） */}
        <div className="flex flex-wrap" style={{ width: "min(21vw, 210px)" }}>
          {BLUE_ARROWS.map((type, i) => (
            <ArrowPiece key={`blue-${i}`} type={type} uid={`blue-arrow-${i}`} />
          ))}
        </div>

        {/* 青プレイヤー（1〜10） */}
        <div className="flex flex-wrap" style={{ width: "min(21vw, 210px)" }}>
          {PLAYER_NUMS.map(num => (
            <PlayerCircle key={`blue-${num}`} num={num} team="blue" />
          ))}
        </div>

      </div>
    </div>
  );
}

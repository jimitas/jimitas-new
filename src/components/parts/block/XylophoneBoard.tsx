"use client"

// ======================================================
// XylophoneBoard（木琴・鉄琴 共通レイアウト）
//
// 旧版 22mokn.js / 23tekn.js の CSS・レイアウトを忠実に再現した
// 2行バー構成のコンポーネント。
//
// 上段: 黒鍵バー（#音）が横一列（left: 28px オフセット）
// 下段: 白鍵バー（♮音）が横一列（margin-top: 222px で下にずらす）
// バーサイズ: 幅 58px × 高さ 220px（黒も白も同じ）
// バー色: barColor prop で外から指定（もっきん=#691c0d, てっきん=#555）
// ======================================================

import React from "react"

// ── 型定義 ──────────────────────────────────────────────

export interface BarItem {
  soundIndex: number  // 0 はスペーサー（バーなし・音なし）
  note: string
}

interface XylophoneBoardProps {
  bkBars: BarItem[]
  whBars: BarItem[]
  barColor: string
  onPressDown: (e: React.MouseEvent | React.TouchEvent) => void
  onPressUp: (e: React.MouseEvent | React.TouchEvent) => void
  onMouseLeave: (e: React.MouseEvent) => void
}

// ── スタイル定数（旧版 CSS の値をそのまま再現） ─────────

const BASE_BAR: React.CSSProperties = {
  width: "58px",
  height: "220px",
  marginRight: "2px",
  textAlign: "center",
  border: "1px solid black",
  color: "white",
  cursor: "pointer",
  userSelect: "none",
  flexShrink: 0,
}

// 黒鍵バー: 上部に音名テキストを表示
const BK_EXTRA: React.CSSProperties = {
  paddingTop: "30px",
  fontSize: "18px",
  lineHeight: "24px",
}

// 白鍵バー: 下段に配置（margin-top で黒鍵行の下に来る）
const WH_EXTRA: React.CSSProperties = {
  marginTop: "222px",
  paddingTop: "20px",
  fontSize: "30px",
}

// スペーサー: バーなし・同じ幅で隙間を作る（ミ→ファ、シ→ドの間）
const SPACER: React.CSSProperties = {
  width: "58px",
  height: "220px",
  marginRight: "2px",
  flexShrink: 0,
}

// ── コンポーネント ────────────────────────────────────

export default function XylophoneBoard({
  bkBars,
  whBars,
  barColor,
  onPressDown,
  onPressUp,
  onMouseLeave,
}: XylophoneBoardProps) {
  return (
    <div className="overflow-x-auto pb-4">
      {/*
        コンテナ幅: 白鍵 16 本 × (58+2)px = 960px
        コンテナ高さ: 白鍵の margin-top(222) + height(220) = 442px
      */}
      <div
        className="relative mx-auto"
        style={{ width: "960px", height: "442px" }}
      >
        {/* 黒鍵バー行（旧版 .B_Kenban: left: 28px） */}
        <div
          className="absolute flex"
          style={{ left: "28px", top: 0, zIndex: 3 }}
        >
          {bkBars.map((bar, i) => {
            if (bar.soundIndex === 0) {
              return <div key={`sp-${i}`} style={SPACER} />
            }
            return (
              <div
                key={bar.soundIndex}
                data-sound={String(bar.soundIndex)}
                style={{ ...BASE_BAR, ...BK_EXTRA, backgroundColor: barColor }}
                onMouseDown={onPressDown}
                onMouseUp={onPressUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onPressDown}
                onTouchEnd={onPressUp}
              >
                {bar.note}
              </div>
            )
          })}
        </div>

        {/* 白鍵バー行（旧版 .W_Kenban） */}
        <div
          className="absolute flex"
          style={{ left: 0, top: 0, zIndex: 2 }}
        >
          {whBars.map((bar) => (
            <div
              key={bar.soundIndex}
              data-sound={String(bar.soundIndex)}
              style={{ ...BASE_BAR, ...WH_EXTRA, backgroundColor: barColor }}
              onMouseDown={onPressDown}
              onMouseUp={onPressUp}
              onMouseLeave={onMouseLeave}
              onTouchStart={onPressDown}
              onTouchEnd={onPressUp}
            >
              {bar.note}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client";

// ======================================================
// 漢字プリント作成 ページ
//
// URL: /kanji-print
// 対象: 先生向け（1〜6年生の漢字書き取り練習プリント作成）
//
// 機能:
//   - 漢字を2文字入力 → A4縦書きの書き取りプリントを生成
//   - ページ1 = 1文字目、ページ2 = 2文字目
//   - 各ページ構成:
//     ・大マス（なぞり字付き）
//     ・読み方欄（音訓分けオプション）
//     ・部首・画数欄
//     ・成り立ち・意味欄（オプション）
//     ・繰り返し練習（7マス、最初の3マスになぞり字）
//     ・熟語づくり・短文づくり
//   - 設定: 学年、マスサイズ、フォント、文字の濃さ、
//           位置微調整、印刷縮小率、各欄の表示切替
//
// 印刷の仕組み:
//   writing-mode: vertical-rl で縦書き A4 レイアウト。
//   スクリーンでは scale(0.75) でプレビュー、
//   印刷時は position:fixed + scale(var(--kp-print-scale)) で出力。
// ======================================================

import { useState, useEffect } from "react";
import * as se from "@/lib/se";

// ── 定数 ─────────────────────────────────────────────

// 学年ごとのタイトル表記
const GRADE_LABEL = ["一年", "二年", "三年", "四年", "五年", "六年"];
const TITLE_LABEL = ["かん字プリント", "かん字プリント", "漢字プリント", "漢字プリント", "漢字プリント", "漢字プリント"];

// 学年ごとの指示文テンプレート
// grade index 0〜5（1年〜6年）
const KURIKAESHI_TEXT = [
  "〇かきじゅんや　かたちに　気をつけて、ていねいに　かきましょう。",
  "○書きじゅんや形に気をつけて、ていねいに書きましょう。",
  "○書きじゅんや形に気をつけて、ていねいに練習しましょう。",
  "○筆順や形に気をつけて、ていねいに練習しましょう。",
  "○筆順や形に気をつけて、ていねいに練習しましょう。",
  "○筆順や形に気をつけて、ていねいに練習しましょう。",
];
const JUKUGO_TEXT = [
  "○このかん字を　つかった　ことばを　かきましょう。",
  "○このかん字をつかったことばを書きましょう。",
  "○このかん字をつかったことばを書きましょう。",
  "○じゅく語を書きましょう。",
  "○じゅく語を書きましょう。",
  "○熟語を書きましょう。",
];
const TANBUN_TEXT = [
  "〇文を　一つ　つくりましょう。",
  "〇文を一つ作りましょう。",
  "〇文を一つ作りましょう。",
  "〇文を一つ作りましょう。",
  "〇文を一つ作りましょう。",
  "〇文を一つ作りましょう。",
];
const NARITACHI_TEXT = [
  "○かん字の　いみや　なり立ちを　かきましょう",
  "○漢字の意味や成り立ちを書きましょう",
  "○漢字の意味や成り立ちを書きましょう",
  "○漢字の意味や成り立ちを書きましょう",
  "○漢字の意味や成り立ちを書きましょう",
  "○漢字の意味や成り立ちを書きましょう",
];
const IMI_TEXT = [
  "○かん字の　いみを　かきましょう。",
  "○漢字の意味を書きましょう。",
  "○漢字の意味を書きましょう。",
  "○漢字の意味を書きましょう。",
  "○漢字の意味を書きましょう。",
  "○漢字の意味を書きましょう。",
];

// フォント定義
const FONT_MINCHO = '"Times New Roman", "游明朝", "YuMincho", "ヒラギノ明朝 ProN W3", "Hiragino Mincho ProN", "HG明朝E", "MS P明朝", "MS 明朝", serif';
const FONT_GOTHIC = '"游ゴシック", "YuGothic", "ヒラギノ角ゴ ProN W3", "Hiragino Kaku Gothic ProN", "メイリオ", "Meiryo", sans-serif'
// 教科書体：筆のはね・はらい・とめが手書きに近く、書き取り練習に最適（Windows 10/11 標準搭載）
const FONT_KYOKASHO = '"UD デジタル 教科書体 NK-B", "UD デジタル 教科書体 N-B", "UD デジタル 教科書体 NK-R", "UD デジタル 教科書体 N-R", serif';

// 繰り返しマスの数
const MASU_COUNT = 7;
// なぞり字を表示するマスの数（先頭から）
const NAZORI_COUNT = 3;

// ── コンポーネント ───────────────────────────────────

export default function KanjiPrintPage() {

  // ── 状態管理 ──────────────────────────────────────

  const [grade, setGrade] = useState(4);       // 学年（1〜6）
  const [size, setSize] = useState(1.96);     // マスサイズ（cm）
  const [kanjiFirst, setKanjiFirst] = useState("漢");     // 1文字目
  const [kanjiSecond, setKanjiSecond] = useState("字");   // 2文字目
  const [opacity, setOpacity] = useState(0.5);      // なぞり字の濃さ
  const [positionX, setPositionX] = useState(0);        // 文字位置X微調整
  const [positionY, setPositionY] = useState(0);        // 文字位置Y微調整
  const [fontStyle, setFontStyle] = useState<"mincho" | "gothic" | "kyokasho">("kyokasho");
  const [printScale, setPrintScale] = useState(0.97);     // 印刷時の縮小率

  // 表示オプション
  const [showOnkun, setShowOnkun] = useState(true);   // 音訓を分ける
  const [showBushu, setShowBushu] = useState(true);   // 部首・部首名
  const [showNaritachi, setShowNaritachi] = useState(false);  // 意味や成り立ち
  const [showImi, setShowImi] = useState(true);   // 漢字の意味
  const [showKurikaeshi2, setShowKurikaeshi2] = useState(false); // 書き写し2段
  const [showJukugo2, setShowJukugo2] = useState(false);  // 熟語2段
  const [showTanbun2, setShowTanbun2] = useState(false);  // 短文2段

  // 印刷縮小率を CSS 変数に反映
  useEffect(() => {
    document.documentElement.style.setProperty("--kp-print-scale", String(printScale));
  }, [printScale]);

  // ── ヘルパー ────────────────────────────────────────

  const gi = grade - 1; // grade index（0〜5）
  const fontFamily = fontStyle === "gothic" ? FONT_GOTHIC : fontStyle === "kyokasho" ? FONT_KYOKASHO : FONT_MINCHO;
  const fontWeight = fontStyle === "gothic" ? "500" : "bold";

  // ── 印刷エリアのサブコンポーネント（インライン関数） ──

  // タイトル行（学年・プリント名・ページ・日付・名前欄）
  const renderTitle = () => (
    <div style={{ display: "flex", alignItems: "center", fontSize: "1.5rem", width: `${size}cm` }}>
      <div>{GRADE_LABEL[gi]}　</div>
      <div>{TITLE_LABEL[gi]}　</div>
      <div>ページ</div>
      <div>{"　　　月　　　　日　　　"}</div>
      <div style={{ display: "flex" }}>
        {/* 名前欄：縦書きなので column-reverse で「名」「前」を上下に配置 */}
        <div style={{ display: "flex", flexDirection: "column-reverse" }}>
          <div style={{ flex: 1 }} />
          <div>名</div>
          <div style={{ flex: 2 }} />
          <div>前</div>
          <div style={{ flex: 1 }} />
        </div>
        {/* 名前記入欄（枠線のみ） */}
        <div style={{
          marginTop: "0.1cm", marginRight: "2mm",
          width: `${size - 0.2}cm`, height: `${size * 5.5}cm`,
          border: "solid 2px #333",
        }} />
      </div>
    </div>
  );

  // 大マス（なぞり字付き、十字線入り）
  const renderTopMasu = (kanji: string, pageIndex: number) => (
    <div
      style={{
        position: "relative",
        display: "inline-table",
        border: "solid black 2px",
        marginBlockStart: `${size * 0.25}cm`,
        width: `${size * 1.5}cm`,
        height: `${size * 1.5}cm`,
      }}
    >
      {/* なぞり字 */}
      <div style={{
        position: "absolute", zIndex: 100, color: "black",
        fontSize: `${size * 1.5}cm`,
        right: `${(positionX + 5) * (pageIndex === 1 ? 1.5 : 1) - 36}px`,
        top: `${positionY * (pageIndex === 1 ? 1.5 : 1) - 3}px`,
        opacity,
        fontFamily, fontWeight,
      }}>
        {kanji}
      </div>
      {/* 十字線（横） */}
      <div style={{
        position: "absolute", zIndex: 10,
        top: "50%", left: "0%",
        height: "1px", width: "calc(100% - 2px)",
        border: "dotted 0.5px #888",
      }} />
      {/* 十字線（縦） */}
      <div style={{
        position: "absolute", zIndex: 10,
        top: 0, left: "50%",
        width: "0px", height: "calc(100% - 2px)",
        borderLeft: "solid 1px #888",
      }} />
    </div>
  );

  // 読み方欄
  const renderYomikata = () => (
    <div style={{ marginInlineStart: `${size * 0.25}cm` }}>
      {grade === 1 ? <div>よみかた</div> : <div>読み方</div>}
      <div style={{
        position: "relative",
        display: "flex",
        border: "solid 1px",
        width: `${size * 1.5}cm`,
        height: `${size * 2.5}cm`,
      }}>
        {/* 音訓分けの見出しと区切り線 */}
        {showOnkun && (
          <>
            <div style={{
              display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center",
            }}>
              <div style={{ flex: 1 }} />
              <div>音</div>
              <div style={{ flex: 2 }} />
              <div>訓</div>
              <div style={{ flex: 1 }} />
            </div>
            {/* 縦中央線 */}
            <div style={{
              position: "absolute", zIndex: 10,
              top: 0, left: "50%",
              width: "0px", height: "calc(100% - 2px)",
              borderLeft: "solid 1px #888",
            }} />
            <div style={{ display: "flex", borderInlineStart: "solid 1px" }} />
          </>
        )}
      </div>
    </div>
  );

  // 部首欄
  const renderBushu = () => (
    <div style={{ marginInlineStart: `${size * 0.25}cm` }}>
      <small>部首・部首名</small>
      <div style={{ width: `${size * 1.5}cm`, height: `${size}cm`, border: "solid 1px" }} />
    </div>
  );

  // 画数欄
  const renderKakusu = () => (
    <div style={{ marginInlineStart: `${size * 0.25}cm` }}>
      <div>画数</div>
      <div style={{
        display: "flex", border: "solid 1px",
        justifyContent: "right", alignItems: "center",
        padding: "0.1cm",
        fontSize: `${size * 0.3}cm`,
        width: `${size * 1.5}cm`,
        height: `${size}cm`,
      }}>
        画
      </div>
    </div>
  );

  // 成り立ち欄
  const renderNaritachi = () => (
    <div style={{ paddingBlockStart: `${size * 0.1}cm` }}>
      <div>{NARITACHI_TEXT[gi]}</div>
      <div style={{ width: `${size}cm`, height: `${size * 7}cm`, border: "1px solid" }} />
    </div>
  );

  // 意味欄（縦中央線付き）
  const renderImi = () => (
    <div style={{ paddingBlockStart: `${size * 0.1}cm` }}>
      <div>{IMI_TEXT[gi]}</div>
      <div style={{
        position: "relative",
        display: "inline-table",
        borderRight: "solid 1px", borderLeft: "solid 1px",
        width: `${size}cm`, height: `${size * 7}cm`,
        marginBlockStart: "0cm",
      }}>
        {/* 縦中央線 */}
        <div style={{
          position: "absolute", zIndex: 10,
          top: 0, left: "50%",
          width: "0px", height: "calc(100% - 2px)",
          borderLeft: "solid 1px #888",
        }} />
      </div>
    </div>
  );

  // 繰り返し練習（7マス、先頭3マスになぞり字）
  const renderKurikaeshi = (kanji: string, pageIndex: number) => (
    <div style={{ paddingBlockStart: `${size * 0.1}cm` }}>
      <div>{KURIKAESHI_TEXT[gi]}</div>
      <div style={{ display: "flex" }}>
        {Array.from({ length: MASU_COUNT }, (_, i) => {
          const isFirst = i === 0;
          const showNazori = i < NAZORI_COUNT;
          return (
            <div
              key={i}
              style={{
                position: "relative",
                display: "inline-table",
                width: `${size}cm`,
                height: `${size}cm`,
                border: "solid black 1px",
                borderTop: isFirst ? "solid black 1px" : "none",
              }}
            >
              {/* なぞり字（先頭3マスのみ） */}
              {showNazori && (
                <div style={{
                  position: "absolute", zIndex: 100, color: "black",
                  fontSize: `${size}cm`,
                  right: `${positionX + 5 - 24}px`,
                  top: `${positionY - 2}px`,
                  opacity,
                  fontFamily, fontWeight,
                }}>
                  {pageIndex === 1 ? kanjiFirst : kanjiSecond}
                </div>
              )}
              {/* 十字線（横）: なぞり字マスのみ */}
              {showNazori && (
                <div style={{
                  position: "absolute", zIndex: 10,
                  top: "50%", left: "0%",
                  height: "1px", width: "calc(100% - 2px)",
                  border: "dotted 0.5px #888",
                }} />
              )}
              {/* 十字線（縦）: 最初の5マスまで */}
              {i < 5 && (
                <div style={{
                  position: "absolute", zIndex: 10,
                  top: 0, left: "50%",
                  width: "0px", height: "calc(100% - 2px)",
                  borderLeft: "solid 1px #888",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // 熟語づくり欄（縦中央線付きの2列）
  const renderJukugo = () => (
    <div style={{ paddingBlockStart: `${size * 0.1}cm` }}>
      <div>{JUKUGO_TEXT[gi]}</div>
      <div style={{ display: "flex", justifyContent: "space-between", width: `${size}cm`, height: `${size * 7}cm` }}>
        <div style={{
          position: "relative", display: "inline-table",
          borderRight: "solid 1px", borderLeft: "solid 1px",
          width: `${size}cm`, height: `${size * 3.2}cm`,
        }}>
          <div style={{
            position: "absolute", zIndex: 10,
            top: 0, left: "50%",
            width: "0px", height: "calc(100% - 2px)",
            borderLeft: "solid 1px #888",
          }} />
        </div>
        <div style={{
          position: "relative", display: "inline-table",
          borderRight: "solid 1px", borderLeft: "solid 1px",
          width: `${size}cm`, height: `${size * 3.5}cm`,
        }}>
          <div style={{
            position: "absolute", zIndex: 10,
            top: 0, left: "50%",
            width: "0px", height: "calc(100% - 2px)",
            borderLeft: "solid 1px #888",
          }} />
        </div>
      </div>
    </div>
  );

  // 短文づくり欄（縦中央線付き）
  const renderTanbun = () => (
    <div style={{ paddingBlockStart: `${size * 0.1}cm` }}>
      <div>{TANBUN_TEXT[gi]}</div>
      <div style={{
        position: "relative", display: "inline-table",
        borderRight: "solid 1px", borderLeft: "solid 1px",
        width: `${size}cm`, height: `${size * 7}cm`,
      }}>
        <div style={{
          position: "absolute", zIndex: 10,
          top: 0, left: "50%",
          width: "0px", height: "calc(100% - 2px)",
          borderLeft: "solid 1px #888",
        }} />
      </div>
    </div>
  );

  // 1ページ分のプリント内容（漢字1文字分）
  const renderPage = (kanji: string, pageIndex: number) => (
    <div key={pageIndex} style={{ marginInlineEnd: "0.5cm" }}>
      {/* 上段: 大マス + 読み方 + 部首 + 画数
           align-items: flex-end でラベルの有無に関わらずボックスの左端を揃える */}
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        {renderTopMasu(kanji, pageIndex)}
        {renderYomikata()}
        {showBushu && renderBushu()}
        {renderKakusu()}
      </div>

      {/* 成り立ち（オプション） */}
      {showNaritachi && renderNaritachi()}

      {/* 意味（オプション） */}
      {showImi && renderImi()}

      {/* 繰り返し練習（1段目：常に表示） */}
      {renderKurikaeshi(kanji, pageIndex)}

      {/* 繰り返し練習（2段目：オプション） */}
      {showKurikaeshi2 && renderKurikaeshi(kanji, pageIndex)}

      {/* 熟語づくり（1段目：常に表示） */}
      {renderJukugo()}

      {/* 熟語づくり（2段目：オプション） */}
      {showJukugo2 && renderJukugo()}

      {/* 短文づくり（1段目：常に表示） */}
      {renderTanbun()}

      {/* 短文づくり（2段目：オプション） */}
      {showTanbun2 && renderTanbun()}
    </div>
  );

  // ── レンダリング ────────────────────────────────────

  return (
    <>
      {/* A4 縦向き印刷を指定（globals.css のデフォルト @page を上書き） */}
      <style>{`@page { size: A4 portrait; margin: 0mm; }`}</style>
      <div className="kp-outer min-h-screen bg-gray-50 dark:bg-gray-900">

        {/* ===== ページタイトル ===== */}
        <header className="text-center pt-4 pb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            漢字プリント作成
          </h1>
        </header>

        {/* ===== メインコンテンツ（左:プレビュー 右:コントロール） ===== */}
        <main className="kp-main flex flex-row-reverse gap-4 p-3 items-start justify-center">

          {/* ========== 右パネル: コントロール（印刷時非表示） ========== */}
          <div className="kp-no-print flex flex-col gap-3" style={{ width: "380px", flexShrink: 0 }}>

            {/* 学年選択 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-warm-400 p-3">
              <p className="text-sm font-bold text-warm-600 mb-1">
                はじめに学年を選択してください
              </p>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5, 6].map(g => (
                  <label key={g} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="grade"
                      value={g}
                      checked={grade === g}
                      onChange={() => {
                        se.playSe(se.set)
                        setGrade(g)
                        // 学年に応じて音訓・部首の表示を自動切替
                        const isAdvanced = g > 2
                        setShowOnkun(isAdvanced)
                        setShowBushu(isAdvanced)
                      }}
                      className="accent-warm-500"
                    />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {g}年
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 漢字入力 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-sm font-bold text-warm-600 mb-2">
                ↓ここに漢字を入力してください
              </p>
              <div className="flex gap-3 items-start">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={kanjiFirst}
                    onChange={e => { se.playSe(se.set); setKanjiFirst(e.target.value); }}
                    maxLength={1}
                    className="w-24 h-24 text-6xl text-center border-2 border-gray-300 rounded-lg
                             focus:outline-none focus:border-accent-500
                             dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={kanjiSecond}
                    onChange={e => { se.playSe(se.set); setKanjiSecond(e.target.value); }}
                    maxLength={1}
                    className="w-24 h-24 text-6xl text-center border-2 border-gray-300 rounded-lg
                             focus:outline-none focus:border-accent-500
                             dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                {/* フォント選択 */}
                <div className="text-sm">
                  <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">フォント</p>
                  {(["kyokasho", "mincho", "gothic"] as const).map(f => (
                    <label key={f} className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="fontStyle"
                        value={f}
                        checked={fontStyle === f}
                        onChange={() => { se.playSe(se.set); setFontStyle(f) }}
                        className="accent-warm-500"
                      />
                      {f === "kyokasho" ? "教科書体" : f === "mincho" ? "明朝体" : "ゴシック体"}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 表示オプション */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3
                          flex gap-4">
              <div className="flex flex-col gap-1 text-sm">
                {[
                  { label: "「音読み・訓読み」を分ける", checked: showOnkun, set: setShowOnkun },
                  { label: "「部首・部首名」を表示する", checked: showBushu, set: setShowBushu },
                  { label: "「意味や成り立ち」を表示する", checked: showNaritachi, set: setShowNaritachi },
                  { label: "「漢字の意味」を表示する", checked: showImi, set: setShowImi },
                  { label: "書き写しを2段にする", checked: showKurikaeshi2, set: setShowKurikaeshi2 },
                  { label: "熟語づくりを2段にする", checked: showJukugo2, set: setShowJukugo2 },
                  { label: "短文づくりを2段にする", checked: showTanbun2, set: setShowTanbun2 },
                ].map(({ label, checked, set }) => (
                  <label key={label} className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => { se.playSe(se.pi); set(!checked); }}
                      className="accent-warm-500"
                    />
                    {label}
                  </label>
                ))}
              </div>

              {/* 印刷縮小率 */}
              <div className="text-sm min-w-[140px]">
                <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">印刷縮小率</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                  {Math.round(printScale * 100)}%
                </p>
                <input
                  type="range"
                  min="0.7"
                  max="1"
                  step="0.01"
                  value={printScale}
                  onChange={e => { se.playSe(se.kako); setPrintScale(Number(e.target.value)); }}
                  className="w-full"
                />
              </div>
            </div>

            {/* サイズ・位置調整 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3
                          flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                マスの大きさ
                <input
                  type="number"
                  step="0.01"
                  value={size}
                  onChange={e => { se.playSe(se.set); setSize(Number(e.target.value)); }}
                  className="w-20 h-8 text-center border border-gray-300 rounded
                           dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                cm
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                  左右
                  <input
                    type="number"
                    step="0.5"
                    value={positionX}
                    onChange={e => { se.playSe(se.kako); setPositionX(Number(e.target.value)); }}
                    className="w-16 h-8 text-center border border-gray-300 rounded
                             dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </label>
                <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                  上下
                  <input
                    type="number"
                    step="0.5"
                    value={positionY}
                    onChange={e => { se.playSe(se.kako); setPositionY(Number(e.target.value)); }}
                    className="w-16 h-8 text-center border border-gray-300 rounded
                             dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </label>
              </div>
            </div>

            {/* 文字の濃さ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm">
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                文字の濃さ
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={opacity}
                  onChange={e => { se.playSe(se.kako); setOpacity(Number(e.target.value)); }}
                  className="flex-1"
                />
              </label>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { se.playSe(se.set); window.print(); }}
                className="px-5 py-2 rounded-lg bg-warm-400 hover:bg-warm-500 active:bg-warm-600 active:translate-y-0.5
                         text-white font-bold text-sm shadow transition-colors"
              >
                🖨️ 印　刷
              </button>
              <button
                onClick={() => { se.playSe(se.reset); location.reload(); }}
                className="px-5 py-2 rounded-lg bg-danger-400 hover:bg-danger-500 active:bg-danger-600 active:translate-y-0.5
                         text-white font-bold text-sm shadow transition-colors"
              >
                🔄 リセット
              </button>
            </div>

            {/* 使い方説明 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                          rounded-xl p-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>📚 はじめに学年を選択してください。</p>
              <p>✏️ 漢字を2文字入力すると、プレビューに反映されます。</p>
              <p>🖨️ 「印刷」ボタンで A4 縦書きプリントを印刷できます。</p>
              <p className="text-gray-400">⚠️ PCでの使用が前提です。印刷縮小率を調整するとレイアウトが整います。</p>
            </div>

          </div>

          {/* ========== 左パネル: プレビュー ========== */}
          <div className="flex flex-col gap-2">

            {/* プレビュー見出し（印刷時非表示） */}
            <p className="kp-no-print text-xs text-gray-500 dark:text-gray-400">
              ↓ 印刷イメージ（実際の印刷は A4 で出力されます）
            </p>

            {/* ========== 印刷エリア ========== */}
            <div className="kp-print-wrapper">
              <div
                className="kp-print-area"
                style={{
                  fontFamily: '"UD デジタル 教科書体 NK-R", "Noto Sans JP", sans-serif',
                  padding: "8mm 3mm 8mm 7mm",
                }}
              >
                {/* タイトル行 */}
                {renderTitle()}

                {/* 2ページ分（漢字1文字目 + 2文字目）を横に並べる */}
                <div style={{ display: "flex", alignContent: "space-between" }}>
                  {renderPage(kanjiFirst, 1)}
                  {renderPage(kanjiSecond, 2)}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}

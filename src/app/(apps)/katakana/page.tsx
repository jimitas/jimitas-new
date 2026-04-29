// ======================================================
// カタカナのれんしゅう ページ
//
// URL: /katakana
// 対象: 小学1年生（国語）
//
// 機能:
//   - 絵文字ヒントを見てカタカナ語をカタカナ文字表で入力
//   - 3段階の難易度（Lv1・Lv2・全問）
//   - ヒント①: ひらがなで表示（ー はそのまま）
//   - ヒント②: カタカナで表示（ほぼ答え）
//   - 正解で自動判定・コイン獲得
// ======================================================

"use client";

import { useState, useCallback, useRef } from "react";
import * as se from "@/lib/se";
import { useCoins } from "@/hooks/useCoins";
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay";

// ── カタカナ→ひらがな変換 ─────────────────────────────
// ー（U+30FC）はカタカナ範囲外なので変換されず、そのまま残る
// 例: ハンバーガー → はんばーがー
function toHiragana(kata: string): string {
  return kata.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// ── 問題データ ────────────────────────────────────────
// id 1-25 : Lv1 かんたん（2〜4文字、1年生によく知られた語）
// id 26-50: Lv2 むずかしい（5文字以上、または複雑な組み合わせ）
const DATA = [
  // ── Lv1: かんたん ─────────────────────────────────
  { id:  1, emoji: "🍞",  word: "パン"         }, // 2文字
  { id:  2, emoji: "🍕",  word: "ピザ"         }, // 2文字
  { id:  3, emoji: "🥤",  word: "コップ"       }, // 3文字
  { id:  4, emoji: "📓",  word: "ノート"       }, // 3文字
  { id:  5, emoji: "🍋",  word: "レモン"       }, // 3文字
  { id:  6, emoji: "🍈",  word: "メロン"       }, // 3文字
  { id:  7, emoji: "🍅",  word: "トマト"       }, // 3文字
  { id:  8, emoji: "🥗",  word: "サラダ"       }, // 3文字
  { id:  9, emoji: "🍌",  word: "バナナ"       }, // 3文字
  { id: 10, emoji: "🍎",  word: "リンゴ"       }, // 3文字
  { id: 11, emoji: "🍓",  word: "イチゴ"       }, // 3文字
  { id: 12, emoji: "🛞",  word: "タイヤ"       }, // 3文字
  { id: 13, emoji: "🥝",  word: "キウイ"       }, // 3文字
  { id: 14, emoji: "⛺",  word: "テント"       }, // 3文字
  { id: 15, emoji: "🎂",  word: "ケーキ"       }, // 3文字（ー含む）
  { id: 16, emoji: "🥬",  word: "レタス"       }, // 3文字
  { id: 17, emoji: "🎸",  word: "ギター"       }, // 3文字（ー含む）
  { id: 18, emoji: "🎹",  word: "ピアノ"       }, // 3文字
  { id: 19, emoji: "🍦",  word: "アイス"       }, // 3文字
  { id: 20, emoji: "🪀",  word: "ヨーヨー"     }, // 4文字（ー含む）
  { id: 21, emoji: "🍪",  word: "クッキー"     }, // 4文字（ー含む）
  { id: 22, emoji: "🧃",  word: "ジュース"     }, // 4文字（ー含む）
  { id: 23, emoji: "🤖",  word: "ロボット"     }, // 4文字
  { id: 24, emoji: "🥄",  word: "スプーン"     }, // 4文字（ー含む）
  { id: 25, emoji: "🎒",  word: "ランドセル"   }, // 5文字（1年生全員が知っている）
  // ── Lv2: むずかしい ───────────────────────────────
  { id: 26, emoji: "🌷",  word: "チューリップ" }, // 6文字（ュ含む）
  { id: 27, emoji: "🍴",  word: "フォーク"     }, // 4文字（ォ含む）
  { id: 28, emoji: "👕",  word: "セーター"     }, // 4文字（ー含む）
  { id: 29, emoji: "👟",  word: "シューズ"     }, // 4文字（ュ含む）
  { id: 30, emoji: "🍳",  word: "フライパン"   }, // 5文字
  { id: 31, emoji: "🍊",  word: "オレンジ"     }, // 4文字（ジ=濁音）
  { id: 32, emoji: "🦌",  word: "トナカイ"     }, // 4文字
  { id: 33, emoji: "🌭",  word: "ウィンナー"   }, // 5文字（ィ含む）
  { id: 34, emoji: "👔",  word: "ワイシャツ"   }, // 5文字
  { id: 35, emoji: "🍔",  word: "ハンバーガー" }, // 6文字（ー含む）
  { id: 36, emoji: "🚁",  word: "ヘリコプター" }, // 6文字（ー含む）
  { id: 37, emoji: "🥞",  word: "ホットケーキ" }, // 6文字
  { id: 38, emoji: "🍨",  word: "アイスクリーム" }, // 7文字
  { id: 39, emoji: "🐻",  word: "ツキノワグマ" }, // 6文字
  { id: 40, emoji: "💻",  word: "コンピュータ" }, // 6文字（ュ含む）
  { id: 41, emoji: "🍝",  word: "スパゲッティ" }, // 6文字（ッ含む）
  { id: 42, emoji: "🚗",  word: "モーターカー" }, // 6文字（ー含む）
  { id: 43, emoji: "🏍️", word: "オートバイ"   }, // 5文字
  { id: 44, emoji: "🎺",  word: "トランペット" }, // 6文字（ッ含む）
  { id: 45, emoji: "🍦",  word: "ソフトクリーム" }, // 7文字
  { id: 46, emoji: "🥁",  word: "タンブリン"   }, // 5文字
  { id: 47, emoji: "💎",  word: "イヤリング"   }, // 5文字
  { id: 48, emoji: "🎡",  word: "ルーレット"   }, // 5文字（ッ含む）
  { id: 49, emoji: "🍫",  word: "チョコレート" }, // 6文字（ョ含む）
  { id: 50, emoji: "🎻",  word: "バイオリン"   }, // 5文字
];

// ── カタカナ文字表 ────────────────────────────────────
// 5行（ア段〜オ段）× 16列（ア行〜特殊）
const KATA_GRID: string[][] = [
  // ア段
  ["ア","カ","サ","タ","ナ","ハ","マ","ヤ","ラ","ワ","ガ","ザ","ダ","バ","パ","ッ"],
  // イ段
  ["イ","キ","シ","チ","ニ","ヒ","ミ","ャ","リ","ァ","ギ","ジ","ヂ","ビ","ピ","ィ"],
  // ウ段
  ["ウ","ク","ス","ツ","ヌ","フ","ム","ユ","ル","ヲ","グ","ズ","ヅ","ブ","プ","ー"],
  // エ段
  ["エ","ケ","セ","テ","ネ","ヘ","メ","ュ","レ","ォ","ゲ","ゼ","デ","ベ","ペ","ェ"],
  // オ段
  ["オ","コ","ソ","ト","ノ","ホ","モ","ヨ","ロ","ン","ゴ","ゾ","ド","ボ","ポ","ョ"],
];

// 列の種類 → ボタン色分けに使う
type ColType = "seion" | "dakuten" | "tokushu";
function colType(ci: number): ColType {
  if (ci <= 9) return "seion";
  if (ci <= 14) return "dakuten";
  return "tokushu";
}

// ── ページ本体 ────────────────────────────────────────
export default function KatakanaPage() {
  const [mode, setMode]             = useState<1 | 2 | 3>(1);
  const [flag, setFlag]             = useState(false);
  const [myAnswer, setMyAnswer]     = useState("");
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [isSeikai, setIsSeikai]     = useState(false);
  // 0: ヒントなし / 1: ひらがな表示 / 2: カタカナ表示（ほぼ答え）
  const [hintLevel, setHintLevel]   = useState<0 | 1 | 2>(0);

  const { coins, addCoins } = useCoins();
  const hasAnsweredRef = useRef(false);

  // ── 問題を出す ──────────────────────────────────────
  const handleQuestion = useCallback(() => {
    se.playSe(se.set);
    let pool: number[];
    if (mode === 1)      pool = DATA.slice(0,  25).map((_, i) => i);
    else if (mode === 2) pool = DATA.slice(25, 50).map((_, i) => i + 25);
    else                 pool = DATA.map((_, i) => i);
    const idx = pool[Math.floor(Math.random() * pool.length)];
    setCurrentIdx(idx);
    setFlag(true);
    setMyAnswer("");
    setIsSeikai(false);
    setHintLevel(0);
    hasAnsweredRef.current = false;
  }, [mode]);

  // ── こたえを見る ───────────────────────────────────
  const handleShowAnswer = useCallback(() => {
    if (!flag || currentIdx === null) return;
    se.playSe(se.seikai2);
    setMyAnswer(DATA[currentIdx].word);
    setFlag(false);
  }, [flag, currentIdx]);

  // ── ヒントを表示 ───────────────────────────────────
  const handleHint = useCallback((level: 1 | 2) => {
    if (!flag) return;
    se.playSe(se.set);
    setHintLevel(level);
  }, [flag]);

  // ── 1文字消す ──────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!flag || myAnswer.length === 0) return;
    se.playSe(se.move1);
    setMyAnswer((prev) => prev.slice(0, -1));
  }, [flag, myAnswer]);

  // ── 全部消す ──────────────────────────────────────
  const handleClear = useCallback(() => {
    if (!flag || myAnswer.length === 0) return;
    se.playSe(se.move2);
    setMyAnswer("");
  }, [flag, myAnswer]);

  // ── 文字クリック・正解チェック ───────────────────
  const handleChar = useCallback((char: string) => {
    if (!flag || currentIdx === null) return;
    se.playSe(se.pi);
    const next = myAnswer + char;
    setMyAnswer(next);

    if (next === DATA[currentIdx].word) {
      setFlag(false);
      setIsSeikai(true);
      if (!hasAnsweredRef.current) {
        addCoins(1);
        hasAnsweredRef.current = true;
      }
      se.playSe(se.seikai1);
    }
  }, [flag, currentIdx, myAnswer, addCoins]);

  // ── モード変更 ────────────────────────────────────
  const handleMode = (m: 1 | 2 | 3) => {
    se.playSe(se.set);
    setMode(m);
  };

  // ── ヒント表示テキスト ─────────────────────────
  const hintText = currentIdx !== null
    ? hintLevel === 1
      ? toHiragana(DATA[currentIdx].word)   // ひらがな（ー はそのまま）
      : hintLevel === 2
      ? DATA[currentIdx].word               // カタカナ（答えそのもの）
      : null
    : null;

  return (
    <div className="min-h-screen flex flex-col px-4 py-3 select-none">

      {/* タイトル＋レベル選択（1行） */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800 shrink-0">
          カタカナのれんしゅう
        </h1>
        <div className="flex gap-2">
          {([
            [1, "Lv1"],
            [2, "Lv2"],
            [3, "ぜんぶ"],
          ] as [1 | 2 | 3, string][]).map(([lv, label]) => (
            <button
              key={lv}
              onClick={() => handleMode(lv)}
              className={`text-base px-4 py-2 rounded-lg font-bold transition-all active:scale-95 ${
                mode === lv
                  ? "bg-brand-500 text-white shadow"
                  : "bg-white border-2 border-brand-200 text-brand-600 hover:bg-brand-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ①段目: 絵文字ボックス ｜ 入力欄（横並び・同じ高さ） */}
      <div className="flex gap-3 mb-3 items-stretch">

        {/* 左：問題ボックス（絵文字 + ヒント） */}
        <div
          className={`w-2/5 flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-colors ${
            isSeikai
              ? "bg-yellow-50 border-yellow-300"
              : "bg-yellow-100 border-yellow-300"
          }`}
        >
          {isSeikai ? (
            <p className="text-3xl font-bold text-red-500 leading-snug">
              せいかい！🎉
            </p>
          ) : currentIdx !== null ? (
            <>
              <p className="text-7xl leading-none">{DATA[currentIdx].emoji}</p>
              {hintText !== null ? (
                <p className={`text-xl font-bold mt-2 tracking-widest leading-snug ${
                  hintLevel === 2 ? "text-accent-600" : "text-gray-600"
                }`}>
                  {hintText}
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-2">カタカナでにゅうりょくしよう</p>
              )}
            </>
          ) : (
            <p className="text-base text-gray-400 font-bold">もんだいを<br />おしてね</p>
          )}
        </div>

        {/* 右：入力表示欄 */}
        <div className="flex-1 flex items-center justify-center bg-white border-2 border-gray-300 rounded-2xl px-4 text-4xl font-bold tracking-widest text-gray-700 min-h-32">
          {myAnswer || <span className="text-gray-300">─</span>}
        </div>

      </div>

      {/* ②段目: ボタン群（6つ1行） */}
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        <button
          onClick={handleQuestion}
          className="px-5 py-3 rounded-xl text-base font-bold bg-brand-400 text-white hover:bg-brand-500 active:bg-brand-600 active:scale-95 transition-all shadow"
        >
          ▶ もんだい
        </button>
        <button
          onClick={handleShowAnswer}
          disabled={!flag}
          className="px-5 py-3 rounded-xl text-base font-bold bg-accent-400 text-white hover:bg-accent-500 active:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          👁 こたえ
        </button>
        <button
          onClick={handleDelete}
          disabled={!flag || myAnswer.length === 0}
          className="px-5 py-3 rounded-xl text-base font-bold bg-accent-400 text-white hover:bg-accent-500 active:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          ← 1つ消す
        </button>
        <button
          onClick={handleClear}
          disabled={!flag || myAnswer.length === 0}
          className="px-5 py-3 rounded-xl text-base font-bold bg-accent-400 text-white hover:bg-accent-500 active:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          🗑 全部消す
        </button>
        <button
          onClick={() => handleHint(1)}
          disabled={!flag}
          className={`px-5 py-3 rounded-xl text-base font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border-2 ${
            hintLevel === 1
              ? "bg-brand-500 text-white border-brand-600 shadow"
              : "bg-white text-brand-600 border-brand-400 hover:bg-brand-50"
          }`}
        >
          ヒント①
        </button>
        <button
          onClick={() => handleHint(2)}
          disabled={!flag}
          className={`px-5 py-3 rounded-xl text-base font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border-2 ${
            hintLevel === 2
              ? "bg-brand-600 text-white border-brand-700 shadow"
              : "bg-white text-brand-700 border-brand-500 hover:bg-brand-50"
          }`}
        >
          ヒント②
        </button>
      </div>

      {/* ③段目: カタカナ文字表（flex-1 で残り高さいっぱいに） */}
      <div className="flex-1 bg-gray-100 rounded-2xl p-4 mb-3 flex flex-col">
        {/* 凡例 */}
        <div className="flex gap-4 justify-center mb-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-warm-400" />
            清音
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-blue-400" />
            濁音・半濁音
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-purple-400" />
            特殊（小文字・長音）
          </span>
        </div>

        {/* 文字ボタン：行を justify-between で縦に均等配置、ボタンは aspect-square で正方形を保つ */}
        <div className="flex-1 flex flex-col justify-between">
          {KATA_GRID.map((row, ri) => (
            <div key={ri} className="flex items-center gap-1.5">
              {/* 行ラベル */}
              <span className="w-8 shrink-0 text-sm text-gray-400 text-right leading-none">
                {["ア段","イ段","ウ段","エ段","オ段"][ri]}
              </span>
              {/* 16文字ボタン（flex-1 + aspect-square で正方形・均等展開） */}
              {row.map((char, ci) => {
                const type = colType(ci);
                return (
                  <button
                    key={ci}
                    onClick={() => handleChar(char)}
                    disabled={!flag}
                    className={`flex-1 aspect-[4/3] rounded-xl text-lg font-bold transition-all active:scale-90 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                      type === "tokushu"
                        ? "bg-purple-400 text-white hover:bg-purple-500"
                        : type === "dakuten"
                        ? "bg-blue-400 text-white hover:bg-blue-500"
                        : "bg-warm-400 text-white hover:bg-warm-500"
                    }`}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ④段目: コイン */}
      <CoinDisplay coins={coins} />

    </div>
  );
}

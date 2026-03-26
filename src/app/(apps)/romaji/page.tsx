// ======================================================
// ローマ字のれんしゅう ページ
//
// URL: /romaji
// 対象: 小学3〜4年生（国語）
//
// 機能:
//   - ひらがなを見てローマ字をキーボードで入力
//   - 3段階の難易度（Lv1・Lv2・全問）
//   - QWERTY キーボード（大文字/小文字 切り替え）
//   - 複数正解パターン対応（si/shi 等）
//   - コインでスコア管理（localStorage）
// ======================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import * as se from "@/lib/se";

// ── 問題データ ────────────────────────────────────────
// id 1-36: Lv1かんたん / id 37-65: Lv2むずかしい
const DATA = [
  { id:  1, word: "あお",       ans_1: "ao",       ans_2: "",         ans_3: "",       ans_4: "" },
  { id:  2, word: "いえ",       ans_1: "ie",       ans_2: "",         ans_3: "",       ans_4: "" },
  { id:  3, word: "うえ",       ans_1: "ue",       ans_2: "",         ans_3: "",       ans_4: "" },
  { id:  4, word: "かい",       ans_1: "kai",      ans_2: "",         ans_3: "",       ans_4: "" },
  { id:  5, word: "きく",       ans_1: "kiku",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id:  6, word: "いけ",       ans_1: "ike",      ans_2: "",         ans_3: "",       ans_4: "" },
  { id:  7, word: "こい",       ans_1: "koi",      ans_2: "",         ans_3: "",       ans_4: "" },
  { id:  8, word: "さか",       ans_1: "saka",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id:  9, word: "しせい",     ans_1: "sisei",    ans_2: "shisei",   ans_3: "",       ans_4: "" },
  { id: 10, word: "せかい",     ans_1: "sekai",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 11, word: "そこ",       ans_1: "soko",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 12, word: "たこ",       ans_1: "tako",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 13, word: "くち",       ans_1: "kuti",     ans_2: "kuchi",    ans_3: "",       ans_4: "" },
  { id: 14, word: "てつ",       ans_1: "tetu",     ans_2: "tetsu",    ans_3: "",       ans_4: "" },
  { id: 15, word: "とけい",     ans_1: "tokei",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 16, word: "なす",       ans_1: "nasu",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 17, word: "にく",       ans_1: "niku",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 18, word: "ぬの",       ans_1: "nuno",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 19, word: "ねこ",       ans_1: "neko",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 20, word: "はと",       ans_1: "hato",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 21, word: "ひふ",       ans_1: "hihu",     ans_2: "hifu",     ans_3: "",       ans_4: "" },
  { id: 22, word: "へそ",       ans_1: "heso",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 23, word: "ほし",       ans_1: "hosi",     ans_2: "hoshi",    ans_3: "",       ans_4: "" },
  { id: 24, word: "まめ",       ans_1: "mame",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 25, word: "うみ",       ans_1: "umi",      ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 26, word: "むし",       ans_1: "musi",     ans_2: "mushi",    ans_3: "",       ans_4: "" },
  { id: 27, word: "もも",       ans_1: "momo",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 28, word: "やま",       ans_1: "yama",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 29, word: "やさい",     ans_1: "yasai",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 30, word: "ゆき",       ans_1: "yuki",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 31, word: "ひよこ",     ans_1: "hiyoko",   ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 32, word: "とら",       ans_1: "tora",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 33, word: "ほたる",     ans_1: "hotaru",   ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 34, word: "すみれ",     ans_1: "sumire",   ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 35, word: "いろり",     ans_1: "irori",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 36, word: "わに",       ans_1: "wani",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 37, word: "みかん",     ans_1: "mikan",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 38, word: "うさぎ",     ans_1: "usagi",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 39, word: "えのぐ",     ans_1: "enogu",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 40, word: "げき",       ans_1: "geki",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 41, word: "りんご",     ans_1: "ringo",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 42, word: "ざりがに",   ans_1: "zarigani", ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 43, word: "もじ",       ans_1: "mozi",     ans_2: "moji",     ans_3: "",       ans_4: "" },
  { id: 44, word: "かぜ",       ans_1: "kaze",     ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 45, word: "かぞく",     ans_1: "kazoku",   ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 46, word: "ぱんだ",     ans_1: "panda",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 47, word: "えんぴつ",   ans_1: "enpitu",   ans_2: "enpitsu",  ans_3: "",       ans_4: "" },
  { id: 48, word: "てんぷら",   ans_1: "tenpura",  ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 49, word: "たんぽぽ",   ans_1: "tanpopo",  ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 50, word: "きゃべつ",   ans_1: "kyabetu",  ans_2: "kyabetsu", ans_3: "",       ans_4: "" },
  { id: 51, word: "でんしゃ",   ans_1: "densya",   ans_2: "densha",   ans_3: "",       ans_4: "" },
  { id: 52, word: "ちょきん",   ans_1: "tyokin",   ans_2: "chokin",   ans_3: "",       ans_4: "" },
  { id: 53, word: "おもちゃ",   ans_1: "omotya",   ans_2: "omocha",   ans_3: "",       ans_4: "" },
  { id: 54, word: "ひゃくえん", ans_1: "hyakuen",  ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 55, word: "みゃく",     ans_1: "myaku",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 56, word: "りょかん",   ans_1: "ryokan",   ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 57, word: "きんぎょ",   ans_1: "kingyo",   ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 58, word: "じゃがいも", ans_1: "zyagaimo", ans_2: "jagaimo",  ans_3: "",       ans_4: "" },
  { id: 59, word: "しんじゅ",   ans_1: "sinzyu",   ans_2: "sinju",    ans_3: "shinzyu", ans_4: "shinju" },
  { id: 60, word: "おかあさん", ans_1: "okâsan",   ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 61, word: "おにいさん", ans_1: "onîsan",   ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 62, word: "ひこうき",   ans_1: "hikôki",   ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 63, word: "ねっこ",     ans_1: "nekko",    ans_2: "",         ans_3: "",       ans_4: "" },
  { id: 64, word: "ざっし",     ans_1: "zassi",    ans_2: "zasshi",   ans_3: "",       ans_4: "" },
  { id: 65, word: "らっぱ",     ans_1: "rappa",    ans_2: "",         ans_3: "",       ans_4: "" },
];

// ── キーボードレイアウト ──────────────────────────────
const LAYOUT_LOWER = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
  ['â','î','û','ê','ô'],
];
const LAYOUT_UPPER = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
  ['Ā','Ī','Ū','Ē','Ō'],
];

// 実際に使うキー（それ以外はグレーアウト）
const ACTIVE_LOWER = new Set(['a','i','u','e','o','k','s','t','n','h','m','y','r','w','g','z','d','b','p','f','j','c','â','î','û','ê','ô']);
const ACTIVE_UPPER = new Set(['A','I','U','E','O','K','S','T','N','H','M','Y','R','W','G','Z','D','B','P','F','J','C','Ā','Ī','Ū','Ē','Ō']);
// 母音・長音記号（オレンジ）
const VOWEL_LOWER = new Set(['a','i','u','e','o','â','î','û','ê','ô']);
const VOWEL_UPPER = new Set(['A','I','U','E','O','Ā','Ī','Ū','Ē','Ō']);

// ── 長音記号の正規化 ──────────────────────────────────
function normalize(str: string): string {
  return str.toLowerCase()
    .replace(/ā/gi, 'â')
    .replace(/ī/gi, 'î')
    .replace(/ū/gi, 'û')
    .replace(/ē/gi, 'ê')
    .replace(/ō/gi, 'ô');
}

// ── ページ本体 ────────────────────────────────────────
export default function RomajiPage() {
  const [mode, setMode]             = useState<1 | 2 | 3>(1);
  const [flag, setFlag]             = useState(false);   // 出題中フラグ
  const [capsFlag, setCapsFlag]     = useState(false);   // 大文字モード
  const [myAnswer, setMyAnswer]     = useState("");      // 入力中の回答
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [score, setScore]           = useState(0);
  const [isSeikai, setIsSeikai]     = useState(false);   // 正解演出フラグ

  // ── スコアをlocalStorageから復元 ──────────────────
  useEffect(() => {
    const saved = parseInt(localStorage.getItem("romajiScore") ?? "0") || 0;
    setScore(saved);
  }, []);

  // ── 正解チェック（myAnswer が変わるたびに実行） ────
  useEffect(() => {
    if (!flag || currentIdx === null || myAnswer === "") return;

    const d = DATA[currentIdx];
    const answers = [d.ans_1, d.ans_2, d.ans_3, d.ans_4]
      .filter(Boolean)
      .map(normalize);

    if (answers.includes(normalize(myAnswer))) {
      setFlag(false);
      setIsSeikai(true);
      setScore((prev) => {
        const next = prev + 1;
        localStorage.setItem("romajiScore", String(next));
        return next;
      });
      se.playSe(se.seikai1);
    }
  }, [myAnswer, flag, currentIdx]);

  // ── 問題を出す ──────────────────────────────────────
  const handleQuestion = useCallback(() => {
    se.playSe(se.set);
    let idx: number;
    if (mode === 1) idx = Math.floor(Math.random() * 36);
    else if (mode === 2) idx = Math.floor(Math.random() * 29 + 36);
    else idx = Math.floor(Math.random() * DATA.length);
    setCurrentIdx(idx);
    setFlag(true);
    setMyAnswer("");
    setIsSeikai(false);
  }, [mode]);

  // ── 答えを見る ─────────────────────────────────────
  const handleShowAnswer = useCallback(() => {
    if (!flag || currentIdx === null) return;
    se.playSe(se.seikai2);
    const d = DATA[currentIdx];
    const answers = [d.ans_1, d.ans_2, d.ans_3, d.ans_4].filter(Boolean).join(",");
    setMyAnswer(answers);
  }, [flag, currentIdx]);

  // ── 1つ消す ───────────────────────────────────────
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

  // ── 大文字/小文字 切り替え ──────────────────────
  const handleCaps = useCallback(() => {
    se.playSe(se.set);
    setCapsFlag((prev) => !prev);
  }, []);

  // ── キー入力 ──────────────────────────────────────
  const handleKey = useCallback((letter: string) => {
    if (!flag) return;
    se.playSe(se.pi);
    setMyAnswer((prev) => prev + letter);
  }, [flag]);

  // ── モード変更 ────────────────────────────────────
  const handleMode = (m: 1 | 2 | 3) => {
    se.playSe(se.set);
    setMode(m);
  };

  // ── 使用するレイアウトとキーセット ──────────────
  const layout      = capsFlag ? LAYOUT_UPPER : LAYOUT_LOWER;
  const activeKeys  = capsFlag ? ACTIVE_UPPER : ACTIVE_LOWER;
  const vowelKeys   = capsFlag ? VOWEL_UPPER  : VOWEL_LOWER;

  return (
    <div className="max-w-xl mx-auto px-3 py-5 select-none">

      {/* タイトル */}
      <h1 className="text-2xl font-bold text-center mb-1 text-gray-800">
        ローマ字のれんしゅう
      </h1>
      <p className="text-sm text-center text-gray-500 mb-4">
        ひらがなを見て、ローマ字をキーボードで入力しよう
      </p>

      {/* レベル選択 */}
      <div className="flex gap-2 justify-center mb-4">
        {([
          [1, "Lv1：かんたん"],
          [2, "Lv2：むずかしい"],
          [3, "Lv1＋Lv2"],
        ] as [1 | 2 | 3, string][]).map(([lv, label]) => (
          <button
            key={lv}
            onClick={() => handleMode(lv)}
            className={`text-xs px-3 py-2 rounded-lg font-bold transition-all active:scale-95 ${
              mode === lv
                ? "bg-brand-500 text-white shadow-md"
                : "bg-white border-2 border-brand-200 text-brand-600 hover:bg-brand-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 問題表示ボックス */}
      <div
        className={`text-center text-4xl font-bold rounded-xl py-5 mb-2 border-2 transition-colors ${
          isSeikai
            ? "bg-yellow-50 border-yellow-300 text-red-500"
            : "bg-yellow-100 border-yellow-300 text-gray-800"
        }`}
      >
        {isSeikai
          ? "せいかい！🎉"
          : currentIdx !== null
          ? DATA[currentIdx].word
          : "もんだいをおしてね。"}
      </div>

      {/* 入力表示ボックス */}
      <div className="text-center text-2xl font-mono font-bold bg-white border-2 border-gray-300 rounded-xl py-3 mb-3 min-h-[3rem] tracking-widest text-gray-700">
        {myAnswer || <span className="text-gray-300">─</span>}
      </div>

      {/* コントロールボタン */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {/* もんだい */}
        <button
          onClick={handleQuestion}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-warm-500 text-white hover:bg-warm-600 active:scale-95 transition-all shadow"
        >
          ▶ もんだい
        </button>
        {/* 答えを見る */}
        <button
          onClick={handleShowAnswer}
          disabled={!flag}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          👁 答えを見る
        </button>
        {/* 1つ消す */}
        <button
          onClick={handleDelete}
          disabled={!flag || myAnswer.length === 0}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          ← 1つ消す
        </button>
        {/* 全部消す */}
        <button
          onClick={handleClear}
          disabled={!flag || myAnswer.length === 0}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          🗑 全部消す
        </button>
        {/* 大文字切り替え */}
        <button
          onClick={handleCaps}
          className={`px-4 py-2 rounded-lg text-sm font-bold active:scale-95 transition-all border-2 ${
            capsFlag
              ? "bg-purple-500 text-white border-purple-600"
              : "bg-white text-purple-600 border-purple-300 hover:bg-purple-50"
          }`}
        >
          {capsFlag ? "A→a" : "a→A"}
        </button>
      </div>

      {/* キーボード */}
      <div className="bg-gray-100 rounded-xl p-2 mb-4 space-y-1">
        {layout.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1">
            {row.map((letter) => {
              const isActive = activeKeys.has(letter);
              const isVowel  = vowelKeys.has(letter);
              return (
                <button
                  key={letter}
                  onClick={() => handleKey(letter)}
                  disabled={!isActive}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm sm:text-base font-bold transition-all active:scale-90 ${
                    !isActive
                      ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                      : isVowel
                      ? "bg-warm-400 text-white hover:bg-warm-500 shadow-sm"
                      : "bg-accent-400 text-white hover:bg-accent-500 shadow-sm"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* スコア（コイン） */}
      <div className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600">🪙</span>
          <span className="text-lg font-bold text-warm-500">{score}</span>
          <span className="text-xs text-gray-400">まい</span>
          {score > 0 && (
            <div className="flex flex-wrap gap-0.5 ml-1">
              {Array.from({ length: Math.min(score, 30) }).map((_, i) => (
                <span key={i} className="text-sm">🪙</span>
              ))}
              {score > 30 && (
                <span className="text-xs text-gray-400">…</span>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

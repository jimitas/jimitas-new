"use client"

// ======================================================
// 漢字テスト作成 ページ
//
// URL: /kanji-test
// 対象: 先生向け（1〜6年生の漢字テスト・プリント作成）
//
// 機能:
//   - テキストエリアに問題を1行1問で入力
//     @漢字@ で囲んだ部分に下線が引かれる
//   - 作成ボタン: 入力内容をプレビューに反映
//   - シャッフルボタン: 問題の順番をランダムに入れ替え
//   - 印刷ボタン: A4横向き縦書きで印刷
//   - 設定: 学年プリセット・問題数・フォントサイズ・段数・
//           表題・副題・名前欄・説明欄
//   - テキストファイルの保存・読み込み
//
// 印刷の仕組み:
//   CSS の writing-mode: vertical-rl で縦書きA4レイアウトを実現。
//   スクリーンでは scale(0.5) でプレビュー表示し、
//   印刷時は scale(1) に戻す（globals.css の @media print で制御）。
// ======================================================

import { useState, useRef, useEffect } from "react"
import * as se                         from "@/lib/se"
import { shuffled }                    from "@/lib/utils"

// localStorage キー（保存データの構造を変えたらバージョンを上げる）
const STORAGE_KEY = "jimitas_kanji_test_v1"

// 保存データの型（ゆるめにバリデーション）
type SavedData = {
  inputText?: string
  displayLines?: string[]
  grade?: number | null
  mondaisu?: number
  fontSize?: number
  dansu?: 1 | 2
  titleIndex?: number
  subTitleText?: string
  namaeIndex?: number
  setumeiIndex?: number
  saveFileName?: string
}

// ── 定数 ─────────────────────────────────────────────

// 問題番号記号（最大20問）
const BANGOU = [
  "①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩",
  "⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳",
]

// 表題の選択肢
const DAIMEI = ["漢字テスト", "かん字テスト", "かんじテスト"]

// 説明文の選択肢
const SETUMEI_DATA = [
  "線を引いた部分を漢字（漢字と送り仮名）で書きましょう。",
  "せんを　ひいた　ぶぶんを　かん字（かん字とおくりがな）で　書きましょう。",
  "線を引いた部分の読みを書きましょう。",
  "せんを　ひいた　かん字の　よみを　書きましょう。",
]

// 名前欄の選択肢（3セット × 3項目）
const NAMAE_DATA = [
  "年", "組", "名前",
  "年", "くみ", "なまえ",
  "ねん", "くみ", "なまえ",
]

// 学年ごとのプリセット値（index 0〜5 = 1年〜6年）
const PRESET_MONDAISU      = [7,  7,  10, 10, 10, 20]
const PRESET_TITLE_INDEX   = [2,  1,   1,  1,  0,  0]
const PRESET_NAMAE_INDEX   = [2,  1,   0,  0,  0,  0]
const PRESET_SETUMEI_INDEX = [1,  1,   1,  0,  0,  0]

// ── ヘルパー関数 ──────────────────────────────────────

/**
 * HTML エスケープ（XSS 対策）
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * 問題文を HTML に変換する。
 * @漢字@ で囲まれた部分を下線付き <span> に変換する。
 *
 * ※ writing-mode: vertical-rl の縦書きでは
 *    border-right が視覚的に「下線」として表示される。
 */
function parseQuestion(line: string): string {
  return line
    .split("@")
    .map((part, i) =>
      i % 2 === 0
        ? escapeHtml(part)
        : `<span style="border-right:1px black double;">${escapeHtml(part)}</span>`
    )
    .join("")
}

/**
 * テーブルのレイアウトパラメータを計算する。
 *
 * 縦書きの印刷エリアは 297mm × 210mm（A4横）。
 * 幅 960px / 問題数 でセル幅を計算する（おおよそ A4 横幅に合わせた値）。
 */
function calcTableLayout(mondaisu: number, dansu: 1 | 2) {
  if (dansu === 1) {
    return {
      tdWidth:    `${960 / mondaisu}px`,
      divWidth:   `${800 / mondaisu}px`,
      tdHeight:   "320px",
      upperCount: mondaisu,
      lowerCount: 0,
    }
  }
  // dansu === 2: 上段・下段に分割（Math.ceil で上段が1問多い場合も対応）
  const upperCount = Math.ceil(mondaisu / 2)
  const lowerCount = Math.floor(mondaisu / 2)
  const colsForWidth = Math.ceil(mondaisu / 2)
  return {
    tdWidth:    `${960 / colsForWidth}px`,
    divWidth:   `${800 / colsForWidth}px`,
    tdHeight:   "160px",
    upperCount,
    lowerCount,
  }
}

// ── コンポーネント ───────────────────────────────────

export default function KanpuriPage() {

  // ── 状態管理 ──────────────────────────────────────

  // テキストエリアの入力値（問題の原文）
  const [inputText, setInputText]       = useState("")
  // プレビューに表示する問題の HTML 文字列配列（作成・シャッフルで更新）
  const [displayLines, setDisplayLines] = useState<string[]>([])

  // 学年（null: 未選択）
  const [grade, setGrade]               = useState<number | null>(null)

  // 設定
  const [mondaisu,     setMondaisu]     = useState(10)     // 問題数
  const [fontSize,     setFontSize]     = useState(20)     // フォントサイズ
  const [dansu,        setDansu]        = useState<1 | 2>(1) // 段数
  const [titleIndex,   setTitleIndex]   = useState(0)      // 表題
  const [subTitleText, setSubTitleText] = useState("")      // 副題
  const [namaeIndex,   setNamaeIndex]   = useState(0)      // 名前欄
  const [setumeiIndex, setSetumeiIndex] = useState(0)      // 説明欄
  const [saveFileName, setSaveFileName] = useState("")      // 保存ファイル名

  // エラー・通知メッセージ
  const [msg, setMsg]   = useState("")
  const msgTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef    = useRef<HTMLInputElement>(null)

  // localStorage 復元完了フラグ（復元前に書き戻しが走るのを防ぐ）
  const [loaded, setLoaded] = useState(false)

  // ── localStorage から復元（マウント時1回だけ） ────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw) as SavedData
        if (typeof data.inputText === "string") setInputText(data.inputText)
        if (Array.isArray(data.displayLines)) {
          setDisplayLines(data.displayLines.filter(s => typeof s === "string"))
        }
        if (data.grade === null || (typeof data.grade === "number" && data.grade >= 1 && data.grade <= 6)) {
          setGrade(data.grade)
        }
        if (typeof data.mondaisu === "number" && data.mondaisu >= 1 && data.mondaisu <= 20) {
          setMondaisu(data.mondaisu)
        }
        if (typeof data.fontSize === "number" && data.fontSize >= 8 && data.fontSize <= 60) {
          setFontSize(data.fontSize)
        }
        if (data.dansu === 1 || data.dansu === 2) setDansu(data.dansu)
        if (typeof data.titleIndex === "number" && data.titleIndex >= 0 && data.titleIndex < DAIMEI.length) {
          setTitleIndex(data.titleIndex)
        }
        if (typeof data.subTitleText === "string") setSubTitleText(data.subTitleText)
        if (typeof data.namaeIndex === "number" && data.namaeIndex >= 0 && data.namaeIndex * 3 + 2 < NAMAE_DATA.length) {
          setNamaeIndex(data.namaeIndex)
        }
        if (typeof data.setumeiIndex === "number" && data.setumeiIndex >= 0 && data.setumeiIndex < SETUMEI_DATA.length) {
          setSetumeiIndex(data.setumeiIndex)
        }
        if (typeof data.saveFileName === "string") setSaveFileName(data.saveFileName)
      }
    } catch {
      // 破損データは無視
    } finally {
      setLoaded(true)
    }
  }, [])

  // ── localStorage に自動保存（編集時に毎回書き出す） ──
  useEffect(() => {
    if (!loaded) return
    try {
      const data: SavedData = {
        inputText, displayLines, grade,
        mondaisu, fontSize, dansu,
        titleIndex, subTitleText, namaeIndex, setumeiIndex,
        saveFileName,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // 容量超過などは無視
    }
  }, [loaded, inputText, displayLines, grade, mondaisu, fontSize, dansu,
      titleIndex, subTitleText, namaeIndex, setumeiIndex, saveFileName])

  // ── ヘルパー ────────────────────────────────────────

  // メッセージを表示して一定時間後に消す
  const showMsg = (text: string) => {
    setMsg(text)
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setMsg(""), 3000)
  }

  // ── イベントハンドラー ──────────────────────────────

  // 学年を選択するとプリセット値を反映
  const handleGradeChange = (g: number) => {
    se.playSe(se.pi)
    setGrade(g)
    setMondaisu(PRESET_MONDAISU[g - 1])
    setTitleIndex(PRESET_TITLE_INDEX[g - 1])
    setNamaeIndex(PRESET_NAMAE_INDEX[g - 1])
    setSetumeiIndex(PRESET_SETUMEI_INDEX[g - 1])
  }

  // 作成: テキストエリアの内容を解析してプレビューを更新
  const handleCheck = () => {
    se.playSe(se.set)
    const lines = inputText
      .replace(/\r\n|\r/g, "\n")
      .split("\n")
      .filter(l => l !== "")
      .map(line => parseQuestion(line))
    setDisplayLines(lines)
  }

  // シャッフル: 現在のプレビューの問題順をランダムに並び替え
  const handleShuffle = () => {
    if (displayLines.length === 0) {
      showMsg("まず「作成」ボタンを押してください")
      return
    }
    se.playSe(se.reset)
    setDisplayLines(prev => shuffled(prev))
  }

  // テキストファイルを保存
  const handleSave = () => {
    if (!inputText) {
      showMsg("テキストエリアに問題が入力されていません")
      return
    }
    se.playSe(se.pi)
    const blob = new Blob([inputText], { type: "text/plain" })
    const a    = document.createElement("a")
    a.href     = URL.createObjectURL(blob)
    const now  = new Date()
    const defaultName =
      `${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, "0")}-` +
      `${String(now.getDate()).padStart(2, "0")}-kanji`
    a.download = (saveFileName || defaultName) + ".txt"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // テキストファイルを読み込む（file input の onChange）
  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type && !file.type.startsWith("text/")) {
      showMsg("テキストファイル（.txt）のみ対応しています")
      e.target.value = ""
      return
    }
    if (file.size > 1024 * 1024) {
      showMsg("ファイルサイズが大きすぎます（1MB以下）")
      e.target.value = ""
      return
    }

    se.playSe(se.pi)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        let content = ev.target?.result as string
        // 10,000文字を超える場合は先頭のみ使用
        if (content.length > 10000) {
          content = content.substring(0, 10000)
          showMsg("長いファイルのため先頭10,000文字を読み込みました")
        }
        // HTML タグと制御文字を除去（安全のため）
        content = content
          .replace(/<[^>]*>/g, "")
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
        setInputText(content)
      } catch {
        showMsg("ファイルの読み込みに失敗しました")
      }
    }
    reader.onerror = () => showMsg("ファイルの読み込みでエラーが発生しました")
    reader.readAsText(file, "UTF-8")
    e.target.value = "" // 同じファイルを再度読み込めるようにリセット
  }

  // ── 印刷プレビューの計算 ──────────────────────────────

  const layout       = calcTableLayout(mondaisu, dansu)
  const namaeLabel   = `　　　${NAMAE_DATA[namaeIndex * 3]}　　${NAMAE_DATA[namaeIndex * 3 + 1]}　${NAMAE_DATA[namaeIndex * 3 + 2]}（　　　　　　　　　　）`
  const setumeiText  = `　　○　${SETUMEI_DATA[setumeiIndex]}`
  const titleText    = `　${DAIMEI[titleIndex]}`

  // テーブルの tr 行を生成するヘルパー（縦書きでは1 tr = 1列）
  const makeRows = (startIdx: number, count: number, bangouOffset: number) =>
    Array.from({ length: count }, (_, j) => {
      const html = displayLines[startIdx + j] || ""
      return (
        <tr key={j}>
          {/* 番号 th（高さ 50px 固定・中央揃え） */}
          <th style={{ fontSize: "20px", height: "50px", textAlign: "center" }}>
            {BANGOU[bangouOffset + j]}
          </th>
          {/* 問題文 td */}
          <td style={{ width: layout.tdWidth, height: layout.tdHeight }}>
            <div
              style={{
                width:        layout.divWidth,
                height:       layout.tdHeight,
                fontSize:     `${fontSize}px`,
                verticalAlign: "middle",
                display:      "table-cell",
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </td>
          {/* 回答欄 td（枠線のみの空欄） */}
          <td style={{ width: layout.tdWidth, height: layout.tdHeight }}>
            <div
              style={{
                width:  layout.divWidth,
                height: layout.tdHeight,
                border: "solid 1px #333",
              }}
            />
          </td>
        </tr>
      )
    })

  // ── レンダリング ────────────────────────────────────

  return (
    <>
    {/* A4 横向き印刷を指定（globals.css のデフォルト @page を上書き） */}
    <style>{`@page { size: A4 landscape; margin: 0mm; }`}</style>
    <div className="kanji-test-outer min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ===== ページタイトル ===== */}
      <header className="text-center pt-4 pb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
          漢字テスト作成
        </h1>
      </header>

      {/* ===== メインコンテンツ（左右2カラム） ===== */}
      <main className="kanji-test-main flex gap-4 p-3 items-start">

        {/* ========== 左パネル: コントロール（印刷時非表示） ========== */}
        <div className="kanji-test-no-print flex flex-col gap-3" style={{ width: "360px", flexShrink: 0 }}>

          {/* 学年プリセット */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-warm-400 p-3">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">簡単セット</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map(g => (
                <label key={g} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="grade"
                    value={g}
                    checked={grade === g}
                    onChange={() => handleGradeChange(g)}
                    className="accent-warm-500"
                  />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {g}年
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* テキストエリア */}
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={18}
            placeholder={"問題を入力してください。\n線を引きたい部分は @ で囲んでください。\n例）@漢字@テストを@受ける@。"}
            className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-sm
                       focus:outline-none focus:border-accent-500
                       dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 resize-none"
            style={{ fontFamily: "inherit" }}
          />

          {/* アクションボタン */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCheck}
              className="px-4 py-2 rounded-lg bg-accent-400 hover:bg-accent-500 active:bg-accent-600 active:translate-y-0.5
                         text-white font-bold text-sm shadow transition-colors"
            >
              ✅ 作　成
            </button>
            <button
              onClick={handleShuffle}
              className="px-4 py-2 rounded-lg bg-brand-400 hover:bg-brand-500 active:bg-brand-600 active:translate-y-0.5
                         text-white font-bold text-sm shadow transition-colors"
            >
              🔀 シャッフル
            </button>
            <button
              onClick={() => { se.playSe(se.pi); window.print() }}
              className="px-4 py-2 rounded-lg bg-warm-400 hover:bg-warm-500 active:bg-warm-600 active:translate-y-0.5
                         text-white font-bold text-sm shadow transition-colors"
            >
              🖨️ 印　刷
            </button>
          </div>

          {/* 保存・読み込み */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={saveFileName}
              onChange={e => setSaveFileName(e.target.value)}
              placeholder="ファイル名（省略可）"
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-40
                         focus:outline-none focus:border-accent-500
                         dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
            <button
              onClick={handleSave}
              className="px-3 py-1 rounded-lg bg-gray-500 hover:bg-gray-600 active:translate-y-0.5
                         text-white text-sm font-bold shadow transition-colors"
            >
              💾 保存
            </button>
            <label className="px-3 py-1 rounded-lg bg-gray-400 hover:bg-gray-500 active:translate-y-0.5
                              text-white text-sm font-bold shadow transition-colors cursor-pointer">
              📂 読込
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={handleFileLoad}
              />
            </label>
          </div>

          {/* メッセージ（エラー・通知） */}
          {msg && (
            <p className="text-sm font-bold text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {msg}
            </p>
          )}

          {/* 使い方説明 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                          rounded-xl p-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>📝 テキストエリアに問題を書きます。改行で次の問題へ。</p>
            <p>🖊️ 線を引きたい場所を <span className="text-warm-500 font-bold">@(半角)@</span> で囲みます。</p>
            <p>✅ 「作成」でプレビューに反映されます。</p>
            <p>🔀 「シャッフル」で問題の順番を入れ替えられます。</p>
            <p>💾 問題はテキストファイルで保存・読み込み可能です。</p>
            <p className="text-gray-400">⚠️ 印刷時、ブラウザの倍率を 85〜90% にすると1ページに収まりやすいです。</p>
          </div>

        </div>

        {/* ========== 右パネル: 設定 + プレビュー ========== */}
        <div className="flex flex-col gap-3">

          {/* 設定パネル（印刷時非表示） */}
          <div className="kanji-test-no-print bg-warm-50 dark:bg-gray-800 border border-warm-200
                          dark:border-gray-700 rounded-xl p-3 flex flex-col gap-2">

            {/* 問題数・フォントサイズ・段数 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                問題数
                <select
                  value={mondaisu}
                  onChange={e => { se.playSe(se.pi); setMondaisu(Number(e.target.value)) }}
                  className="border border-brand-500 rounded px-1 py-0.5 text-sm
                             dark:bg-gray-700 dark:border-brand-600 dark:text-gray-100"
                >
                  {Array.from({ length: 16 }, (_, i) => i + 5).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                フォントサイズ
                <select
                  value={fontSize}
                  onChange={e => { se.playSe(se.pi); setFontSize(Number(e.target.value)) }}
                  className="border border-brand-500 rounded px-1 py-0.5 text-sm
                             dark:bg-gray-700 dark:border-brand-600 dark:text-gray-100"
                >
                  {Array.from({ length: 44 }, (_, i) => i + 6).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                段数
                <select
                  value={dansu}
                  onChange={e => { se.playSe(se.pi); setDansu(Number(e.target.value) as 1 | 2) }}
                  className="border border-brand-500 rounded px-1 py-0.5 text-sm
                             dark:bg-gray-700 dark:border-brand-600 dark:text-gray-100"
                >
                  <option value={1}>1だん</option>
                  <option value={2}>2だん</option>
                </select>
              </label>
            </div>

            {/* 表題・副題 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                表題
                <select
                  value={titleIndex}
                  onChange={e => { se.playSe(se.pi); setTitleIndex(Number(e.target.value)) }}
                  className="border border-brand-500 rounded px-1 py-0.5 text-sm
                             dark:bg-gray-700 dark:border-brand-600 dark:text-gray-100"
                >
                  {DAIMEI.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                副題
                <input
                  type="text"
                  value={subTitleText}
                  onChange={e => setSubTitleText(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-0.5 text-sm w-32
                             focus:outline-none focus:border-accent-500
                             dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </label>
            </div>

            {/* 名前欄・説明欄 */}
            <div className="flex flex-col gap-1 text-sm">
              <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                名前欄
                <select
                  value={namaeIndex}
                  onChange={e => { se.playSe(se.pi); setNamaeIndex(Number(e.target.value)) }}
                  className="border border-brand-500 rounded px-1 py-0.5 text-sm
                             dark:bg-gray-700 dark:border-brand-600 dark:text-gray-100"
                >
                  {[0, 1, 2].map(i => (
                    <option key={i} value={i}>
                      {`　${NAMAE_DATA[i*3]}　${NAMAE_DATA[i*3+1]}　${NAMAE_DATA[i*3+2]}（　）`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                説明
                <select
                  value={setumeiIndex}
                  onChange={e => { se.playSe(se.pi); setSetumeiIndex(Number(e.target.value)) }}
                  className="border border-brand-500 rounded px-1 py-0.5 text-sm w-full max-w-md
                             dark:bg-gray-700 dark:border-brand-600 dark:text-gray-100"
                >
                  {SETUMEI_DATA.map((s, i) => (
                    <option key={i} value={i}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

          </div>

          {/* プレビュー見出し（印刷時非表示） */}
          <p className="kanji-test-no-print text-xs text-gray-500 dark:text-gray-400 mb-0">
            ↓ 印刷イメージ（実際の印刷は A4 横向きで出力されます）
          </p>

          {/* ========== 印刷エリア ========== */}
          {/*
            kanji-test-print-wrapper: スクリーン表示用ラッパー（scale後のサイズにクリップ）
            kanji-test-print-area:    writing-mode:vertical-rl のA4コンテンツ
            globals.css の @media print で:
              wrapper → position:static, 297mm×210mm
              area    → transform:scale(1)
          */}
          <div className="kanji-test-print-wrapper">
            <div
              className="kanji-test-print-area"
              style={{ fontFamily: '"UD デジタル 教科書体 NK-R", "Noto Sans JP", sans-serif' }}
            >

              {/* 表題・副題 */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className="text-4xl font-bold">{titleText}</div>
                <div className="text-2xl">{subTitleText}</div>
              </div>

              {/* 名前欄 */}
              <div style={{ textAlign: "center", width: "50px" }}>
                {namaeLabel}
              </div>

              {/* 説明欄 */}
              <div className="text-base">{setumeiText}</div>

              {/* 問題テーブル */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>

                {/* 上段テーブル（dansu=1 ならすべての問題） */}
                <table>
                  <tbody>
                    {makeRows(0, layout.upperCount, 0)}
                  </tbody>
                </table>

                {/* 下段テーブル（dansu=2 のときのみ問題あり） */}
                <table>
                  <tbody>
                    {makeRows(layout.upperCount, layout.lowerCount, layout.upperCount)}
                  </tbody>
                </table>

              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
    </>
  )
}

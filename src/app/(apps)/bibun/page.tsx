// ======================================================
// 微分の意味がわかる 〜2点を近づけると接線になる〜 ページ
//
// URL: /bibun（要件では /apps/bibun だが、既存アプリの URL 規則に合わせた。2026-10-25 オーナー了承）
// 対象: 高校 数学Ⅱ「微分」。教員の PC 実演 → 生徒が各自の端末で試す
// 要件: docs/requirements-derivative-app.md
//
// 3つのステップ（タブ）：① 平均変化率 ② 微分係数（接線の傾き） ③ 導関数
//   初期表示は ①。② は1クリックで行ける。
//   関数の選択と表示レベル（ことばで／記号で）はタブを切りかえても残す。
//   点A の x（a）も ① と ② で共有する（① で決めた点A に ② で B を近づける。2026-10-25 オーナー決定）。
//   初期値 a = 1・b = 2 は授業スライドの数値例（2026-10-26 に a = 2・b = 3 から変更）。
//   関数を変えたら、各ステップは key を変えて初期状態にもどす。
//
// 計算と文言は _lib/（jest でテスト済み）。ここは配線だけ。
// コインは付けない（問題に答える形ではないため。練習問題を入れるときに改めて決める）。
// ======================================================

"use client"

import { useState } from "react"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { separate } from "./_lib/average"
import { PRESETS, formatPoly, parseCoefs } from "./_lib/polynomial"
import type { CoefText, Poly } from "./_lib/polynomial"
import type { Level } from "./_lib/text"
import { CUSTOM_ID, FunctionPicker } from "./_components/FunctionPicker"
import { BigProvider } from "@/components/parts/graph/Display"
import { MotionProvider } from "./_components/Motion"
import { Practice } from "./_components/Practice"
import { StepAverage } from "./_components/StepAverage"
import { StepDerivative } from "./_components/StepDerivative"
import { StepTangent } from "./_components/StepTangent"

type Tab = 1 | 2 | 3

const TABS: { id: Tab; label: string }[] = [
  { id: 1, label: "① 平均変化率" },
  { id: 2, label: "② 微分係数（接線の傾き）" },
  { id: 3, label: "③ 導関数" },
]

/**
 * 点A・点B の初期値（授業スライドの数値例）。2026-10-26 にスライドの起点を a = 2 → a = 1 に変えたので合わせた。
 * a = 1 なら h = 1 の点B が (2, 4) で済み、表示を狭めて（横 0〜2.4・縦 0〜4.8）大きく見せられる
 * （2点を結ぶ直線と曲線のすき間は a によらず h²/4 なので、拡大しないと見え方は変わらない）。
 * スライダーで 2 や 3 も選べる。
 */
const INITIAL_A = 1
const INITIAL_B = 2

/** 「自分で作る」を選んだときの初期値（直線 2x + 1：h によらず平均変化率が 2） */
const INITIAL_COEF: CoefText = ["0", "0", "2", "1"]

export default function BibunPage() {
  const [tab, setTab] = useState<Tab>(1)
  const [level, setLevel] = useState<Level>("words")
  /** 大きく表示（投影用。線を太く、文字を大きく） */
  const [big, setBig] = useState(false)
  /** 文脈ラベル：「x, y」⇔「時間（秒）, 距離（m）」（スライド9 の運動の例と結びつける） */
  const [motion, setMotion] = useState(false)
  const [a, setA] = useState(INITIAL_A)
  const [b, setB] = useState(INITIAL_B)
  /** ② で a を変えたとき、① の b と重なったら b をずらす（① では a ≠ b が前提） */
  const changeA = (na: number) => {
    setA(na)
    setB((ob) => separate(na, ob))
  }
  const [choice, setChoice] = useState(PRESETS[0].id)
  const [coefText, setCoefText] = useState<CoefText>(INITIAL_COEF)
  // 最後に正しく読めた自分の関数（入力欄が空のあいだもグラフを出し続ける）
  const [custom, setCustom] = useState<Poly>(() => parseCoefs(INITIAL_COEF)!)

  const p: Poly = choice === CUSTOM_ID ? custom : PRESETS.find((x) => x.id === choice)!.poly
  const coefError = choice === CUSTOM_ID && !parseCoefs(coefText)
    ? "係数は −10〜10 の数を入れてください（グラフは前の関数のままです）"
    : null

  const onCoefText = (t: CoefText) => {
    setCoefText(t)
    const q = parseCoefs(t)
    if (q) setCustom(q)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
        微分の意味がわかる
        <span className="block md:inline md:ml-2 text-base font-normal text-gray-600 dark:text-gray-300">〜2点を近づけると接線になる〜</span>
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-3 my-3">
        <FunctionPicker choice={choice} coefText={coefText} onChoice={setChoice} onCoefText={onCoefText} error={coefError} />
        <div className="flex gap-2" role="group" aria-label="表示のしかた">
          <BtnMode value="words" current={level} onChange={setLevel} className="shrink-0">ことばで</BtnMode>
          <BtnMode value="symbols" current={level} onChange={setLevel} className="shrink-0">記号で</BtnMode>
          <label className="flex items-center gap-2 cursor-pointer ml-2 font-bold text-gray-700 dark:text-gray-200">
            <input type="checkbox" className="w-5 h-5 accent-brand-500" checked={big} onChange={(e) => setBig(e.target.checked)} />
            大きく表示
          </label>
          <label className="flex items-center gap-2 cursor-pointer ml-2 font-bold text-gray-700 dark:text-gray-200">
            <input type="checkbox" className="w-5 h-5 accent-brand-500" checked={motion} onChange={(e) => setMotion(e.target.checked)} />
            時間・距離で表す
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3" role="group" aria-label="ステップ">
        {TABS.map((t) => (
          <BtnMode key={t.id} value={t.id} current={tab} onChange={setTab} className="shrink-0 text-base">
            {t.label}
          </BtnMode>
        ))}
      </div>

      {/* 大きく表示は context で配る（グラフの線・点・文字と、数値・凡例・記録表の文字） */}
      <BigProvider value={big}>
        <MotionProvider value={motion}>
          {tab === 1 ? (
            <StepAverage
              key={formatPoly(p)} p={p} level={level} a={a} b={b}
              onPoints={(na, nb) => { setA(na); setB(nb) }} onNext={() => setTab(2)}
            />
          ) : tab === 2 ? (
            <StepTangent key={formatPoly(p)} p={p} level={level} a={a} onA={changeA} />
          ) : (
            <StepDerivative key={formatPoly(p)} p={p} level={level} initialA={a} />
          )}

          {/* 練習問題（③ の下）。タブを切りかえても正解数・問題・入力が消えないよう、
              いつも置いておいて ③ 以外では隠す。関数の選択とも関係ないので key をつけない */}
          <div hidden={tab !== 3} className="mt-6">
            <Practice />
          </div>
        </MotionProvider>
      </BigProvider>
    </div>
  )
}

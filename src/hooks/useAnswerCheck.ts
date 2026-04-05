"use client"

/* eslint-disable react-hooks/immutability -- el_text・hasAnsweredRef は外部 ref で意図的に書き換える */
import { useCallback } from "react"
import * as se from "@/lib/se"

// ── useAnswerCheck ──────────────────────────────────────────────────────────
//
// 正誤判定ロジックを共通化するフック。
// 以下の処理を一括して行う:
//   - 正解: 効果音 → "せいかい" 表示 → 初回のみ addCoins(1)
//   - 不正解: 効果音 → "ちがうよ" 表示 → 1秒後に prevText を復元
//
// 適用アプリ: tashizan-1, hikizan-1, ikutu, kazoeyou
// ────────────────────────────────────────────────────────────────────────────

interface UseAnswerCheckOptions {
  /** コインを加算する関数（useCoins から取得） */
  addCoins: (n: number) => void
  /** 初回正解フラグ（問題生成時に false にリセットすること） */
  hasAnsweredRef: React.MutableRefObject<boolean>
  /**
   * 不正解時に1秒後に戻すテキストを返す関数（HTMLを直接返す）。
   * 多くのアプリでは el_text.current.innerHTML をそのまま返せばよい。
   * kazoeyou のように固定テキストを返す場合はその文字列を返す。
   */
  getPrevText: () => string
  /** メッセージ表示エリアへの ref */
  el_text: React.RefObject<HTMLDivElement | null>
  /**
   * 正解時に el_text に表示するテキスト（HTML）。
   * 省略時は `<span style="color:red;">せいかい</span>` を使用。
   */
  correctText?: string
  /**
   * 正解時に実行する追加処理（例: hasProblem を false に戻す等）。
   * checkAnswer の呼び出し側で setHasProblem(false) などを行う場合は不要。
   */
  onCorrect?: () => void
  /**
   * 不正解後 1秒経過して prevText を復元するタイミングで実行する追加処理。
   * 例: setHasProblem(true), setFlag(true) など。
   */
  onWrongRestore?: () => void
}

export function useAnswerCheck({
  addCoins,
  hasAnsweredRef,
  getPrevText,
  el_text,
  correctText,
  onCorrect,
  onWrongRestore,
}: UseAnswerCheckOptions) {

  const checkAnswer = useCallback(
    (myAnswer: number, correctAnswer: number) => {
      if (myAnswer === correctAnswer) {
        // ── 正解 ──
        se.playSe(se.right)
        if (el_text.current) {
          el_text.current.innerHTML =
            correctText ?? `<span style="color:red;">せいかい</span>`
        }
        if (!hasAnsweredRef.current) {
          addCoins(1)              // 初回正解のみコイン付与
          hasAnsweredRef.current = true
        }
        onCorrect?.()
      } else {
        // ── 不正解：1秒後に prevText を復元して再入力可能に ──
        se.playSe(se.alertSound)
        if (el_text.current) {
          const prevText = getPrevText()
          el_text.current.innerHTML = `<span style="color:gray;">ちがうよ</span>`
          setTimeout(() => {
            if (el_text.current) el_text.current.innerHTML = prevText
            onWrongRestore?.()
          }, 1000)
        }
      }
    },
    [addCoins, hasAnsweredRef, getPrevText, el_text, correctText, onCorrect, onWrongRestore]
  )

  return { checkAnswer }
}

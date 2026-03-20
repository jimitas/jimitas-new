// ======================================================
// PutShiki コンポーネント
//
// たしざんの式（左数 ＋ 右数 ＝ 答え）を表示・入力するエリア。
// 「もんだい」で左・右の input が自動入力される。
// 「セット」では左・右の input を手動で入力する。
// ======================================================

"use client"

import { RefObject } from "react"
import styles from "@/components/apps/tashizan-1/PutShiki.module.css"

interface PutShikiProps {
  /** たされる数の入力欄（自動入力・手動入力兼用） */
  el_left_input: RefObject<HTMLInputElement | null>
  /** たす数の入力欄（自動入力・手動入力兼用） */
  el_right_input: RefObject<HTMLInputElement | null>
  /** 答えの入力欄 */
  el_answer: RefObject<HTMLInputElement | null>
  /** 演算子（たしざんは "+"） */
  kigo: string
}

export function PutShiki({ el_left_input, el_right_input, el_answer, kigo }: PutShikiProps) {
  return (
    <div className={styles.place}>
      {/* たされる数 */}
      <input
        ref={el_left_input}
        className={styles.input}
        type="number"
        min="0"
        max="20"
        step="1"
      />
      {/* 演算子（＋） */}
      <span className={styles.kigo}>{kigo}</span>
      {/* たす数 */}
      <input
        ref={el_right_input}
        className={styles.input}
        type="number"
        min="0"
        max="20"
        step="1"
      />
      {/* ＝ */}
      <span className={styles.kigo}>＝</span>
      {/* 答え */}
      <input
        ref={el_answer}
        className={styles.input}
        type="number"
        min="0"
        max="40"
        step="1"
      />
    </div>
  )
}

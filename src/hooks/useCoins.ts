// ======================================================
// useCoins フック
//
// コインの取得・加算を管理するカスタムフック。
// コインはゲーミフィケーションの仕組みで、正解すると獲得できる。
//
// 【今の実装】
//   ブラウザの localStorage に保存する。
//   ページを閉じてもコイン数が消えない。
//
// 【将来の予定】
//   Supabase を使ってサーバー側に保存する。
//   そのときはこのファイルだけ書き換えれば OK にしてある。
// ======================================================

"use client" // Next.js の App Router では、ブラウザAPIを使うファイルに必要な宣言

import { useState, useEffect } from "react"

// localStorage に保存するときのキー名
const STORAGE_KEY = "jimitas_coins"

export function useCoins() {
  // コイン数を状態として管理する
  // 初期値は 0（実際の値は useEffect の中で localStorage から読み込む）
  const [coins, setCoins] = useState<number>(0)

  // ページを開いたとき、localStorage からコイン数を読み込む
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      setCoins(parseInt(saved, 10))
    }
  }, []) // [] = 最初の1回だけ実行

  // コインを指定した数だけ加算して保存する
  const addCoins = (amount: number) => {
    setCoins((prev) => {
      const next = prev + amount
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  // コインを 0 にリセットする（将来のデバッグ用）
  const resetCoins = () => {
    setCoins(0)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { coins, addCoins, resetCoins }
}

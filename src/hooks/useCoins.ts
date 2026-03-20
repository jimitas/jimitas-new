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

// localStorage の変更を他のコンポーネントに知らせるカスタムイベント名
const COINS_EVENT = "jimitas_coins_changed"

// localStorage から現在のコイン数を読み取るヘルパー
function readCoins(): number {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved !== null ? parseInt(saved, 10) : 0
}

export function useCoins() {
  // コイン数を状態として管理する
  // 初期値は 0（実際の値は useEffect の中で localStorage から読み込む）
  const [coins, setCoins] = useState<number>(0)

  useEffect(() => {
    // 初回：localStorage から読み込む
    setCoins(readCoins())

    // 同タブ内での変更を受け取る（アプリ→ヘッダーの同期）
    const handleCoinsChanged = () => setCoins(readCoins())

    // 別タブ・別ウィンドウからの変更を受け取る
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCoins(readCoins())
    }

    window.addEventListener(COINS_EVENT, handleCoinsChanged)
    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener(COINS_EVENT, handleCoinsChanged)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  // コインを指定した数だけ加算して保存する
  const addCoins = (amount: number) => {
    // localStorage を先に更新してから setCoins・dispatchEvent を呼ぶ。
    // こうすることで dispatchEvent による他の useCoins インスタンスの
    // handleCoinsChanged が readCoins() で必ず新しい値を取得できる。
    const next = readCoins() + amount
    localStorage.setItem(STORAGE_KEY, String(next))
    setCoins(next)
    window.dispatchEvent(new Event(COINS_EVENT))
  }

  // コインを 0 にリセットする（将来のデバッグ用）
  const resetCoins = () => {
    setCoins(0)
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event(COINS_EVENT))
  }

  return { coins, addCoins, resetCoins }
}

// ======================================================
// DarkModeToggle コンポーネント
//
// ライトモードとダークモードを切り替えるボタン。
//
// 仕組み：
//   html 要素の data-theme 属性を "dark" にする／外す。
//   globals.css の @custom-variant dark により、
//   data-theme="dark" がついている間は dark: プレフィックスのスタイルが適用される。
//
//   class ではなく data 属性を使う理由:
//     layout.tsx で React が <html className={...}> を管理しているため、
//     class に "dark" を足すとハイドレーション時に React が className を
//     書き戻して消してしまう（＝リロードするとライトに戻るバグ）。
//     React が管理していない data 属性なら書き戻されない。
//
//   localStorage に保存するため、次回アクセス時も設定が維持される。
//   ページ読み込み時の復元は layout.tsx のテーマスクリプトが行う。
//
// このコンポーネントが state を持たない理由:
//   「今ダークかどうか」はサーバー側では分からない（localStorage は
//   ブラウザにしかない）。state で持って絵文字を出し分けると、
//   サーバーは🌙・クライアントは☀️を描画してハイドレーションエラーになる。
//   そこで「今の状態は DOM に聞く」「見た目は CSS に任せる」方式にしている。
//   サーバーとクライアントで同じHTMLを出すので、ズレようがない。
// ======================================================

"use client"

import { useSound, UI_SOUNDS } from "@/hooks/useSound"

export default function DarkModeToggle() {
  const { play } = useSound()

  // ダークモードを切り替える
  const toggle = () => {
    play(UI_SOUNDS.darkMode)

    // 現在の状態は state ではなく html 要素から読む
    const root = document.documentElement
    const next = root.dataset.theme !== "dark"

    if (next) {
      root.dataset.theme = "dark"
    } else {
      delete root.dataset.theme
    }

    // localStorage に保存（次回アクセス時に layout.tsx のスクリプトが復元する）
    localStorage.setItem("jimitas_dark", String(next))
  }

  return (
    <button
      onClick={toggle}
      // title は現在の状態によらず固定にする（サーバーとクライアントでズレないように）
      title="ライトモード／ダークモードを切り替え"
      aria-label="ライトモード／ダークモードを切り替え"
      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      {/*
        アイコンは state ではなく CSS で出し分ける。
        両方を常に描画しておき、dark: プレフィックスで表示を切り替えるため、
        サーバーとクライアントで同じHTMLになり、かつ
        JavaScript が動く前（テーマスクリプト実行直後）から正しい方が出る。
      */}
      <span className="dark:hidden">🌙</span>
      <span className="hidden dark:inline">☀️</span>
    </button>
  )
}

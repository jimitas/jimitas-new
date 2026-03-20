// ======================================================
// 共通レイアウト
//
// すべてのページに共通して適用される「外枠」。
// ここに書いたものは、トップページでもアプリページでも
// 必ず表示される。
//
// 構造：
//   <html>
//     <body>
//       <Header />        ← 全ページ共通のヘッダー
//       <main>{children}  ← 各ページの中身がここに入る
//       <Footer />        ← 全ページ共通のフッター
//     </body>
//   </html>
// ======================================================

import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/common/Header"
import Footer from "@/components/common/Footer"

// ページのタイトルや説明（ブラウザのタブや検索結果に使われる）
export const metadata: Metadata = {
  title: "Jimitas（ジミタス）| 地味に助かる学習コンテンツ",
  description:
    "先生・子ども・保護者のための学習アプリポータル。算数・国語・音楽・社会など36種類のアプリが無料で使えます。",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // lang="ja" にすることで、ブラウザが日本語のページと認識する
    <html lang="ja">
      {/*
        min-h-screen：画面の高さいっぱいに広げる
        flex flex-col：Header・main・Footer を縦に並べる
        bg-gray-50：ページ全体の背景をごく薄いグレーに
      */}
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
        {/* ヘッダー：全ページの上部に表示 */}
        <Header />

        {/* メインコンテンツ：各ページの内容が入る */}
        {/* flex-1 で残りの高さをすべて使い、フッターを常に下に押しやる */}
        <main className="flex-1">
          {children}
        </main>

        {/* フッター：全ページの下部に表示 */}
        <Footer />
      </body>
    </html>
  )
}

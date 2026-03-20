// ======================================================
// 共通レイアウト
//
// このファイルでやっていること：
//   1. Google Fonts を next/font で読み込む
//      （CDN より速く、レイアウトのズレが起きない）
//   2. Font Awesome を CDN で読み込む（アイコン用）
//   3. ダークモード・フォント設定をページ表示前に適用する
//      （「テーマスクリプト」：チラつき防止のため同期的に実行）
//   4. Header・Footer で全ページを囲む
// ======================================================

import type { Metadata } from "next"
import { Noto_Sans_JP, M_PLUS_1p } from "next/font/google"
import "./globals.css"
import Header from "@/components/common/Header"
import Footer from "@/components/common/Footer"
import SoundPreloader from "@/components/common/SoundPreloader"

// -------------------------------------------------------
// Google Fonts の読み込み（next/font）
//
// next/font を使うとフォントファイルがサーバー側でキャッシュされ、
// Google のサーバーへのリクエストが不要になる。表示も速い。
// variable オプションで CSS 変数名を決める。
// この変数名を globals.css の var(--font-noto-sans-jp) で参照する。
// -------------------------------------------------------

// 丸ゴシック：子ども向けのやさしい字形
const notoSansJP = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans-jp", // globals.css の var(--font-noto-sans-jp) と対応
  display: "swap",                 // フォント読み込み中はシステムフォントで表示
})

// ゴシック：先生向けのすっきりした字形
const mPlus1p = M_PLUS_1p({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-m-plus-1p",   // globals.css の var(--font-m-plus-1p) と対応
  display: "swap",
})

// -------------------------------------------------------
// ダークモード・フォント初期化スクリプト（チラつき防止）
//
// React が動き出す前（ページ描画の瞬間）に実行される。
// localStorage の設定を読んで html 要素に反映することで、
// ページを開いた瞬間に正しいテーマが適用され、白→黒のチラつきを防ぐ。
// -------------------------------------------------------
const themeInitScript = `
(function() {
  // ダークモードの設定を復元
  if (localStorage.getItem('jimitas_dark') === 'true') {
    document.documentElement.classList.add('dark');
  }
  // フォントの設定を復元
  const font = localStorage.getItem('jimitas_font');
  if (font === 'gothic') {
    document.documentElement.dataset.font = 'gothic';
  }
})();
`

// -------------------------------------------------------
// メタデータ（ブラウザのタブや検索結果に使われる）
// -------------------------------------------------------
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
    // suppressHydrationWarning:
    //   テーマスクリプトが html の class や data 属性を書き換えるため、
    //   サーバー側とブラウザ側でHTMLが一致しないことがある。
    //   この警告を抑制するために必要。
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${notoSansJP.variable} ${mPlus1p.variable}`}
    >
      <head>
        {/* ダークモード・フォントの初期化（チラつき防止のため同期実行） */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

        {/* Font Awesome（アイコン用）CDNから読み込む */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200">
        <SoundPreloader />
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

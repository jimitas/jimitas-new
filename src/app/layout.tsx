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

import type { Metadata, Viewport } from "next"
import { Noto_Sans_JP, M_PLUS_1p } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import Header from "@/components/common/Header"
import Footer from "@/components/common/Footer"
import SoundPreloader from "@/components/common/SoundPreloader"
import NoContextMenu from "@/components/common/NoContextMenu"

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
// ビューポート設定（タブレット・スマホのピンチズーム・スケール制御）
//
// user-scalable=no, maximum-scale=1:
//   ピンチアウトによる意図しないズームを禁止する。
//   ボタン連打時にブラウザが画面を拡大するのを防ぐ。
// -------------------------------------------------------
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// -------------------------------------------------------
// メタデータ（ブラウザのタブや検索結果に使われる）
// -------------------------------------------------------
export const metadata: Metadata = {
  title: {
    default: "Jimitas（ジミタス）| 地味に助かる学習コンテンツ",
    template: "%s | Jimitas",  // 子ページで title を設定すると「○○ | Jimitas」になる
  },
  description:
    "先生・子ども・保護者のための学習Webアプリポータル。算数・国語・音楽・社会など56種類のアプリ・ツールが無料で使えます。URLを貼るだけでタブレット・PCで動く、授業でそのまま使えるコンテンツです。",
  metadataBase: new URL("https://jimitas.com"),
  openGraph: {
    siteName: "Jimitas（ジミタス）",
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: "/jimitas_logo.png",
        width: 480,
        height: 150,
        alt: "Jimitas - 地味に助かる学習コンテンツ",
      },
    ],
  },
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
    // translate="no": Google翻訳などによるアプリUIの自動翻訳を禁止する
    <html
      lang="ja"
      translate="no"
      suppressHydrationWarning
      className={`${notoSansJP.variable} ${mPlus1p.variable}`}
    >
      <head>
        {/* ダークモード・フォントの初期化（チラつき防止のため同期実行） */}
        <Script src="/theme-init.js" strategy="beforeInteractive" />

        {/* Font Awesome（アイコン用）CDNから読み込む */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200">
        <NoContextMenu />
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

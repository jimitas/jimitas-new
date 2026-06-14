// ======================================================
// アプリ単位で読み込むフォント定義（next/font）
//
// ここに置く理由：
//   日本語Webフォントは CJK 全域を数百個の @font-face に分割して持つため、
//   定義CSSだけで1フォント約189KBになる。root layout で読み込むと
//   全ページの critical path に載り、render-blocking CSS になってしまう。
//   特定アプリでしか使わないフォントは root ではなく、
//   そのアプリの layout.tsx で読み込んで読込範囲を限定する。
// ======================================================

import { BIZ_UDMincho } from "next/font/google"

// UD明朝（漢字プリント・漢字テスト・じみぷりの「UD明朝」オプション専用）
// preload: false → これらのアプリでも初回描画では未使用（明朝を選んだ時だけ使う）。
// root layout から外し、使う3アプリの layout.tsx でのみ読み込む。
export const bizUDMincho = BIZ_UDMincho({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-biz-ud-mincho",
  display: "swap",
  preload: false,
})

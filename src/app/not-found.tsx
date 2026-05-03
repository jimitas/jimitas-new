// ======================================================
// 404 ページ
//
// 旧 WordPress 版 jimitas.com からの移行により、
// 旧サイトのURL（/category/... など）にアクセスすると
// このページが表示される。
//
// 「びっくりして離脱しない」ことを目標に、
// 状況をやさしく説明してトップへ誘導する。
// ======================================================

import Link from "next/link"

export const metadata = {
  title: "ページが見つかりません | Jimitas",
}

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">

      {/* ===== アイコン ===== */}
      <div className="text-6xl mb-6">🐱</div>

      {/* ===== 見出し ===== */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        ページが見つかりませんでした
      </h1>

      {/* ===== 説明 ===== */}
      <div className="bg-brand-50 dark:bg-gray-800 rounded-xl p-6 text-left space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
        <p>
          Jimitas は <strong className="text-gray-900 dark:text-gray-100">2026年4月末にサイトをリニューアル</strong>しました。
          お気に入りに登録していたURLや検索結果のリンクが古いままになっている場合、
          このページが表示されることがあります。
        </p>
        <p>
          アプリはすべて新しいサイトに引き継いでいます。
          下のボタンからトップページへ移動し、お探しのアプリをご利用ください。
        </p>
      </div>

      {/* ===== トップへ戻るボタン ===== */}
      <Link
        href="/"
        className="inline-block px-8 py-3 rounded-full bg-brand-400 text-white font-medium hover:bg-brand-500 transition-colors"
      >
        トップページへ
      </Link>

      {/* ===== URL メモ ===== */}
      <p className="mt-10 text-xs text-gray-400 dark:text-gray-500">
        エラーコード: 404 Not Found
      </p>

    </div>
  )
}

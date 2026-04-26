// ======================================================
// Footer コンポーネント
//
// 全ページ共通のフッター。コピーライト表示のみ。
//
// サーバーコンポーネントでOK（ブラウザAPIを使わないため）。
// ======================================================

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
        <p>© {new Date().getFullYear()} jimitas.com</p>
      </div>
    </footer>
  )
}

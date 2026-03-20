// ======================================================
// Footer コンポーネント
//
// 全ページ共通のフッター。
// - コピーライト表示
// - jimitas.com へのリンク
//
// サーバーコンポーネントでOK（ブラウザAPIを使わないため）。
// ======================================================

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-400">
        <p>
          © {new Date().getFullYear()}{" "}
          {/* target="_blank" で別タブで開く */}
          {/* rel="noopener noreferrer" はセキュリティのお約束 */}
          <a
            href="https://jimitas.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-500 transition-colors"
          >
            jimitas.com
          </a>
        </p>
      </div>
    </footer>
  )
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // -----------------------------------------------------------
  // 旧 jimitas.com（WordPress + さくらレンタルサーバー）からの移行用リダイレクト
  //
  // DNSを Vercel に切り替えると、jimitas.com への全アクセスが
  // この Next.js アプリに届くようになる。旧サイトで生きていた
  // 主要な URL を新しいパスに 301 リダイレクトする。
  //
  // 方針:
  //   - 旧WordPress記事URL（日本語エンコード済みの長いスラッグ）は
  //     原則404でよい（指名検索で来る人はトップページに着地するため）
  //   - ただし、さくらサーバー上で実アプリとして動いていた静的HTML
  //     （/kanji/）は jimitas-new の対応アプリへ転送する
  // -----------------------------------------------------------
  async redirects() {
    return [
      // 旧 /kanji/（さくらサーバー上の静的HTML漢字テスト作成ツール）
      // → 新 /kanji-test（jimitas-new に移植済み）
      {
        source: "/kanji",
        destination: "/kanji-test",
        permanent: true,
      },
      {
        source: "/kanji/",
        destination: "/kanji-test",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

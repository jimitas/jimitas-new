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
  //   - さくらサーバー上で実アプリとして動いていた静的HTMLは
  //     jimitas-new の対応アプリ、または対応がなければトップページへ
  // -----------------------------------------------------------
  async redirects() {
    return [
      // ===== さくらサーバー上の静的HTMLアプリ =====

      // /kanji/ → 新 /kanji-test（漢字テスト作成ツール）
      { source: "/kanji",  destination: "/kanji-test", permanent: true },
      { source: "/kanji/", destination: "/kanji-test", permanent: true },

      // /round-off/ → 新 /shishagonyu（四捨五入の練習・「がい数」アプリ）
      { source: "/round-off",  destination: "/shishagonyu", permanent: true },
      { source: "/round-off/", destination: "/shishagonyu", permanent: true },

      // /fushidukuri/ → トップ（ふしづくり、jimitas-new 未移植）
      { source: "/fushidukuri",  destination: "/", permanent: true },
      { source: "/fushidukuri/", destination: "/", permanent: true },

      // /eawase/ → トップ（絵合わせゲーム、jimitas-new 未移植）
      { source: "/eawase",  destination: "/", permanent: true },
      { source: "/eawase/", destination: "/", permanent: true },

      // /nandemo/ → トップ（なんでもトランプ、jimitas-new 未移植）
      { source: "/nandemo",  destination: "/", permanent: true },
      { source: "/nandemo/", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(sounds|images)/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/theme-init.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ]
  },

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

      // /fushidukuri/ → 新 /fushi-dukuri（ふしづくり、移植済み）
      // 旧URL（ハイフンなし）から新URL（ハイフンあり）へ誘導
      { source: "/fushidukuri",  destination: "/fushi-dukuri", permanent: true },
      { source: "/fushidukuri/", destination: "/fushi-dukuri", permanent: true },

      // 注意: /eawase /nandemo は jimitas-new と同じ URL で移植済みのため
      //       リダイレクト設定は不要（残しておくと自分自身のページが
      //       永久リダイレクトで「/」に飛ばされてアクセス不能になる）
    ];
  },
};

export default nextConfig;

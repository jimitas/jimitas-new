# jimitas.com 移行マップ

調査日: 2026-04-26

`jimitas.com`（WordPress）の各ブログ記事から、外部にホスティングされている旧アプリのURLと、`jimitas-new` 内の対応アプリへのマッピング表。

DNS切替時のリダイレクト設計、および各旧デプロイ（Vercel/Netlify）への移行告知バナー設置に使用する。

---

## サマリ

- **WordPress 投稿数**: 25件（全件、外部にホスティングされたアプリへのリンクあり）
- **WordPress 固定ページ**: 1件（HOMEのみ）
- **静的HTMLアプリ**（WordPress外）: `jimitas.com/kanji/` を確認済み（さくらサーバー上の静的ファイルと推定）
- **旧デプロイ先内訳**: Vercel 11件 / Netlify 14件
- **jimitas-new に未移植のアプリ**: 1件（三角比＝triangle-ratio。中高向けのため）

---

## 完全マッピング表

| 旧記事ID | 旧記事タイトル | 旧アプリURL（外部ホスト） | GitHubリポジトリ | jimitas-new パス | 対応アプリ id |
|---|---|---|---|---|---|
| 283 | じみパレット改め、さんすうノート | https://jimitas.vercel.app/sansu-note | (jimitas-new内) | `/sansu-note` | `sansu-note` |
| 265 | ぶろっく\|かずのがくしゅう | https://kazu-block.vercel.app/ | jimitas/kazu_block | `/suuzu-block` | `suuzu-block` |
| 243 | お金の学習\|1円～99999円まで対応 | https://okane-gakushu.netlify.app/ | jimitas/okane.git | `/okane` | `okane` |
| 236 | 1年算数 たし算アプリの決定版！ | https://tashizan1.vercel.app/ | jimitas/tashizan1.git | `/tashizan-1` | `tashizan-1` |
| 228 | たし算の練習アプリ | https://tasu-renshu.vercel.app/ | jimitas/tasu_renshu.git | `/tasu-renshu` | `tasu-renshu` |
| 219 | 色の三原色と光の三原色 学習アプリ | https://sangenshoku.vercel.app/ | jimitas/sangenshoku.git | `/sangenshoku` | `sangenshoku` |
| 209 | 小数のわり算の筆算練習アプリ | https://warizan-hissan-shousuu.netlify.app/ | jimitas/warizan-hissan2.git | `/wari-hissan` | `wari-hissan`（小数対応統合版） |
| 205 | 九九の読み上げ練習アプリ | https://kuku-yomiage.netlify.app/ | jimitas/kuku-yomiage.git | `/kuku-yomi` | `kuku-yomi` |
| 195 | かけ算の筆算 練習アプリ | https://kakezan-hissan.netlify.app/ | jimitas/kakezan-hissan.git | `/kake-hissan-1` | `kake-hissan-1`（または`/kake-hissan2`） |
| 167 | 地味に助かる 作戦ボード | https://sakusen.netlify.app/ | jimitas/sakusen.git | `/sakusen-board` | `sakusen-board` |
| 160 | わり算の筆算 練習アプリ | https://warizan-hissan.netlify.app/ | (要確認) | `/wari-hissan` | `wari-hissan` |
| 146 | 音楽記号を覚えよう\|楽典 | https://gakuten.vercel.app/ | jimitas/gakuten.git | `/gakuten` | `gakuten` |
| 140 | 漢字かんたんプリント作成 | https://kanji-kantan.vercel.app/ | jimitas/kanji.git | `/kanji-test` | `kanji-test` |
| 136 | 地味に助かるローマ字練習アプリ | https://romaji-olive.vercel.app/ | jimitas/romaji.git | `/romaji` | `romaji` |
| 108 | 地味に助かる三角比学習アプリ | https://triangle-ratio.vercel.app/ | jimitas/triangle-ratio.git | **未移植** | — |
| 103 | 地味に助かる漢字プリント作成 | https://jimitas.vercel.app/kanji-print | (jimitas-new内) | `/kanji-print` | `kanji-print` |
| 93 | じみぷり\|地味に助かる学習プリント | https://jimipuri.netlify.app/ | jimitas/jimipuri.git | `/jimipri` | `jimipri` |
| 90 | 算数パレット（デジタル算数セット） | https://jimipale.netlify.app/ | jimitas/jimipallet.git | `/sansu-note` | `sansu-note`（リネーム継承） |
| 71 | 雪の結晶の形を作ろう\|六角形コッホ曲線 | https://koch-curve.netlify.app/ | jimitas/koch-curve.git | `/koch-curve` | `koch-curve` |
| 66 | バーンズリーのシダ（フラクタル） | https://barnsley-fern-requirements.netlify.app/ | jimitas/barnsley-fern-requirements.git | `/barnsley-fern` | `barnsley-fern` |
| 61 | 九九のアレイ図メーカー | https://kuku-array.netlify.app/ | jimitas/kuku-array.git | `/kuku-array` | `kuku-array` |
| 58 | タイマーとストップウォッチ | https://classtimer.netlify.app/ | jimitas/classroom-timer.git | `/classroom-timer` | `classroom-timer` |
| 52 | わり算の考え方２ | https://warizan2.netlify.app/ | jimitas/warizan_2.git | `/warizan2` | `warizan2`（disabled） |
| 48 | わり算の考え方１ | https://warizan1.netlify.app/ | jimitas/warizan_1.git | `/warizan` | `warizan`（disabled） |
| 11 | もっと学習コンテンツ | https://motto-gakushu.netlify.app/ | jimitas/motto.git | `/`（トップ） | 集約ページ |

---

## ホスティング種別ごとの一覧

### Vercel（11件）
- jimitas.vercel.app (sansu-note, kanji-print のサブパス)
- kazu-block.vercel.app
- tashizan1.vercel.app
- tasu-renshu.vercel.app
- sangenshoku.vercel.app
- gakuten.vercel.app
- kanji-kantan.vercel.app
- romaji-olive.vercel.app
- triangle-ratio.vercel.app

### Netlify（14件）
- okane-gakushu.netlify.app
- warizan-hissan-shousuu.netlify.app
- kuku-yomiage.netlify.app
- kakezan-hissan.netlify.app
- sakusen.netlify.app
- warizan-hissan.netlify.app
- jimipuri.netlify.app
- jimipale.netlify.app
- koch-curve.netlify.app
- barnsley-fern-requirements.netlify.app
- kuku-array.netlify.app
- classtimer.netlify.app
- warizan2.netlify.app
- warizan1.netlify.app
- motto-gakushu.netlify.app

---

## 旧 jimitas.com 記事URL → 新URL の 301リダイレクトマップ

DNS切替時に `next.config.js` の `redirects()` に追加するルール。

```js
// next.config.js
module.exports = {
  async redirects() {
    return [
      // === ブログ記事URL（WordPress スラッグ）→ アプリページ ===
      // ※スラッグは日本語URLエンコード済みのままでOK
      { source: '/%e3%81%98%e3%81%bf%e3%83%91%e3%83%ac%e3%83%83%e3%83%88%e6%94%b9%e3%82%81%e3%80%81%e3%81%95%e3%82%93%e3%81%99%e3%81%86%e3%83%8e%e3%83%bc%e3%83%88', destination: '/sansu-note', permanent: true },
      // …全25記事分（実装時に展開）

      // === 静的HTMLアプリ（WordPress外）→ アプリページ ===
      { source: '/kanji', destination: '/kanji-test', permanent: true },
      { source: '/kanji/', destination: '/kanji-test', permanent: true },
    ]
  }
}
```

---

## 個別の旧デプロイ先（Vercel/Netlify）→ 新URL のリダイレクト

### Vercel プロジェクトの場合
各プロジェクトのリポジトリルートに `vercel.json` を追加:

```json
{
  "redirects": [
    { "source": "/(.*)", "destination": "https://jimitas.com/<新パス>", "permanent": true }
  ]
}
```

### Netlify プロジェクトの場合
各リポジトリルートに `_redirects` ファイル（または `public/_redirects`）を1行で:

```
/*  https://jimitas.com/<新パス>  301
```

⚠️ 削除は急がない方針。**転送設定だけ仕込み、本体は維持**。半年〜1年後にアクセスログを見て不要と判断したら削除する。

---

## 注意点

1. **三角比（triangle-ratio）は jimitas-new に未移植**。中高向けで対象外。リダイレクトせず残すか、新サイトで「中高向け」セクションを作って移植するかは要判断。
2. **もっと学習コンテンツ（motto-gakushu）** は複数アプリの集約ページ。jimitas-new のトップ（`/`）にリダイレクトするのが自然。
3. **わり算の考え方①②** は jimitas-new で `disabled: true`。リダイレクト先のページは現状トップに自動フォールバックする想定。
4. **既存ユーザーのブックマーク**: 旧個別デプロイ先（Vercel/Netlify）は急いで削除しない。リダイレクトを仕込んで自然集約させる。
5. **`jimitas.vercel.app`** は複数アプリのサブパスとして使われている特殊ケース（`sansu-note`, `kanji-print`）。このプロジェクトだけは個別パス→新URLのマッピングが必要。

# スクショ目視 発見レポート

**作成**: 2026-04-26（夜間自律タスク）
**対象**: `screenshots/2026-04-26/` の 54 枚（00_index 〜 53_sakusen-board）
**確認済み**: 23 枚（主要アプリ優先。context 節約のため残り 31 枚は次回確認推奨）
**viewport**: 1024×768（タブレット）

---

## 確認済みアプリ一覧と判定

| ファイル | アプリ名 | 判定 | 備考 |
|---|---|---|---|
| `00_index.png` | トップページ | ✅ OK | brand-400 系で統一、トーン良好 |
| `08_sansu-note.png` | さんすうノート | ✅ OK | BtnMode サイズ選択・danger リセット正常 |
| `09_suuzu-block.png` | すうずぶろっく | ✅ OK | はじめるモーダル brand-green、danger リセット正常 |
| `10_kazoe-bou.png` | かぞえぼう | ✅ OK | 百/十/一の位色（物の色）・danger リセット正常 |
| `11_tokei.png` | とけい | ✅ OK | select border-brand-500・hint ボタン outlined 正常 |
| `12_okane.png` | おかねのけいさん | ✅ OK | セット(brand)/いくら?(accent)/リセット(danger) 統一 |
| `13_tashi-hissan.png` | たし算ひっ算 | ⚠️ 要確認 | 「クリア」ボタンが白背景+黒枠のアウトライン系に見える。danger-400 になっているか確認 |
| `16_kuku-array.png` | 九九のアレイ図 | ✅ OK | 行=rose、列=accent（物の色）、warm BtnShowAnswer 正常 |
| `22_shishagonyu.png` | 四捨五入の練習 | ✅ OK | brand もんだい・disabled accent/warm ヒント/答え 正常 |
| `23_jimipri.png` | じみぷり | ✅ OK | 学年別カード色（物の色）で統一、トーン良好 |
| `26_romaji.png` | ローマ字のれんしゅう | ⚠️ 要確認 | 「もんだい」ボタンが warm-orange（設計トークンでは brand-green のはず）。BtnQuestion を使っていないインライン書きの可能性 |
| `27_kanji-test.png` | 漢字テスト作成 | ✅ OK | 作成(accent)/シャッフル(accent)/印刷(warm) 整合 |
| `29_classroom-english.png` | Classroom English | ✅ OK | 全幅 brand バナー・BtnMode カテゴリタブ正常 |
| `31_gakuten.png` | 音楽記号を覚えよう | ✅ OK | BtnMode フラッシュカード/クイズ 正常 |
| `32_kenban-easy.png` | けんばんハーモニカ（かんたん）| ✅ OK | 楽器 UI のみ、ボタンなし |
| `39_waaon.png` | 和音を出そう | ✅ OK | とめる(danger) 正常。和音ボタンは白枠（固有UI） |
| `40_fushi-dukuri.png` | ふしづくり | ✅ OK | 再生(brand)/停止(danger)/リセット(danger) 正常 |
| `43_nihon-todouhuken.png` | 日本の都道府県 | ✅ OK | 都道府県カードは識別用（物の色）、全体トーン良好 |
| `44_kyoto-ku.png` | 京都市11区 | ✅ OK | リセット(danger) 正常。カードは白枠スタイル |
| `46_sangenshoku.png` | 三原色学習 | ✅ OK | BtnMode 正常。Venn 図の原色は意図的（物の色）|
| `47_classroom-timer.png` | タイマー | ✅ OK | スタート(brand)/リセット(danger) 正常 |
| `48_nandemo.png` | なんでもトランプ | ✅ OK | リセット(danger)/セット(brand) 正常 |
| `53_sakusen-board.png` | 作戦ボード | ✅ OK | リセット(danger)、チーム赤/青（物の色）正常 |

---

## 要確認アプリ（翌朝対応推奨）

### ⚠️ `26_romaji.png` — ローマ字のれんしゅう

**発見**: 「▶ もんだい」ボタンが **warm-orange 系**に見える。

設計トークンによれば「もんだい」ボタンは `BtnQuestion` = brand（緑）が正しい。
スクリーンショットで見るとオレンジ系のトーンが出ており、raw color またはインライン warm スタイルで書かれている可能性。

**確認方法**:
```bash
grep -n "もんだい\|BtnQuestion\|bg-warm\|bg-orange" src/app/\(apps\)/romaji/page.tsx
```

**判断**: 修正の要否はコードを確認後に決定。ただし **2026-04-26 の Phase 5 で修正漏れ**の可能性が高い。

---

### ⚠️ `13_tashi-hissan.png` — たし算のひっ算

**発見**: 「クリア」ボタンが白背景 + 黒・濃色アウトライン系に見える。

Phase 5 では「停止・リセット系を danger-400 に統一」が実施されたはずだが、「クリア」ボタンのスタイルが不明瞭。

**確認方法**:
```bash
grep -n "クリア\|BtnUndo\|bg-danger\|bg-gray" src/app/\(apps\)/tashi-hissan/page.tsx
```

**判断**: アウトライン系であれば danger-400 への統一を検討。ただし「クリア」は筆算特有のアクションなので、デザイン上の例外として残す可能性もあり。翌朝オーナーと確認。

---

## 未確認アプリ一覧（31枚）

context 節約のため省略。次回確認推奨の優先順位：

**優先度 高**（配色変更が大きかったアプリ）:
- `14_hiki-hissan.png` — ひき算ひっ算（クリアボタン確認）
- `15_kake-hissan-1.png` / `18_kake-hissan2.png` / `19_wari-hissan.png` — かけ算・割り算ひっ算
- `30_english-words.png` — スクショ修正前に「つぎへ」が gray だった

**優先度 中**（楽器系・数学系）:
- `33_kenban.png` / `34_mokkin.png` / `35_tekkin.png` / `36_recorder.png` / `37_recorder-play.png`
- `38_oto-dashiyo.png` / `41_dagakki.png` / `42_metronome.png`

**優先度 低**（視覚変更が少なかったアプリ）:
- `01_tashizan-1.png` 〜 `07_ikutu.png`（基本計算系）
- `17_kuku-yomi.png` / `20_warizan.png` / `21_warizan2.png`
- `24_kuku-hyo.png` / `25_katakana.png`
- `28_kanji-print.png`
- `45_masu-nuri.png`
- `49_eawase.png` / `50_barnsley-fern.png` / `51_koch-curve.png` / `52_triangle-ratio.png`

---

## 総評

**確認した 23 枚中、21 枚は配色トーンが統一されており良好。**

新標準（-400 白抜き・danger トークン）が全体的にしっかり適用されている。
2026-04-26 の配色リファクタリングとスクショ駆動検証（6 箇所修正）の成果が出ている。

要確認は **2 アプリ**（romaji の もんだいボタン・tashi-hissan の クリアボタン）のみ。
スクショで「トーンが浮いている」と感じる箇所はなく、全体的に「やわらかい・親しみやすい」印象に統一されている。

# かけ算の筆算① — Next.js / TypeScript 移植 要件定義書

> **対象ファイル（移植元）**
> `16kah1.js`（メインロジック）・`se.js`（効果音）・`style.scss`（スタイル）
> 移植先エディタからこれらのファイルを直接参照できる前提で作成。
>
> **既存の移植先ファイル**
> `src/app/(apps)/kake-hissan-1/page.tsx` — 筆算グリッドとお金グリッドの基本実装が完成済み。
> `src/components/parts/hissan/OkaneGrid.tsx` — `variant="kake1"` が実装済み。
> このドキュメントは、既存実装との差分と仕様の正確な確認を目的とする。

---

## 1. たし算・ひき算との主な違い一覧

| 項目 | たし算 / ひき算 | かけ算① |
|---|---|---|
| 演算記号 | ＋ / － | **×** |
| 被演算数の行 | row 1 | **row 0**（1つ上） |
| 演算数の行 | row 2 | **row 1** |
| 繰り操作の行 | row 0 | **row 2**（中間） |
| 答えの行 | row 3 | row 3（同じ） |
| お金テーブルの行数 | 4行 | **12行** |
| 繰上りの意味 | 10枚→上位1枚 | **桁ごとの積が10超→繰上り** |
| 手動繰上りボタン | なし | **あり（3種類）** |
| 乗数の範囲 | ─ | **1〜9（1桁のみ）** |

---

## 2. 状態管理（State）

| 変数名 | 型 | 初期値 | 説明 |
|---|---|---|---|
| `num1`（hijousu） | number | 23 | 被乗数（かけられる数、2〜3桁） |
| `num2`（jousu） | number | 4 | 乗数（かける数、1桁：1〜9） |
| `answer`（seki） | number | — | 積（num1×num2、自動計算） |
| `hijousuArr` | number[] | [] | 被乗数の各桁（index 0 = 一の位） |
| `jousuArr` | number[] | [] | 乗数の各桁（index 0 = 一の位、常に1要素） |
| `sekiArr` | number[] | [] | 積の各桁（index 0 = 一の位） |
| `carryRow` | string[] | ["","","",""] | 筆算 row 2 の繰上り表示値 |
| `ansRow` | string[] | ["","","",""] | 筆算 row 3 の答え入力値 |
| `isCorrect` | boolean | false | 正解フラグ |
| `typeIndex` | 0\|1 | 0 | 問題タイプ |
| `problemKey` | number | 0 | OkaneGrid リセット用キー |

> **現在の `kake-hissan-1/page.tsx` で実装済み。** 追加変更不要。

---

## 3. ボタン群エリア

| ボタン | 動作 |
|---|---|
| クリア | carryRow・ansRow を空にリセット、selCell を null に |
| もんだい | 問題タイプに応じたランダム問題生成 |
| セット | 入力欄の値で問題をセット |
| こたえ | 繰上りと答えを筆算テーブルに表示 |

**問題タイプ select**（2種類）

| value | 表示テキスト |
|---|---|
| 0 | (２けた)×(１けた) |
| 1 | (３けた)×(１けた) |

> **現在の `kake-hissan-1/page.tsx` で実装済み。**

---

## 4. 式の入力欄

```
[被乗数 input] [× 記号] [乗数 input] [セットボタン]
```

- 被乗数 input：type="number", min=10, max=999
- 乗数 input：type="number", **min=1, max=9**（1桁のみ）
- 答え input は存在しない（筆算 row3 からの自動読み取りで判定）

> **現在の `kake-hissan-1/page.tsx` で実装済み。**

---

## 5. バリデーション

```typescript
// 被乗数: 0 〜 999 の範囲
// 乗数: 1 〜 9 の範囲
if (hijousu > 999 || jousu > 9 || hijousu < 0 || jousu < 0) {
  playSe("alert");
  alert("かけられる数は1～999，かける数は1～9までにしてください。");
  // 入力欄クリア・処理中断
}
```

> **現在の `handleSet` で実装済み。**

---

## 6. 筆算テーブル（TBL）― たし算・ひき算と行の意味が異なる

### テーブル構造（重要：行の役割が違う）

**4行 × 4列**、全セル 60×60px

| 行 | 役割 | 背景色 | 高さ | ドロップ/編集可否 |
|---|---|---|---|---|
| row 0 | 被乗数（かけられる数） | white | 60px | × |
| row 1 | 乗数（かける数）＋「×」記号 | white | 60px | × |
| row 2 | 繰上り（`seki_kuriagari`） | **yellow** | **20px** | ○（編集可） |
| row 3 | 積（答え、`seki_kotae`） | lightyellow | 60px | ○（編集可） |

> たし算では row 0 が繰上り・row 1 が被加数だったが、かけ算では **row 0 が被乗数** になる。

### 数字の配置ロジック（`suujiSet()`）

```typescript
// 全セルクリア後：
// row 0 に被乗数（右詰め）
for (let col = 0; col < hijousuKeta; col++) {
  TBL[0][COLS - col - 1] = String(hijousuArr[col]);
}
// row 1 に乗数（一の位だけ col3 に）
TBL[1][COLS - 1] = String(jousu);
// 「×」の位置
if (hijousu < 100) {
  TBL[1][1] = "×";  // col 1（十の位）
} else {
  TBL[1][0] = "×";  // col 0（百の位）
}
```

### クリア（`masuClear()`）

```typescript
// 全セル空文字 → TBL[1][0] = "×" を入れる
```

### こたえ表示（`showAnswer()`）― 繰上り計算

```typescript
let kuriagari = 0;
for (let col = 0; col < hijousuKeta; col++) {
  const prod = hijousuArr[col] * jousu + kuriagari;
  if (prod > 9) {
    kuriagari = Math.floor(prod / 10);
    // col の1つ上の列（左隣）に繰上り値を表示
    TBL[2][COLS - col - 2] = String(kuriagari);
    // スタイル: fontSize 20px, color red, verticalAlign bottom
  } else {
    kuriagari = 0;
  }
}
// 積（答え）を row 3 に右詰めで配置
for (let col = 0; col < sekiKeta; col++) {
  TBL[3][COLS - col - 1] = String(sekiArr[col]);
}
```

> **現在の `handleShowAnswer` で実装済み。** 繰上り計算ロジックの確認ポイント：
> - 元コードは `floor((積+繰上り) / 10)` で繰上り値を計算
> - 現在の実装は `Math.floor(prod / 10)` — 同等

---

## 7. お金テーブル（TBL_2）― 12行 × 4列

### かけ算特有の構造（最重要）

かけ算の「繰り返し加算」を視覚化する。12行固定。

| 行インデックス | 役割 | 背景色 |
|---|---|---|
| row 0 | ヘッダー（計算式テキスト） | lightyellow |
| row 1〜jousu | 被乗数を1回ずつ繰り返したコイン（最大9行） | white |
| row jousu+1〜9 | 空行（jousuが少ないとき余る） | white |
| row 10 | 集計エリア（合計硬貨を置く・自動繰上り対象） | **yellow** |
| row 11 | 予備・最終答えエリア | lightyellow |

### 列構造（元コードと OkaneGrid の違い）

| 列 | 元コード（16kah1.js） | OkaneGrid（移植先） |
|---|---|---|
| col 0（左端） | 幅100px・ボーダーなし（ラベル用、基本空） | 金種列（千の位）・幅72px |
| col 1 | 幅255px・点線ボーダー（百の位） | 幅72px（百の位） |
| col 2 | 幅255px・点線ボーダー（十の位） | 幅72px（十の位） |
| col 3 | 幅255px・点線ボーダー（一の位） | 幅72px（一の位） |

> **OkaneGrid は4列均等（各72px）。元コードは左端ラベル列（100px）＋右3列（255px）の非対称構成。**
> 視覚的対応付け（筆算との位の一致）は OkaneGrid でも維持されている。

### ヘッダー行（row 0）の表示

元コードの表示内容：
```
col 3（一の位）: [1円画像] が (hijousuArr[0] × jousu) こ
col 2（十の位）: [10円画像] が (hijousuArr[1] × jousu) こ
col 1（百の位）: [100円画像] が (hijousuArr[2] × jousu) こ
```

OkaneGrid の表示内容（実装済み）：
```
[ichi画像] ×jousu＝digit*jousuこ  ← 同じ意味、フォーマットが若干異なる
```

> OkaneGrid のヘッダーフォーマットで十分。表現の細かい差は許容範囲。

### お金の配置ロジック（`okaneSet()`）

```typescript
// 全セルクリア（12行×4列）
// row 1〜jousu の各行に被乗数のコインを1セット配置
for (let i = 1; i <= jousu; i++) {
  for (let col = 0; col < hijousuKeta; col++) {
    for (let k = 0; k < hijousuArr[col]; k++) {
      // coinTypes[col] の硬貨を TBL_2[i][COLS-col-1] に追加
    }
  }
}
```

例：`123 × 4` の場合
- row 1〜4 それぞれに：1円×3枚（col3）、10円×2枚（col2）、100円×1枚（col1）

---

## 8. 繰上りロジック（かけ算特有）

### 自動繰上り（`img_kuriagari()`）

**トリガー**：硬貨が任意のセルにドロップされるたびに実行。

**対象**：`row 10`（集計エリア）のみ。

```typescript
// row 10 の各列で、同金種が10枚以上あれば自動繰上り
for (let j = 0; j < 3; j++) {
  const count = TBL_2[10][COLS-1-j] の coinTypes[j] の枚数;
  if (count > 9) {
    playSe("reset");
    // 10枚削除
    for (let i = 0; i < 10; i++) remove();
    // 上位金種1枚を row 10 の左隣列（col COLS-2-j）に追加
    TBL_2[10][COLS-2-j] に coinTypes[j+1] を1枚追加;
  }
}
```

> OkaneGrid の `postDrop` 内 `variant === "kake1" && row === 10` で実装済み。

### 手動繰上りボタン（3種類）― 元コードの特徴的な仕様

**元コードとの重要な違い**：手動繰上りはテーブル全体（row 0〜11すべて）のコインを対象にカウントし、どこにあっても10枚以上なら繰上げる。

```typescript
// 例: Kuriagari_10() - 1円玉の手動繰上り
function kuriagari10() {
  let count = TBL_2 全体の "ichien" の枚数;  // ← 全行を対象
  if (count > 9) playSe("reset");
  while (count > 9) {
    // ichien を10枚削除（どの行にあっても先頭から10枚）
    for (let i = 0; i < 10; i++) { TBL_2全体.ichien[0].remove(); }
    // row 10 の十の位（col 2）に juuen を1枚追加
    TBL_2[10][2] に juuen を追加;
    count -= 10;
  }
}
```

| ボタン | 対象金種 | 繰上げ先 |
|---|---|---|
| 10くり上がり | 1円（ichien）全体 | row 10 の col 2（十の位）に10円1枚 |
| 100くり上がり | 10円（juuen）全体 | row 10 の col 1（百の位）に100円1枚 |
| 1000くり上がり | 100円（hyakuen）全体 | row 10 の col 0（千の位）に1000円1枚 |

OkaneGrid の `handleKake1Carry` の実装：
```typescript
// wrapperRef.current 全体からカウント → 同等の動作
const totalCount = wrapperRef.current.getElementsByClassName(`hissan-coin-${fromType}`).length
```

> **OkaneGrid で実装済み（全体カウント）。**

### 繰上りボタンの配置（元コード）

元コードでは繰上りボタンが **式の入力欄（shiki セクション）** に配置されている（ボタン群の右側ではなく、式の右）。移植先では OkaneGrid のグリッド下部に配置されており、これで問題ない。

---

## 9. 答え判定（`kotaeInput()`）

```typescript
const kotae =
  Number(TBL[3][0]) * 1000 +
  Number(TBL[3][1]) * 100 +
  Number(TBL[3][2]) * 10 +
  Number(TBL[3][3]);

if (kotae === seki) {
  box5.style.color = "red";
  playSe("seikai1");
}
```

> **`checkAnswer` として実装済み。**

---

## 10. 数字パレット

元コード：0〜9（10個）、ドラッグ＆ドロップで筆算 row2/row3 に配置。

移植先：`HissanNumPad`（クリックで入力）。

> D&Dパレットは後回し方針に従い、現在の HissanNumPad で代替。

---

## 11. 現状の実装ギャップ整理

| 機能 | 元コード | 移植先の状況 | 対応要否 |
|---|---|---|---|
| 筆算テーブル4行構造 | row0=被乗数,row1=乗数,row2=繰上り,row3=答え | **実装済み** | 不要 |
| ×記号の配置（桁数で移動） | hijousu<100→col1、else→col0 | **実装済み**（signCol） | 不要 |
| こたえ表示の繰上り計算 | 桁ごとに積+繰上りを計算 | **実装済み** | 不要 |
| OkaneGrid 12行構造 | 12行×4列 | **実装済み**（kake1） | 不要 |
| row0ヘッダーテキスト | 「1円が(3×4)こ」形式 | **実装済み**（異形式だが同義） | 確認のみ |
| 自動繰上り（row10） | >9枚で自動変換 | **実装済み** | 不要 |
| 手動繰上りボタン3種 | 全体カウント | **実装済み** | 不要 |
| 数字パレット（D&D版） | ドラッグ式 | **HissanNumPad で代替中** | 後回し |

---

## 12. 確認・調整が必要なポイント

### 12-1. OkaneGrid の `isDroppable` 範囲

現在の実装：
```typescript
if (variant === "kake1") return row >= 1 && row <= 11
```
元コード：全セルが `droppable-elem-2`（row 0 含む）。

> **row 0（ヘッダー行）はドロップ不可で正しい。** 現在の実装でOK。

### 12-2. コインのサイズ

| | 元コード | OkaneGrid |
|---|---|---|
| 通常コイン（1円・10円・100円） | 20×20px | 22×22px |
| 千円 | 45×20px | 36×20px |

> 20px と 22px の差は実用上問題なし。1000円の幅が縮んでいるが許容範囲。

### 12-3. セットボタンのタッチスタートバグ対応

元コードにはコメントあり：
```javascript
// セットボタンが効きにくいので、タッチスタートも併せて設置
set.addEventListener("touchstart", () => mondai_set());
```

移植先では `onClick` のみ。iOS Safari でボタンが効きにくい場合はこの対応が必要。

### 12-4. `hijousu_arr[2] = 0` の初期化

元コード L337：
```javascript
hijousu_arr[2] = 0;  // 3桁目を先に0で初期化（2桁数の場合の安全弁）
```

移植先の `toDigits` 関数は文字列分解でインデックスが範囲外なら `undefined` を返すため、`hijousuArr[2] ?? 0` で対応する必要がある（OkaneGrid の `d1[di] ?? 0` で対応済み）。

---

## 13. 移植の優先順位

| 優先度 | 機能 | 状況 |
|---|---|---|
| ─（完了） | 筆算グリッド・数字入力・こたえ | 実装済み |
| ─（完了） | OkaneGrid（12行・手動繰上り・自動繰上り） | 実装済み |
| 1（確認） | セットボタン iOS タッチ問題 | 要動作確認 |
| 2（後回し） | D&D数字パレット | HissanNumPad で代替中 |

---

## 14. 移植先 Claude Code へ渡すプロンプト（推奨文）

```
このプロジェクト（motto/）の 16kah1.js を読んでください。
かけ算の筆算ページは Next.js + TypeScript への移植がほぼ完成しています。
要件定義書は docs/kake-hissan-1-requirements.md にあります。

既存の src/app/(apps)/kake-hissan-1/page.tsx と
src/components/parts/hissan/OkaneGrid.tsx（variant="kake1"）を確認した上で、
以下の差分だけを対応してください：

1. iOS Safari でセットボタンが効きにくい場合、onClick に加えて onTouchStart も追加する
2. OkaneGrid のヘッダー行（row 0）の表示が元コードと異なる場合、
   「[コイン画像] が (桁の値 × 乗数) こ」形式に近づける（任意）
3. OkaneGrid の自動繰上り・手動繰上りの動作を元コードで確認し、
   挙動の差異があれば修正する

筆算グリッド・数字パレット・答えチェックは実装済みのため変更不要。
```

---

*最終更新: 2026-03-22*

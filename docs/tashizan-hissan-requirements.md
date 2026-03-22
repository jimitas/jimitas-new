# たし算の筆算 — Next.js / TypeScript 移植 要件定義書

> **対象ファイル（移植元）**
> `14tahi.js`（メインロジック）・`se.js`（効果音）・`drag.js`（D&Dユーティリティ）・`style.scss`（スタイル）移植先エディタからこれらのファイルを直接参照できる前提で作成。

---

## 0. 移植先の前提

- 移植先：`C:\jimitas-project\jimitas-new`
- 既存の実装：`src/app/(apps)/tashi-hissan/page.tsx`（作り直し対象）
- 共通コンポーネント：`src/components/parts/hissan/` に HissanGrid・HissanNumPad・OkaneGrid が実装済み
- この要件定義書の仕様を優先しつつ、既存の共通コンポーネントを活用すること
- 効果音は `@/lib/se` の playSe() を使うこと
- デザイントークン（brand/accent/warm）を使うこと

## 1. 画面全体の構成

```
[ボタン群エリア]
[式の入力欄]
[筆算テーブル] [ゴミ箱] [お金テーブル]
[数字パレット]
[スコアエリア]
```

縦方向に上記の順で積み上げる。「筆算テーブル」「ゴミ箱」「お金テーブル」は **横並び（flexbox row）**
にする。筆算の列とお金の列が視覚的に対応していることが重要。

---

## 2. 状態管理（State）

| 変数名           | 型           | 初期値    | 説明                             |
| ---------------- | ------------ | --------- | -------------------------------- |
| `hikasu`         | number       | 123       | 被加数（たされる数）             |
| `kasu`           | number       | 456       | 加数（たす数）                   |
| `wa`             | number       | —         | 和（自動計算）                   |
| `hikasArr`       | number[]     | []        | 被加数の各桁（index 0 = 一の位） |
| `kasuArr`        | number[]     | []        | 加数の各桁（index 0 = 一の位）   |
| `waArr`          | number[]     | []        | 和の各桁（index 0 = 一の位）     |
| `hissan`         | string[][]   | 4×4 の "" | 筆算テーブルの表示値             |
| `moneyTable`     | CoinList[][] | 4×4 の [] | お金テーブルの硬貨リスト         |
| `problemType`    | 1\|2\|3\|4   | 1         | 問題タイプ                       |
| `answerBoxValue` | string       | ""        | 答え入力欄の値                   |
| `score`          | number       | 0         | 正解数                           |

### 桁数の取り方（コード忠実移植）

```typescript
// 各数を一の位から順に配列化
function toDigitArray(n: number): number[] {
  return String(n).split("").reverse().map(Number);
}
```

---

## 3. ボタン群エリア

| ボタン   | クラス            | 動作                  |
| -------- | ----------------- | --------------------- |
| クリア   | `btn btn-primary` | `masuClear()` を呼ぶ  |
| もんだい | `btn btn-success` | `shutudai()` を呼ぶ   |
| セット   | `btn btn-info`    | `mondaiSet()` を呼ぶ  |
| こたえ   | `btn btn-danger`  | `showAnswer()` を呼ぶ |

**問題タイプ select**（ボタン群と同列に配置）

| value | 表示テキスト      |
| ----- | ----------------- |
| 1     | (２けた)+(２けた) |
| 2     | (３けた)+(２けた) |
| 3     | (２けた)+(３けた) |
| 4     | (３けた)+(３けた) |

---

## 4. 式の入力欄

横並び（flex row）で以下を配置：

```
[被加数 input] [+ 記号] [加数 input] [= 記号] [答え input]
```

- **被加数・加数 input**：type="number", min=10, max=999, 幅120px, 高さ50px, フォント30px
- **答え input**：type="number", 幅120px, 高さ50px, フォント30px
  - 値が `wa` と一致 → 文字色を **赤** にして seikai1 音を鳴らす
  - 一致しない → 文字色を **黒**

---

## 5. 筆算テーブル（TBL）

### テーブル構造

**4行 × 4列**、全セル 60×60px、border: 1px solid #333

| 行    | 役割                       | 背景色        | ドロップ可否   |
| ----- | -------------------------- | ------------- | -------------- |
| row 0 | 繰上り記入欄               | `lightyellow` | ○（droppable） |
| row 1 | 被加数（たされる数）       | `white`       | ×              |
| row 2 | 加数（たす数） + 「+」記号 | `white`       | ×              |
| row 3 | 和（答え）                 | `lightyellow` | ○（droppable） |

| 列           | 位     |
| ------------ | ------ |
| col 0 (左端) | 千の位 |
| col 1        | 百の位 |
| col 2        | 十の位 |
| col 3 (右端) | 一の位 |

### 数字の配置ロジック（`suujiSet()`）

```typescript
// セルを全クリア後：
// 被加数：右から配置
for (let col = 0; col < hikasKeta; col++) {
  TBL[1][3 - col] = String(hikasArr[col]);
}
// 加数：右から配置
for (let col = 0; col < kasuKeta; col++) {
  TBL[2][3 - col] = String(kasuArr[col]);
}
// 「+」の位置（両数が2桁以下なら十の位、3桁以上があれば百の位）
if (hikasu < 100 && kasu < 100) {
  TBL[2][2] = "+"; // col 2 = 十の位
} else {
  TBL[2][1] = "+"; // col 1 = 百の位（左方向にシフト）
}
```

### クリア（`masuClear()`）

- TBL 全セルを空文字にリセット
- `TBL[2][0] = "+"` を入れる（← 元コード: `TBL.rows[2].cells[0].innerHTML = "+"` ）
- 式の入力欄（被加数・加数・答え）も空にリセット
- reset 音を鳴らす

### こたえ表示（`showAnswer()`）

```typescript
// 繰上りの表示
let kuriagari = 0;
for (let col = 0; col < Math.min(hikasKeta, kasuKeta); col++) {
  if (hikasArr[col] + kasuArr[col] + kuriagari > 9) {
    TBL[0][3 - col - 1] = "1"; // 赤字・小さめフォント・下揃え
    kuriagari = 1;
  } else {
    kuriagari = 0;
  }
}
// 和の表示
for (let col = 0; col < waKeta; col++) {
  TBL[3][3 - col] = String(waArr[col]);
}
```

繰上りの「1」はスタイルが特別：

- fontSize: 20px（通常は30px）
- color: red
- verticalAlign: bottom（セル下寄せ）

---

## 6. お金テーブル（TBL_2）

### テーブル構造

**4行 × 4列**、筆算テーブルと **完全対応** する。各セルは幅200px
× 高さ60px。セル内には複数の硬貨画像が横並びで入る（`flex-wrap`）。

| 行    | 役割                           | 背景色        |
| ----- | ------------------------------ | ------------- |
| row 0 | 繰上り硬貨が出現する場所       | `lightyellow` |
| row 1 | 被加数のお金                   | `white`       |
| row 2 | 加数のお金 + 「+」記号         | `white`       |
| row 3 | 答え（生徒がドロップする場所） | `lightyellow` |

### 硬貨の種類と画像

| クラス名  | 画像ファイル  | サイズ  | 金種   | 対応列          |
| --------- | ------------- | ------- | ------ | --------------- |
| `ichien`  | `ichien.png`  | 25×25px | 1円    | col 3（一の位） |
| `juuen`   | `juuen.png`   | 25×25px | 10円   | col 2（十の位） |
| `hyakuen` | `hyakuen.png` | 25×25px | 100円  | col 1（百の位） |
| `senen`   | `senen.png`   | 60×25px | 1000円 | col 0（千の位） |

### お金の配置ロジック（`okaneSet()`）

```typescript
// まず TBL_2 全セルをクリア
// 被加数のお金を row 1 に配置
for (let col = 0; col < hikasKeta; col++) {
  for (let i = 0; i < hikasArr[col]; i++) {
    // 対応する金種の画像を TBL_2[1][3-col] に appendChild
  }
}
// 加数のお金を row 2 に配置
for (let col = 0; col < kasuKeta; col++) {
  for (let i = 0; i < kasuArr[col]; i++) {
    // 対応する金種の画像を TBL_2[2][3-col] に appendChild
  }
}
// 「+」の位置は筆算テーブルと同じルール
if (hikasu < 100 && kasu < 100) {
  TBL_2[2][2] の innerHTML = "+";  // 十の位
} else {
  TBL_2[2][1] の innerHTML = "+";  // 百の位
}
```

> **注意**：「もんだい」「セット」を押すたびに **必ず全クリアしてから配置**
> する。クリアせずに配置するとお金が増え続けてバグになる。

---

## 7. 繰上り（くりあがり）ロジック

### トリガー

生徒が硬貨を row 3（答え欄）にドロップするたびに `imgKuriagari()` を実行。

### ロジック詳細

```typescript
function imgKuriagari() {
  const coinClasses = ["ichien", "juuen", "hyakuen", "senen"];

  for (let j = 0; j < 3; j++) {
    // row 3 の (3-j) 列目に同金種が 10枚以上あるか
    const count = TBL_2[3][3 - j] の coinClasses[j] の枚数;
    if (count >= 10) {
      // reset 音を鳴らす
      // 10枚削除
      10枚 remove;
      // 1つ上の金種を row 0 の (2-j) 列目に追加
      // j=0: 1円×10→10円を col 2 へ
      // j=1: 10円×10→100円を col 1 へ
      // j=2: 100円×10→1000円を col 0 へ
      TBL_2[0][2 - j] に coinClasses[j+1] の画像を appendChild;
      // 追加した画像もドラッグ可能にする
    }
  }
}
```

> ループは j=0（1円）→ j=1（10円）→ j=2（100円）の順で処理。1000円の繰上りは発生しない（3桁＋3桁の最大は1998円）。

---

## 8. ドラッグ＆ドロップ（D&D）

### 対象要素と動作

| ドラッグ元           | ドロップ先クラス                          | 動作                                                           |
| -------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| 数字パレット（0〜9） | `droppable-elem`（筆算 row0/row3 のセル） | セルに数字を配置 → 数字パレットをリフレッシュ → `kotaeInput()` |
| 硬貨画像             | `droppable-elem-2`（お金テーブル全セル）  | 硬貨を移動 → `imgKuriagari()`                                  |
| 硬貨画像             | ゴミ箱（`droppable-elem`）                | 硬貨を削除                                                     |

### タッチ操作（iOS/Android 対応）

元コードにはマウスD&DとタッチD&Dの両方が実装されている。タッチの実装は以下の流れ：

```
touchstart → スクロール preventDefault
touchmove  → 要素を fixed に変えて指の位置に追従
touchend   → elementFromPoint で着地先を特定 → 親要素として appendChild
```

着地先の判定：

- `elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset)`
- className が `droppable-elem` か `droppable-elem-2` かで処理を分岐

### 数字パレットのリフレッシュ

数字をドロップするたびに、パレット内の全要素を削除してから 0〜9 を再生成する（無限に使える）。

---

## 9. 数字パレット（num_pallet）

- 0〜9 の数字を横並びに表示
- 各要素：50×50px、白背景、フォント30px、border-radius 10%、border 1px solid #333
- ドラッグして筆算の `row0`（繰上り欄）・`row3`（答え欄）に配置できる
- 配置後はパレットをリフレッシュ（常に 0〜9 が使える状態を保つ）

---

## 10. 答え判定（`kotaeInput()`）

```typescript
// 筆算 row3 から値を読む
const kotae = Number(TBL[3][0]) * 1000 + Number(TBL[3][1]) * 100 + Number(TBL[3][2]) * 10 + Number(TBL[3][3]);

// 答えボックスに反映
answerBoxValue = String(kotae);

// 正解判定
if (kotae === wa) {
  answerBox.style.color = "red";
  play(seikai1);
  scoreWrite(); // スコアにコイン追加
} else {
  answerBox.style.color = "black";
}
```

---

## 11. スコアエリア（score_pallet）

- 正解するたびに `coin.png`（30×30px）を追加表示
- 正解ごとに蓄積され続ける

---

## 12. ゴミ箱

- 画像：`gomibako.png`（50×60px）
- 位置：筆算テーブルとお金テーブルの間、下方（`top: 150px` 相対位置）
- 硬貨や数字をドロップすると削除される

---

## 13. 効果音

| 定数名    | ファイル             | 再生タイミング         |
| --------- | -------------------- | ---------------------- |
| `pi`      | `Sounds/pi.mp3`      | D&Dドロップ時          |
| `set`     | `Sounds/set.mp3`     | もんだい・セット押下時 |
| `seikai1` | `Sounds/seikai.mp3`  | 正解時                 |
| `seikai2` | `Sounds/seikai2.mp3` | こたえボタン押下時     |
| `reset`   | `Sounds/reset.mp3`   | クリア時・繰上り発生時 |
| `alert`   | `Sounds/alert.mp3`   | 入力エラー時（範囲外） |

再生前に `currentTime = 0` でリセットしてから play（連続再生対応）。

---

## 14. バリデーション

- 被加数・加数の入力値が 0未満または999超の場合：
  - alert.mp3 を再生
  - `alert("数字は1～999までにしてください。")` を表示
  - 入力欄をクリア
  - `hissanSet` を中断

---

## 15. 移植の優先順位

| 優先度        | 機能                                       |
| ------------- | ------------------------------------------ |
| 1（必須）     | 筆算テーブル表示・数字セット・こたえボタン |
| 1（必須）     | お金テーブル表示・okaneSet                 |
| 1（必須）     | 繰上りロジック（imgKuriagari）             |
| 1（必須）     | ボタン群・問題タイプ選択・もんだい・セット |
| 2（重要）     | タッチD&D（硬貨の移動）                    |
| 3（後回し可） | マウスD&D（数字パレット → 筆算セル）       |
| 3（後回し可） | 数字パレット（D&D版、現在は別実装中）      |
| 4（任意）     | スコアエリア・効果音                       |

> 数字パレットのD&Dは現在移植先で別の方法（クリック入力など）で代替実装されている。お金テーブルの繰上りが完成してから数字パレットのD&D化に取り組む。

---

## 16. コンポーネント分割案（Next.js / TypeScript）

```
/components/tashizan-hissan/
  ├── TashizanHissan.tsx       # ページ全体のコンテナ
  ├── ButtonGroup.tsx          # ボタン群・タイプ選択
  ├── ShikiInput.tsx           # 式の入力欄
  ├── HissanTable.tsx          # 筆算テーブル（4×4）
  ├── OkaneTable.tsx           # お金テーブル（4×4）
  ├── Gomibako.tsx             # ゴミ箱
  ├── NumPallet.tsx            # 数字パレット
  ├── ScorePallet.tsx          # スコア表示
  └── hooks/
      ├── useHissanState.ts    # 状態管理・計算ロジック
      ├── useDragDrop.ts       # D&D ロジック（タッチ・マウス）
      └── useKuriagari.ts      # 繰上り判定ロジック
```

---

## 17. 移植先 Claude Code へ渡すプロンプト（推奨文）

```
このプロジェクト（motto/）の 14tahi.js を読んでください。
たし算の筆算ページを Next.js + TypeScript に移植します。
要件定義書は docs/tashizan-hissan-requirements.md に記載しています。
実装の優先順位・コンポーネント構成・状態管理・繰上りロジックはすべてそこに書いてあります。

まず以下を実装してください：
1. HissanTable（4×4テーブル、筆算の数字表示）
2. OkaneTable（4×4テーブル、硬貨の表示・ドロップ・繰上り）
3. ButtonGroup + useHissanState（もんだい・セット・クリア・こたえ）

数字パレットのD&Dは最後に実装します。
```

---

_最終更新: 2026-03-22_

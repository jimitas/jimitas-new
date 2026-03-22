# 引き算の筆算 — Next.js / TypeScript 移植 要件定義書

> **対象ファイル（移植元）**
> `15hihi.js`（メインロジック）・`se.js`（効果音）・`style.scss`（スタイル）
> 移植先エディタからこれらのファイルを直接参照できる前提で作成。
>
> **たし算の筆算（`tashizan-hissan-requirements.md`）との差分を中心に記述。**
> 共通部分（D&D実装・数字パレット・スコアエリア・効果音一覧）はたし算の要件定義書も参照すること。

---

## 0. 移植先の前提

- 移植先：`C:\jimitas-project\jimitas-new`
- 既存の実装：`src/app/(apps)/hiki-hissan/page.tsx`（作り直し対象）
- 共通コンポーネント：`src/components/parts/hissan/` の HissanGrid・HissanNumPad・OkaneGrid を活用
- 効果音は `@/lib/se` の `playSe()` を使うこと
- デザイントークン（brand/accent/warm）を使うこと

---

## 1. たし算との主な違い一覧

| 項目 | たし算（14tahi.js） | 引き算（15hihi.js） |
|---|---|---|
| 演算記号 | `+` | `-` |
| 被演算数の呼び名 | 被加数（hikasu） | 被減数（higensu） |
| 演算数の呼び名 | 加数（kasu） | 減数（gensu） |
| 結果の呼び名 | 和（wa） | 差（sa） |
| 問題タイプ数 | 4種類 | **3種類** |
| お金の配置 | 被加数＋加数の両方 | **被減数のみ**（row 1 のみ） |
| 繰り操作 | 繰り上がり（両替して上位へ） | **繰り下がり（崩して下位へ）** |
| 数字パレット | 0〜9（10個） | **0〜10（11個）** |
| バリデーション追加 | なし | **higensu >= gensu のチェック** |

---

## 2. 状態管理（State）

| 変数名 | 型 | 初期値 | 説明 |
|---|---|---|---|
| `higensu` | number | 456 | 被減数（引かれる数） |
| `gensu` | number | 123 | 減数（引く数） |
| `sa` | number | — | 差（自動計算） |
| `higensuArr` | number[] | [] | 被減数の各桁（index 0 = 一の位） |
| `gensuArr` | number[] | [] | 減数の各桁（index 0 = 一の位） |
| `saArr` | number[] | [] | 差の各桁（index 0 = 一の位） |
| `hissan` | string[][] | 4×4 の "" | 筆算テーブルの表示値 |
| `moneyTable` | CoinList[][] | 4×4 の [] | お金テーブルの硬貨リスト |
| `problemType` | 1\|2\|3 | 1 | 問題タイプ（3種類） |
| `answerBoxValue` | string | "" | 答え入力欄の値 |
| `score` | number | 0 | 正解数 |
| `kurisagari` | number | 0 | 繰り下がりフラグ（0 or 1） |

---

## 3. ボタン群エリア

たし算と同じ構成（クリア・もんだい・セット・こたえ）。

**問題タイプ select**（3種類）

| value | 表示テキスト |
|---|---|
| 1 | (２けた)-(２けた) |
| 2 | (３けた)-(２けた) |
| 3 | (３けた)-(３けた) |

> たし算には `(２けた)+(３けた)` があったが、引き算では **被減数 ≧ 減数** の制約上、この組み合わせは存在しない。

---

## 4. 式の入力欄

たし算と同じ構成。演算記号が `+` → `-` に変わる。

```
[被減数 input] [- 記号] [減数 input] [= 記号] [答え input]
```

答え input の正解判定：`box5.value == sa` なら赤字 + seikai1 音。

---

## 5. ランダム問題生成（`shutudai()`）

```typescript
switch (problemType) {
  case 1:  // (2けた)-(2けた)
    higensu = Math.floor(Math.random() * 90 + 10);         // 10〜99
    gensu   = Math.floor(Math.random() * (higensu - 10) + 10); // 10〜higensu-1
    break;
  case 2:  // (3けた)-(2けた)
    higensu = Math.floor(Math.random() * 900 + 100);       // 100〜999
    gensu   = Math.floor(Math.random() * 90 + 10);         // 10〜99
    break;
  case 3:  // (3けた)-(3けた)
    higensu = Math.floor(Math.random() * 900 + 100);       // 100〜999
    gensu   = Math.floor(Math.random() * (higensu - 100) + 100); // 100〜higensu-1
    break;
}
```

> **重要**：type 1・3 では `gensu` の上限を `higensu` より小さく制限して、必ず正の差が出るようにしている。

---

## 6. バリデーション（たし算から追加）

```typescript
// 範囲チェック（たし算と共通）
if (higensu > 999 || gensu > 999 || higensu < 0 || gensu < 0) {
  playSe("alert");
  alert("数字は1～999までにしてください。");
  // 入力欄クリア・処理中断
  return;
}
// 引き算固有のチェック
if (higensu < gensu) {
  playSe("alert");
  alert("引かれる数は，引く数よりも大きくしてください。");
  // 入力欄クリア・処理中断
  return;
}
```

---

## 7. 筆算テーブル（TBL）

構造はたし算と同じ（4行×4列、droppable は row 0・row 3）。

### 数字配置ロジック（`suujiSet()`）

```typescript
// 被減数（row 1）を右から配置
for (let col = 0; col < higensuKeta; col++) {
  TBL[1][3 - col] = String(higensuArr[col]);
}
// 減数（row 2）を右から配置
for (let col = 0; col < gensuKeta; col++) {
  TBL[2][3 - col] = String(gensuArr[col]);
}
// 「-」の位置
if (higensu < 100 && gensu < 100) {
  TBL[2][2] = "-";  // 十の位
} else {
  TBL[2][1] = "-";  // 百の位
}
```

### クリア

```typescript
// 全セル空文字 → TBL[2][0] = "-" を入れる
```

> たし算は `TBL[2][0] = "+"` だったのが `-` になるだけ。

### こたえ表示（`showAnswer()`）― 繰り下がりの可視化

元コードを忠実に再現する。繰り下がりが発生した桁に以下を表示：

```typescript
// こたえボタンでの繰り下がり表示
let kurisagari = 0;
for (let col = 0; col < Math.max(higensuKeta, gensuKeta) - 1; col++) {
  if (higensuArr[col] - gensuArr[col] - kurisagari < 0) {
    // row 0 に "10" を赤字小フォントで表示（借りた数）
    TBL[0][3 - col] = <span color:red font-size:20px vertical-align:bottom>10</span>;
    // row 1 の上の桁に「取り消し線付き元の数字」と「-1した数字」を重ねて表示
    TBL[1][3 - col - 1] =
      <span class="naname1">{higensuArr[col + 1]}</span>  // 取り消し線
      + <span color:red font-size:20px vertical-align:top>{higensuArr[col + 1] - 1}</span>;
    kurisagari = 1;
  } else {
    kurisagari = 0;
  }
  // 特殊ケース：2回繰り下がり かつ 十の位が 0 の場合
  if (higensuArr[0] - gensuArr[0] < 0 && higensuArr[1] === 0) {
    TBL[0][2] = <span color:red font-size:20px vertical-align:bottom>9</span>;
    TBL[1][2] = "0";
  }
}
// 差（答え）を row 3 に配置
for (let col = 0; col < saKeta; col++) {
  TBL[3][3 - col] = String(saArr[col]);
}
```

**`naname1` クラス**（取り消し線）はたし算要件定義書のスタイルに定義済み：
```css
.naname1::before {
  content: ""; position: absolute; display: block;
  transform: rotate(45deg); background-color: red;
  width: 100%; height: 1px; top: 50%; left: 0;
}
```

---

## 8. お金テーブル（TBL_2）

### たし算との決定的な違い

たし算では **被加数（row 1）と加数（row 2）の両方**にお金を並べた。

引き算では **被減数（row 1）だけ**にお金を並べる。
減数（row 2）にはお金を並べない。「−」記号の表示のみ。

```typescript
function okaneSet() {
  // 全セルクリア
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++)
      moneyTable[row][col] = [];

  // 被減数のお金を row 1 に配置（被減数の桁数分）
  for (let col = 0; col < higensuKeta; col++) {
    for (let i = 0; i < higensuArr[col]; i++) {
      // coinTypes[col] の硬貨を TBL_2[1][3-col] に追加
    }
  }

  // 「-」記号の位置
  if (higensu < 100 && gensu < 100) {
    TBL_2[2][2] = "-";  // 十の位
  } else {
    TBL_2[2][1] = "-";  // 百の位
  }
}
```

---

## 9. 繰り下がり（くりさがり）ロジック ← 最重要

### 概念（教育的背景）

引き算の筆算で繰り下がりが必要な場合、生徒は上の桁から「借りる」操作を行う。
お金で表現すると「10円玉を1円玉の列に持ってきて、10枚の1円玉にくずす（両替する）」。

**操作の流れ：**
1. 生徒が被減数（row 1）の高位の硬貨（例：10円）を row 0（繰り下がり行）の低位列（例：一の位の col 3）にドラッグ
2. システムが row 0 の該当セルに上位金種が1枚あることを検出
3. その上位金種を削除し、下位金種10枚を同じセルに追加
4. 生徒は増えた1円玉から必要な枚数を row 3（答え行）に移す

### トリガー

硬貨が `droppable-elem-2` セルにドロップされるたびに `imgKurisagari()` を実行。

### 元コードのロジック

```typescript
function imgKurisagari() {
  const coinTypes = ["ichien", "juuen", "hyakuen", "senen"];

  for (let j = 0; j < 3; j++) {
    // row 0 の (3-j) 列目に上位金種が 1枚あるか確認
    // j=0: col 3（一の位）に juuen（10円）が1枚
    // j=1: col 2（十の位）に hyakuen（100円）が1枚
    // j=2: col 1（百の位）に senen（1000円）が1枚
    const count = TBL_2[0][3 - j] の coinTypes[j + 1] の枚数;
    if (count === 1) {
      playSe("reset");
      // 上位金種を1枚削除
      TBL_2[0][3 - j] から coinTypes[j+1] を1枚 remove;
      // 下位金種を10枚追加（同じセルに）
      for (let i = 0; i < 10; i++) {
        coinTypes[j] の画像を TBL_2[0][3 - j] に appendChild;
        // 追加した硬貨もドラッグ可能にする（touchイベント付与）
      }
    }
  }
}
```

### 繰り下がりの列マッピング

| j | チェックするセル | 検出する金種（上位） | 追加する金種（下位） | 教育的意味 |
|---|---|---|---|---|
| 0 | row 0, col 3（一の位） | 10円（juuen） | 1円×10枚 | 10円→1円×10 |
| 1 | row 0, col 2（十の位） | 100円（hyakuen） | 10円×10枚 | 100円→10円×10 |
| 2 | row 0, col 1（百の位） | 1000円（senen） | 100円×10枚 | 1000円→100円×10 |

### 繰り下がり制限（追加要件・元コードに未実装）

**問題**：元コードでは `count === 1` の瞬間に変換するが、変換後に再び上位金種を同じセルに持ってくると2回目の変換が発生し、意図しない枚数になる。

**解決策**：変換は各列につき1回のみ許可する。
以下のいずれかのアプローチで制御する：

**推奨アプローチ（コード量少）：下位金種の枚数チェック**

```typescript
if (count === 1) {
  // 既に下位金種が10枚以上あれば変換しない（既に1回変換済み）
  const lowerCount = TBL_2[0][3 - j] の coinTypes[j] の枚数;
  if (lowerCount >= 10) return; // ガード：2回目の変換をブロック

  // 変換実行
  playSe("reset");
  TBL_2[0][3 - j] から coinTypes[j+1] を1枚 remove;
  for (let i = 0; i < 10; i++) {
    coinTypes[j] の画像を追加;
  }
}
```

**補足説明**：
- 正常な1回目の変換後：セルには下位金種が10枚ある
- 生徒が再び上位金種を持ってきても `lowerCount >= 10` でブロック
- 生徒が下位金種を使った後（<10枚になった後）も、再変換は教育的に不要のため `lowerCount >= 10` の条件ではなく、**状態フラグ** で管理する方が確実

**より確実なアプローチ（状態フラグ）**：

```typescript
// state として各列の変換済みフラグを管理
const [kurisagariDone, setKurisagariDone] = useState([false, false, false]);
// index 0 = col 3（一の位）, index 1 = col 2（十の位）, index 2 = col 1（百の位）

// imgKurisagari 内：
for (let j = 0; j < 3; j++) {
  const count = ...; // row 0 のセルの上位金種枚数
  if (count === 1 && !kurisagariDone[j]) {  // ← フラグチェック追加
    // 変換実行
    setKurisagariDone(prev => {
      const next = [...prev];
      next[j] = true;  // 変換済みにする
      return next;
    });
    playSe("reset");
    // 削除・追加処理
  }
}
```

**フラグのリセットタイミング**：「もんだい」「セット」「クリア」ボタンを押したとき（`[false, false, false]` に戻す）

---

## 10. 答え判定（`kotaeInput()`）

たし算と同じ仕組み。差だけが変わる。

```typescript
const kotae =
  Number(TBL[3][0]) * 1000 +
  Number(TBL[3][1]) * 100 +
  Number(TBL[3][2]) * 10 +
  Number(TBL[3][3]);

answerBoxValue = String(kotae);

if (kotae === sa) {
  answerBox.style.color = "red";
  playSe("seikai1");
  scoreWrite();
} else {
  answerBox.style.color = "black";
}
```

---

## 11. 数字パレット（num_pallet）

たし算は 0〜9（10個）。引き算は **0〜10（11個）**。

繰り下がり後に「10」と書いたセルを表現するために 10 が必要。

```typescript
for (let i = 0; i <= 10; i++) {  // ← たし算の i < 10 と違い i <= 10
  // div を生成して num_pallet に追加
}
```

---

## 12. こたえボタンでの繰り下がり可視化（特殊ケース）

「2回繰り下がり かつ 十の位が 0 の場合」は特別な表示が必要。

例：`301 - 152`
- 一の位：1 < 2 → 十の位から借りたいが十の位が 0
- 十の位が 0 → 百の位から借りて十の位に 10 を作ってから、さらに一の位へ
- この場合、十の位のセル（col 2）は `9` と表示、row 1 の col 2 は `0` のまま

```typescript
if (higensuArr[0] - gensuArr[0] < 0 && higensuArr[1] === 0) {
  TBL[0][2] = <span color:red font-size:20px>9</span>;
  TBL[1][2] = "0";
}
```

---

## 13. レイアウト（たし算との差分）

画面構成はたし算と同じ：

```
[ボタン群エリア]
[式の入力欄（被減数 - 減数 = 答え）]
[筆算テーブル] [ゴミ箱] [お金テーブル]
[数字パレット（0〜10）]
[スコアエリア]
```

お金テーブルの見た目の違い：
- row 1（被減数）：硬貨が並ぶ
- row 2（減数）：**硬貨なし**、「-」記号のみ
- row 0（繰り下がり行）：生徒が上位硬貨を置いて崩す場所

---

## 14. 移植の優先順位

| 優先度 | 機能 |
|---|---|
| 1（必須） | 筆算テーブル表示・suujiSet・こたえボタン |
| 1（必須） | お金テーブル表示・okaneSet（被減数のみ） |
| 1（必須） | 繰り下がりロジック（imgKurisagari）＋制限フラグ |
| 1（必須） | ボタン群・問題タイプ選択・バリデーション |
| 2（重要） | タッチD&D（硬貨の移動） |
| 2（重要） | showAnswer の繰り下がり可視化（取り消し線・赤字） |
| 3（後回し可） | 数字パレット D&D 版 |
| 4（任意） | スコアエリア・効果音 |

---

## 15. コンポーネント分割案（Next.js / TypeScript）

```
/components/hikizan-hissan/
  ├── HikizanHissan.tsx          # ページ全体のコンテナ
  ├── ButtonGroup.tsx            # ボタン群（共通化可能）
  ├── ShikiInput.tsx             # 式の入力欄（演算子 prop で共通化可）
  ├── HissanTable.tsx            # 筆算テーブル（共通 HissanGrid 活用）
  ├── OkaneTable.tsx             # お金テーブル（繰り下がり版）
  ├── Gomibako.tsx               # ゴミ箱（共通化可）
  ├── NumPallet.tsx              # 数字パレット（0〜10）
  └── hooks/
      ├── useHikizanState.ts     # 状態管理・計算ロジック
      ├── useDragDrop.ts         # D&D（共通化可）
      └── useKurisagari.ts       # 繰り下がり判定＋制限フラグ
```

---

## 16. 移植先 Claude Code へ渡すプロンプト（推奨文）

```
このプロジェクト（motto/）の 15hihi.js を読んでください。
引き算の筆算ページを Next.js + TypeScript に移植します。

要件定義書は docs/hikizan-hissan-requirements.md に、
たし算の筆算との差分・共通部分は docs/tashizan-hissan-requirements.md にあります。
両方を読んでから実装してください。

主な差分：
1. お金テーブルは被減数（row 1）のみ。減数のお金は並べない
2. 繰り下がりロジック（imgKurisagari）：上位硬貨→下位10枚に崩す
3. 繰り下がりは各列1回のみ（状態フラグ kurisagariDone[] で制御）
4. 数字パレットは 0〜10（11個）
5. バリデーション：higensu >= gensu のチェックを追加

まず以下を実装してください：
1. HissanTable（筆算の数字表示・suujiSet）
2. OkaneTable（被減数のみのお金表示）
3. useKurisagari（繰り下がり判定＋フラグ制御）
4. ButtonGroup + useHikizanState（もんだい・セット・クリア・こたえ）
```

---

*最終更新: 2026-03-22*

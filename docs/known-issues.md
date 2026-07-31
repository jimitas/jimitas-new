# 既知の課題・調査メモ（jimitas-new）

グローバル `~/.claude/CLAUDE.md` に混入していたタスク固有メモをここへ移設（2026-07-31）。
常時ロードされる場所に置くべきではないため、関連プロジェクトの docs に集約。

## okane（お金を並べる）テーブルの td 高さ問題 ※要再検証

- お金を並べるテーブルエリア（`#TBL`）の `tr` には min-height が適用されているが、
  `td`（background: #fff3e0）は見たところ height が 10px 程度の最小のままになる。
- min-height が設定されているのに効いていない → 他の要素が影響している可能性。

> 注意: 現行の jimitas-new の okane 実装には `#TBL` という id は見当たらず（`OkaneGrid.tsx` は
> `minHeight` を JS で付与）、旧版（jimitas-old）由来の観察の可能性が高い。現行 UI で再現するか
> 未確認。再発したら `src/components/parts/hissan/OkaneGrid.tsx` 付近を調査。

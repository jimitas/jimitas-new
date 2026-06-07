# Ship Log

## 2026-06-07 — カスタムスキル4本追加とCLAUDE.mdへの自動起動設定

**コミット：** `218cf7a`

### 背景・目的
定型作業（新アプリ追加・移植・ビジュアル確認・効果音監査）を毎回手動でやるコストを削減するため、Claude Code のカスタムスキルとして自動化した。さらに「○○のアプリを作りたい」のような自然な指示文でスキルが自動起動するよう設定した。

### 変更内容

| ファイル | 内容 |
|--------|------|
| `.claude/skills/new-app.md` | 新アプリ雛形（page.tsx / layout.tsx / apps.ts）を一括作成 |
| `.claude/skills/port.md` | jimitas-old からの移植チェックリストと jQuery→React 変換ガイド |
| `.claude/skills/screenshot-review.md` | スクショ撮影→目視チェック→崩れ修正のワークフロー |
| `.claude/skills/se-audit.md` | `new Audio()` 直書き・インライン cursor など禁止パターンを全アプリ Grep |
| `CLAUDE.md` | スキル自動起動ルール表を追記（6パターン） |
| `.claude/skills/ship.md` | レポートを `docs/ship-log.md` に先頭挿入する手順を追加 |

### 技術的なポイント
- スキルの `description` フィールドがシステムプロンプトに挿入され、ハーネスがリクエストと自動照合する仕組みを活用
- CLAUDE.md のルール表を「保険」として二重に設定し、照合漏れを防止
- ship-log.md は新しいエントリを先頭挿入することで、最新の作業が上に来る構成

---

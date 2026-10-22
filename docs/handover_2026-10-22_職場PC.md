# 職場PC向け引き継ぎ（2026-10-22 脆弱性対応の続き）

自宅PCで Node.js / Next.js の脆弱性対応を済ませた。職場PCでは下のプロンプトを Claude Code に貼る。

---

## 貼り付け用プロンプト

```
2026-10-22 に自宅PCで Node.js / Next.js の脆弱性対応をした。職場PCでも同じ状態にそろえたい。
詳細は jimitas-new の docs/ship-log.md の 2026-10-22 の項を参照。順に確認・案内してほしい。

1. `node -v` を確認する。v22.23.4 でなければ、更新手順を案内して止まる
   （公式 .msi https://nodejs.org/dist/v22.23.4/node-v22.23.4-x64.msi。
   インストールは私がやる。Claude Code を閉じる必要があるので、更新後に再開する）
2. C:\claude\edu-apps\jimitas-new で git pull → npm ci。
   next が 16.4.2、sharp が 0.35.5 になったことを npm ls で確認する
3. C:\claude\learning\custom-portal も git pull → npm ci。next 16.4.2 を確認する
4. jimitas-new で npm test と npm run lint を流し、自宅と同じく通ることを確認する
   （lint は 0件のはず。eslint-config-next は意図的に 16.2.4 のまま据え置き）
5. 結果を短く報告する。コードの変更・push はしない
```

---

## 補足
- Vercel の練習プロジェクト16件の一時停止は Vercel 側の設定なので、職場PCでの作業はない
- 職場PCに jimitas-new / custom-portal 以外の Next.js プロジェクトがあっても、公開していなければ急ぐ必要はない

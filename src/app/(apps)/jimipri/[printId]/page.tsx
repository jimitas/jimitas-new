// ======================================================
// じみぷり 各プリントページ（動的ルート・サーバーコンポーネント）
//
// /jimipri/[printId] で各プリントを表示する。
//
// このページ自体はサーバーデータを必要としない（問題生成は
// クライアント側の純粋関数）。そこで generateStaticParams で
// 全39種を「ビルド時に静的生成（SSG）」し、CDNキャッシュ配信に
// する。これにより毎回のサーバーレンダリング（Function呼び出し）
// が無くなり、Vercel の Edge Requests を大幅に削減できる。
//
// dynamicParams = false: 未知のIDは Function を起動せず静的404。
// 実際の表示・操作はクライアントコンポーネント PrintClient に委譲。
// ======================================================

import { ALL_PRINTS, isImplemented } from "../_lib/prints"
import PrintClient from "./PrintClient"

// ビルド時に全プリントのパスを静的生成する
export function generateStaticParams() {
  return ALL_PRINTS
    .filter(isImplemented)
    .map((p) => ({ printId: p.id }))
}

// 静的生成したID以外はサーバーを起動せず 404 にする
export const dynamicParams = false

export default async function JimipriPrintPage({
  params,
}: {
  params: Promise<{ printId: string }>
}) {
  const { printId } = await params
  return <PrintClient printId={printId} />
}

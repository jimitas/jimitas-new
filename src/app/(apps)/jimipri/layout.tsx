import { getAppMetadata, getAppJsonLd } from "@/lib/seo"
import { bizUDMincho } from "@/lib/fonts"

export const metadata = getAppMetadata("jimipri")

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getAppJsonLd("jimipri")
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/*
        UD明朝（--font-biz-ud-mincho）はこのアプリ専用に読み込む。
        配下の [printId]/PrintClient.tsx もこのラッパの子孫になる。
        display:contents でラッパ自体はボックスを生成しないため
        既存レイアウト・CLS に影響を与えず、CSS変数だけを子孫へ継承する。
      */}
      <div className={bizUDMincho.variable} style={{ display: "contents" }}>
        {children}
      </div>
    </>
  )
}

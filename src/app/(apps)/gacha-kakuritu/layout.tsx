import { getAppMetadata, getAppJsonLd } from "@/lib/seo"

export const metadata = getAppMetadata("gacha-kakuritu")

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getAppJsonLd("gacha-kakuritu")
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}

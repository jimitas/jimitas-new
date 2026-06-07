import { getAppMetadata, getAppJsonLd } from "@/lib/seo"

export const metadata = getAppMetadata("juu-tsukuri")

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getAppJsonLd("juu-tsukuri")
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

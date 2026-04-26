import { getAppMetadata, getAppJsonLd } from "@/lib/seo"

export const metadata = getAppMetadata("oto-dashiyo")

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getAppJsonLd("oto-dashiyo")
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

import { getAppMetadata, getAppJsonLd } from "@/lib/seo"

export const metadata = getAppMetadata("natsu-no-hoshi")

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getAppJsonLd("natsu-no-hoshi")
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

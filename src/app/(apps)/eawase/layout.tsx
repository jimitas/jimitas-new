import { getAppMetadata, getAppJsonLd } from "@/lib/seo"

export const metadata = getAppMetadata("eawase")

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getAppJsonLd("eawase")
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

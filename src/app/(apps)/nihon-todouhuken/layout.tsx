import { getAppMetadata, getAppJsonLd } from "@/lib/seo"

export const metadata = getAppMetadata("nihon-todouhuken")

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getAppJsonLd("nihon-todouhuken")
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

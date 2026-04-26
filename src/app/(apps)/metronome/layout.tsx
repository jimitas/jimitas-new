import { getAppMetadata, getAppJsonLd } from "@/lib/seo"

export const metadata = getAppMetadata("metronome")

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getAppJsonLd("metronome")
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

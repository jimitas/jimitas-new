import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("kanji-test")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

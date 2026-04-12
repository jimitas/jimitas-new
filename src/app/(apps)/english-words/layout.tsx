import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("english-words")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

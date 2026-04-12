import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("kuku-yomi")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

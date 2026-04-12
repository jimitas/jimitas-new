import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("katakana")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

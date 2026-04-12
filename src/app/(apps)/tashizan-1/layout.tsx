import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("tashizan-1")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

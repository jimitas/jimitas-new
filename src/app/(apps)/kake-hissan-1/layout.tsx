import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("kake-hissan-1")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

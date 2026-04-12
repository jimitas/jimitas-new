import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("kake-hissan2")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

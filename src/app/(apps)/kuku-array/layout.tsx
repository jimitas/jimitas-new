import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("kuku-array")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

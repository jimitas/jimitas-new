import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("wari-hissan")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

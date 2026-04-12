import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("hikizan-1")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

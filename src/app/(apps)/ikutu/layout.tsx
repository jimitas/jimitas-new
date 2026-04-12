import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("ikutu")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

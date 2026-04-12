import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("koch-curve")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

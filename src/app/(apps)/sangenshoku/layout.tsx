import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("sangenshoku")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

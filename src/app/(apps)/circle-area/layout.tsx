import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("circle-area")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

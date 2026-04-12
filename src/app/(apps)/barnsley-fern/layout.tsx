import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("barnsley-fern")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("tashi-hissan")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

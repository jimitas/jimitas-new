import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("hiki-hissan")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

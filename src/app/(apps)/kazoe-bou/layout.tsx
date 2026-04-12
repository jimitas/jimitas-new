import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("kazoe-bou")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

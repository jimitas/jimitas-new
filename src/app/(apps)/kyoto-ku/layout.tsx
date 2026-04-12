import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("kyoto-ku")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

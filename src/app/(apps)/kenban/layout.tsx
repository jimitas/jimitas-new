import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("kenban")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

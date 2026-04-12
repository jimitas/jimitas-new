import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("kazoeyou")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("romaji")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("sakusen-board")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

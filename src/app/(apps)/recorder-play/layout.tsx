import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("recorder-play")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

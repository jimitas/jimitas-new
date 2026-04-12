import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("classroom-english")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

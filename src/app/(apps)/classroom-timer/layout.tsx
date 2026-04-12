import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("classroom-timer")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

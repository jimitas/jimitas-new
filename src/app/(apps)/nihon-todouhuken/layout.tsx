import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("nihon-todouhuken")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

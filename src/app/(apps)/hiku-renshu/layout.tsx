import { getAppMetadata } from "@/lib/seo"

export const metadata = getAppMetadata("hiku-renshu")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Jimitasについて",
  description: "「地味に助かる」をコンセプトに、現役小学校教員がタブレット授業で実際に使うために作った学習Webアプリポータル。無料・広告なし・ログイン不要で使えます。",
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}

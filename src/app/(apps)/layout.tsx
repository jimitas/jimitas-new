import SoundPreloader from "@/components/common/SoundPreloader"

export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SoundPreloader />
      {children}
    </>
  )
}

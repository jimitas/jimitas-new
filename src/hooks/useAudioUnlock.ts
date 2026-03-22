import { useEffect } from "react"
import { Howler } from "howler"

// 初回のクリック or タッチで AudioContext を起動するフック。
// ブラウザの自動再生ポリシーにより、最初のユーザー操作まで音声は停止している。
// 楽器系アプリのすべてでこのフックを呼ぶことで「最初の1音が遅い」問題を解消できる。
export function useAudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      Howler.ctx?.resume()
      document.removeEventListener("click", unlock)
      document.removeEventListener("touchstart", unlock)
    }
    document.addEventListener("click", unlock)
    document.addEventListener("touchstart", unlock)
    return () => {
      document.removeEventListener("click", unlock)
      document.removeEventListener("touchstart", unlock)
    }
  }, [])
}

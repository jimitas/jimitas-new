"use client"

// ======================================================
// useCategoryAudio — カテゴリ単位の音声遅延ロードフック
//
// audioFiles が変わる（カテゴリ切り替え）たびに
// 前カテゴリの Howl を破棄し、新カテゴリをロードする。
//
// 使い方:
//   const { isLoading, play } = useCategoryAudio(
//     words.map(w => `/sounds/english/words/${w.audioFile}.mp3`)
//   )
//   play(index)  // words[index] の音声を再生
// ======================================================

import { useState, useEffect, useRef, useCallback } from "react"
import { Howl } from "howler"

export function useCategoryAudio(audioFiles: string[]) {
  const [isLoading, setIsLoading] = useState(false)

  // Howl の配列。インデックスは audioFiles の順と一致
  const soundsRef = useRef<Howl[]>([])

  useEffect(() => {
    if (audioFiles.length === 0) return

    setIsLoading(true)

    let loadedCount = 0
    const total = audioFiles.length
    const howls: Howl[] = []

    audioFiles.forEach((src, i) => {
      const h = new Howl({
        src: [src],
        preload: true,
        onload: () => {
          loadedCount++
          if (loadedCount >= total) setIsLoading(false)
        },
        onloaderror: () => {
          // エラーでもカウントを進めてローディングを止める
          loadedCount++
          if (loadedCount >= total) setIsLoading(false)
        },
      })
      howls[i] = h
    })

    soundsRef.current = howls

    // クリーンアップ: カテゴリ変更時 or アンマウント時に破棄
    return () => {
      howls.forEach(h => h.unload())
    }
  // audioFiles の参照が変わったら再ロード（消費側でuseMemoを使って安定化）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFiles])

  // 指定インデックスの音声を再生（先頭から再生）
  const play = useCallback((index: number) => {
    const h = soundsRef.current[index]
    if (h) {
      h.stop()
      h.play()
    }
  }, [])

  return { isLoading, play }
}

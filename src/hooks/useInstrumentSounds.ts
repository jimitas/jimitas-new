import { useEffect, useRef, useCallback } from "react"
import { Howl } from "howler"

interface UseInstrumentSoundsOptions {
  // 音を止めるときの方式
  // "stop"  : 完全に止める（もっきん・てっきんなどの打楽器向け。音が自然に減衰する）
  // "pause" : 一時停止して先頭に戻す（鍵盤ハーモニカのように押している間だけ鳴らす向け）
  stopMethod?: "stop" | "pause"
  // 音源ファイルのディレクトリ（末尾スラッシュ必須）
  dir?: string
}

// 楽器の音源（`${dir}${prefix}${1..count}.mp3`）をプリロードし、再生・停止関数を返すフック。
//
// prefix が変わると（楽器切り替え時）既存の音源を止めて自動的に再ロードする。
// soundsRef.current[1..count] に Howl インスタンスが格納される（index 0 は null）。
export function useInstrumentSounds(
  prefix: string,
  count: number,
  options?: UseInstrumentSoundsOptions,
) {
  const { stopMethod = "stop", dir = "/sounds/kenban/" } = options ?? {}
  const soundsRef = useRef<(Howl | null)[]>([])

  useEffect(() => {
    // 既存の音源を停止
    soundsRef.current.forEach(s => s?.stop())

    // index 0 は使わないので null を置く（soundIndex が 1 始まりのため）
    const newSounds: (Howl | null)[] = [null]
    for (let i = 1; i <= count; i++) {
      newSounds[i] = new Howl({
        src: [`${dir}${prefix}${i}.mp3`],
        preload: true,
        volume: 1.0,
      })
    }
    soundsRef.current = newSounds
  }, [prefix, count, dir])

  const playSound = useCallback((index: number) => {
    if (index < 1 || index > count) return
    soundsRef.current[index]?.play()
  }, [count])

  const stopSound = useCallback((index: number) => {
    if (index < 1 || index > count) return
    const s = soundsRef.current[index]
    if (!s) return
    if (stopMethod === "pause") {
      s.pause()
      s.seek(0)
    } else {
      s.stop()
    }
  }, [count, stopMethod])

  return { playSound, stopSound }
}

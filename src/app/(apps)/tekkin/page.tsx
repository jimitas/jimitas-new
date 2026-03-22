"use client"

// ======================================================
// てっきん
//
// 旧版 23tekn.js の CSS・レイアウトを忠実に再現。
//
// 【レイアウト】
//   上段: 黒鍵バー（#音）が横一列（左に 28px オフセット）
//   下段: 白鍵バー（♮音）が横一列（margin-top: 222px で下にずらす）
//   バーサイズ: 幅 58px × 高さ 220px（黒も白も同じ）
//   色: #555（グレー）
//
// 【操作】
//   タッチ・マウスのみ
// ======================================================

import { useEffect, useCallback, useRef } from "react"
import { Howl, Howler } from "howler"

// ── バーデータ ────────────────────────────────────────
// soundIndex: 音源ファイルの番号（te_*.mp3）
// soundIndex === 0 はスペーサー（音なし・バーなし）

const BK_BARS = [
  { soundIndex: 2,  note: "#ﾌｧ/♭ソ" },
  { soundIndex: 4,  note: "#ソ/♭ラ"  },
  { soundIndex: 6,  note: "#ラ/♭シ"  },
  { soundIndex: 0,  note: ""          },  // スペーサー（ミ〜ファの間）
  { soundIndex: 9,  note: "#ド/♭レ"  },
  { soundIndex: 11, note: "#レ/♭ミ"  },
  { soundIndex: 0,  note: ""          },  // スペーサー（シ〜ドの間）
  { soundIndex: 14, note: "#ﾌｧ/♭ソ" },
  { soundIndex: 16, note: "#ソ/♭ラ"  },
  { soundIndex: 18, note: "#ラ/♭シ"  },
  { soundIndex: 0,  note: ""          },  // スペーサー
  { soundIndex: 21, note: "#ド/♭レ"  },
  { soundIndex: 23, note: "#レ/♭ミ"  },
  { soundIndex: 0,  note: ""          },  // スペーサー
  { soundIndex: 26, note: "#ﾌｧ/♭ソ" },
]

const WH_BARS = [
  { soundIndex: 1,  note: "ﾌｧ" },
  { soundIndex: 3,  note: "ソ"   },
  { soundIndex: 5,  note: "ラ"   },
  { soundIndex: 7,  note: "シ"   },
  { soundIndex: 8,  note: "ド"   },
  { soundIndex: 10, note: "レ"   },
  { soundIndex: 12, note: "ミ"   },
  { soundIndex: 13, note: "ﾌｧ" },
  { soundIndex: 15, note: "ソ"   },
  { soundIndex: 17, note: "ラ"   },
  { soundIndex: 19, note: "シ"   },
  { soundIndex: 20, note: "ド"   },
  { soundIndex: 22, note: "レ"   },
  { soundIndex: 24, note: "ミ"   },
  { soundIndex: 25, note: "ﾌｧ" },
  { soundIndex: 27, note: "ソ"   },
]

// てっきんのバー色（グレー）
const BAR_COLOR = "#555"

// ── ページコンポーネント ──────────────────────────────

export default function TekkinPage() {
  const soundsRef = useRef<(Howl | null)[]>([])

  // ── AudioContext 事前起動 ──────────────────────────
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

  // ── 全34音をページ読み込み時にプリロード ────────────
  useEffect(() => {
    const newSounds: (Howl | null)[] = [null]
    for (let i = 1; i <= 34; i++) {
      newSounds[i] = new Howl({
        src: [`/sounds/kenban/te_${i}.mp3`],
        preload: true,
        volume: 1.0,
      })
    }
    soundsRef.current = newSounds
  }, [])

  // ── 音の再生・停止 ────────────────────────────────

  const playSound = useCallback((index: number) => {
    soundsRef.current[index]?.play()
  }, [])

  const stopSound = useCallback((index: number) => {
    soundsRef.current[index]?.stop()
  }, [])

  // ── イベントハンドラー ────────────────────────────

  const handlePressDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).dataset.sound)
    if (idx > 0) {
      playSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = "brightness(1.4)"
    }
  }, [playSound])

  const handlePressUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).dataset.sound)
    if (idx > 0) {
      stopSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = ""
    }
  }, [stopSound])

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).dataset.sound)
    if (idx > 0) {
      stopSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = ""
    }
  }, [stopSound])

  // ── バーの共通スタイル ──────────────────────────────

  const bkBarStyle: React.CSSProperties = {
    width: "58px",
    height: "220px",
    marginRight: "2px",
    paddingTop: "30px",
    fontSize: "18px",
    lineHeight: "24px",
    textAlign: "center",
    border: "1px solid black",
    backgroundColor: BAR_COLOR,
    color: "white",
    cursor: "pointer",
    userSelect: "none",
    flexShrink: 0,
  }

  const whBarStyle: React.CSSProperties = {
    width: "58px",
    height: "220px",
    marginTop: "222px",
    marginRight: "2px",
    paddingTop: "20px",
    fontSize: "30px",
    textAlign: "center",
    border: "1px solid black",
    backgroundColor: BAR_COLOR,
    color: "white",
    cursor: "pointer",
    userSelect: "none",
    flexShrink: 0,
  }

  const spacerStyle: React.CSSProperties = {
    width: "58px",
    height: "220px",
    marginRight: "2px",
    flexShrink: 0,
  }

  // ── JSX ──────────────────────────────────────────────

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold text-center mb-1">てっきん</h1>
      <p className="text-center text-sm text-gray-500 mb-6">
        けんばんをおして演奏しよう
      </p>

      {/* 鍵盤エリア: 横スクロール対応 */}
      <div className="overflow-x-auto pb-4">
        <div
          className="relative mx-auto"
          style={{ width: "960px", height: "442px" }}
        >
          {/* 黒鍵バー行: 旧版 .B_Kenban（left: 28px） */}
          <div
            className="absolute flex"
            style={{ left: "28px", top: 0, zIndex: 3 }}
          >
            {BK_BARS.map((bar, i) => {
              if (bar.soundIndex === 0) {
                return <div key={`sp-${i}`} style={spacerStyle} />
              }
              return (
                <div
                  key={bar.soundIndex}
                  data-sound={String(bar.soundIndex)}
                  style={bkBarStyle}
                  onMouseDown={handlePressDown}
                  onMouseUp={handlePressUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handlePressDown}
                  onTouchEnd={handlePressUp}
                >
                  {bar.note}
                </div>
              )
            })}
          </div>

          {/* 白鍵バー行: 旧版 .W_Kenban */}
          <div
            className="absolute flex"
            style={{ left: 0, top: 0, zIndex: 2 }}
          >
            {WH_BARS.map((bar) => (
              <div
                key={bar.soundIndex}
                data-sound={String(bar.soundIndex)}
                style={whBarStyle}
                onMouseDown={handlePressDown}
                onMouseUp={handlePressUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handlePressDown}
                onTouchEnd={handlePressUp}
              >
                {bar.note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

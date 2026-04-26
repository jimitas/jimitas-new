// なんばんめ専用表示
// 元: 01_nanbanme.js を忠実にReact化
// 6匹の動物が横並び → 5問の位置問題

import Image from "next/image"
import type { NanbanmeResult } from "../types"

export function NanbanmeDisplay({ data }: { data: NanbanmeResult }) {
  const { animals, positions } = data

  // 入力欄のスタイル（元: .input-box { width: 15mm; height: 15mm; border: 1px solid black; }）
  const inputStyle: React.CSSProperties = {
    display: "inline-block",
    width: "15mm",
    height: "15mm",
    border: "1px solid black",
    verticalAlign: "middle",
    marginLeft: "2mm",
    marginRight: "2mm",
  }

  // 動物画像サイズ（元: .animal { width: 50px; height: 50px; margin: 2px; }）
  const animalImgSize = 50

  return (
    <div style={{ fontSize: "5mm", lineHeight: "10mm" }}>
      <div style={{ fontSize: "7mm", fontWeight: "bold", marginBottom: "3mm" }}>
        なんばんめですか。
      </div>

      {/* 動物の横並び（ひだり・6匹・みぎ） */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "solid 1px black",
          padding: "3mm 5mm",
          marginBottom: "5mm",
        }}
      >
        <div style={{ paddingTop: "4mm", marginRight: "3mm" }}>ひだり</div>
        <div style={{ display: "flex", flex: 1 }}>
          {animals.map((name, i) => (
            <Image
              key={i}
              src={`/images/${name}.png`}
              alt={name}
              width={50}
              height={50}
              style={{ width: "50px", height: "50px", margin: "2px" }}
            />
          ))}
        </div>
        <div style={{ paddingTop: "4mm", marginLeft: "3mm" }}>みぎ　</div>
      </div>

      {/* ① ひだりから□ばんめ */}
      <div style={{ marginBottom: "5mm" }}>
        <span>①　</span>
        <Image
          src={`/images/${animals[positions[0] - 1]}.png`}
          alt={animals[positions[0] - 1]}
          width={animalImgSize}
          height={animalImgSize}
          style={{ display: "inline-block", width: "50px", height: "50px", verticalAlign: "middle", margin: "2px" }}
        />
        <span>は、ひだりから</span>
        <span style={inputStyle} />
        <span>ばんめ</span>
      </div>

      {/* ② みぎから□ばんめ */}
      <div style={{ marginBottom: "5mm" }}>
        <span>②　</span>
        <Image
          src={`/images/${animals[positions[1] - 1]}.png`}
          alt={animals[positions[1] - 1]}
          width={animalImgSize}
          height={animalImgSize}
          style={{ display: "inline-block", width: "50px", height: "50px", verticalAlign: "middle", margin: "2px" }}
        />
        <span>は、みぎから</span>
        <span style={inputStyle} />
        <span>ばんめ</span>
      </div>

      {/* ③〜⑤ ひだりから□ばんめ、みぎから□ばんめ */}
      {[2, 3, 4].map((n) => (
        <div key={n} style={{ marginBottom: "5mm" }}>
          <span>{["③", "④", "⑤"][n - 2]}　</span>
          <Image
            src={`/images/${animals[positions[n] - 1]}.png`}
            alt={animals[positions[n] - 1]}
            width={animalImgSize}
            height={animalImgSize}
            style={{ display: "inline-block", width: "50px", height: "50px", verticalAlign: "middle", margin: "2px" }}
          />
          <span>は、</span>
          <br />
          <span>　　ひだりから</span>
          <span style={inputStyle} />
          <span>ばんめ、みぎから</span>
          <span style={inputStyle} />
          <span>ばんめ</span>
        </div>
      ))}
    </div>
  )
}

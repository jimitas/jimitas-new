// ======================================================
// PutImage コンポーネント（共通）
//
// 画像を並べて表示するコンテナ。
// 中身（<Image> 要素）は各ページで渡す（children）。
//
// 使い方:
//   <PutImage>
//     <Image src="..." alt="..." width={60} height={60} />
//     ...
//   </PutImage>
// ======================================================

"use client"

interface PutImageProps {
  children?: React.ReactNode
}

export function PutImage({ children }: PutImageProps) {
  return (
    <div
      className="flex flex-wrap justify-center items-end gap-2
                 w-full my-4 p-4 min-h-20
                 bg-blue-50 dark:bg-gray-800 rounded-xl
                 border-2 border-blue-200 dark:border-gray-600"
    >
      {children}
    </div>
  )
}

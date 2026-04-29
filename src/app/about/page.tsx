// ======================================================
// Jimitasについて ページ
//
// URL: /about
// ロゴマーク（大）＋ サイトの成り立ち・想いを紹介するページ
// ======================================================

import Image from "next/image"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">

      {/* ===== ロゴマーク（大きく表示） ===== */}
      <div className="flex justify-center mb-10">
        <Image
          src="/jimitas_logo.png"
          alt="Jimitas - 地味に助かる学習コンテンツ"
          width={480}
          height={150}
          className="w-full max-w-sm rounded-2xl shadow-md"
          priority
        />
      </div>

      {/* ===== タイトル ===== */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center mb-10">
        Jimitasについて
      </h1>

      {/* ===== 本文 ===== */}
      {/*
        prose 的なレイアウト。
        各段落を <section> で区切り、読みやすくまとめる。
      */}
      <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">

        {/* --- きっかけ --- */}
        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <span className="text-brand-500">●</span> きっかけ
          </h2>
          <p>
            現役の小学校教員として働くなかで、プログラミングを独学で学び始めました。
            「授業で使えるアプリが作れないか」と考えていた矢先、新型コロナウイルスの感染拡大により学校が休校になりました。
          </p>
        </section>

        {/* --- 学校再開後の課題 --- */}
        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <span className="text-brand-500">●</span> 学校再開後の課題
          </h2>
          <p>
            学校が再開されても、以前と同じような授業はすぐには難しい状況でした。
            たとえばリコーダーの演奏は、同じ教室内での飛沫感染が懸念され、
            授業のたびに細心の注意が必要でした。
          </p>
          <p className="mt-3">
            こうした経験から、「タブレットで代わりに楽器を演奏できたら」「一人ひとりが自分のペースで練習できたら」と強く感じるようになりました。
          </p>
        </section>

        {/* --- GIGAスクールとの出会い --- */}
        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <span className="text-brand-500">●</span> GIGAスクール構想との出会い
          </h2>
          <p>
            同じ時期に、GIGAスクール構想により一人一台タブレットが整備されました。
            これを活用すれば、感染対策をしながら授業ができるだけでなく、
            子どもが自分のペースで学べる「個別最適な学習」や、
            先生が教材づくりにかける時間を減らすことにもつながると考えました。
          </p>
        </section>

        {/* --- Jimitasへ --- */}
        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <span className="text-brand-500">●</span> 「地味に助かる」を積み重ねて
          </h2>
          <p>
            派手さはないけれど、授業のどこかで「あると助かる」と感じてもらえるアプリを。
            先生が教材づくりを楽にできるプリント生成ツールを。
            そして何より、<strong className="text-gray-900 dark:text-gray-100">子どもたちが楽しみながら学べること</strong>を大切に、
            このサイトを作り続けています。
          </p>
        </section>

      </div>

      {/* ===== トップへ戻るリンク ===== */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-block px-6 py-2 rounded-full bg-brand-400 text-white text-sm font-medium hover:bg-brand-500 transition-colors"
        >
          ← アプリ一覧へ戻る
        </Link>
      </div>

    </div>
  )
}

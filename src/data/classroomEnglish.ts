// ======================================================
// Classroom English データ定義
//
// 旧版 01cren.js の data/title 配列を TypeScript に移植。
// 各フレーズを { en, ja, audioIndex } に分解して管理。
// audioIndex: 1〜37 → /sounds/english/classroom/vo_{n}.mp3
// ======================================================

export type CrenPhrase = {
  en: string        // 英語表現
  ja: string        // 日本語訳
  audioIndex: number // 1〜37
}

export type CrenCategory = {
  id: string
  title: string
  phrases: CrenPhrase[]
}

export const CLASSROOM_ENGLISH: CrenCategory[] = [
  {
    id: "greeting",
    title: "Greeting（あいさつ）",
    phrases: [
      { en: '"How are you?"',        ja: "元気ですか。",           audioIndex: 1  },
      { en: '"I\'m good."',          ja: "元気です。",             audioIndex: 2  },
      { en: '"I\'m fine."',          ja: "元気です。",             audioIndex: 3  },
      { en: '"I\'m OK."',            ja: "元気です。",             audioIndex: 4  },
      { en: '"I\'m hungry."',        ja: "おなかがすきました。",   audioIndex: 5  },
      { en: '"I\'m sleepy."',        ja: "ねむたいです。",         audioIndex: 6  },
      { en: '"I\'m not bad."',       ja: "ふつうです。",           audioIndex: 7  },
    ],
  },
  {
    id: "date-weather",
    title: "Date 日付・Weather 天気",
    phrases: [
      { en: '"What\'s the date?"',         ja: "何日ですか。",                 audioIndex: 8  },
      { en: '"What day is it?"',            ja: "何曜日ですか。",               audioIndex: 9  },
      { en: '"How\'s the weather today?"',  ja: "今日の天気はどうですか。",     audioIndex: 10 },
      { en: '"It\'s sunny."',               ja: "晴れです。",                   audioIndex: 11 },
      { en: '"It\'s cloudy."',              ja: "曇りです。",                   audioIndex: 12 },
      { en: '"It\'s rainy."',               ja: "雨です。",                     audioIndex: 13 },
      { en: '"It\'s windy."',               ja: "風が強いです。",               audioIndex: 14 },
    ],
  },
  {
    id: "class1",
    title: "学習で使える表現①",
    phrases: [
      { en: '"Nice."',          ja: "（ほめる）",             audioIndex: 15 },
      { en: '"Great."',         ja: "（ほめる）",             audioIndex: 16 },
      { en: '"Cool."',          ja: "（ほめる）",             audioIndex: 17 },
      { en: '"Wonderful."',     ja: "（ほめる）",             audioIndex: 18 },
      { en: '"Wow!"',           ja: "（おどろき）",           audioIndex: 19 },
      { en: '"Oh!"',            ja: "（おどろき）",           audioIndex: 20 },
      { en: '"Good luck!"',     ja: "（はげまし）",           audioIndex: 21 },
      { en: '"It\'s OK."',      ja: "（はげまし）",           audioIndex: 22 },
      { en: '"I see."',         ja: "相づち",                 audioIndex: 23 },
      { en: '"Really?"',        ja: "相づち",                 audioIndex: 24 },
      { en: '"Well...."',       ja: "相づち",                 audioIndex: 25 },
      { en: '"Me, too."',       ja: "共感",                   audioIndex: 26 },
      { en: '"Thank you."',     ja: "お礼",                   audioIndex: 27 },
      { en: '"You\'re welcome!"', ja: "どういたしまして",     audioIndex: 28 },
    ],
  },
  {
    id: "class2",
    title: "学習で使える表現②",
    phrases: [
      { en: '"One more time, please."',       ja: "もう一度お願いします。",             audioIndex: 29 },
      { en: '"May I ask a question?"',         ja: "質問してもいいですか。",             audioIndex: 30 },
      { en: '"Can you help me?"',              ja: "手伝ってくれませんか。",             audioIndex: 31 },
      { en: '"Excuse me."',                    ja: "ちょっといいですか。",               audioIndex: 32 },
      { en: '"Is this right?"',                ja: "これで合っていますか。",             audioIndex: 33 },
      { en: '"How do you say ○○ in English?"', ja: "○○は英語で何と言いますか。",       audioIndex: 34 },
      { en: '"More slowly, please."',          ja: "もっとゆっくりお願いします。",       audioIndex: 35 },
      { en: '"It\'s too easy."',               ja: "簡単です。",                         audioIndex: 36 },
      { en: '"It\'s too difficult."',          ja: "むずかしいです。",                   audioIndex: 37 },
    ],
  },
]

// クイズ用: 全フレーズのフラット配列
export const ALL_CREN_PHRASES: CrenPhrase[] = CLASSROOM_ENGLISH.flatMap(c => c.phrases)

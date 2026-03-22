// ======================================================
// English Words データ定義
//
// 旧版 02enwo.js の Data 配列を TypeScript に移植。
// 15カテゴリ・227語。
//
// audioFile: /sounds/english/words/{audioFile}.mp3
// imageFile: /images/english/words/{imageFile}.png（undefined=画像なし）
// bgColor:   Colors カテゴリのみ背景色指定
// ======================================================

export type WordEntry = {
  word: string         // 表示テキスト（例: "dog", "A", "0"）
  audioFile: string    // 音声ファイル名（拡張子なし）
  imageFile?: string   // 画像ファイル名（拡張子なし）。undefined=画像なし
  bgColor?: string     // Colors カテゴリのみ背景色
  textColor?: string   // 文字色（bgColorが暗い場合は白）
}

export type WordCategory = {
  id: string
  title: string
  words: WordEntry[]
  hasImage: boolean    // カード内に画像を表示するか
}

export const ENGLISH_WORDS: WordCategory[] = [
  {
    id: "numbers",
    title: "Numbers",
    hasImage: false,
    words: Array.from({ length: 31 }, (_, i) => ({
      word: String(i),
      audioFile: String(i),
    })),
  },
  {
    id: "upper",
    title: "Upper（大文字）",
    hasImage: false,
    words: ["A","B","C","D","E","F","G","H","I","J","K","M","L","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"].map(c => ({
      word: c,
      audioFile: c.toLowerCase(),
    })),
  },
  {
    id: "lower",
    title: "Lower（小文字）",
    hasImage: false,
    words: ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"].map(c => ({
      word: c,
      audioFile: c,
    })),
  },
  {
    id: "colors",
    title: "Colors（色）",
    hasImage: false,
    words: [
      { word: "red",    audioFile: "red",    bgColor: "red",    textColor: "white" },
      { word: "orange", audioFile: "orange", bgColor: "orange", textColor: "black" },
      { word: "yellow", audioFile: "yellow", bgColor: "yellow", textColor: "black" },
      { word: "green",  audioFile: "green",  bgColor: "green",  textColor: "white" },
      { word: "blue",   audioFile: "blue",   bgColor: "blue",   textColor: "white" },
      { word: "purple", audioFile: "purple", bgColor: "purple", textColor: "white" },
      { word: "pink",   audioFile: "pink",   bgColor: "pink",   textColor: "black" },
      { word: "brown",  audioFile: "brown",  bgColor: "brown",  textColor: "white" },
      { word: "black",  audioFile: "black",  bgColor: "black",  textColor: "white" },
      { word: "white",  audioFile: "white",  bgColor: "#e5e7eb", textColor: "black" },
    ],
  },
  {
    id: "condition",
    title: "Condition（気分・状態）",
    hasImage: true,
    words: [
      { word: "fine",    audioFile: "fine",    imageFile: "fine"    },
      { word: "happy",   audioFile: "happy",   imageFile: "happy"   },
      { word: "hungry",  audioFile: "hungry",  imageFile: "hungry"  },
      { word: "sad",     audioFile: "sad",     imageFile: "sad"     },
      { word: "sleepy",  audioFile: "sleepy",  imageFile: "sleepy"  },
      { word: "tired",   audioFile: "tired",   imageFile: "tired"   },
    ],
  },
  {
    id: "body",
    title: "Body（体）",
    hasImage: true,
    words: [
      { word: "head",      audioFile: "head",      imageFile: "head"      },
      { word: "shoulders", audioFile: "shoulders", imageFile: "shoulders" },
      { word: "knees",     audioFile: "knees",     imageFile: "knees"     },
      { word: "toes",      audioFile: "toes",      imageFile: "toes"      },
      { word: "eyes",      audioFile: "eyes",      imageFile: "eyes"      },
      { word: "ears",      audioFile: "ears",      imageFile: "ears"      },
      { word: "mouth",     audioFile: "mouth",     imageFile: "mouth"     },
      { word: "nose",      audioFile: "nose",      imageFile: "nose"      },
    ],
  },
  {
    id: "janken",
    title: "Janken（じゃんけん）",
    hasImage: true,
    words: [
      { word: "rock",     audioFile: "rock",     imageFile: "rock"     },
      { word: "scissors", audioFile: "scissors", imageFile: "scissors" },
      { word: "paper",    audioFile: "paper",    imageFile: "paper"    },
    ],
  },
  {
    id: "animals",
    title: "Animals（動物）",
    hasImage: true,
    words: [
      { word: "dog",       audioFile: "dog",       imageFile: "dog"       },
      { word: "cat",       audioFile: "cat",       imageFile: "cat"       },
      { word: "bear",      audioFile: "bear",      imageFile: "bear"      },
      { word: "bird",      audioFile: "bird",      imageFile: "bird"      },
      { word: "duck",      audioFile: "duck",      imageFile: "duck"      },
      { word: "horse",     audioFile: "horse",     imageFile: "horse"     },
      { word: "frog",      audioFile: "frog",      imageFile: "frog"      },
      { word: "sheep",     audioFile: "sheep",     imageFile: "sheep"     },
      { word: "goldfish",  audioFile: "goldfish",  imageFile: "goldfish"  },
      { word: "monkey",    audioFile: "monkey",    imageFile: "monkey"    },
      { word: "gorilla",   audioFile: "gorilla",   imageFile: "gorilla"   },
      { word: "fish",      audioFile: "fish",      imageFile: "fish"      },
      { word: "pig",       audioFile: "pig",       imageFile: "pig"       },
      { word: "rabbit",    audioFile: "rabbit",    imageFile: "rabbit"    },
      { word: "panda",     audioFile: "panda",     imageFile: "panda"     },
      { word: "mouse",     audioFile: "mouse",     imageFile: "mouse"     },
      { word: "spider",    audioFile: "spider",    imageFile: "spider"    },
      { word: "cow",       audioFile: "cow",       imageFile: "cow"       },
      { word: "dragon",    audioFile: "dragon",    imageFile: "dragon"    },
      { word: "snake",     audioFile: "snake",     imageFile: "snake"     },
      { word: "tiger",     audioFile: "tiger",     imageFile: "tiger"     },
      { word: "chicken",   audioFile: "chicken",   imageFile: "chicken"   },
      { word: "wild boar", audioFile: "wild-boar", imageFile: "wild-boar" },
    ],
  },
  {
    id: "fruits",
    title: "Fruits（くだもの）",
    hasImage: true,
    words: [
      { word: "apple",      audioFile: "apple",      imageFile: "apple"      },
      { word: "banana",     audioFile: "banana",     imageFile: "banana"     },
      { word: "lemon",      audioFile: "lemon",      imageFile: "lemon"      },
      { word: "melon",      audioFile: "melon",      imageFile: "melon"      },
      { word: "orange",     audioFile: "orange",     imageFile: "orange"     },
      { word: "peach",      audioFile: "peach",      imageFile: "peach"      },
      { word: "strawberry", audioFile: "strawberry", imageFile: "strawberry" },
      { word: "grapes",     audioFile: "grapes",     imageFile: "grapes"     },
      { word: "pineapple",  audioFile: "pineapple",  imageFile: "pineapple"  },
      { word: "kiwifruit",  audioFile: "kiwifruit",  imageFile: "kiwifruit"  },
    ],
  },
  {
    id: "vegetables",
    title: "Vegetables（野菜）",
    hasImage: true,
    words: [
      { word: "broccoli",     audioFile: "broccoli",     imageFile: "broccoli"     },
      { word: "cabbage",      audioFile: "cabbage",      imageFile: "cabbage"      },
      { word: "carrot",       audioFile: "carrot",       imageFile: "carrot"       },
      { word: "corn",         audioFile: "corn",         imageFile: "corn"         },
      { word: "cucumber",     audioFile: "cucumber",     imageFile: "cucumber"     },
      { word: "green pepper", audioFile: "green-pepper", imageFile: "green-pepper" },
      { word: "lettuce",      audioFile: "lettuce",      imageFile: "lettuce"      },
      { word: "onion",        audioFile: "onion",        imageFile: "onion"        },
      { word: "pumpkin",      audioFile: "pumpkin",      imageFile: "pumpkin"      },
      { word: "tomato",       audioFile: "tomato",       imageFile: "tomato"       },
    ],
  },
  {
    id: "things",
    title: "Things（もの）",
    hasImage: true,
    words: [
      { word: "counter",  audioFile: "counter",  imageFile: "counter"  },
      { word: "ball",     audioFile: "ball",     imageFile: "ball"     },
      { word: "pencil",   audioFile: "pencil",   imageFile: "pencil"   },
      { word: "eraser",   audioFile: "eraser",   imageFile: "eraser"   },
      { word: "ruler",    audioFile: "ruler",    imageFile: "ruler"    },
      { word: "crayon",   audioFile: "crayon",   imageFile: "crayon"   },
      { word: "hat",      audioFile: "hat",      imageFile: "hat"      },
      { word: "ink",      audioFile: "ink",      imageFile: "ink"      },
      { word: "jet",      audioFile: "jet",      imageFile: "jet"      },
      { word: "king",     audioFile: "king",     imageFile: "king"     },
      { word: "drum",     audioFile: "drum",     imageFile: "drum"     },
      { word: "book",     audioFile: "book",     imageFile: "book"     },
      { word: "notebook", audioFile: "notebook", imageFile: "notebook" },
      { word: "queen",    audioFile: "queen",    imageFile: "queen"    },
      { word: "sun",      audioFile: "sun",      imageFile: "sun"      },
      { word: "tree",     audioFile: "tree",     imageFile: "tree"     },
      { word: "umbrella", audioFile: "umbrella", imageFile: "umbrella" },
      { word: "violin",   audioFile: "violin",   imageFile: "violin"   },
      { word: "watch",    audioFile: "watch",    imageFile: "watch"    },
      { word: "box",      audioFile: "box",      imageFile: "box"      },
      { word: "yacht",    audioFile: "yacht",    imageFile: "yacht"    },
      { word: "bus",      audioFile: "bus",      imageFile: "bus"      },
      { word: "flower",   audioFile: "flower",   imageFile: "flower"   },
      { word: "shop",     audioFile: "shop",     imageFile: "shop"     },
      { word: "balloon",  audioFile: "balloon",  imageFile: "balloon"  },
      { word: "car",      audioFile: "car",      imageFile: "car"      },
    ],
  },
  {
    id: "sports",
    title: "Sports（スポーツ）",
    hasImage: true,
    words: [
      { word: "soccer",       audioFile: "soccer",       imageFile: "soccer"       },
      { word: "baseball",     audioFile: "baseball",     imageFile: "baseball"     },
      { word: "basketball",   audioFile: "basketball",   imageFile: "basketball"   },
      { word: "dodgeball",    audioFile: "dodgeball",    imageFile: "dodgeball"    },
      { word: "swimming",     audioFile: "swimming",     imageFile: "swimming"     },
      { word: "volleyball",   audioFile: "volleyball",   imageFile: "volleyball"   },
      { word: "table tennis", audioFile: "table-tennis", imageFile: "table-tennis" },
    ],
  },
  {
    id: "foods",
    title: "Foods（食べ物）",
    hasImage: true,
    words: [
      { word: "ice cream",    audioFile: "ice-cream",    imageFile: "ice-cream"    },
      { word: "pudding",      audioFile: "pudding",      imageFile: "pudding"      },
      { word: "milk",         audioFile: "milk",         imageFile: "milk"         },
      { word: "orange juice", audioFile: "orange-juice", imageFile: "orange-juice" },
      { word: "hamburger",    audioFile: "hamburger",    imageFile: "hamburger"    },
      { word: "pizza",        audioFile: "pizza",        imageFile: "pizza"        },
      { word: "spaghetti",    audioFile: "spaghetti",    imageFile: "spaghetti"    },
      { word: "steak",        audioFile: "steak",        imageFile: "steak"        },
      { word: "salad",        audioFile: "salad",        imageFile: "salad"        },
      { word: "cake",         audioFile: "cake",         imageFile: "cake"         },
      { word: "noodle",       audioFile: "noodle",       imageFile: "noodle"       },
      { word: "egg",          audioFile: "egg",          imageFile: "egg"          },
      { word: "rice ball",    audioFile: "rice-ball",    imageFile: "rice-ball"    },
      { word: "jam",          audioFile: "jam",          imageFile: "jam"          },
      { word: "candy",        audioFile: "candy",        imageFile: "candy"        },
    ],
  },
  {
    id: "weeks",
    title: "Weeks（曜日）",
    hasImage: true,
    words: [
      { word: "Monday",    audioFile: "monday",    imageFile: "monday"    },
      { word: "Tuesday",   audioFile: "tuesday",   imageFile: "tuesday"   },
      { word: "Wednesday", audioFile: "wednesday", imageFile: "wednesday" },
      { word: "Thursday",  audioFile: "thursday",  imageFile: "thursday"  },
      { word: "Friday",    audioFile: "friday",    imageFile: "friday"    },
      { word: "Saturday",  audioFile: "saturday",  imageFile: "saturday"  },
      { word: "Sunday",    audioFile: "sunday",    imageFile: "sunday"    },
    ],
  },
  {
    id: "month",
    title: "Month（月）",
    hasImage: true,
    words: [
      { word: "January",   audioFile: "january",   imageFile: "january"   },
      { word: "February",  audioFile: "february",  imageFile: "february"  },
      { word: "March",     audioFile: "march",     imageFile: "march"     },
      { word: "April",     audioFile: "april",     imageFile: "april"     },
      { word: "May",       audioFile: "may",       imageFile: "may"       },
      { word: "June",      audioFile: "june",      imageFile: "june"      },
      { word: "July",      audioFile: "july",      imageFile: "july"      },
      { word: "August",    audioFile: "august",    imageFile: "august"    },
      { word: "September", audioFile: "september", imageFile: "september" },
      { word: "October",   audioFile: "october",   imageFile: "october"   },
      { word: "November",  audioFile: "november",  imageFile: "november"  },
      { word: "December",  audioFile: "december",  imageFile: "december"  },
    ],
  },
]

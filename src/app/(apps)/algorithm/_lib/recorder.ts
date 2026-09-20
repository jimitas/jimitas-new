// ======================================================
// アルゴリズムシミュレーター — 実行の記録係（Recorder）
//
// アルゴリズム本体は Recorder に対してだけ書く。
// 配列をくらべる手段が lessThan しか無いので、
// 「比較したのに数え忘れる」が原理的に起きない。
// カウンタは StepKind から自動集計する（生成器は手で数えない）。
//
// 実装は2つ。アルゴリズム本体は共通なので、
// アニメーションのカウンタと計算量グラフの数値が食い違うことがない。
//   StepRecorder  … ステップ列を作る（アニメーション用）
//   CountRecorder … 回数だけ数える（段階3のグラフ用・配列コピーなし）
// 「2つが常に一致すること」は単体テストで固定する。
// ======================================================

import {
  describeHeldCompare,
  describePutDown,
  describeStep,
  describeTakeOut,
} from "./describe"
import type { CodeTag, Pointers, Step, StepInput, StepKind } from "./types"

/**
 * 打ち切りガード。
 * 生成器のミス（ループ変数の更新忘れなど）でブラウザが固まるのを防ぐ。
 * n の上限は 50 で、最も多いバブルソートでも 3,000 程度なので十分に余裕がある。
 */
export const MAX_STEPS = 20000

export class StepLimitExceededError extends Error {
  constructor(limit: number) {
    super(`ステップ数が上限（${limit}）を超えました。生成器が止まっていない可能性があります。`)
    this.name = "StepLimitExceededError"
  }
}

export type Recorder = {
  /** 今の配列。アルゴリズムはこれを直接書きかえてよい */
  readonly array: number[]
  readonly length: number
  /** 1ステップ記録する */
  push(input: StepInput): void
  /** A[i] < A[j] か。比較の記録とカウントも同時に行う */
  lessThan(i: number, j: number, codeTag: CodeTag, pointers?: Pointers): boolean
  /**
   * A[i] と さがす値をくらべる（探索用）。
   * 小さければ -1、同じなら 0、大きければ 1 を返す。
   *
   * 「同じか」「小さいか」をコード上は2行に分けて書くが、
   * 人が数える「くらべた回数」は1回なので、ここでも1回として数える。
   */
  compareWith(i: number, value: number, codeTag: CodeTag, pointers?: Pointers): number
  /** A[i] と A[j] を入れかえる。交換の記録とカウントも同時に行う */
  swap(i: number, j: number, codeTag: CodeTag, pointers?: Pointers): void
  /** その位置が確定したことにする。message を省くと定型文になる */
  mark(index: number, codeTag: CodeTag, pointers?: Pointers, message?: string): void

  // ── 挿入ソートの「手に持つ」操作 ────────────────
  // tmp = Data[i] ／ Data[j+1] = Data[j] ／ Data[j+1] = tmp を
  // Recorder 側で組にして扱う。手の状態は push のたびに自動で全ステップへ
  // 付くので、生成器が付け忘れることがない。

  /** A[i] を取り出して手に持つ（tmp = Data[i]）。その場所が穴になる */
  takeOut(index: number, codeTag: CodeTag, pointers?: Pointers): void
  /** A[j] が 手に持っている値より大きいか（Data[j] > tmp）。比較として数える */
  greaterThanHeld(j: number, codeTag: CodeTag, pointers?: Pointers): boolean
  /** A[j] を1つ右へずらす（Data[j+1] = Data[j]）。穴が j へ移る。移動として数える */
  shiftRight(j: number, codeTag: CodeTag, pointers?: Pointers): void
  /** 手に持っている値を穴に置く（Data[j+1] = tmp）。数えない */
  putDown(codeTag: CodeTag, pointers?: Pointers): void
}

/** 交換回数として数える kind */
function isSwapKind(kind: StepKind): boolean {
  return kind === "swap" || kind === "shift" || kind === "write"
}

abstract class BaseRecorder implements Recorder {
  readonly array: number[]
  protected compares = 0
  protected swaps = 0
  private stepCount = 0

  /** 手に持っている値と、あいている場所。持っていなければ undefined */
  protected held: number | undefined
  protected gap: number | undefined

  constructor(input: readonly number[]) {
    this.array = [...input]
  }

  get length(): number {
    return this.array.length
  }

  push(input: StepInput): void {
    this.stepCount++
    if (this.stepCount > MAX_STEPS) throw new StepLimitExceededError(MAX_STEPS)

    // カウントはここでしか行わない。StepRecorder / CountRecorder で共通。
    if (input.kind === "compare") this.compares++
    else if (isSwapKind(input.kind)) this.swaps++

    this.record(input)
  }

  /** 記録の仕方だけを実装が決める */
  protected abstract record(input: StepInput): void

  lessThan(i: number, j: number, codeTag: CodeTag, pointers: Pointers = {}): boolean {
    this.push({ kind: "compare", codeTag, compared: [i, j], pointers })
    return this.array[i] < this.array[j]
  }

  compareWith(i: number, value: number, codeTag: CodeTag, pointers: Pointers = {}): number {
    this.push({ kind: "compare", codeTag, compared: [i], target: value, pointers })
    const v = this.array[i]
    if (v === value) return 0
    return v < value ? -1 : 1
  }

  swap(i: number, j: number, codeTag: CodeTag, pointers: Pointers = {}): void {
    // 先に入れかえてから記録する。
    // 画面には「入れかえた結果」が出たほうが動きとして読みやすい。
    const tmp = this.array[i]
    this.array[i] = this.array[j]
    this.array[j] = tmp
    this.push({ kind: "swap", codeTag, swapped: [i, j], pointers })
  }

  mark(index: number, codeTag: CodeTag, pointers: Pointers = {}, message?: string): void {
    this.push({ kind: "mark", codeTag, marked: index, pointers, message })
  }

  takeOut(index: number, codeTag: CodeTag, pointers: Pointers = {}): void {
    this.held = this.array[index]
    this.gap = index
    // 矢印は足さない。取り出した値はオレンジの札として穴の上に出しているので、
    // 矢印も出すと二重になるうえ、取り出したステップだけ凡例が増えて目が散る。
    this.push({
      kind: "take",
      codeTag,
      pointers,
      message: describeTakeOut(index, this.held),
    })
  }

  greaterThanHeld(j: number, codeTag: CodeTag, pointers: Pointers = {}): boolean {
    this.push({
      kind: "compare",
      codeTag,
      compared: [j],
      pointers,
      message: describeHeldCompare(j, this.array[j], this.held),
    })
    return this.held !== undefined && this.array[j] > this.held
  }

  shiftRight(j: number, codeTag: CodeTag, pointers: Pointers = {}): void {
    this.array[j + 1] = this.array[j]
    this.gap = j
    this.push({ kind: "shift", codeTag, wrote: j + 1, pointers })
  }

  putDown(codeTag: CodeTag, pointers: Pointers = {}): void {
    const at = this.gap
    const value = this.held
    if (at !== undefined && value !== undefined) this.array[at] = value
    this.held = undefined
    this.gap = undefined
    this.push({
      kind: "place",
      codeTag,
      wrote: at,
      pointers,
      message: at === undefined || value === undefined ? undefined : describePutDown(at, value),
    })
  }
}

// ── アニメーション用 ──────────────────────────────
export class StepRecorder extends BaseRecorder {
  private readonly out: Step[] = []
  private readonly sortedSet = new Set<number>()
  private arraySnap: readonly number[]
  private sortedSnap: readonly number[] = Object.freeze<number[]>([])

  constructor(input: readonly number[]) {
    super(input)
    this.arraySnap = Object.freeze([...this.array])
  }

  /** 配列の中身が1つ前のスナップショットから変わったか */
  private hasChanged(): boolean {
    if (this.array.length !== this.arraySnap.length) return true
    for (let i = 0; i < this.array.length; i++) {
      if (this.array[i] !== this.arraySnap[i]) return true
    }
    return false
  }

  protected record(input: StepInput): void {
    // 構造共有：配列が変わったステップだけ新しい配列を作り、
    // 変わらないステップは1つ前の配列をそのまま指す。
    //
    // 「どの kind が配列を変えるか」を表で持つのはやめて、中身を見て決める。
    // 新しい操作を足したときに表の更新を忘れると、画面が1つ前の配列を
    // 出しつづけて**無言で嘘をつく**ため。n は 50 までなので比較のコストは無視できる。
    if (this.hasChanged()) {
      this.arraySnap = Object.freeze([...this.array])
    }
    if (input.kind === "mark" && input.marked !== undefined) {
      this.sortedSet.add(input.marked)
      this.sortedSnap = Object.freeze([...this.sortedSet].sort((a, b) => a - b))
    }

    this.out.push(
      Object.freeze({
        kind: input.kind,
        array: this.arraySnap,
        compared: input.compared,
        target: input.target,
        swapped: input.swapped,
        wrote: input.wrote,
        marked: input.marked,
        // 手の状態は毎ステップ自動で付ける（生成器が付け忘れられない）
        held: this.held,
        gap: this.gap,
        sorted: this.sortedSnap,
        range: input.range,
        pointers: input.pointers ?? {},
        aux: input.aux,
        pendingRanges: input.pendingRanges,
        codeTag: input.codeTag,
        message: input.message ?? describeStep(input, this.arraySnap),
        compares: this.compares,
        swaps: this.swaps,
      }),
    )
  }

  get steps(): Step[] {
    return this.out
  }
}

// ── 計算量グラフ用（配列コピーをしない）──────────────
export class CountRecorder extends BaseRecorder {
  protected record(): void {
    // 何も残さない。カウントは push 側で済んでいる。
  }

  get counts(): { compares: number; swaps: number } {
    return { compares: this.compares, swaps: this.swaps }
  }
}

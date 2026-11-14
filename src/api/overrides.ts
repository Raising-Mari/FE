import type { components } from './generated/schema'

/**
 * Swagger 가 이름이 같은 내부 타입(`Item`·`Disciple`·`Question` 등)을 하나로 합쳐 버려 `generated` 가 틀리게 나오는 응답을
 * BE 의 DTO(record) 그대로 다시 적은 것. BE 가 스키마 이름을 고치면 이 파일을 지우고 `generated` 를 쓴다.
 * 출처: BE `domain/review/dto/ReviewResponse.java`, `domain/admin/dto/QuestionAccuracyResponse.java`.
 */
type Schemas = components['schemas']

export type Verdict = NonNullable<Schemas['QuestionResult']['myVerdict']>
export type ReviewCause = Schemas['SaveReviewRequest']['userCause']

export interface ReviewItem {
  battleAnswerId: number
  seq: number
  /** `referenceAnswer` 는 정답 보기(R-11) 뒤에만 온다. */
  question: { id: number; stem: string; referenceAnswer?: string }
  disciple: {
    answerText: string | null
    isUnknown: boolean
    verdict: Verdict
    finalScore: number
    copyFactor: number
    injectionFlag: boolean
  }
  usedNotes: { id: number; content: string }[]
  causeSuggestion: ReviewCause | null
  myReview: {
    userCause: ReviewCause
    studyMemo: string | null
    aiMemo: string | null
    sourceNote: string | null
    reasonNote: string | null
  } | null
  practiceAvailable: boolean
  /** 정답 보기 뒤에만 오고, 근거 문장이 없는 문항은 그 뒤에도 없다. */
  evidence?: { text: string; materialTitle: string | null }
}

export interface ReviewResponse {
  answersRevealed: boolean
  items: ReviewItem[]
}

export interface QuestionAccuracyItem {
  questionId: number
  unitId: number
  stem: string
  status: string
  answeredCount: number
  correctCount: number
  correctRate: number
}

export interface QuestionAccuracyResponse {
  minAnswers: number
  tooHardAtMost: number
  tooEasyAtLeast: number
  tooHard: QuestionAccuracyItem[]
  tooEasy: QuestionAccuracyItem[]
}

import { apiClient } from '@/api/client'
import type { components } from '@/api/generated/schema'
import type { ReviewCause, ReviewResponse } from '@/api/overrides'

type Schemas = components['schemas']
export type Battle = Schemas['BattleResponse']
export type BattleResult = Schemas['BattleResultResponse']
export type QuestionResult = Schemas['QuestionResult']
export type ReportKind = Schemas['CreateReportRequest']['kind']
export type ReportReason = Schemas['CreateReportRequest']['reasonType']
export type OpponentNotes = Schemas['OpponentNotesResponse']
export type NoteReviews = Schemas['NoteReviewsResponse']
export type SaveReviewInput = Schemas['SaveReviewRequest']
export type { ReviewCause, ReviewItem, ReviewResponse } from '@/api/overrides'

export const CAUSE_LABEL: Record<ReviewCause, string> = {
  NOT_TAUGHT: '가르치지 않음',
  NOT_IN_NOTES: '노트에 없음',
  NOTE_WRONG: '노트가 틀림',
  NOT_APPLIED: '노트는 맞는데 제자가 못 씀',
  OTHER: '기타',
}

/** 자동 분류는 제안일 뿐이라 단정하지 않는 말투로 보여 준다. */
export const CAUSE_SUGGESTION: Record<ReviewCause, string> = {
  NOT_TAUGHT: '이 문제를 설명한 노트가 없을 수 있어요.',
  NOT_IN_NOTES: '설명은 했지만 노트로 남지 않았을 수 있어요.',
  NOTE_WRONG: '사용한 노트의 내용이 정확하지 않을 수 있어요.',
  NOT_APPLIED: '노트는 맞지만 제자가 문제에 적용하지 못했을 수 있어요.',
  OTHER: '원인을 하나로 짚기 어려워요. 직접 골라 주세요.',
}

export const REPORT_REASONS: Record<ReportKind, { value: ReportReason; label: string }[]> = {
  QUESTION: [
    { value: 'WRONG_ANSWER', label: '정답이 틀린 것 같아요' },
    { value: 'AMBIGUOUS', label: '문제가 모호해요' },
    { value: 'NOT_IN_MATERIAL', label: '자료에 없는 내용이에요' },
    { value: 'OTHER', label: '기타' },
  ],
  GRADING: [
    { value: 'GRADING_DISPUTE', label: '채점이 잘못된 것 같아요' },
    { value: 'OTHER', label: '기타' },
  ],
}

/** B-03 배틀의 과목·주차(화면 머리말과 "노트 고치러 가기"에 쓴다). */
export async function fetchBattle(battleId: number) {
  const { data } = await apiClient.get<Battle>(`/api/battles/${battleId}`)
  return data
}

/** B-07 결과. 연습 배틀이면 `sourceBattleId`·`retestOf` 가 붙고 상대·승패·Elo 는 없다. */
export async function fetchResult(battleId: number) {
  const { data } = await apiClient.get<BattleResult>(`/api/battles/${battleId}/result`)
  return data
}

/** R-01 복기. 모범 답과 자료 근거는 정답 보기 전에는 응답에 없다. */
export async function fetchReview(battleId: number) {
  const { data } = await apiClient.get<ReviewResponse>(`/api/battles/${battleId}/review`)
  return data
}

/** R-02 원인·메모 저장. 다시 저장하면 모든 칸을 덮어쓴다(보내지 않은 메모는 지워진다). */
export async function saveReview(answerId: number, input: SaveReviewInput) {
  await apiClient.put(`/api/battle-answers/${answerId}/review`, input)
}

/** R-03 문제 신고·채점 이의제기. 같은 답에 같은 종류는 한 번만 낼 수 있다. */
export async function reportAnswer(answerId: number, input: Schemas['CreateReportRequest']) {
  await apiClient.post(`/api/battle-answers/${answerId}/reports`, input)
}

/** R-11 정답 보기. 되돌릴 수 없고 이 배틀의 연습이 끝난다. */
export async function revealAnswers(battleId: number) {
  await apiClient.post(`/api/battles/${battleId}/reveal-answers`)
}

/** B-10 연습 배틀 시작. 고른 답의 같은 문항을 지금 노트로 다시 푼다. */
export async function startPractice(sourceBattleId: number, battleAnswerIds: number[]) {
  const { data } = await apiClient.post<Schemas['CreatePracticeResponse']>(
    '/api/battles/practice',
    { sourceBattleId, battleAnswerIds } satisfies Schemas['CreatePracticeRequest'],
  )
  return data
}

/** B-08 내 노트 공개 동의 바꾸기. */
export async function updateNotesPublic(battleId: number, notesPublic: boolean) {
  await apiClient.patch(`/api/battles/${battleId}/participants/me`, {
    notesPublic,
  } satisfies Schemas['UpdateParticipantRequest'])
}

/** R-06 상대 노트. 두 사람이 모두 공개에 동의했을 때만 온다(아니면 `REVIEW_NOTES_NOT_PUBLIC`). */
export async function fetchOpponentNotes(battleId: number) {
  const { data } = await apiClient.get<OpponentNotes>(`/api/battles/${battleId}/opponent-notes`)
  return data
}

/** R-08 내가 쓴 리뷰와 받은 리뷰. */
export async function fetchNoteReviews(battleId: number) {
  const { data } = await apiClient.get<NoteReviews>(`/api/battles/${battleId}/note-reviews`)
  return data
}

/** R-07 노트 교환 리뷰 쓰기. 배틀당 한 번. */
export async function writeNoteReview(battleId: number, input: Schemas['WriteNoteReviewRequest']) {
  await apiClient.post(`/api/battles/${battleId}/note-reviews`, input)
}

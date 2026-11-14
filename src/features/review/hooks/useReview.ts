import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/api/errorMessages'
import {
  fetchBattle,
  fetchNoteReviews,
  fetchOpponentNotes,
  fetchResult,
  fetchReview,
  reportAnswer,
  revealAnswers,
  saveReview,
  startPractice,
  updateNotesPublic,
  writeNoteReview,
  type SaveReviewInput,
} from '../api'

export const reviewKeys = {
  battle: (id: number) => ['review', id, 'battle'] as const,
  result: (id: number) => ['review', id, 'result'] as const,
  review: (id: number) => ['review', id, 'items'] as const,
  opponentNotes: (id: number) => ['review', id, 'opponent-notes'] as const,
  noteReviews: (id: number) => ['review', id, 'note-reviews'] as const,
}

export function useBattleInfo(battleId: number) {
  return useQuery({
    queryKey: reviewKeys.battle(battleId),
    queryFn: () => fetchBattle(battleId),
    enabled: battleId > 0,
  })
}

export function useResult(battleId: number) {
  return useQuery({
    queryKey: reviewKeys.result(battleId),
    queryFn: () => fetchResult(battleId),
    enabled: battleId > 0,
  })
}

export function useReview(battleId: number, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.review(battleId),
    queryFn: () => fetchReview(battleId),
    enabled: battleId > 0 && enabled,
  })
}

export function useSaveReview(battleId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { answerId: number; review: SaveReviewInput }) =>
      saveReview(input.answerId, input.review),
    onSuccess: () => void client.invalidateQueries({ queryKey: reviewKeys.review(battleId) }),
  })
}

export function useReport() {
  return useMutation({
    mutationFn: (input: { answerId: number; report: Parameters<typeof reportAnswer>[1] }) =>
      reportAnswer(input.answerId, input.report),
  })
}

export function useRevealAnswers(battleId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => revealAnswers(battleId),
    onSuccess: () => void client.invalidateQueries({ queryKey: reviewKeys.review(battleId) }),
  })
}

export function useStartPractice(battleId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (answerIds: number[]) => startPractice(battleId, answerIds),
    // 기록 화면의 연습 횟수가 바뀐다.
    onSuccess: () => void client.invalidateQueries({ queryKey: ['battles'] }),
  })
}

/** 상대 노트. 공개되지 않았으면(`REVIEW_NOTES_NOT_PUBLIC`) 오류가 아니라 `null` 로 돌려준다. */
export function useOpponentNotes(battleId: number) {
  return useQuery({
    queryKey: reviewKeys.opponentNotes(battleId),
    queryFn: async () => {
      try {
        return await fetchOpponentNotes(battleId)
      } catch (error) {
        if (hasErrorCode(error, 'REVIEW_NOTES_NOT_PUBLIC')) return null
        throw error
      }
    },
    enabled: battleId > 0,
  })
}

export function useNoteReviews(battleId: number) {
  return useQuery({
    queryKey: reviewKeys.noteReviews(battleId),
    queryFn: () => fetchNoteReviews(battleId),
    enabled: battleId > 0,
  })
}

export function useUpdateNotesPublic(battleId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (notesPublic: boolean) => updateNotesPublic(battleId, notesPublic),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: reviewKeys.opponentNotes(battleId) })
      void client.invalidateQueries({ queryKey: reviewKeys.result(battleId) })
    },
  })
}

export function useWriteNoteReview(battleId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof writeNoteReview>[1]) => writeNoteReview(battleId, input),
    onSettled: () => void client.invalidateQueries({ queryKey: reviewKeys.noteReviews(battleId) }),
  })
}

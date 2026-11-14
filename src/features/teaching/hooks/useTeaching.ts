import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { courseKeys } from '@/hooks/useCourseQueries'
import {
  fetchMessages,
  fetchNotes,
  mergeNotes,
  sendMessage,
  type ChatMessage,
  type TeachingTurn,
} from '../api'

export const teachingKeys = {
  messages: (discipleId: number, unitId: number) =>
    ['teaching', discipleId, unitId, 'messages'] as const,
  notes: (discipleId: number, unitId: number) => ['teaching', discipleId, unitId, 'notes'] as const,
}

export function useMessages(discipleId: number, unitId: number) {
  return useQuery({
    queryKey: teachingKeys.messages(discipleId, unitId),
    queryFn: () => fetchMessages(discipleId, unitId),
    enabled: discipleId > 0 && unitId > 0,
  })
}

export function useNotes(discipleId: number, unitId: number) {
  return useQuery({
    queryKey: teachingKeys.notes(discipleId, unitId),
    queryFn: () => fetchNotes(discipleId, unitId),
    enabled: discipleId > 0 && unitId > 0,
  })
}

/** 한 턴의 응답을 대화 목록에 이어 붙인다. 같은 메시지를 두 번 넣지 않는다(재전송 대비). */
function appendTurn(messages: ChatMessage[], turn: TeachingTurn, unitId: number): ChatMessage[] {
  const added: ChatMessage[] = [
    { ...turn.studentMessage, role: 'STUDENT', unitId, turnNo: turn.turnNo },
    { ...turn.discipleMessage, role: 'DISCIPLE', unitId, turnNo: turn.turnNo },
  ]
  const known = new Set(messages.map((m) => m.id))
  return [...messages, ...added.filter((m) => !known.has(m.id))]
}

export function useSendMessage(courseId: number, discipleId: number, unitId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { content: string; clientMessageId: string }) =>
      sendMessage(discipleId, { unitId, ...input }),
    onSuccess: (turn) => {
      client.setQueryData<ChatMessage[]>(teachingKeys.messages(discipleId, unitId), (prev) =>
        appendTurn(prev ?? [], turn, unitId),
      )
      // 노트는 서버가 반영한 것만 보여 주므로 미리 넣지 않고 다시 받는다.
      void client.invalidateQueries({ queryKey: teachingKeys.notes(discipleId, unitId) })
      void client.invalidateQueries({ queryKey: courseKeys.units(courseId) })
    },
  })
}

export function useMergeNotes(courseId: number, discipleId: number, unitId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { keepEntryId: number; mergeEntryId: number }) =>
      mergeNotes(discipleId, input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: teachingKeys.notes(discipleId, unitId) })
      void client.invalidateQueries({ queryKey: courseKeys.units(courseId) })
    },
  })
}

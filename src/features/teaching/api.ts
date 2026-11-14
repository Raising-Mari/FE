import { apiClient } from '@/api/client'
import type { components } from '@/api/generated/schema'
import { AI_REQUEST_TIMEOUT_MS } from '@/api/timeouts'

type Schemas = components['schemas']
export type ChatMessage = Schemas['ChatMessageResponse']
export type TeachingTurn = Schemas['TeachingTurnResponse']
export type NoteChanges = Schemas['NoteChanges']
export type MergeSuggestion = Schemas['MergeSuggestion']
export type NoteGroup = Schemas['Group']

/** 서버 기준(T-01): 메시지 1~2000자. */
export const MAX_MESSAGE_LENGTH = 2000

/** T-02 이 주차의 대화. 화면에는 오래된 것부터 보여 준다. */
export async function fetchMessages(discipleId: number, unitId: number): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<Schemas['PageResponseChatMessageResponse']>(
    `/api/disciples/${discipleId}/messages`,
    { params: { unitId, page: 0, size: 100 } },
  )
  return [...(data.items ?? [])].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
}

/** T-03 이 주차의 현재 노트(서버가 반영한 것만). */
export async function fetchNotes(discipleId: number, unitId: number): Promise<NoteGroup | null> {
  const { data } = await apiClient.get<Schemas['NotesResponse']>(
    `/api/disciples/${discipleId}/notes`,
    { params: { unitId } },
  )
  return data.groups?.[0] ?? null
}

/**
 * T-01 설명을 보내고 제자의 답과 노트 변경을 받는다. AI 가 답하므로 오래 걸릴 수 있다.
 * 같은 `clientMessageId` 로 다시 보내면 서버가 저장된 결과를 돌려주므로 재전송해도 두 번 저장되지 않는다.
 */
export async function sendMessage(
  discipleId: number,
  input: Schemas['SendMessageRequest'],
): Promise<TeachingTurn> {
  const { data } = await apiClient.post<TeachingTurn>(
    `/api/disciples/${discipleId}/messages`,
    input,
    { timeout: AI_REQUEST_TIMEOUT_MS },
  )
  return data
}

/** T-05 확인 카드에서 "합치기". 내용은 바뀌지 않고 옛 노트가 새 노트로 합쳐진다. */
export async function mergeNotes(discipleId: number, input: Schemas['MergeNotesRequest']) {
  const { data } = await apiClient.post<Schemas['MergeNotesResponse']>(
    `/api/disciples/${discipleId}/notes/merge`,
    input,
  )
  return data
}

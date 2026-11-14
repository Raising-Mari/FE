import { apiClient } from '@/api/client'
import type { components } from '@/api/generated/schema'

type Schemas = components['schemas']
export type Battle = Schemas['BattleResponse']
export type BattleStatus = NonNullable<Battle['status']>
export type Participant = Schemas['Participant']
export type BattleSummary = Schemas['BattleSummaryResponse']
export type BattleReadiness = Schemas['BattleReadinessResponse']

export const MIN_QUESTIONS = 3
export const MAX_QUESTIONS = 10
export const DEFAULT_QUESTIONS = 5

/** 진행 중으로 치는 상태(B-01: 같은 사람의 진행 중 랭킹 방은 하나). */
export const ACTIVE_STATUSES: BattleStatus[] = ['WAITING', 'LOBBY', 'RUNNING', 'ERROR']
/** 더 바뀌지 않는 상태. 여기서만 폴링을 멈춘다(`ERROR` 는 아니다). */
export const FINAL_STATUSES: BattleStatus[] = ['FINISHED', 'CANCELED', 'EXPIRED']

/** 방 코드는 대소문자·공백을 정리해 보낸다. */
export function normalizeRoomCode(value: string): string {
  return value.replace(/\s/g, '').toUpperCase()
}

/** Q-01 이 주차에서 내게 아직 안 나온 문제 수(내용은 오지 않는다). */
export async function fetchReadiness(unitId: number, questionCount: number) {
  const { data } = await apiClient.get<BattleReadiness>(`/api/units/${unitId}/battle-readiness`, {
    params: { questionCount },
  })
  return data
}

/** B-01 랭킹 방 만들기. */
export async function createBattle(input: Schemas['CreateBattleRequest']) {
  const { data } = await apiClient.post<Schemas['CreateBattleResponse']>('/api/battles', input)
  return data
}

/** B-02 방 코드로 입장. 이미 들어와 있으면 같은 응답을 준다(새로고침). */
export async function joinBattle(roomCode: string) {
  const { data } = await apiClient.post<Battle>('/api/battles/join', {
    roomCode: normalizeRoomCode(roomCode),
  } satisfies Schemas['JoinBattleRequest'])
  return data
}

/** B-03 방·진행 상태. 진행 중에는 문항·답·상대 노트가 오지 않는다. */
export async function fetchBattle(battleId: number) {
  const { data } = await apiClient.get<Battle>(`/api/battles/${battleId}`)
  return data
}

/** B-04 준비 완료. 누른 순간의 내 노트가 이 배틀에 쓰인다. `notesPublic` 은 처음 준비할 때만 반영된다. */
export async function readyBattle(battleId: number, notesPublic: boolean) {
  await apiClient.post(`/api/battles/${battleId}/ready`, {
    notesPublic,
  } satisfies Schemas['ReadyRequest'])
}

/** B-05 방 취소·포기하고 나가기. 참가자 누구나 할 수 있고 방 전체가 닫힌다. */
export async function cancelBattle(battleId: number) {
  await apiClient.post(`/api/battles/${battleId}/cancel`)
}

/** B-09 오류가 난 배틀의 풀이를 다시 시도한다. */
export async function retrySolve(battleId: number) {
  await apiClient.post(`/api/battles/${battleId}/solve/retry`)
}

/** B-06 내 배틀 기록. */
export async function fetchBattles(params: {
  mode?: 'RANKED' | 'PRACTICE'
  status?: BattleStatus
  courseId?: number
  page?: number
  size?: number
}) {
  const { data } = await apiClient.get<Schemas['PageResponseBattleSummaryResponse']>(
    '/api/battles',
    { params },
  )
  return data
}

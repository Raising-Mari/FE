import { apiClient } from '@/api/client'
import type { components } from '@/api/generated/schema'

type Schemas = components['schemas']
export type RankingEntry = Schemas['Entry']
/** K-05 항목에는 기간 안의 Elo 증감(`delta`)이 더 있다. Swagger 가 K-01 의 `Entry` 와 합쳐 버려 따로 적는다(BE `GrowthRankingResponse.Entry`). */
export type GrowthEntry = RankingEntry & { delta: number }
export type Ranking = Schemas['RankingResponse']
export type GrowthRanking = Omit<Schemas['GrowthRankingResponse'], 'items' | 'me'> & {
  items?: GrowthEntry[]
  me?: GrowthEntry | null
}
export type OpponentRecord = Schemas['OpponentRecordResponse']
export type BattleSummary = Schemas['BattleSummaryResponse']
export type BattleMode = NonNullable<BattleSummary['mode']>

/** 시안대로 성장폭은 최근 7일을 본다. */
export const GROWTH_DAYS = 7
export const PAGE_SIZE = 10

/** K-01 과목 Elo 순위와 내 순위. */
export async function fetchRanking(courseId: number, page: number) {
  const { data } = await apiClient.get<Ranking>('/api/rankings', {
    params: { courseId, page, size: PAGE_SIZE },
  })
  return data
}

/** K-05 성장폭 순위(기간 안의 Elo 증감). */
export async function fetchGrowth(courseId: number) {
  const { data } = await apiClient.get<GrowthRanking>('/api/rankings/growth', {
    params: { courseId, days: GROWTH_DAYS, page: 0, size: PAGE_SIZE },
  })
  return data
}

/** K-03 상대별 전적. */
export async function fetchOpponentRecords(courseId: number) {
  const { data } = await apiClient.get<OpponentRecord[]>('/api/me/records', {
    params: { courseId },
  })
  return data
}

/** K-04 그 상대와의 배틀 목록. */
export async function fetchOpponentBattles(opponentId: number, courseId: number) {
  const { data } = await apiClient.get<Schemas['PageResponseOpponentBattleResponse']>(
    `/api/me/records/${opponentId}/battles`,
    { params: { courseId, page: 0, size: PAGE_SIZE } },
  )
  return data
}

/** K-07 내 Elo 변동 이력. */
export async function fetchEloHistory(courseId: number) {
  const { data } = await apiClient.get<Schemas['PageResponseEloHistoryResponse']>(
    '/api/me/ratings/history',
    { params: { courseId, page: 0, size: PAGE_SIZE } },
  )
  return data
}

/** B-06 내 배틀·연습 기록. */
export async function fetchBattleRecords(courseId: number, mode: BattleMode | null, page: number) {
  const { data } = await apiClient.get<Schemas['PageResponseBattleSummaryResponse']>(
    '/api/battles',
    { params: { courseId, mode: mode ?? undefined, page, size: PAGE_SIZE } },
  )
  return data
}

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  fetchBattleRecords,
  fetchEloHistory,
  fetchGrowth,
  fetchOpponentBattles,
  fetchOpponentRecords,
  fetchRanking,
  type BattleMode,
} from '../api'

export function useRanking(courseId: number, page: number) {
  return useQuery({
    queryKey: ['ranking', courseId, page],
    queryFn: () => fetchRanking(courseId, page),
    enabled: courseId > 0,
    placeholderData: keepPreviousData,
  })
}

export function useGrowth(courseId: number) {
  return useQuery({
    queryKey: ['ranking', courseId, 'growth'],
    queryFn: () => fetchGrowth(courseId),
    enabled: courseId > 0,
  })
}

export function useOpponentRecords(courseId: number) {
  return useQuery({
    queryKey: ['records', courseId, 'opponents'],
    queryFn: () => fetchOpponentRecords(courseId),
    enabled: courseId > 0,
  })
}

/** 펼쳤을 때만 그 상대와의 배틀 목록을 받는다. */
export function useOpponentBattles(opponentId: number, courseId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['records', courseId, 'opponents', opponentId],
    queryFn: () => fetchOpponentBattles(opponentId, courseId),
    enabled: enabled && opponentId > 0,
  })
}

export function useEloHistory(courseId: number) {
  return useQuery({
    queryKey: ['ranking', courseId, 'history'],
    queryFn: () => fetchEloHistory(courseId),
    enabled: courseId > 0,
  })
}

/** 키가 `['battles', …]` 라서 배틀·연습이 끝나거나 새로 시작되면 함께 다시 받는다. */
export function useBattleRecords(courseId: number, mode: BattleMode | null, page: number) {
  return useQuery({
    queryKey: ['battles', 'records', courseId, mode, page],
    queryFn: () => fetchBattleRecords(courseId, mode, page),
    enabled: courseId > 0,
    placeholderData: keepPreviousData,
  })
}

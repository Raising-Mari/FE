import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStatusPolling } from '@/hooks/useStatusPolling'
import {
  ACTIVE_STATUSES,
  FINAL_STATUSES,
  cancelBattle,
  createBattle,
  fetchBattle,
  fetchBattles,
  fetchReadiness,
  joinBattle,
  readyBattle,
  retrySolve,
  type Battle,
} from '../api'

export const battleKeys = {
  all: ['battles'] as const,
  detail: (battleId: number) => ['battles', battleId] as const,
  list: (params: object) => ['battles', 'list', params] as const,
  readiness: (unitId: number, count: number) => ['battle-readiness', unitId, count] as const,
}

export function useReadiness(unitId: number, questionCount: number) {
  return useQuery({
    queryKey: battleKeys.readiness(unitId, questionCount),
    queryFn: () => fetchReadiness(unitId, questionCount),
    enabled: unitId > 0,
  })
}

/** 이 과목에서 아직 끝나지 않은 내 랭킹 방. 새로고침·다른 화면에서 돌아와도 이어서 들어갈 수 있게 한다. */
export function useActiveBattle(courseId: number) {
  return useQuery({
    queryKey: battleKeys.list({ courseId, mode: 'RANKED', active: true }),
    queryFn: async () => {
      const page = await fetchBattles({ courseId, mode: 'RANKED', size: 10 })
      return page.items?.find((b) => b.status && ACTIVE_STATUSES.includes(b.status)) ?? null
    },
    enabled: courseId > 0,
  })
}

/** 방 상태를 2.5초마다 확인한다. 끝난 상태에서만 멈추고 `ERROR` 에서는 계속한다. */
export function useBattle(battleId: number) {
  return useStatusPolling<Battle>({
    queryKey: battleKeys.detail(battleId),
    queryFn: () => fetchBattle(battleId),
    isDone: (battle) => !!battle.status && FINAL_STATUSES.includes(battle.status),
    enabled: battleId > 0,
  })
}

export function useCreateBattle() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: createBattle,
    onSuccess: () => void client.invalidateQueries({ queryKey: battleKeys.all }),
  })
}

export function useJoinBattle() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: joinBattle,
    onSuccess: (battle) => {
      if (battle.id) client.setQueryData(battleKeys.detail(battle.id), battle)
    },
  })
}

/** 준비·취소·재시도는 끝나면 방 상태를 바로 다시 받는다(다음 폴링을 기다리지 않는다). */
export function useBattleActions(battleId: number) {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: battleKeys.all })
  return {
    ready: useMutation({
      mutationFn: (notesPublic: boolean) => readyBattle(battleId, notesPublic),
      onSettled: refresh,
    }),
    cancel: useMutation({ mutationFn: () => cancelBattle(battleId), onSettled: refresh }),
    retry: useMutation({ mutationFn: () => retrySolve(battleId), onSettled: refresh }),
  }
}

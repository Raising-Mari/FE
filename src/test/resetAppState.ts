import { resetMockData } from '@/mocks/reset'
import { DEFAULT_SCENARIO, useScenario } from '@/mocks/scenario'
import { useToastStore } from '@/stores/toastStore'

/**
 * 테스트 사이에 남으면 안 되는 것을 모두 처음으로 돌린다(`setup.ts` 가 테스트마다 부른다).
 * 라우터·화면을 import 하지 않는다 — setup 에서 먼저 불러오면 테스트 파일의 `vi.mock` 이 먹지 않는다.
 */
export function resetAppState() {
  localStorage.clear()
  useScenario.setState(DEFAULT_SCENARIO)
  useToastStore.setState({ toasts: [] })
  resetMockData()
}

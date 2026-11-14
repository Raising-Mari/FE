import { create } from 'zustand'

/**
 * 시연 도구(`DemoPanel`)가 바꾸고 목업 핸들러가 읽는 "지금 서버가 어떤 상태인가".
 * 목업 모드에서만 쓰이며 실제 서버와는 상관이 없다.
 */
export interface Scenario {
  /** 내 정보(A-06)가 돌려줄 역할. */
  role: 'STUDENT' | 'ADMIN'
  /** true 면 모든 `/api` 요청이 서버에 닿지 못한 것처럼 실패한다. */
  networkDown: boolean
  /** true 면 로그인 상태가 필요한 모든 요청이 401(토큰 만료)로 거절된다. */
  tokenRejected: boolean
  /** true 면 배틀 상대가 저절로 들어오고 준비한다(혼자서 흐름을 끝까지 볼 수 있게). */
  opponentAuto: boolean
  /** true 면 다음 배틀 풀이가 한 번 실패해 오류 화면이 된다. */
  battleFail: boolean
  /** 배틀 상대가 노트 공개에 동의했는가(노트 교환 리뷰). */
  opponentNotesPublic: boolean
}

export const DEFAULT_SCENARIO: Scenario = {
  role: 'STUDENT',
  networkDown: false,
  tokenRejected: false,
  opponentAuto: true,
  battleFail: false,
  opponentNotesPublic: true,
}

interface ScenarioState extends Scenario {
  set: (patch: Partial<Scenario>) => void
  reset: () => void
}

export const useScenario = create<ScenarioState>((set) => ({
  ...DEFAULT_SCENARIO,
  set: (patch) => set(patch),
  reset: () => set(DEFAULT_SCENARIO),
}))

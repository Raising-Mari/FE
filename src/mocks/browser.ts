import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { resetMockData } from './reset'

// 시안과 같은 예시(노트 4개, 끝난 배틀 1개 등)로 시작한다. 새로고침하면 다시 이 상태가 된다.
resetMockData()

export const worker = setupWorker(...handlers)

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** 테스트(vitest)용. 브라우저용 worker 와 같은 handlers 를 공유한다. */
export const server = setupServer(...handlers)

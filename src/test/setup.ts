import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { server } from '@/mocks/server'
import { resetAppState } from './resetAppState'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => resetAppState())
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

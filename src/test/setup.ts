import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { server } from '@/mocks/server'
import { resetAppState } from './resetAppState'

// 앱 전체를 띄우는 테스트는 파일의 첫 테스트에서 화면을 처음 불러오느라 기본 1초를 넘길 수 있다.
configure({ asyncUtilTimeout: 3000 })

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => resetAppState())
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

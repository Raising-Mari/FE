import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ToastViewport } from '@/app/ToastViewport'
import { routes } from '@/app/router'
import { useAuthStore } from '@/stores/authStore'

/**
 * 로그인한 상태로 앱 전체(라우터·가드·틀)를 주소 하나에서 띄운다. 기능 화면 테스트가 같이 쓴다.
 * 목업 데이터·시나리오·저장소는 `test/setup.ts` 가 테스트마다 처음 상태로 되돌린다.
 */
export function renderApp(path: string) {
  useAuthStore.setState({ accessToken: 'test-token', sessionExpired: false })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
      <ToastViewport />
    </QueryClientProvider>,
  )
  return router
}

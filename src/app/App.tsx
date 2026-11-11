import { lazy, Suspense } from 'react'
import { RouterProvider } from 'react-router'
import { env } from '@/lib/env'
import { Providers } from './providers'
import { router } from './router'
import { ToastViewport } from './ToastViewport'

/** 시연 도구는 목업 모드에서만 불러온다. 실제 서버로 동작하는 빌드에는 들어가지 않는다. */
const DemoPanel = env.useMock
  ? lazy(() => import('@/mocks/DemoPanel').then((m) => ({ default: m.DemoPanel })))
  : null

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <ToastViewport />
      {DemoPanel && (
        <Suspense fallback={null}>
          <DemoPanel />
        </Suspense>
      )}
    </Providers>
  )
}

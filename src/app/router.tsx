import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/features/home/HomePage'
import { env } from '@/lib/env'

/** 개발 서버에서만 여는 스타일 가이드. 배포에서는 라우트 자체가 없다. */
const devRoutes: RouteObject[] = env.isDev
  ? [
      {
        path: '/styleguide',
        lazy: async () => {
          const { StyleguidePage } = await import('@/features/styleguide/StyleguidePage')
          return { Component: StyleguidePage }
        },
      },
    ]
  : []

/** 라우트는 이 파일에서만 등록한다. 기능을 만들 때 features/<기능>/ 의 페이지를 여기에 추가한다. */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [{ path: '/', element: <HomePage /> }],
  },
  ...devRoutes,
])

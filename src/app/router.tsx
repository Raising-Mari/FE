import { createBrowserRouter, type RouteObject } from 'react-router'
import { NotFoundPage } from '@/features/system/NotFoundPage'
import { SessionExpiredPage } from '@/features/system/SessionExpiredPage'
import { env } from '@/lib/env'
import { RequireAdmin, RequireAuth } from './guards'
import { ProtectedLayout, PublicLayout } from './layouts'
import { AdminRoute, TeachRoute } from './routeElements'
import { LandingPage } from '@/features/auth/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { CoursesPage } from '@/features/course/CoursesPage'
import { CourseHomePage } from '@/features/course/CourseHomePage'
import { RequireDisciple } from '@/features/course/RequireDisciple'
import { MaterialsPage } from '@/features/material/MaterialsPage'
import { BattleRoomPage } from '@/features/battle/BattleRoomPage'
import { BattleSetupPage } from '@/features/battle/BattleSetupPage'
import { JoinPage } from '@/features/battle/JoinPage'
import { PracticeResultPage } from '@/features/review/PracticeResultPage'
import { ReviewPage } from '@/features/review/ReviewPage'
import { MePage } from '@/features/auth/MePage'
import { RankingPage } from '@/features/ranking/RankingPage'
import { RecordsPage } from '@/features/ranking/RecordsPage'

/** 개발 서버에서만 여는 화면(스타일 가이드·서버 연결 확인). 배포에서는 라우트 자체가 없다. */
const devRoutes: RouteObject[] = env.isDev
  ? [
      {
        path: '/styleguide',
        lazy: async () => {
          const { StyleguidePage } = await import('@/features/styleguide/StyleguidePage')
          return { Component: StyleguidePage }
        },
      },
      {
        path: '/dev/health',
        lazy: async () => {
          const { HomePage } = await import('@/features/home/HomePage')
          return { Component: HomePage }
        },
      },
    ]
  : []

/**
 * 라우트는 이 파일에서만 등록한다(주소는 계획서 부록 A).
 * 로그인 전 화면은 `PublicLayout`, 로그인이 필요한 화면은 `RequireAuth` → `ProtectedLayout` 아래에 둔다.
 */
export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/session-expired', element: <SessionExpiredPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <ProtectedLayout />,
        children: [
          { path: '/courses', element: <CoursesPage /> },
          { path: '/courses/:courseId', element: <CourseHomePage /> },
          {
            element: <RequireDisciple />,
            children: [
              { path: '/courses/:courseId/teach', element: <TeachRoute /> },
              { path: '/courses/:courseId/battle', element: <BattleSetupPage /> },
            ],
          },
          { path: '/courses/:courseId/materials', element: <MaterialsPage /> },
          { path: '/courses/:courseId/records', element: <RecordsPage /> },
          { path: '/courses/:courseId/ranking', element: <RankingPage /> },
          { path: '/join/:code', element: <JoinPage /> },
          { path: '/battles/:battleId', element: <BattleRoomPage /> },
          { path: '/battles/:battleId/review', element: <ReviewPage /> },
          { path: '/battles/:battleId/result', element: <PracticeResultPage /> },
          { path: '/me', element: <MePage /> },
          {
            element: <RequireAdmin />,
            children: [{ path: '/admin', element: <AdminRoute /> }],
          },
        ],
      },
    ],
  },
  ...devRoutes,
]

export const router = createBrowserRouter(routes)

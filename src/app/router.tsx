import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/features/home/HomePage'

/** 라우트는 이 파일에서만 등록한다. 기능을 만들 때 features/<기능>/ 의 페이지를 여기에 추가한다. */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [{ path: '/', element: <HomePage /> }],
  },
])

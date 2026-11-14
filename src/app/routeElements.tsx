import { AdminPage } from '@/features/admin/AdminPage'
import { useMe } from '@/features/auth/hooks/useMe'
import { CreateUnitDialog } from '@/features/course/components/CreateUnitDialog'
import { useSelectedCourse } from '@/features/course/hooks/useSelectedCourse'
import { TeachPage } from '@/features/teaching/TeachPage'

/**
 * 기능 화면에 다른 기능의 것을 끼워 주는 자리. 기능끼리는 서로 import 하지 않으므로(FE 규칙 6)
 * 두 기능을 잇는 조립은 여기(app)에서 한다.
 */
export function TeachRoute() {
  const me = useMe()
  return (
    <TeachPage
      myName={me.data?.nickname ?? '나'}
      renderCreateUnit={(props) => <CreateUnitDialog {...props} />}
    />
  )
}

/** 관리자 화면은 왼쪽 메뉴에서 고른 과목의 주차로 문항을 거르고 만든다. */
export function AdminRoute() {
  return <AdminPage courseId={useSelectedCourse()} />
}

import { useMe } from '@/features/auth/hooks/useMe'
import { CreateUnitDialog } from '@/features/course/components/CreateUnitDialog'
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

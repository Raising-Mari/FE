import { Navigate, Outlet, useLocation } from 'react-router'
import { ErrorState } from '@/components/ui/ErrorState'
import { StateBox } from '@/components/ui/StateBox'
import { useMe } from '@/features/auth/hooks/useMe'
import { ForbiddenPage } from '@/features/system/ForbiddenPage'
import { makeFromState } from '@/lib/redirectState'
import { useAuthStore } from '@/stores/authStore'

/**
 * 로그인해야 들어갈 수 있는 라우트를 묶는다. 서버도 막지만 화면에서도 로그인 화면으로 안내한다.
 * 토큰이 만료돼 401 을 받으면 `authStore` 가 토큰을 지우므로, 이 가드가 다시 그려지며 만료 안내로 보낸다.
 */
export function RequireAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const sessionExpired = useAuthStore((s) => s.sessionExpired)
  const location = useLocation()

  if (!accessToken) {
    return (
      <Navigate
        to={sessionExpired ? '/session-expired' : '/login'}
        replace
        state={makeFromState(location)}
      />
    )
  }
  return <Outlet />
}

/**
 * 관리자 화면 묶음. 역할(`role=ADMIN`)은 서버가 주는 내 정보로만 판단한다.
 * 정보를 받는 동안·실패했을 때는 권한이 없다고 단정하지 않고 상태 안내를 보여 준다.
 */
export function RequireAdmin() {
  const me = useMe()

  if (me.isPending) return <StateBox kind="loading" />
  if (me.isError) return <ErrorState error={me.error} onRetry={() => void me.refetch()} />
  if (me.data.role !== 'ADMIN') return <ForbiddenPage />
  return <Outlet />
}

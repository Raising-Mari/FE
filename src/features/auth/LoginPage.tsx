import { Navigate, useLocation } from 'react-router'
import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { env } from '@/lib/env'
import { readFromState } from '@/lib/redirectState'
import { useAuthStore } from '@/stores/authStore'
import { AuthFrame } from './components/AuthFrame'
import { GoogleSignIn } from './components/GoogleSignIn'
import { useLogin } from './hooks/useLogin'

export function LoginPage() {
  const token = useAuthStore((s) => s.accessToken)
  const location = useLocation()
  const login = useLogin()
  if (token) return <Navigate to={readFromState(location.state) ?? '/courses'} replace />
  return (
    <AuthFrame title="로그인" description="학교 Google 계정으로 마리와 함께하세요.">
      {env.isDev && env.useMock ? (
        <div className="flex flex-col gap-3">
          <Button loading={login.isPending} onClick={() => login.mutate('mock-registered')}>
            학교 Google 계정으로 로그인
          </Button>
          <Button
            variant="secondary"
            disabled={login.isPending}
            onClick={() => login.mutate('mock-new')}
          >
            처음 가입하기 (목업)
          </Button>
          <Button
            variant="link"
            disabled={login.isPending}
            onClick={() => login.mutate('mock-wrong-domain')}
          >
            학교 외 계정 오류 확인 (목업)
          </Button>
        </div>
      ) : (
        <GoogleSignIn
          onCredential={(credential) => {
            if (!login.isPending) login.mutate(credential)
          }}
          disabled={login.isPending}
        />
      )}
      {login.isPending && (
        <p role="status" className="mt-4 text-12 text-muted">
          로그인을 확인하고 있어요…
        </p>
      )}
      {login.isError && (
        <p role="alert" className="mt-4 rounded-lg bg-danger-soft p-4 text-12 text-danger">
          {getErrorMessage(login.error)}
        </p>
      )}
      <p className="mt-5 text-11 text-muted">학교 계정(mju.ac.kr)으로만 이용할 수 있어요.</p>
    </AuthFrame>
  )
}

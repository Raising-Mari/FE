import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { getErrorMessage, hasErrorCode } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Checkbox } from '@/components/ui/Checkbox'
import { ErrorState } from '@/components/ui/ErrorState'
import { Select } from '@/components/ui/Select'
import { StateBox } from '@/components/ui/StateBox'
import { TextInput } from '@/components/ui/TextInput'
import { readFromState } from '@/lib/redirectState'
import { useAuthStore } from '@/stores/authStore'
import { AuthFrame } from './components/AuthFrame'
import { useDepartments, useNicknameAvailability, useSignup } from './hooks/useSignup'
import { useSignupSession } from './useSignupSession'

export function SignupPage() {
  const { session } = useSignupSession()
  const token = useAuthStore((s) => s.accessToken)
  const location = useLocation()
  if (token) return <Navigate to={readFromState(location.state) ?? '/courses'} replace />
  if (!session) return <Navigate to="/login" replace state={location.state} />
  return <SignupForm signupToken={session.token} expiresAt={session.expiresAt} />
}

function SignupForm({ signupToken, expiresAt }: { signupToken: string; expiresAt: number }) {
  const [nickname, setNickname] = useState('')
  const [checkedName, setCheckedName] = useState('')
  const [department, setDepartment] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [expired, setExpired] = useState(() => Date.now() >= expiresAt)
  const departments = useDepartments()
  const availability = useNicknameAvailability(checkedName)
  const signup = useSignup()
  const location = useLocation()
  const validName = /^[가-힣a-zA-Z0-9_]{2,12}$/.test(nickname)
  useEffect(() => {
    const timer = window.setTimeout(() => setCheckedName(nickname), 350)
    return () => window.clearTimeout(timer)
  }, [nickname])
  useEffect(() => {
    const timer = window.setTimeout(() => setExpired(true), Math.max(0, expiresAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [expiresAt])
  const invalidToken = expired || hasErrorCode(signup.error, 'AUTH_SIGNUP_TOKEN_INVALID')
  const available =
    checkedName === nickname &&
    availability.data === true &&
    !availability.isFetching &&
    !availability.isError
  return (
    <AuthFrame title="처음 오셨네요!" description="마리가 불러줄 이름과 학과를 알려주세요.">
      {invalidToken ? (
        <div>
          <p role="alert" className="mb-4 text-12 text-danger">
            가입 시간이 지났어요. 처음부터 다시 로그인해주세요.
          </p>
          <ButtonLink to="/login" state={location.state}>
            다시 로그인
          </ButtonLink>
        </div>
      ) : departments.isPending ? (
        <StateBox kind="loading" />
      ) : departments.isError ? (
        <ErrorState error={departments.error} onRetry={() => void departments.refetch()} />
      ) : departments.data.length === 0 ? (
        <StateBox
          kind="empty"
          title="선택할 학과가 아직 없어요"
          message="잠시 뒤 다시 확인해주세요."
          action={<Button onClick={() => void departments.refetch()}>다시 확인</Button>}
        />
      ) : (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            if (available && agreed && department && !signup.isPending)
              signup.mutate({
                signupToken,
                nickname,
                departmentId: Number(department),
                agreedTerms: agreed,
              })
          }}
        >
          <TextInput
            label="닉네임"
            placeholder="마리가 불러줄 이름"
            value={nickname}
            maxLength={12}
            required
            disabled={signup.isPending}
            onChange={(e) => {
              setNickname(e.target.value)
              signup.reset()
            }}
            hint="2~12자의 한글·영문·숫자·_를 쓸 수 있어요."
            error={
              nickname && !validName
                ? '닉네임 형식을 확인해주세요.'
                : checkedName === nickname && availability.data === false
                  ? '이미 쓰고 있는 닉네임이에요.'
                  : undefined
            }
          />
          {validName && (
            <div aria-live="polite" className="text-11 text-primary">
              {checkedName !== nickname || availability.isFetching
                ? '닉네임을 확인하고 있어요…'
                : available
                  ? '사용 가능한 닉네임이에요.'
                  : ''}
            </div>
          )}
          {availability.isError && (
            <div>
              <p role="alert" className="text-11 text-danger">
                {getErrorMessage(availability.error)}
              </p>
              <Button variant="link" onClick={() => void availability.refetch()}>
                중복 확인 다시 시도
              </Button>
            </div>
          )}
          <Select
            label="학과"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
            disabled={signup.isPending}
          >
            <option value="">학과를 선택해주세요</option>
            {departments.data
              .filter((item) => item.id !== undefined)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.collegeName ? `${item.collegeName} · ` : ''}
                  {item.name}
                </option>
              ))}
          </Select>
          <details className="rounded-lg border border-line bg-canvas p-4 text-11 text-muted">
            <summary className="cursor-pointer text-12 text-ink">이용 안내</summary>
            <p className="mt-3">
              학교 계정으로 이용하며, 다른 사람의 개인정보나 사용 권한이 없는 자료를 올리지 않아요.
            </p>
            <p className="mt-2">AI의 답과 채점은 틀릴 수 있어요. 이상한 결과는 신고해주세요.</p>
            <p className="mt-2">
              대화와 노트는 학습 기능 제공에 사용돼요. 노트는 배틀에서 양쪽이 공개에 동의했을 때
              공유돼요.
            </p>
          </details>
          <Checkbox
            label="[필수] 이용 안내를 확인하고 동의해요."
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={signup.isPending}
          />
          {signup.isError && (
            <p role="alert" className="text-12 text-danger">
              {getErrorMessage(signup.error)}
            </p>
          )}
          <Button
            type="submit"
            fullWidth
            loading={signup.isPending}
            disabled={!available || !agreed || !department}
          >
            가입 완료
          </Button>
        </form>
      )}
    </AuthFrame>
  )
}

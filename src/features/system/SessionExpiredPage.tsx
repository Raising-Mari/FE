import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { readFromState } from '@/lib/redirectState'

/**
 * 로그인이 만료됐을 때(시안 28). 서버가 토큰을 거부하면(401) 가드가 이 화면으로 보낸다.
 * 누르면 로그인 화면으로 가고, 로그인에 성공하면 하던 화면으로 돌아간다(돌아갈 주소는 location.state 로 넘긴다).
 */
export function SessionExpiredPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const clearExpired = useAuthStore((s) => s.clearExpired)

  function goLogin() {
    clearExpired() // 안내를 한 번 보여 줬으니, 이후 로그인 가드는 일반 로그인 화면으로 보낸다.
    navigate('/login', { replace: true, state: { from: readFromState(location.state) } })
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-24 text-center">
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-full bg-primary-tint text-25 leading-none text-primary"
      >
        !
      </span>
      <h1 className="text-25 text-ink">로그인이 만료됐어요</h1>
      <p className="text-12 whitespace-pre-line text-subtle">
        {'보안을 위해 7일마다 다시 로그인해야 해요.\n로그인하면 하던 화면으로 돌아가요.'}
      </p>
      <div className="w-[280px] pt-3 pb-2">
        <Button variant="cta" fullWidth onClick={goLogin}>
          학교 Google 계정으로 로그인
        </Button>
      </div>
    </div>
  )
}

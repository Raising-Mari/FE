import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { useAuthStore } from '@/stores/authStore'
import { useScenario } from './scenario'

/** 목업 모드에서 "로그인한 것처럼" 만들 때 쓰는 가짜 토큰. 실제 서버에서는 의미가 없다. */
export const MOCK_ACCESS_TOKEN = 'mock-access-token'

/**
 * 시연 도구: 서버·로그인 상태를 흉내 내 화면의 오류·만료·권한 안내를 직접 확인하는 패널.
 * 목업 모드(`VITE_USE_MOCK=true`)에서만 `App`이 불러오며, 실제 서버로 동작할 때는 나타나지 않는다.
 */
export function DemoPanel() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const logout = useAuthStore((s) => s.logout)
  const { role, networkDown, set, reset } = useScenario()

  /** 상태를 바꾼 뒤 화면이 바로 반영되도록 보이는 데이터를 다시 받는다. */
  function apply(patch: Parameters<typeof set>[0]) {
    set(patch)
    void queryClient.invalidateQueries()
  }

  return (
    <section
      aria-label="시연 도구"
      className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2"
    >
      {open && (
        <div className="flex w-[240px] flex-col gap-3 rounded-lg border border-line-emphasis bg-surface p-4 shadow-dialog">
          <p className="text-11 text-subtle">목업 서버에서만 보이는 도구예요.</p>

          {accessToken ? (
            <Button variant="secondary" onClick={logout}>
              로그아웃
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setAccessToken(MOCK_ACCESS_TOKEN)}>
              로그인한 상태로 만들기
            </Button>
          )}

          <Checkbox
            label="관리자로 보기"
            checked={role === 'ADMIN'}
            onChange={(e) => apply({ role: e.target.checked ? 'ADMIN' : 'STUDENT' })}
          />
          <Checkbox
            label="서버 연결 끊기"
            checked={networkDown}
            onChange={(e) => apply({ networkDown: e.target.checked })}
          />
          <Button
            variant="secondary"
            disabled={!accessToken}
            onClick={() => apply({ tokenRejected: true })}
          >
            로그인 만료시키기
          </Button>

          <Button
            variant="link"
            onClick={() => {
              reset()
              void queryClient.invalidateQueries()
            }}
          >
            처음 상태로
          </Button>
        </div>
      )}
      <Button variant="secondary" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        시연 도구
      </Button>
    </section>
  )
}

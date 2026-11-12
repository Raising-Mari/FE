import { Outlet } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { Brand } from '@/components/layout/Brand'
import { NavItem } from '@/components/layout/NavItem'
import { PublicShell } from '@/components/layout/PublicShell'
import { Avatar } from '@/components/ui/Avatar'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pill } from '@/components/ui/Pill'
import { StateBox } from '@/components/ui/StateBox'
import { useMe } from '@/features/auth/hooks/useMe'
import { SignupSessionProvider } from '@/features/auth/SignupSession'
import { CourseNavigation } from '@/features/course/components/CourseNavigation'
import { useSelectedCourse } from '@/features/course/hooks/useSelectedCourse'

/** 로그인 전 화면(첫 화면·로그인·가입)과 404·만료 안내가 쓰는 틀. */
export function PublicLayout() {
  return (
    <PublicShell
      brand={<Brand />}
      headerRight={<span className="text-12 text-muted">한국어 · KR</span>}
    >
      <SignupSessionProvider>
        <Outlet />
      </SignupSessionProvider>
    </PublicShell>
  )
}

/**
 * 로그인 뒤 화면의 틀. 내 정보(`useMe`)를 헤더·메뉴에 쓰고, 정보를 받는 동안·실패했을 때는 본문 자리에 상태를 보여 준다.
 * 주소의 과목을 우선하고, 과목 주소가 아니면 내가 참여한 과목 중 마지막으로 선택한 과목을 보여 준다.
 */
export function ProtectedLayout() {
  const courseId = useSelectedCourse()
  const me = useMe()
  const isAdmin = me.data?.role === 'ADMIN'
  const course = courseId ? `/courses/${courseId}` : null

  return (
    <AppShell
      brand={<Brand />}
      headerRight={
        <div className="flex items-center gap-3">
          <Pill>✦ 나의 학습 공간</Pill>
          {me.data?.nickname && (
            <div className="flex items-center gap-2">
              <Avatar name={me.data.nickname} />
              <span className="text-12 text-ink">{me.data.nickname} 님</span>
            </div>
          )}
        </div>
      }
      sidebarTop={<CourseNavigation courseId={courseId} />}
      nav={
        <>
          <NavItem to="/courses" end icon="⌂">
            내 과목
          </NavItem>
          {course && (
            <>
              <NavItem to={course} end icon="◉">
                과목 홈
              </NavItem>
              <NavItem to={`${course}/teach`} icon="✎">
                가르치기
              </NavItem>
              <NavItem to={`${course}/materials`} icon="▤">
                학습 자료
              </NavItem>
              <NavItem to={`${course}/battle`} icon="⚑">
                제자 배틀
              </NavItem>
              <NavItem to={`${course}/records`} icon="◷">
                배틀 기록
              </NavItem>
              <NavItem to={`${course}/ranking`} icon="♧">
                과목 랭킹
              </NavItem>
            </>
          )}
          <NavItem to="/me" icon="○">
            내 정보
          </NavItem>
          {isAdmin && (
            <NavItem to="/admin" icon="⚙">
              운영·문제 점검
            </NavItem>
          )}
        </>
      }
      sidebarBottom={
        <>
          <p className="text-14 text-navy">설명 · 확인 · 개선</p>
          <p className="pt-1 text-11 whitespace-pre-line text-subtle">
            {'가르친 내용을 확인하고\n배틀에서 이해도를 점검하세요.'}
          </p>
        </>
      }
    >
      {me.isPending ? (
        <StateBox kind="loading" />
      ) : me.isError ? (
        <ErrorState error={me.error} onRetry={() => void me.refetch()} />
      ) : (
        <Outlet />
      )}
    </AppShell>
  )
}

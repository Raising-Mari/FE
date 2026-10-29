import { Outlet } from 'react-router'

/** 모바일 우선 레이아웃. 좁은 화면은 꽉 채우고, 넓은 화면은 가운데 정렬한다. */
export function AppLayout() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">
      <main>
        <Outlet />
      </main>
    </div>
  )
}

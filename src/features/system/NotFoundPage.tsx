import { ButtonLink } from '@/components/ui/ButtonLink'

/** 없는 주소로 들어왔을 때(시안 27). 로그인 전·후 모두 같은 화면이고, 어느 쪽으로든 돌아갈 길을 준다. */
export function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-24 text-center">
      <p className="text-43 text-navy">404</p>
      <h1 className="text-25 text-ink">페이지를 찾을 수 없어요</h1>
      <p className="text-12 text-subtle">주소가 바뀌었거나 없는 페이지예요.</p>
      <div className="flex gap-2.5 pt-3">
        <ButtonLink to="/courses">내 과목으로 가기</ButtonLink>
        <ButtonLink to="/" variant="secondary">
          첫 화면으로
        </ButtonLink>
      </div>
    </div>
  )
}

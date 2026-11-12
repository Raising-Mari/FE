import { Navigate } from 'react-router'
import mariWelcome from '@/assets/mari/mari-welcome-jump.webp'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { useAuthStore } from '@/stores/authStore'

export function LandingPage() {
  const token = useAuthStore((s) => s.accessToken)
  if (token) return <Navigate to="/courses" replace />
  return (
    <>
      <section className="grid flex-1 grid-cols-2 items-center gap-8 px-10 py-10">
        <div className="relative text-center">
          <p className="text-12 tracking-label text-primary-soft">너의 설명으로 자라는</p>
          <img
            src={mariWelcome}
            alt="책과 소품 사이에서 반기는 마리"
            width="460"
            height="460"
            className="mx-auto w-[460px]"
          />
          <p className="text-12 text-muted">나의 작은 AI 제자, 마리</p>
        </div>
        <div>
          <p className="text-11 tracking-eyebrow-wide text-primary-soft">TEACH. LEARN. GROW.</p>
          <h1 className="mt-5 text-38 tracking-hero text-navy-deep">
            내가 가르칠수록,
            <br />
            함께 자라는 마리.
          </h1>
          <p className="mt-6 text-14 leading-[2] text-muted">
            배운 내용을 내 말로 설명하고,
            <br />
            마리의 도전으로 나의 이해를 확인하세요.
          </p>
          <ButtonLink to="/login" variant="cta" className="mt-9">
            시작하기
          </ButtonLink>
          <p className="mt-5 text-11 text-subtle">학교 Google 계정으로 함께해요.</p>
        </div>
      </section>
      <footer className="mx-10 flex justify-between border-t border-line py-8 text-11 text-muted">
        <span>설명으로 완성하는 학습</span>
        <span>01 내 말로 가르치고　→　02 마리가 도전하고　→　03 함께 돌아보기</span>
      </footer>
    </>
  )
}

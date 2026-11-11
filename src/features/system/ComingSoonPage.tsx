import { StateBox } from '@/components/ui/StateBox'

interface ComingSoonPageProps {
  /** 화면 이름(시안 번호가 아니라 사용자가 보는 이름). */
  title: string
}

/**
 * 아직 만들지 않은 화면의 자리표시. 단계별로 화면을 채우는 동안만 쓰고, 마지막 단계에서 라우트마다 실제 화면으로 바꿔 없앤다.
 * 사용자에게 보여 줄 완성 화면이 아니다.
 */
export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <StateBox
      kind="empty"
      title={`${title} 화면을 준비하고 있어요`}
      message="곧 만나볼 수 있어요."
    />
  )
}

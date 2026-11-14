import { useEffect, useRef } from 'react'
import { Navigate, useParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StateBox } from '@/components/ui/StateBox'
import { normalizeRoomCode } from './api'
import { BattleErrorNotice } from './components/BattleErrorNotice'
import { useJoinBattle } from './hooks/useBattle'

/**
 * 링크 입장(`/join/<코드>`). 열자마자 방에 들어가고 대기실로 옮긴다.
 * 노트 공개 동의는 링크에 담지 않으므로 대기실에서 준비 완료 전에 고른다.
 */
export function JoinPage() {
  const code = normalizeRoomCode(useParams().code ?? '')
  const join = useJoinBattle()
  const { mutate } = join
  const started = useRef(false)

  useEffect(() => {
    // 개발 모드의 이중 실행에서도 한 번만 입장을 시도한다(서버는 다시 불러도 같은 응답을 주지만 불필요하다).
    if (started.current || !code) return
    started.current = true
    mutate(code)
  }, [code, mutate])

  if (join.data?.id) return <Navigate to={`/battles/${join.data.id}`} replace />

  return (
    <>
      <PageHeader
        banner={false}
        crumbs={['제자 배틀', '방 코드 입장']}
        title="배틀 방에 들어가요."
      />
      {!code ? (
        <StateBox
          kind="error"
          title="방 코드가 없는 링크예요"
          message="링크를 다시 확인해 주세요."
        />
      ) : join.isError ? (
        <Card className="flex flex-col items-start gap-4">
          <p className="text-14 text-ink">방 코드 {code}</p>
          <BattleErrorNotice error={join.error} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => mutate(code)}>
              다시 시도
            </Button>
            <ButtonLink variant="secondary" to="/courses">
              내 과목으로
            </ButtonLink>
          </div>
        </Card>
      ) : (
        <StateBox kind="loading" message={`방 코드 ${code}로 입장하고 있어요…`} />
      )}
    </>
  )
}

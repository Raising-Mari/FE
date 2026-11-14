import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Select } from '@/components/ui/Select'
import { StateBox } from '@/components/ui/StateBox'
import { TextInput } from '@/components/ui/TextInput'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import { fetchDepartments, updateMe, type Me } from './api'
import { ME_QUERY_KEY, useMe } from './hooks/useMe'

const NICKNAME_RULE = /^[가-힣a-zA-Z0-9_]{2,12}$/

/** 내 정보 수정(시안 24): 닉네임·학과를 바꾸고 로그아웃한다. */
export function MePage() {
  const me = useMe()
  if (me.isPending) return <StateBox kind="loading" />
  if (me.isError) return <ErrorState error={me.error} onRetry={() => void me.refetch()} />
  // 불러온 값으로 입력칸을 한 번만 채우도록, 정보가 온 뒤에 폼을 만든다.
  return <MeForm me={me.data} />
}

function MeForm({ me }: { me: Me }) {
  const client = useQueryClient()
  const logout = useAuthStore((s) => s.logout)
  const departments = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments })
  const [nickname, setNickname] = useState(me.nickname ?? '')
  const [departmentId, setDepartmentId] = useState(String(me.department?.id ?? ''))
  const [failure, setFailure] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => client.setQueryData(ME_QUERY_KEY, updated),
  })

  const trimmed = nickname.trim()
  const nicknameError =
    trimmed && !NICKNAME_RULE.test(trimmed)
      ? '닉네임은 2~12자의 한글·영문·숫자·_만 쓸 수 있어요.'
      : undefined
  const changed = trimmed !== me.nickname || departmentId !== String(me.department?.id ?? '')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!trimmed || nicknameError || !changed || save.isPending) return
    setFailure(null)
    save.mutate(
      { nickname: trimmed, departmentId: departmentId ? Number(departmentId) : undefined },
      {
        onSuccess: () => toast.info('정보를 저장했어요.'),
        onError: (error) => setFailure(getErrorMessage(error)),
      },
    )
  }

  function signOut() {
    // 토큰이 없어지면 로그인 가드가 로그인 화면으로 보낸다.
    logout()
    // 다음 사람이 같은 브라우저를 써도 앞 사람의 데이터가 남지 않게 받아 둔 것을 모두 지운다.
    client.clear()
  }

  return (
    <>
      <PageHeader
        crumbs={['내 과목', '내 정보']}
        title="나의 학습 정보"
        sub="닉네임과 학과를 관리하세요."
      />
      <Card as="section" aria-label="내 정보" className="max-w-[560px]">
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <TextInput
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={12}
            required
            error={nicknameError}
            hint="2~12자의 한글·영문·숫자·_"
            disabled={save.isPending}
          />
          <Select
            label="학과"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            disabled={save.isPending || departments.isPending}
            hint={departments.isError ? '학과 목록을 불러오지 못했어요.' : undefined}
          >
            {!departments.data && me.department?.id && (
              <option value={me.department.id}>{me.department.name}</option>
            )}
            {departments.data?.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
          <dl className="grid grid-cols-[80px_1fr] gap-y-1 text-11 text-muted">
            <dt>학교</dt>
            <dd className="text-ink">{me.school?.name ?? '—'}</dd>
            <dt>계정</dt>
            <dd className="text-ink">{me.emailMasked ?? '—'}</dd>
          </dl>
          {failure && (
            <p role="alert" className="text-12 text-danger">
              {failure}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Button
              type="submit"
              loading={save.isPending}
              disabled={!trimmed || !!nicknameError || !changed}
            >
              정보 저장
            </Button>
            <Button variant="secondary" onClick={signOut}>
              로그아웃
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}

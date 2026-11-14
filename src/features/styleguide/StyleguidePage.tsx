import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError, NETWORK_ERROR_CODE } from '@/api/errors'
import { AppShell } from '@/components/layout/AppShell'
import { Brand } from '@/components/layout/Brand'
import { NavItem } from '@/components/layout/NavItem'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Dialog } from '@/components/ui/Dialog'
import { Disclosure } from '@/components/ui/Disclosure'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pill } from '@/components/ui/Pill'
import { Select } from '@/components/ui/Select'
import { StateBox } from '@/components/ui/StateBox'
import { TextInput } from '@/components/ui/TextInput'
import { Textarea } from '@/components/ui/Textarea'
import { Toast } from '@/components/ui/Toast'

/** 개발 서버에서만 열리는 화면(`/styleguide`). 토큰·부품을 한눈에 보고, 시안과 나란히 비교할 때 쓴다. */

const COLOR_GROUPS: Array<{
  title: string
  items: Array<{ token: string; className: string; usage: string }>
}> = [
  {
    title: '브랜드',
    items: [
      { token: 'primary', className: 'bg-primary', usage: '주 버튼, 활성 메뉴 글자' },
      {
        token: 'primary-deep',
        className: 'bg-primary-deep',
        usage: '주 버튼 눌림, 큰 버튼 아랫면',
      },
      { token: 'primary-soft', className: 'bg-primary-soft', usage: '글자 링크, 작은 강조' },
      { token: 'primary-tint', className: 'bg-primary-tint', usage: '활성 메뉴 바탕, 아바타' },
    ],
  },
  {
    title: '글자',
    items: [
      { token: 'ink', className: 'bg-ink', usage: '본문·제목 기본' },
      { token: 'navy-deep', className: 'bg-navy-deep', usage: '첫 화면 큰 제목' },
      { token: 'navy', className: 'bg-navy', usage: '알약, 점수 숫자' },
      { token: 'ink-soft', className: 'bg-ink-soft', usage: '작은 라벨' },
      { token: 'muted', className: 'bg-muted', usage: '메뉴·입력 라벨' },
      { token: 'subtle', className: 'bg-subtle', usage: '경로, 보조 설명' },
      { token: 'faint', className: 'bg-faint', usage: '하단 문구' },
      { token: 'placeholder', className: 'bg-placeholder', usage: '입력 안내 글' },
    ],
  },
  {
    title: '바탕',
    items: [
      { token: 'canvas', className: 'bg-canvas', usage: '앱 바탕, 안내 상자' },
      { token: 'surface', className: 'bg-surface', usage: '카드, 헤더, 사이드바' },
      { token: 'surface-soft', className: 'bg-surface-soft', usage: '입력창, 선택 상자' },
      { token: 'surface-muted', className: 'bg-surface-muted', usage: '알약, 대결 패널' },
      { token: 'surface-tint', className: 'bg-surface-tint', usage: '마리 배너' },
    ],
  },
  {
    title: '선',
    items: [
      { token: 'line', className: 'bg-line', usage: '카드·헤더·입력창 테두리' },
      { token: 'line-soft', className: 'bg-line-soft', usage: '목록 구분선' },
      { token: 'line-strong', className: 'bg-line-strong', usage: '보조 버튼·알약·모달 테두리' },
      { token: 'line-emphasis', className: 'bg-line-emphasis', usage: '시연 도구 상자' },
    ],
  },
  {
    title: '기타',
    items: [
      { token: 'overlay', className: 'bg-overlay', usage: '모달 뒤 막' },
      { token: 'danger', className: 'bg-danger', usage: '오류 (시안에 없음, 임시)' },
      { token: 'danger-soft', className: 'bg-danger-soft', usage: '오류 바탕 (시안에 없음, 임시)' },
    ],
  },
]

const TYPE_SCALE: Array<{ token: string; className: string; usage: string }> = [
  { token: 'text-9', className: 'text-9', usage: '노트 번호' },
  { token: 'text-10', className: 'text-10', usage: '알약, 영문 소제목, 하단 문구' },
  { token: 'text-11', className: 'text-11', usage: '경로, 입력 라벨, 작은 본문' },
  { token: 'text-12', className: 'text-12', usage: '기본 본문, 버튼, 입력' },
  { token: 'text-13', className: 'text-13', usage: '사이드바 하단 문구' },
  { token: 'text-14', className: 'text-14', usage: '카드 제목, 문제 번호' },
  { token: 'text-18', className: 'text-18', usage: '섹션 제목, 모달 제목' },
  { token: 'text-21', className: 'text-21 tracking-title', usage: '첫 화면 보조 제목' },
  { token: 'text-25', className: 'text-25 tracking-title', usage: '화면 제목' },
  { token: 'text-27', className: 'text-27 tracking-logo', usage: '로고 글자' },
  { token: 'text-38', className: 'text-38 tracking-hero', usage: '첫 화면 큰 제목' },
  { token: 'text-43', className: 'text-43', usage: '점수·레이팅 숫자' },
]

/** 화면에 그려진 실제 색을 읽어 보여 줘서, 이 목록과 CSS 값이 어긋나도 바로 드러난다. */
function toHex(computed: string): string {
  const parts = computed.match(/[\d.]+/g)?.map(Number)
  if (!parts || parts.length < 3) return computed
  const [r = 0, g = 0, b = 0, a = 1] = parts
  const hex = [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
  return a < 1 ? `#${hex} · ${Math.round(a * 100)}%` : `#${hex}`
}

function Swatch({ token, className, usage }: { token: string; className: string; usage: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (ref.current) setValue(toHex(getComputedStyle(ref.current).backgroundColor))
  }, [])

  return (
    <li className="flex items-center gap-3">
      <span ref={ref} className={`size-9 shrink-0 rounded-md border border-line ${className}`} />
      <span className="min-w-0">
        <span className="block text-12 leading-tight text-ink">{token}</span>
        <span className="block text-10 leading-tight text-subtle">
          {value} · {usage}
        </span>
      </span>
    </li>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-18 text-ink">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function StyleguidePage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <AppShell
      brand={<Brand />}
      headerRight={
        <div className="flex items-center gap-3">
          <Avatar name="서연" />
          <span className="text-10 text-navy">서연 님</span>
        </div>
      }
      nav={
        <>
          <NavItem to="/courses" end icon="○">
            내 과목
          </NavItem>
          <NavItem to="/styleguide" icon="▤">
            스타일 가이드
          </NavItem>
        </>
      }
      sidebarTop={<p className="text-10 tracking-eyebrow text-subtle">MY CLASSROOM</p>}
      sidebarBottom={<p className="text-13 text-navy">설명 · 확인 · 개선</p>}
    >
      <div className="mx-auto flex max-w-[1154px] flex-col gap-10">
        <header className="flex flex-col gap-1">
          <p className="text-10 tracking-eyebrow text-subtle">DESIGN SYSTEM</p>
          <h1 className="text-25 tracking-title text-ink">스타일 가이드</h1>
          <p className="text-12 text-subtle">
            Figma 시안에서 뽑아 합친 색·글자·부품. 개발 서버에서만 열린다.
          </p>
        </header>

        <Section id="sg-colors" title="색">
          <div className="grid gap-6 grid-cols-2">
            {COLOR_GROUPS.map((group) => (
              <Card key={group.title} className="flex flex-col gap-3">
                <h3 className="text-11 text-muted">{group.title}</h3>
                <ul className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <Swatch key={item.token} {...item} />
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="sg-type" title="글자 (세방고딕 2.0)">
          <Card className="flex flex-col gap-4">
            {TYPE_SCALE.map((row) => (
              <div
                key={row.token}
                className="flex items-baseline gap-6 border-b border-line-soft pb-4 last:border-b-0 last:pb-0"
              >
                <p className="w-44 shrink-0 text-10 text-subtle">
                  {row.token} · {row.usage}
                </p>
                <p className={`${row.className} text-ink`}>
                  내가 가르칠수록, 함께 자라는 마리 0123
                </p>
              </div>
            ))}
          </Card>
        </Section>

        <Section id="sg-shape" title="모서리 · 그림자">
          <div className="flex flex-wrap gap-4">
            {[
              ['rounded-xs', '2.5px 체크박스'],
              ['rounded-md', '9px 버튼·입력'],
              ['rounded-lg', '12px 카드'],
              ['rounded-xl', '16px 모달'],
              ['rounded-2xl', '24px 대기 패널'],
            ].map(([cls, label]) => (
              <div key={cls} className="flex flex-col items-center gap-2">
                <div className={`size-20 border border-line-strong bg-surface-muted ${cls}`} />
                <p className="text-10 text-subtle">{label}</p>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <div className="size-20 rounded-lg bg-primary shadow-cta" />
              <p className="text-10 text-subtle">shadow-cta</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="size-20 rounded-xl border border-line-strong bg-surface shadow-dialog" />
              <p className="text-10 text-subtle">shadow-dialog</p>
            </div>
          </div>
        </Section>

        <Section id="sg-buttons" title="버튼 · 알약 · 아바타">
          <Card className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button>＋ 새 과목 만들기</Button>
              <Button variant="secondary">＋ 주차 만들기</Button>
              <Button variant="link">전체 이력</Button>
              <Button disabled>비활성</Button>
              <Button loading>저장 중</Button>
              <Button variant="secondary" disabled>
                비활성
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink to="/styleguide">이동하는 버튼 (링크)</ButtonLink>
              <ButtonLink to="/styleguide" variant="secondary">
                이동하는 보조 버튼
              </ButtonLink>
            </div>
            <div className="max-w-[360px]">
              <Button variant="cta" fullWidth>
                시작하기
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Pill>✦ 나의 학습 공간</Pill>
              <Pill>무승부</Pill>
              <Avatar name="서연" />
            </div>
          </Card>
        </Section>

        <Section id="sg-states" title="상태 표시 · 알림">
          <div className="grid grid-cols-3 gap-5">
            <StateBox kind="loading" />
            <StateBox
              kind="error"
              message="서버에서 답을 받지 못했어요. 잠시 뒤에 다시 시도해 주세요."
              action={<Button variant="secondary">다시 시도</Button>}
            />
            <StateBox
              kind="empty"
              title="아직 노트가 없어요"
              message="마리에게 가르치면 여기에 노트가 쌓여요."
              action={<Button>가르치러 가기</Button>}
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <ErrorState
              error={new ApiError(0, { code: NETWORK_ERROR_CODE })}
              onRetry={() => undefined}
            />
            <ErrorState error={new ApiError(409, { code: 'BATTLE_NOTES_REQUIRED' })} />
          </div>
          <div className="flex flex-col items-start gap-3">
            <Toast kind="info" message="자료를 저장했어요." onClose={() => undefined} />
            <Toast
              kind="error"
              message="저장하지 못했어요. 다시 시도해 주세요."
              onClose={() => undefined}
            />
          </div>
        </Section>

        <Section id="sg-fields" title="입력">
          <Card className="grid gap-6 grid-cols-2">
            <TextInput label="닉네임" placeholder="마리가 불러줄 이름" hint="2~10자" />
            <TextInput label="닉네임 (오류)" defaultValue="서" error="2자 이상 입력해 주세요." />
            <Select label="캐릭터" defaultValue="flower">
              <option value="flower">꽃을 든 마리</option>
              <option value="book">책을 든 마리</option>
            </Select>
            <TextInput label="비활성" defaultValue="수정할 수 없어요" disabled />
            <Textarea
              className="col-span-2"
              label="복기 메모"
              placeholder="다음에는 어떻게 설명할까요?"
            />
            <div className="col-span-2 flex flex-col gap-1">
              <Checkbox label="상대에게 내 배틀 노트 공개에 동의합니다." defaultChecked />
              <Checkbox label="자료를 사용할 권한이 있습니다." />
              <Checkbox label="비활성" disabled />
            </div>
          </Card>
        </Section>

        <Section id="sg-cards" title="카드 · 안내 상자 · 접는 상자">
          <div className="grid gap-4 grid-cols-3">
            <Card>
              <p className="text-14 text-ink">기본 카드</p>
              <p className="text-11 text-subtle">흰 바탕, 테두리 한 줄</p>
            </Card>
            <Card tone="soft" padding="sm">
              <p className="text-11 text-ink-soft">안내 상자</p>
              <p className="text-11 text-muted">한 번의 노트는 5~300자까지 쓸 수 있어요.</p>
            </Card>
            <Card tone="tint">
              <p className="text-18 tracking-title text-ink">마리와 함께, 한 걸음씩.</p>
              <p className="text-11 text-subtle">강조 배너</p>
            </Card>
          </div>
          <Disclosure summary="시연 도구 · 상대와 오류 상태 확인">
            접는 상자의 안쪽 내용이에요.
          </Disclosure>
        </Section>

        <Section id="sg-dialog" title="다이얼로그">
          <div>
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              새 과목 만들기 창 열기
            </Button>
          </div>
          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title="새 과목 만들기"
            footer={
              <>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={() => setDialogOpen(false)}>확인</Button>
              </>
            }
          >
            <TextInput label="과목 이름" placeholder="예: 자료구조" />
          </Dialog>
        </Section>
      </div>
    </AppShell>
  )
}

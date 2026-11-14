import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pager } from '@/components/ui/Pager'
import { StateBox } from '@/components/ui/StateBox'
import { parseId, useCourse } from '@/hooks/useCourseQueries'
import { cx } from '@/lib/cx'
import { formatDelta, formatKst, formatScore } from '@/lib/datetime'
import { RESULT_SHORT } from '@/lib/verdict'
import { GROWTH_DAYS, type OpponentRecord, type RankingEntry } from './api'
import {
  useEloHistory,
  useGrowth,
  useOpponentBattles,
  useOpponentRecords,
  useRanking,
} from './hooks/useRanking'

interface QueryLike {
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => unknown
}

/** 구역 하나의 로딩·오류·빈 상태를 같은 모양으로 처리한다. */
function Section({
  title,
  query,
  empty,
  emptyMessage,
  children,
}: {
  title: string
  query: QueryLike
  empty: boolean
  emptyMessage: string
  children: ReactNode
}) {
  const id = `ranking-${title}`
  return (
    <Card as="section" aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-18 text-ink">
        {title}
      </h2>
      {query.isPending ? (
        <StateBox kind="loading" className="border-0 py-6" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} className="border-0" />
      ) : empty ? (
        <p className="py-3 text-12 text-muted">{emptyMessage}</p>
      ) : (
        children
      )}
    </Card>
  )
}

function Row({ entry, value, mine }: { entry: RankingEntry; value: ReactNode; mine: boolean }) {
  return (
    <li
      className={cx(
        'flex items-center gap-3 rounded-md px-3 py-2 text-12',
        mine ? 'bg-primary-tint text-primary' : 'text-ink',
      )}
    >
      <span className="w-6 text-navy">{entry.rank}</span>
      <span className="flex-1 truncate">
        {entry.nickname}
        {mine && <span className="sr-only"> (나)</span>}
      </span>
      <span className="text-10 text-subtle">
        {entry.wins ?? 0}승 {entry.draws ?? 0}무 {entry.losses ?? 0}패
      </span>
      <span className="w-14 text-right text-navy">{value}</span>
    </li>
  )
}

function OpponentRow({ record, courseId }: { record: OpponentRecord; courseId: number }) {
  const [open, setOpen] = useState(false)
  const opponentId = record.opponent?.id ?? 0
  const battles = useOpponentBattles(opponentId, courseId, open)
  const name = record.opponent?.nickname ?? '상대'
  return (
    <li className="border-b border-line-soft py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-12 text-ink">{name}와의 전적</p>
          <p className="text-11 text-muted">
            {record.wins ?? 0}승 · {record.draws ?? 0}무 · {record.losses ?? 0}패
            {record.lastBattleAt && ` · 마지막 ${formatKst(record.lastBattleAt)}`}
          </p>
        </div>
        <Button variant="link" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? '배틀 목록 접기' : '배틀 목록 보기'}
        </Button>
      </div>
      {open &&
        (battles.isPending ? (
          <StateBox kind="loading" className="border-0 py-4" />
        ) : battles.isError ? (
          <ErrorState
            error={battles.error}
            onRetry={() => void battles.refetch()}
            className="border-0"
          />
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5" aria-label={`${name}와의 배틀`}>
            {(battles.data.items ?? []).map((battle) => (
              <li
                key={battle.battleId}
                className="flex items-center justify-between rounded-md bg-surface-soft px-3 py-2 text-11 text-ink"
              >
                <span>
                  {formatKst(battle.finishedAt)} ·{' '}
                  {battle.result ? RESULT_SHORT[battle.result] : '—'} ·{' '}
                  {formatScore(battle.myScore)} : {formatScore(battle.opponentScore)}
                </span>
                <ButtonLink variant="link" to={`/battles/${battle.battleId}/review`}>
                  복기 열기
                </ButtonLink>
              </li>
            ))}
          </ul>
        ))}
    </li>
  )
}

/** 과목 Elo·성장폭·상대별 전적·Elo 변동(시안 23). 순위만이 아니라 성장과 재도전을 함께 보여 준다. */
export function RankingPage() {
  const courseId = parseId(useParams().courseId)
  const course = useCourse(courseId)
  const [page, setPage] = useState(0)
  const ranking = useRanking(courseId, page)
  const growth = useGrowth(courseId)
  const opponents = useOpponentRecords(courseId)
  const history = useEloHistory(courseId)

  if (!courseId) return <StateBox kind="error" title="과목 주소를 확인해주세요" />

  const myId = ranking.data?.me?.userId
  const myRank = ranking.data?.me

  return (
    <>
      <PageHeader
        crumbs={['내 과목', course.data?.name, '과목 랭킹']}
        title="각자의 속도로, 함께 성장해요."
        sub="과목별 Elo · 성장폭 · 상대별 전적"
      />
      <div className="grid grid-cols-2 items-start gap-6">
        <Section
          title="Elo 순위"
          query={ranking}
          empty={(ranking.data?.items ?? []).length === 0}
          emptyMessage="아직 순위가 없어요. 첫 배틀을 마치면 순위에 올라가요."
        >
          <ol className="flex flex-col gap-1">
            {(ranking.data?.items ?? []).map((entry) => (
              <Row
                key={entry.userId}
                entry={entry}
                value={entry.rating}
                mine={entry.userId === myId}
              />
            ))}
          </ol>
          <p className="text-11 text-muted">
            {myRank
              ? `내 순위 ${myRank.rank}위 · Elo ${myRank.rating} · ${myRank.gamesPlayed ?? 0}전`
              : '아직 내 순위가 없어요. 랭킹 배틀을 한 번 마치면 생겨요.'}
          </p>
          <Pager
            page={page}
            hasNext={ranking.data?.hasNext ?? false}
            onChange={setPage}
            disabled={ranking.isFetching}
          />
        </Section>

        <Section
          title={`성장폭 · 최근 ${GROWTH_DAYS}일`}
          query={growth}
          empty={(growth.data?.items ?? []).length === 0}
          emptyMessage={`최근 ${GROWTH_DAYS}일 동안 끝난 배틀이 없어요.`}
        >
          <ol className="flex flex-col gap-1">
            {(growth.data?.items ?? []).map((entry) => (
              <Row
                key={entry.userId}
                entry={entry}
                value={formatDelta(entry.delta)}
                mine={entry.userId === myId}
              />
            ))}
          </ol>
        </Section>

        <Section
          title="상대별 전적"
          query={opponents}
          empty={(opponents.data ?? []).length === 0}
          emptyMessage="아직 맞붙은 상대가 없어요."
        >
          <ul>
            {(opponents.data ?? []).map((record) => (
              <OpponentRow key={record.opponent?.id} record={record} courseId={courseId} />
            ))}
          </ul>
        </Section>

        <Section
          title="내 Elo 변동"
          query={history}
          empty={(history.data?.items ?? []).length === 0}
          emptyMessage="아직 Elo 변동이 없어요."
        >
          <ul className="flex flex-col gap-1.5">
            {(history.data?.items ?? []).map((item) => (
              <li
                key={item.battleId}
                className="flex items-center justify-between rounded-md bg-surface-soft px-3 py-2 text-11 text-ink"
              >
                <span>
                  {formatKst(item.createdAt)} · 상대 {item.opponent?.nickname ?? '—'}
                </span>
                <span>
                  {item.ratingBefore} → {item.ratingAfter}{' '}
                  <span className="text-navy">{formatDelta(item.delta)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  )
}

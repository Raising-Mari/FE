import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getErrorMessage } from '@/api/errorMessages'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { StateBox } from '@/components/ui/StateBox'
import { TextInput } from '@/components/ui/TextInput'
import { academicTerm } from '@/lib/academicTerm'
import type { Course } from '../api'
import { useCourseSearch, useCreateCourse } from '../hooks/useCourses'

export function CreateCourseDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Course | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const search = useCourseSearch(keyword, page)
  const create = useCreateCourse()
  const navigate = useNavigate()
  const term = academicTerm()
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(name.trim())
      setPage(0)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [name])
  function openCourse(id: number) {
    navigate(`/courses/${id}`)
    onClose()
  }
  function submit() {
    if (!name.trim() || create.isPending) return
    setFailure(null)
    create.mutate(
      { name: name.trim(), term },
      {
        onSuccess: (course) => {
          if (course.id) openCourse(course.id)
          else setFailure('과목 정보를 확인하지 못했어요. 다시 시도해주세요.')
        },
        onError: (error) => {
          const existingId =
            error instanceof ApiError && error.code === 'COURSE_DUPLICATE'
              ? error.details.existingCourseId
              : null
          if (typeof existingId === 'number' && existingId > 0) openCourse(existingId)
          else setFailure(getErrorMessage(error))
        },
      },
    )
  }
  return (
    <Dialog
      open
      title={selected ? '과목 참여' : '새 과목 만들기'}
      onClose={onClose}
      dismissible={!create.isPending}
    >
      {selected ? (
        <div className="space-y-5">
          <p className="text-18">
            {selected.name} · {selected.term}
          </p>
          <p className="text-12 text-muted">
            이 과목에 참여할까요?
            <br />
            제자를 만들면 내 과목에 추가돼요.
            <br />
            과목의 주차와 자료는 같은 학교 학생들과 함께 사용해요.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSelected(null)}>
              검색으로 돌아가기
            </Button>
            <Button
              onClick={() => {
                if (selected.id) openCourse(selected.id)
              }}
            >
              제자 만들기로
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (search.isSuccess && keyword === name.trim() && !search.isFetching) submit()
          }}
          className="space-y-5"
        >
          <TextInput
            label="과목 이름"
            value={name}
            maxLength={80}
            required
            disabled={create.isPending}
            onChange={(e) => {
              setName(e.target.value)
              setFailure(null)
            }}
          />
          <p className="text-11 text-muted">현재 학기 {term}로 자동 설정돼요.</p>
          {keyword &&
            (keyword !== name.trim() || search.isPending ? (
              <StateBox kind="loading" />
            ) : search.isError ? (
              <ErrorState error={search.error} onRetry={() => void search.refetch()} />
            ) : (
              <section className="rounded-lg border border-line p-4">
                <h3 className="mb-3 text-12">같은 학교의 기존 과목</h3>
                {search.data.items?.length ? (
                  <ul className="space-y-2">
                    {search.data.items.map((course) => (
                      <li key={course.id}>
                        <Button
                          variant="secondary"
                          fullWidth
                          disabled={!course.id || create.isPending}
                          onClick={() => setSelected(course)}
                        >
                          {course.name} · {course.term} → 선택
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-12 text-muted">
                    검색 결과가 없어요. 새 과목을 만들 수 있어요.
                  </p>
                )}
                <div className="mt-3 flex justify-between">
                  <Button
                    variant="link"
                    disabled={page === 0}
                    onClick={() => setPage((n) => n - 1)}
                  >
                    이전
                  </Button>
                  <Button
                    variant="link"
                    disabled={!search.data.hasNext}
                    onClick={() => setPage((n) => n + 1)}
                  >
                    다음
                  </Button>
                </div>
              </section>
            ))}
          {failure && (
            <p role="alert" className="text-12 text-danger">
              {failure}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" disabled={create.isPending} onClick={onClose}>
              취소
            </Button>
            <Button
              type="submit"
              loading={create.isPending}
              disabled={
                !name.trim() || keyword !== name.trim() || !search.isSuccess || search.isFetching
              }
            >
              새 과목 만들기
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  )
}

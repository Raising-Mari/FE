import { useState } from 'react'
import { useNavigate } from 'react-router'
import { getErrorMessage } from '@/api/errorMessages'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextInput } from '@/components/ui/TextInput'
import { useCreateUnit, useUnits } from '../hooks/useCourses'

export function CreateUnitDialog({ courseId, onClose }: { courseId: number; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const create = useCreateUnit(courseId)
  const units = useUnits(courseId)
  const navigate = useNavigate()
  const [failure, setFailure] = useState<string | null>(null)
  function openUnit(id: number) {
    navigate(`/courses/${courseId}/teach?unitId=${id}`)
    onClose()
  }
  return (
    <Dialog open title="주차 만들기" onClose={onClose} dismissible={!create.isPending}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim() || create.isPending) return
          const existing = units.data?.find((unit) => unit.title === title.trim())
          if (existing?.id) {
            openUnit(existing.id)
            return
          }
          setFailure(null)
          create.mutate(title.trim(), {
            onSuccess: (unit) => {
              if (unit.id) openUnit(unit.id)
              else setFailure('주차 정보를 확인하지 못했어요. 다시 시도해주세요.')
            },
            onError: (error) => {
              const id =
                error instanceof ApiError && error.code === 'UNIT_DUPLICATE'
                  ? error.details.existingUnitId
                  : null
              if (typeof id === 'number' && id > 0) openUnit(id)
              else setFailure(getErrorMessage(error))
            },
          })
        }}
      >
        <TextInput
          label="주차 이름"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 3주차 스택과 큐"
          maxLength={80}
          required
          disabled={create.isPending}
        />
        <p className="text-11 text-muted">
          같은 과목 학생들과 함께 쓰는 주차예요. 같은 이름이 있으면 기존 주차로 이동해요.
        </p>
        {failure && (
          <p role="alert" className="text-12 text-danger">
            {failure}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            취소
          </Button>
          <Button type="submit" loading={create.isPending} disabled={!title.trim()}>
            주차 만들기
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

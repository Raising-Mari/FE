import { useState } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Dialog } from '@/components/ui/Dialog'
import type { Unit } from '@/hooks/useCourseQueries'
import { toast } from '@/stores/toastStore'
import type { MaterialSummary } from '../api'
import { useUpdateMaterialUnits } from '../hooks/useMaterials'

interface UnitLinkDialogProps {
  courseId: number
  material: MaterialSummary
  units: Unit[]
  onClose: () => void
}

/** 자료와 주차 연결(시안 11). 확인을 누르면 고른 주차로 통째로 바꾼다. */
export function UnitLinkDialog({ courseId, material, units, onClose }: UnitLinkDialogProps) {
  const [selected, setSelected] = useState<number[]>(material.unitIds ?? [])
  const [failure, setFailure] = useState<string | null>(null)
  const update = useUpdateMaterialUnits(courseId)

  function toggle(unitId: number, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, unitId] : prev.filter((id) => id !== unitId)))
  }

  function save() {
    if (!material.id) return
    setFailure(null)
    update.mutate(
      { materialId: material.id, unitIds: selected },
      {
        onSuccess: () => {
          toast.info('주차 연결을 저장했어요.')
          onClose()
        },
        onError: (error) => setFailure(getErrorMessage(error)),
      },
    )
  }

  return (
    <Dialog
      open
      title="자료와 주차 연결"
      onClose={onClose}
      dismissible={!update.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            취소
          </Button>
          <Button onClick={save} loading={update.isPending}>
            확인
          </Button>
        </>
      }
    >
      <p className="mb-4 text-14 text-ink">{material.title}</p>
      {units.length === 0 ? (
        <p className="text-12 text-subtle">
          아직 주차가 없어요. 과목 홈에서 주차를 먼저 만들어 주세요.
        </p>
      ) : (
        <fieldset className="flex flex-col gap-2" disabled={update.isPending}>
          <legend className="sr-only">연결할 주차</legend>
          {units.map((unit) =>
            unit.id ? (
              <Checkbox
                key={unit.id}
                label={unit.title}
                checked={selected.includes(unit.id)}
                onChange={(e) => toggle(unit.id!, e.target.checked)}
              />
            ) : null,
          )}
        </fieldset>
      )}
      <p className="mt-4 text-10 text-subtle">연결 해제 시 해당 출처 문제는 배틀에서 제외돼요.</p>
      {failure && (
        <p role="alert" className="mt-3 text-12 text-danger">
          {failure}
        </p>
      )}
    </Dialog>
  )
}

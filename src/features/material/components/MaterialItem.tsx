import { useState } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { isNotSupported, NOT_SUPPORTED_MESSAGE } from '@/api/pending'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Pill } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import type { Unit } from '@/hooks/useCourseQueries'
import { formatKst } from '@/lib/datetime'
import { toast } from '@/stores/toastStore'
import type { MaterialFailReason, MaterialStatus, MaterialSummary } from '../api'
import { useDeleteMaterial, useMaterialDetail } from '../hooks/useMaterials'
import { UnitLinkDialog } from './UnitLinkDialog'

const STATUS_LABEL: Record<MaterialStatus, string> = {
  PENDING: '처리 대기',
  PROCESSING: '처리 중',
  DONE: '처리 완료',
  FAILED: '처리 실패',
  DELETED: '삭제됨',
}

const FAIL_REASON: Record<MaterialFailReason, string> = {
  NO_TEXT: '글자를 찾지 못했어요. 스캔한 PDF라면 원문을 붙여넣어 주세요.',
  TOO_LARGE: '자료가 너무 길어요. 500쪽 이하로 나눠서 올려 주세요.',
  PARSE_ERROR: '파일을 읽지 못했어요. 암호가 걸렸거나 손상된 파일인지 확인해 주세요.',
  SERVER_RESTART: '처리하던 중에 서버가 다시 시작됐어요. 한 번 더 올려 주세요.',
}

interface MaterialItemProps {
  courseId: number
  material: MaterialSummary
  units: Unit[]
}

/** 자료 한 건(시안 10 오른쪽): 상태, 연결된 주차, 주차 연결 관리·삭제. */
export function MaterialItem({ courseId, material, units }: MaterialItemProps) {
  const [dialog, setDialog] = useState<'units' | 'delete' | null>(null)
  const status = material.status ?? 'PENDING'
  const failed = status === 'FAILED'
  const detail = useMaterialDetail(material.id ?? 0, failed && !!material.id)
  const remove = useDeleteMaterial(courseId)
  const linked = units.filter((unit) => unit.id && material.unitIds?.includes(unit.id))
  const working = status === 'PENDING' || status === 'PROCESSING'

  function confirmDelete() {
    if (!material.id) return
    remove.mutate(material.id, {
      onSuccess: () => {
        toast.info('자료를 삭제했어요.')
        setDialog(null)
      },
      onError: (error) => {
        toast.error(isNotSupported(error) ? NOT_SUPPORTED_MESSAGE : getErrorMessage(error))
        setDialog(null)
      },
    })
  }

  return (
    <Card as="article" padding="sm" className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-14 text-ink">{material.title}</h3>
        <Pill className={failed ? 'border-danger bg-danger-soft text-danger' : undefined}>
          {working && <Spinner />}
          {STATUS_LABEL[status]}
        </Pill>
      </div>
      <p className="text-11 text-muted">
        {linked.length > 0
          ? linked.map((unit) => unit.title).join(', ')
          : '아직 연결된 주차가 없어요. 주차에 연결해야 문제가 만들어져요.'}
      </p>
      <p className="text-10 text-subtle">내 자료 · {formatKst(material.createdAt)}</p>
      {failed && (
        <p role="alert" className="text-11 text-danger">
          {detail.data?.failReason
            ? FAIL_REASON[detail.data.failReason]
            : '자료를 처리하지 못했어요. 다시 올려 주세요.'}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <Button variant="secondary" disabled={failed} onClick={() => setDialog('units')}>
          주차 연결 관리
        </Button>
        <Button variant="link" onClick={() => setDialog('delete')}>
          삭제
        </Button>
      </div>

      {dialog === 'units' && (
        <UnitLinkDialog
          courseId={courseId}
          material={material}
          units={units}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'delete' && (
        <Dialog
          open
          title="자료 삭제"
          onClose={() => setDialog(null)}
          dismissible={!remove.isPending}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDialog(null)}
                disabled={remove.isPending}
              >
                취소
              </Button>
              <Button onClick={confirmDelete} loading={remove.isPending}>
                삭제
              </Button>
            </>
          }
        >
          <p className="text-12 text-ink">‘{material.title}’ 자료를 삭제할까요?</p>
          <p className="mt-2 text-11 text-subtle">
            이 자료를 근거로 만든 문제는 배틀에서 제외되고, 되돌릴 수 없어요.
          </p>
        </Dialog>
      )}
    </Card>
  )
}

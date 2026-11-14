import { useParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/ui/ErrorState'
import { StateBox } from '@/components/ui/StateBox'
import { parseId, useCourse, useUnits } from '@/hooks/useCourseQueries'
import { MaterialForm } from './components/MaterialForm'
import { MaterialItem } from './components/MaterialItem'
import { useMaterials } from './hooks/useMaterials'

/** 학습 자료(시안 10·11): 왼쪽에서 자료를 올리고, 오른쪽 목록에서 주차에 연결한다. */
export function MaterialsPage() {
  const courseId = parseId(useParams().courseId)
  const course = useCourse(courseId)
  const units = useUnits(courseId)
  const materials = useMaterials(courseId)

  if (!courseId) return <StateBox kind="error" title="과목 주소를 확인해주세요" />

  return (
    <>
      <PageHeader
        crumbs={['내 과목', course.data?.name, '학습 자료']}
        title="배움의 재료를 모아두세요."
        sub="과목에 올린 자료를 여러 주차에 연결할 수 있어요."
      />
      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-start gap-6">
        <MaterialForm courseId={courseId} />
        <section aria-labelledby="material-list-title" className="flex flex-col gap-3">
          <h2 id="material-list-title" className="text-18 text-ink">
            내가 올린 자료
          </h2>
          {materials.isPending ? (
            <StateBox kind="loading" />
          ) : materials.isError ? (
            <ErrorState error={materials.error} onRetry={() => void materials.refetch()} />
          ) : materials.data.length === 0 ? (
            <StateBox
              kind="empty"
              title="아직 올린 자료가 없어요"
              message="강의 자료를 올리고 주차에 연결하면 배틀 문제가 만들어져요."
            />
          ) : (
            materials.data.map((material) => (
              <MaterialItem
                key={material.id}
                courseId={courseId}
                material={material}
                units={units.data ?? []}
              />
            ))
          )}
        </section>
      </div>
    </>
  )
}

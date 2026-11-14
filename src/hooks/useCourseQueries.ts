import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { hasErrorCode } from '@/api/errorMessages'
import type { components } from '@/api/generated/schema'

/**
 * 과목·주차·제자 조회. 자료·가르치기·배틀·기록 등 거의 모든 기능이 같이 쓰기 때문에
 * `features/course` 가 아니라 여기(공용 훅)에 둔다(기능끼리 서로 import 하지 않는 규칙).
 * 같은 queryKey 를 쓰므로 어느 화면에서 불러도 한 번만 요청한다.
 */
export type Course = components['schemas']['CourseResponse']
export type Unit = components['schemas']['UnitResponse']
export type Disciple = components['schemas']['DiscipleResponse']

export const courseKeys = {
  all: ['courses'] as const,
  mine: ['courses', 'mine'] as const,
  detail: (id: number) => ['courses', id] as const,
  units: (id: number) => ['courses', id, 'units'] as const,
  disciple: (id: number) => ['courses', id, 'disciple'] as const,
}

const valid = (id: number) => Number.isSafeInteger(id) && id > 0

export async function fetchCourse(courseId: number): Promise<Course> {
  const { data } = await apiClient.get<Course>(`/api/courses/${courseId}`)
  return data
}

export async function fetchUnits(courseId: number): Promise<Unit[]> {
  const { data } = await apiClient.get<Unit[]>(`/api/courses/${courseId}/units`)
  return data
}

export async function fetchDisciple(courseId: number): Promise<Disciple> {
  const { data } = await apiClient.get<Disciple>(`/api/courses/${courseId}/disciple`)
  return data
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => fetchCourse(id),
    enabled: valid(id),
  })
}

export function useUnits(id: number) {
  return useQuery({
    queryKey: courseKeys.units(id),
    queryFn: () => fetchUnits(id),
    enabled: valid(id),
  })
}

/** 제자가 아직 없으면(`DISCIPLE_NOT_FOUND`) 오류가 아니라 `null` 로 돌려준다. */
export function useDisciple(id: number) {
  return useQuery({
    queryKey: courseKeys.disciple(id),
    queryFn: async () => {
      try {
        return await fetchDisciple(id)
      } catch (error) {
        if (hasErrorCode(error, 'DISCIPLE_NOT_FOUND')) return null
        throw error
      }
    },
    enabled: valid(id),
  })
}

/** 주소의 `:courseId` 를 숫자로 읽는다. 잘못된 값이면 0(조회하지 않음). */
export function parseId(value: string | undefined): number {
  const id = Number(value)
  return valid(id) ? id : 0
}

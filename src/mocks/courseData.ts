import type { components } from '@/api/generated/schema'

type Schemas = components['schemas']
export const mockCourses: Schemas['CourseResponse'][] = []
export const mockDisciples = new Map<number, Schemas['DiscipleResponse']>()
export const mockUnits = new Map<number, Schemas['UnitResponse'][]>()
export let mockNickname = '서연'
export function setMockNickname(name: string) {
  mockNickname = name
}
export function resetCourseData() {
  mockNickname = '서연'
  mockCourses.splice(
    0,
    mockCourses.length,
    { id: 1, name: '자료구조', term: '2026-2', hasMyDisciple: true },
    { id: 2, name: '운영체제', term: '2026-2', hasMyDisciple: false },
  )
  mockDisciples.clear()
  mockDisciples.set(1, { id: 1, courseId: 1, name: '마리', characterKey: 'mari' })
  mockUnits.clear()
  mockUnits.set(1, [
    { id: 1, title: '1주차 기초', myNoteCount: 0, materialCount: 0, battleReady: false },
  ])
}
resetCourseData()

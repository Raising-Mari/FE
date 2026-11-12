import { apiClient } from '@/api/client'
import type { components, operations } from '@/api/generated/schema'

export type Course = components['schemas']['CourseResponse']
export type MyCourse = components['schemas']['MyCourseResponse']
export type Unit = components['schemas']['UnitResponse']
export type Disciple = components['schemas']['DiscipleResponse']
export type CourseSearch = components['schemas']['PageResponseCourseResponse']
export type SearchCoursesParams = operations['searchCourses']['parameters']['query']
export type CreateCourseRequest = components['schemas']['CreateCourseRequest']
export type CreateDiscipleRequest = components['schemas']['CreateDiscipleRequest']

export async function fetchMyCourses(): Promise<MyCourse[]> {
  const { data } = await apiClient.get<MyCourse[]>('/api/me/courses')
  return data
}

export async function searchCourses(params: SearchCoursesParams): Promise<CourseSearch> {
  const { data } = await apiClient.get<CourseSearch>('/api/courses', { params })
  return data
}

export async function createCourse(input: CreateCourseRequest): Promise<Course> {
  const { data } = await apiClient.post<Course>('/api/courses', input)
  return data
}

export async function fetchCourse(courseId: number): Promise<Course> {
  const { data } = await apiClient.get<Course>(`/api/courses/${courseId}`)
  return data
}

export async function fetchDisciple(courseId: number): Promise<Disciple> {
  const { data } = await apiClient.get<Disciple>(`/api/courses/${courseId}/disciple`)
  return data
}

export async function createDisciple(
  courseId: number,
  input: CreateDiscipleRequest,
): Promise<Disciple> {
  const { data } = await apiClient.post<Disciple>(`/api/courses/${courseId}/disciple`, input)
  return data
}

export async function fetchUnits(courseId: number): Promise<Unit[]> {
  const { data } = await apiClient.get<Unit[]>(`/api/courses/${courseId}/units`)
  return data
}

export async function createUnit(courseId: number, title: string): Promise<Unit> {
  const { data } = await apiClient.post<Unit>(`/api/courses/${courseId}/units`, { title })
  return data
}

export async function fetchMyRatings(): Promise<components['schemas']['MyRatingResponse'][]> {
  const { data } =
    await apiClient.get<components['schemas']['MyRatingResponse'][]>('/api/me/ratings')
  return data
}

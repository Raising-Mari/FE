import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/api/errorMessages'
import {
  createCourse,
  createDisciple,
  createUnit,
  fetchCourse,
  fetchDisciple,
  fetchMyCourses,
  fetchMyRatings,
  fetchUnits,
  searchCourses,
  type CreateCourseRequest,
  type CreateDiscipleRequest,
} from '../api'

export const courseKeys = {
  all: ['courses'] as const,
  mine: ['courses', 'mine'] as const,
  detail: (id: number) => ['courses', id] as const,
  units: (id: number) => ['courses', id, 'units'] as const,
  disciple: (id: number) => ['courses', id, 'disciple'] as const,
}

export function useMyCourses() {
  return useQuery({ queryKey: courseKeys.mine, queryFn: fetchMyCourses })
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => fetchCourse(id),
    enabled: Number.isSafeInteger(id) && id > 0,
  })
}

export function useUnits(id: number) {
  return useQuery({
    queryKey: courseKeys.units(id),
    queryFn: () => fetchUnits(id),
    enabled: Number.isSafeInteger(id) && id > 0,
  })
}

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
    enabled: Number.isSafeInteger(id) && id > 0,
  })
}

export function useCourseSearch(keyword: string, page: number) {
  return useQuery({
    queryKey: ['course-search', keyword, page],
    queryFn: () => searchCourses({ keyword, page, size: 10 }),
    enabled: keyword.trim().length > 0,
  })
}

export function useMyRatings() {
  return useQuery({ queryKey: ['my-ratings'], queryFn: fetchMyRatings })
}

export function useCreateCourse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCourseRequest) => createCourse(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courseKeys.all })
      void client.invalidateQueries({ queryKey: ['course-search'] })
    },
  })
}

export function useCreateDisciple(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDiscipleRequest) => createDisciple(id, input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courseKeys.all })
      void client.invalidateQueries({ queryKey: ['my-ratings'] })
    },
    onError: (error) => {
      if (hasErrorCode(error, 'DISCIPLE_ALREADY_EXISTS')) {
        void client.invalidateQueries({ queryKey: courseKeys.all })
        void client.invalidateQueries({ queryKey: ['my-ratings'] })
      }
    },
  })
}

export function useCreateUnit(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => createUnit(id, title),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courseKeys.units(id) })
    },
  })
}

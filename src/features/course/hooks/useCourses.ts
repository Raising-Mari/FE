import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/api/errorMessages'
import { courseKeys } from '@/hooks/useCourseQueries'
import {
  createCourse,
  createDisciple,
  createUnit,
  fetchMyCourses,
  fetchMyRatings,
  searchCourses,
  type CreateCourseRequest,
  type CreateDiscipleRequest,
} from '../api'

export { courseKeys, useCourse, useDisciple, useUnits } from '@/hooks/useCourseQueries'

export function useMyCourses() {
  return useQuery({ queryKey: courseKeys.mine, queryFn: fetchMyCourses })
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

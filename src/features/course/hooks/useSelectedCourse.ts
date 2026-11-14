import { useEffect } from 'react'
import { useParams } from 'react-router'
import { useMyCourses } from './useCourses'

const STORAGE_KEY = 'mari.lastCourseId'
function readLast() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function useSelectedCourse() {
  const { courseId } = useParams()
  const courses = useMyCourses()
  const previous = readLast()
  const remembered = courses.data?.find((course) => String(course.id) === previous)?.id
  useEffect(() => {
    if (courseId && /^\d+$/.test(courseId)) {
      try {
        localStorage.setItem(STORAGE_KEY, courseId)
      } catch {
        /* 저장이 안 돼도 현재 주소로 계속 이용한다. */
      }
    }
  }, [courseId])
  return courseId ?? (remembered ? String(remembered) : undefined)
}

import { useNavigate } from 'react-router'
import { Select } from '@/components/ui/Select'
import { useMyCourses } from '../hooks/useCourses'

export function CourseNavigation({ courseId }: { courseId: string | undefined }) {
  const courses = useMyCourses()
  const navigate = useNavigate()
  return (
    <Select
      label="MY CLASSROOM"
      value={courseId ?? ''}
      disabled={courses.isPending || courses.isError}
      onChange={(event) => {
        if (event.target.value) navigate(`/courses/${event.target.value}`)
      }}
    >
      <option value="">
        {courses.isPending
          ? '과목 확인 중…'
          : courses.isError
            ? '과목 목록을 불러오지 못했어요'
            : '과목 선택'}
      </option>
      {courseId && !courses.data?.some((course) => String(course.id) === courseId) && (
        <option value={courseId}>선택한 과목</option>
      )}
      {courses.data?.map((course) => (
        <option key={course.id} value={course.id}>
          {course.name}
        </option>
      ))}
    </Select>
  )
}

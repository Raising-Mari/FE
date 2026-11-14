import { resetCourseData } from './courseData'
import { resetMaterialData } from './materialHandlers'

/** 목업 데이터를 처음 상태로 되돌린다. 테스트의 `beforeEach` 와 시연 도구의 "처음 상태로"가 쓴다. */
export function resetMockData() {
  resetCourseData()
  resetMaterialData()
}

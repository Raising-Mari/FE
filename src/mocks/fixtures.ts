import type { components } from '@/api/generated/schema'

type Me = components['schemas']['MeResponse']

/** 목업이 돌려주는 가짜 사용자. 실제 학생 정보를 쓰지 않는다. */
export const MOCK_ME: Me = {
  id: 1,
  nickname: '서연',
  emailMasked: 's***@mju.ac.kr',
  school: { id: 1, name: '명지대학교' },
  department: { id: 1, name: '컴퓨터공학과' },
  role: 'STUDENT',
}

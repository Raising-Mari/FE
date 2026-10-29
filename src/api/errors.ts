/** BE 의 ErrorResponse(global/error/ErrorResponse.java)와 같은 모양. */
export interface ErrorResponse {
  code: string
  message: string
  violations: { field: string; reason: string }[]
}

/** 화면에서는 AxiosError 가 아니라 항상 ApiError 만 다룬다. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly violations: ErrorResponse['violations']

  constructor(status: number, body: Partial<ErrorResponse>) {
    super(body.message ?? '요청을 처리하지 못했습니다.')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code ?? 'UNKNOWN'
    this.violations = body.violations ?? []
  }
}

/** 서버에 닿지 못한 경우(서버 꺼짐, 네트워크 끊김). */
export const NETWORK_ERROR_CODE = 'NETWORK_ERROR'

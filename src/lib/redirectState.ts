/**
 * 로그인이 필요해 로그인 화면으로 보낼 때, 로그인 뒤 돌아올 주소를 router 의 `location.state` 에 담아 넘긴다.
 * 주소창에 싣지 않으므로 공유되는 링크에 남지 않는다.
 */
export interface RedirectState {
  from: string
}

/** 앱 안의 주소(`/…`)만 받는다. `//evil.com` 이나 `https://…` 로 밖으로 보내는 일을 막는다. */
function isInternalPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
}

export function makeFromState(location: {
  pathname: string
  search: string
  hash: string
}): RedirectState {
  return { from: `${location.pathname}${location.search}${location.hash}` }
}

/** `location.state` 에서 돌아갈 주소를 꺼낸다. 없거나 앱 밖 주소면 `null`. */
export function readFromState(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null
  const from = (state as Partial<RedirectState>).from
  return isInternalPath(from) ? from : null
}

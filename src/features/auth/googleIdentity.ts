interface CredentialResponse {
  credential: string
}
export interface GoogleIdentity {
  initialize: (options: {
    client_id: string
    callback: (response: CredentialResponse) => void
    hd: string
    auto_select: boolean
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type: string
      theme: string
      size: string
      width: number
      locale: string
      text: string
    },
  ) => void
}

function identity(): GoogleIdentity | undefined {
  return (window as Window & { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts
    ?.id
}

let loading: Promise<GoogleIdentity> | undefined

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  const existing = identity()
  if (existing) return Promise.resolve(existing)
  if (loading) return loading
  loading = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client?hl=ko'
    script.async = true
    const timer = window.setTimeout(fail, 15_000)
    function fail() {
      window.clearTimeout(timer)
      script.remove()
      reject(new Error('Google 로그인 불러오기 실패'))
    }
    script.onload = () => {
      window.clearTimeout(timer)
      const client = identity()
      if (client) resolve(client)
      else fail()
    }
    script.onerror = fail
    document.head.append(script)
  }).catch((error: unknown) => {
    loading = undefined
    throw error
  })
  return loading
}

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { env } from '@/lib/env'
import { loadGoogleIdentity } from '../googleIdentity'

export function GoogleSignIn({
  onCredential,
  disabled,
}: {
  onCredential: (token: string) => void
  disabled: boolean
}) {
  const container = useRef<HTMLDivElement>(null)
  const callback = useRef(onCredential)
  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])
  const [error, setError] = useState(false)
  const [ready, setReady] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!env.googleClientId) return
    let active = true
    void loadGoogleIdentity()
      .then((client) => {
        if (!active || !container.current) return
        client.initialize({
          client_id: env.googleClientId,
          hd: 'mju.ac.kr',
          auto_select: false,
          callback: ({ credential }) => {
            if (active) callback.current(credential)
          },
        })
        container.current.replaceChildren()
        client.renderButton(container.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 400,
          locale: 'ko',
          text: 'signin_with',
        })
        setReady(true)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [attempt])
  if (!env.googleClientId)
    return (
      <p role="status" className="rounded-lg bg-canvas p-4 text-12 text-muted">
        학교 Google 로그인을 준비하고 있어요.
      </p>
    )
  return (
    <>
      {!ready && !error && (
        <p role="status" className="mb-3 text-12 text-muted">
          Google 로그인을 불러오고 있어요…
        </p>
      )}
      <div
        ref={container}
        aria-label="Google 로그인"
        inert={disabled}
        className={disabled ? 'pointer-events-none opacity-45' : ''}
      />
      {error && (
        <div role="alert" className="mt-3 text-12 text-danger">
          Google 로그인을 불러오지 못했어요.
          <Button
            variant="link"
            onClick={() => {
              setError(false)
              setAttempt((n) => n + 1)
            }}
          >
            다시 시도
          </Button>
        </div>
      )}
    </>
  )
}

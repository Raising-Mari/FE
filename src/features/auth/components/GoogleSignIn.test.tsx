import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { loadGoogleIdentity, type GoogleIdentity } from '../googleIdentity'
import { GoogleSignIn } from './GoogleSignIn'

vi.mock('@/lib/env', () => ({ env: { googleClientId: 'test-client-id' } }))
vi.mock('../googleIdentity', () => ({ loadGoogleIdentity: vi.fn() }))

it('Google ID 토큰을 전달하고 화면을 떠난 뒤에는 전달하지 않는다', async () => {
  let callback: ((response: { credential: string }) => void) | undefined
  const initialize = vi.fn<GoogleIdentity['initialize']>((options) => {
    callback = options.callback
  })
  const renderButton = vi.fn<GoogleIdentity['renderButton']>()
  vi.mocked(loadGoogleIdentity).mockResolvedValue({ initialize, renderButton })
  const receive = vi.fn()
  const view = render(<GoogleSignIn onCredential={receive} disabled={false} />)
  await waitFor(() => expect(renderButton).toHaveBeenCalled())
  expect(initialize).toHaveBeenCalledWith(
    expect.objectContaining({ client_id: 'test-client-id', hd: 'mju.ac.kr', auto_select: false }),
  )
  callback?.({ credential: 'google-id-token' })
  expect(receive).toHaveBeenCalledWith('google-id-token')
  view.unmount()
  callback?.({ credential: 'late-token' })
  expect(receive).toHaveBeenCalledTimes(1)
})

it('Google 스크립트 로딩 실패 후 다시 시도할 수 있다', async () => {
  const renderButton = vi.fn<GoogleIdentity['renderButton']>()
  vi.mocked(loadGoogleIdentity)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ initialize: vi.fn(), renderButton })
  render(<GoogleSignIn onCredential={vi.fn()} disabled={false} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Google 로그인을 불러오지 못했어요.')
  await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))
  await waitFor(() => expect(renderButton).toHaveBeenCalled())
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

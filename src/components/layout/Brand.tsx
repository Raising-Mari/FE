import { Link } from 'react-router'
import mariLogo from '@/assets/mari/mari-logo.png'
import { SERVICE_NAME, SERVICE_TAGLINE } from '@/lib/brand'

/** 헤더 왼쪽의 마리 그림 + 서비스 이름. 누르면 첫 화면으로 간다. 그림은 이름 옆 장식이라 대체 글은 비워 둔다. */
export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-[11px] px-1.5 py-px">
      <img src={mariLogo} alt="" width={42} height={51} className="h-[51px] w-[42px] shrink-0" />
      <span className="text-27 tracking-logo text-ink">{SERVICE_NAME}</span>
      <span aria-hidden="true" className="pl-[18px] text-11 text-faint">
        {SERVICE_TAGLINE}
      </span>
    </Link>
  )
}

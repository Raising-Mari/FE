# features/auth — Google 로그인·가입

## 화면 흐름
학교 Google 로그인 → (처음이면) 닉네임 → 학과 선택·약관 동의 → 내 과목. **메일 인증 코드는 없다.**

## 규칙
- 로그인은 **학교 Google 계정만**이다. Google 로그인 창에서 받은 ID 토큰을 `POST /api/auth/google`(A-01)로 보내고, 서버가 학교 도메인(`hd` = `mju.ac.kr`)을 검사한다. 로그인 창에 `hd`를 힌트로 넘기는 것은 편의일 뿐이고 보안은 서버 검사가 맡는다.
- Google 클라이언트 ID는 `env.googleClientId`(`VITE_GOOGLE_CLIENT_ID`)로만 읽는다.
- 응답이 `registered=false`면 가입 토큰(10분짜리)으로 닉네임(A-04로 중복 확인) → 학과(A-05 목록에서 선택)·약관 동의(필수) → 가입(A-03) 순으로 진행한다. 가입 토큰은 가입 화면이 열려 있는 동안만 메모리에 둔다.
- 서버가 주는 7일짜리 액세스 토큰은 `stores/authStore`에 두고 **`localStorage`에 한 키로 저장**해 새로고침 뒤에도 로그인을 유지한다(2026-11-11 팀 결정). 401이 오면 토큰을 지우고 로그인 화면으로 보낸다(처리는 `api/client.ts` interceptor 한 곳). 리프레시는 없고, 만료되면 Google 로그인을 다시 한다.
- Google 토큰·액세스 토큰·가입 토큰·이메일을 콘솔에 출력하지 않는다. Google 토큰은 로그인 호출에만 쓰고 저장하지 않는다.
- 로그인 전 사용자는 로그인 영역(과목·가르치기·배틀·랭킹 등)에 들어올 수 없게 라우트 가드를 둔다. 서버도 막지만 화면에서도 안내한다. 관리자 화면은 `role=ADMIN`(A-06)일 때만 열린다.
- 실패 이유는 `ApiError.code`로 나눠 안내한다: `AUTH_EMAIL_DOMAIN_NOT_ALLOWED`(학교 계정으로만 가능), `AUTH_GOOGLE_TOKEN_INVALID`, `AUTH_NICKNAME_TAKEN`·`AUTH_NICKNAME_INVALID`, `AUTH_TERMS_REQUIRED`, `AUTH_SIGNUP_TOKEN_INVALID`(가입 토큰 만료 → 다시 로그인), `RATE_LIMITED`.
- 서버가 `local` 프로필이면 `POST /api/auth/dev-login`(A-09)으로 Google 없이 로그인할 수 있다. 운영 서버에는 이 경로가 없다. 개발용 로그인 코드는 배포 번들에 들어가지 않게 `env.isDev`로 막는다.

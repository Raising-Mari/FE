# src/components/ui/ — 작은 UI 부품

버튼, 입력창, 카드, 모달, 채팅 말풍선처럼 **업무 지식이 없는** 부품.

## 규칙
- 색·간격은 Tailwind 클래스로 통일한다. 같은 모양의 버튼을 화면마다 새로 만들지 않고 여기 부품을 쓴다.
- 키보드로 조작할 수 있어야 하고(`button`·`label` 같은 올바른 태그), 크기는 시안을 따른다(버튼 40px, 입력 44px). 데스크톱 전용이라 터치 기준(44px)과 좁은 화면용 분기는 두지 않는다.
- props는 필요한 것만 받는다. 부품 하나가 학습·배틀 같은 도메인 용어를 알면 안 된다.
- 새 부품은 로딩·비활성·에러 상태까지 같이 만든다.
- 부품을 추가하면 `features/styleguide/StyleguidePage.tsx`에도 한 줄 넣고, 동작이 있는 부품은 옆에 `이름.test.tsx`를 둔다.

## 지금 있는 부품 (Figma 시안에서 뽑은 것)
| 부품 | 용도 |
|---|---|
| `Button` | `primary` · `secondary` · `cta`(첫 화면 큰 버튼) · `link`. `loading` · `fullWidth` |
| `Pill` · `Avatar` · `Spinner` | 작은 표시 |
| `TextInput` · `Select` · `Textarea` | 라벨·도움말·오류까지 포함. 라벨은 항상 보이고 `aria`로 이어진다 |
| `Checkbox` | 라벨 전체가 눌린다 |
| `Card` | `tone`: `default` · `soft`(안내 상자) · `tint`(배너) |
| `Disclosure` | 눌러서 펼치는 상자(`details`) |
| `Dialog` | 포커스 이동·Tab 가두기·Esc·바깥 클릭·포커스 복귀 |
| `Field` | 새 입력 부품을 만들 때 쓰는 라벨·도움말·오류 틀 (`controlClass`로 모양을 맞춘다) |

시안에 있지만 아직 만들지 않은 요소는 `docs/디자인 시스템 정리.md` 5번 항목에 있다.

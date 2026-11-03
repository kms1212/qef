# 웹 프론트엔드 기준

브라우저에서 도는 웹 앱에서 무엇을 어디에 두고, 데이터를 어떻게 다룰지 판단하는 기준이다. 어떤 라이브러리와 프레임워크를 쓸지는 정하지 않는다. 그것은 프로젝트의 스택 관례와 설계가 정하고, 같은 문제를 푸는 표준 라이브러리가 있으면 직접 짜지 않는다(`qef:dev`의 `criteria/reuse.md`). 파일 배치와 이름은 프레임워크 관례가 먼저다.

## 어디에 두나

- 쓰는 곳이 하나면 그곳에 둔다(colocation). 한 화면에서만 쓰는 컴포넌트와 로직은 그 화면과 같은 자리에 두고, 다른 화면이 쓰게 되는 순간 둘이 함께 보는 자리로 옮긴다. 미리 공통 자리에 두지 않는다.
- 화면은 기능 단위로 묶고, 기능 단위는 백엔드 도메인과 같게 잡는다. 한 도메인의 화면, 그 도메인을 부르는 코드, 그 도메인 전용 컴포넌트는 한 자리에 모인다. "이 도메인 화면을 고치려면 어디를 여나"가 도메인 이름만으로 정해져야 한다.
- 여러 도메인이 함께 쓰는 것과 어느 도메인의 것도 아닌 것(넓게 퍼진 공통 코드, 전역 설정)은 공통 자리에 둔다. 공통 자리 안에서도 그것이 다루는 개념 이름으로 나눈다(예: `lib/date/`, `config/`). `helpers`, `utils`, `common`, `shared`처럼 무엇이든 넣을 수 있는 이름은 쓰지 않는다(`qef:dev`의 `criteria/structure.md`).
- 여러 화면이 함께 쓰는 껍데기(탭 바, 메뉴)는 상위 레이아웃이 갖고, 각 탭은 그 아래 형제 화면으로 둔다.

근거: Kent C. Dodds, "Colocation" (https://kentcdodds.com/blog/colocation); Next.js, "Project structure" (https://nextjs.org/docs/app/getting-started/project-structure); Next.js, "Layouts and Pages" (https://nextjs.org/docs/app/getting-started/layouts-and-pages); React Router, "Routing" (https://reactrouter.com/start/framework/routing).

## 서버와 주고받는 것

- 요청과 응답의 모양은 백엔드 API 한 곳에서 만들어 받는다. 화면에서 타입을 다시 적지 않는다.
- server state와 client state를 가른다. server state는 가져오기·캐시를 맡은 한 곳이 들고 있고, 화면은 그것을 읽기만 한다. server state를 client state로 복사해 따로 들고 있지 않는다. 같은 데이터가 두 벌이 되면 어긋나기 때문이다. 예외: 폼의 초기값처럼 서버 값에서 시작해 사용자가 고치는 값은 복사해서 쓴다.
- 화면에 맞는 모양이 필요하면 서버가 내는 모양(`fields`, view)이나 데이터를 받는 한 곳에서 바꾼다. 화면마다 따로 바꾸지 않는다. 표시용 계산(남은 날짜, 가격 표시)은 그것을 보여 주는 자리에서 한다.
- 같은 대상을 보여 주는 컴포넌트는 보여 주는 정보의 양으로 나누고, 그 양을 이름에 붙인다. 서버에 응답 모양 단계(view)가 있으면 그 이름에 맞춘다.
- 도메인 대상을 보여 주는 컴포넌트는 서버 API의 그 객체를 받는다. 리렌더링을 줄이려고 메모이제이션하는 컴포넌트는 필요한 값만 받는다. 원시값만 받는 것은 기본 컴포넌트(버튼, 태그)이다.
- 서버의 enum은 그대로 화면에 내지 않고 표시 문자열로 바꾼다. 바꾸는 표는 한 곳에 둔다.
- 업데이트할 때는 바뀐 필드만 보낸다.
- 쓰는 쪽이 필요한 만큼만 받는다. 다른 도메인의 정보는 그 루트 컬렉션의 Batch Get으로 모아 가져오고, 필요한 필드만 고른다(`criteria/web-api.md`).
- 로딩 상태와 실패를 다루는 방식은 Suspense 경계와 Error Boundary마다 하나씩 둔다. 그 경계 안의 화면은 그 방식을 쓰고, 화면마다 따로 짜지 않는다. 실패는 삼키지 않는다. 사용자에게 알리고, 원인(권한 없음, 없음, 연결 실패)에 따라 다르게 보이며, 로딩 표시는 실패해도 되돌린다.

근거: openapi-typescript (https://openapi-ts.dev/introduction); react.dev, "Choosing the State Structure" (https://react.dev/learn/choosing-the-state-structure); TanStack Query, "Does this replace client state?" (https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state); TkDodo, "Practical React Query" (https://tkdodo.eu/blog/practical-react-query); Google AIP-157 (https://google.aip.dev/157); react.dev, "Suspense" (https://react.dev/reference/react/Suspense); Next.js, "error.js" (https://nextjs.org/docs/app/api-reference/file-conventions/error); TkDodo, "React Query Data Transformations" (https://tkdodo.eu/blog/react-query-data-transformations); Relay, "Fragments" (https://relay.dev/docs/tutorial/fragments-1/); react.dev, "memo" (https://react.dev/reference/react/memo); Google AIP-126, "Enumerations" (https://google.aip.dev/126); FormatJS, "Message Syntax" (https://formatjs.github.io/docs/core-concepts/icu-syntax/); RFC 5789 (https://www.rfc-editor.org/rfc/rfc5789); Google AIP-134 (https://google.aip.dev/134); WCAG 2.2, "Understanding Status Messages" (https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html); RFC 9110 (https://www.rfc-editor.org/rfc/rfc9110); GOV.UK Design System, "Page not found pages" (https://design-system.service.gov.uk/patterns/page-not-found-pages/), "Problem with the service pages" (https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/).

## 상태를 어디에 두나

- URL로 나타낼 수 있는 상태(무엇을 보고 있는지, 필터, 정렬, 페이지)는 URL에 둔다. 새로고침과 공유에도 같은 화면이 나와야 한다.
- 화면 사이에 넘기는 데이터는 식별자뿐이고, URL에 둔다. URL에서 꺼내 타입으로 바꾸는 일은 한 곳에서 한다.
- 그 밖의 client state는 그것을 쓰는 가장 가까운 컴포넌트가 들고 있는다. 여러 컴포넌트가 함께 쓰게 될 때만 State 끌어올리기를 한다.
- 전역으로 두는 것은 앱 전체가 함께 쓰는 것(API 클라이언트, 내 정보, 인증, 테마)뿐이다. 한 화면 묶음만 쓰는 것은 그 묶음 위에서 넘긴다.
- 서버에서 할 수 있는 일(데이터 조합, 권한 판단)을 브라우저로 끌어오지 않는다. 권한은 서버가 판단하고, 브라우저의 권한 검사는 보일 것을 고르는 용도로만 쓴다. 브라우저에서만 할 수 있는 일(상호작용, 브라우저 API)만 브라우저에서 한다.

근거: Next.js Learn, "Adding Search and Pagination" (https://nextjs.org/learn/dashboard-app/adding-search-and-pagination); react.dev, "Sharing State Between Components" (https://react.dev/learn/sharing-state-between-components); Kent C. Dodds, "State Colocation will make your React app faster" (https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster); Next.js, "Server and Client Components" (https://nextjs.org/docs/app/getting-started/server-and-client-components); OWASP, "Authorization Cheat Sheet" (https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); TanStack Router, "Search Params" (https://tanstack.com/router/latest/docs/framework/react/guide/search-params); react.dev, "Passing Data Deeply with Context" (https://react.dev/learn/passing-data-deeply-with-context).

## 입력

- 입력 검증 규칙은 서버의 것을 기준으로 하고, 서버 API에 규칙이 있으면 화면은 그것을 가져다 쓴다. 같은 규칙을 화면에 다시 적으면 둘이 어긋난다.
- 검증 오류는 틀린 입력 곁에 보이고, 화면 위쪽에는 그 오류들로 가는 요약을 함께 둔다.
- 형식이 정해진 값(사업자등록번호, 전화번호, 날짜)은 입력하는 동안 형식을 맞춰 준다(input mask). 형식을 글로 안내하지 않는다.

근거: OWASP, "Input Validation Cheat Sheet" (https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html); GOV.UK Design System, "Error message" (https://design-system.service.gov.uk/components/error-message/), "Error summary" (https://design-system.service.gov.uk/components/error-summary/); W3C WAI, "Form Notifications" (https://www.w3.org/WAI/tutorials/forms/notifications/); WCAG 2.2, "Understanding Error Identification" (https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html).

## 화면 문구

- 화면 문구는 `design:ux-copy`와 `korean-humanizer`로 쓰고 리뷰한다.
- 출처·경위·동작을 설명하는 주석식 문장과 em dash를 화면에 넣지 않는다.

## 모양

- 색, 간격, 글꼴 같은 값은 이름 붙은 값(디자인 토큰)으로만 쓴다. 값을 직접 쓰면 바꿀 때 모든 곳을 찾아다녀야 한다.
- 같은 모양의 컴포넌트를 공통으로 뺄지는 `qef:dev`의 `criteria/review-lenses.md` 단순성 판정 규칙대로 판단한다.

근거: Design Tokens Community Group, "Design Tokens Format Module" (https://www.designtokens.org/tr/drafts/format/); Atlassian Design System, "Design tokens" (https://atlassian.design/foundations/tokens/design-tokens).

## 옛 방식에서 바꿀 것

이전 프로젝트에 남은 방식 중, 위 기준에 어긋나서 따라 하지 않을 것이다.

| 옛 방식 | 어긋난 기준 |
|---|---|
| 화면에서 직접 불러와 client state에 담기 | server state와 client state를 가른다 |
| 화면마다 따로 하는 로딩·오류 처리 | 로딩 상태·실패를 다루는 방식은 경계마다 하나 |
| 인라인 스타일에 색 값을 직접 쓰기 | 값은 이름 붙은 값으로만 |
| 개념 이름 없는 `helpers/`, `shared/`, `common/` | 공통 자리 안에서도 개념 이름으로 |
| 데이터를 쓰는 화면 전체를 브라우저에서 돌리기 | 브라우저에서만 할 수 있는 일만 브라우저에서 |
| 실패를 콘솔에만 찍거나 처리하지 않음 | 실패는 삼키지 않는다 |
| URL의 식별자를 화면마다 꺼내 바꾸기 | 꺼내 바꾸는 일은 한 곳에서 |
| 인증 토큰을 화면마다 다시 읽기 | 전역은 앱 전체가 함께 쓰는 것만, 한 곳에 |
| enum 원문을 그대로 화면에 내기 | 표시 문자열로 바꾸고 표는 한 곳에 |

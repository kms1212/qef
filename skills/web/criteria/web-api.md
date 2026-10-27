# 웹 백엔드 API 기준

HTTP API를 내는 백엔드에서 영역을 어떻게 나누고, 영역 안과 영역 사이를 어떻게 짜고, 요청과 응답을 어떤 모양으로 낼지 판단하는 기준이다. 어떤 프레임워크와 라이브러리를 쓸지는 정하지 않는다. 같은 문제를 푸는 표준이 있으면 그것을 쓴다(`qef:dev`의 `criteria/reuse.md`).

## 영역과 경로

- API의 첫 경로 조각 하나가 도메인 영역 하나다. 영역마다 모듈 하나를 두고, 모듈 이름은 경로와 같다.
- 부모 없이 존재할 수 없는 자원은 부모 경로 안에 둔다. 예: `/files/:fileId/versions/:versionId`. 코드에서도 그 영역 안의 하위 모듈이다.
- 그 밖의 관계는 아이디로만 가리킨다. 예: `/files?projectId=…`.
- 경로가 정하는 것은 영역과 중첩 자원의 모듈까지다. 영역 안의 그 밖의 배치는 `qef:dev` 스킬의 `criteria/structure.md` 파일·디렉터리 규칙대로 한다. 영역 안을 정리해도 경로는 바뀌지 않는다.

근거: Vaughn Vernon, "Effective Aggregate Design" Part II (https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf); Google AIP-122, "Resource names" (https://google.aip.dev/122).

## 영역 사이

- 영역은 같은 층의 다른 영역 코드를 가져다 쓰지 않고, 다른 영역의 표를 직접 읽거나 쓰지 않는다. 영역들이 함께 쓰는 바탕(DB 클라이언트, 인증 확인 등)은 영역 아래 층에 두고, 바탕은 영역을 모른다.
- 다른 영역의 정보가 필요하면 응답에는 아이디만 넣고, 쓰는 쪽(웹, MCP 등)이 그 영역에서 가져온다. 이를 위해 영역마다 여러 기록을 한 번에 가져오는 요청과, 받을 필드를 고르는 `fields` 파라미터를 둔다.
- 한 동작이 여러 영역을 함께 바꿔야 할 것 같으면 설계를 다시 본다. 미리 만들지 않거나(필요할 때 아이디로 가리킨다), 쓰는 때에 확인하거나(상태를 퍼뜨리지 않고 읽을 때 판단한다), 늘 함께 바뀌는 것이면 `qef:dev` 스킬의 `criteria/structure.md` "함께 바뀜"대로 한 영역으로 합친다.

근거: Vaughn Vernon, "Effective Aggregate Design" Part II (위); Chris Richardson, "Pattern: Database per service" (https://microservices.io/patterns/data/database-per-service.html); JSON:API, "Sparse Fieldsets" (https://jsonapi.org/format/#fetching-sparse-fieldsets); Google AIP-157, "Partial responses" (https://google.aip.dev/157); Google AIP-231, "Batch methods: Get" (https://google.aip.dev/231).

## 영역 안

- 저장소(repository) 층을 따로 두지 않는다. 업무 코드가 ORM을 바로 부르고, ORM 클라이언트는 바탕에 하나만 만들어 함께 쓴다. 외부 서비스 클라이언트(파일 저장소, 메일)도 같다.
- 경로를 받는 코드는 API 이름과 DB 이름을 맞바꾸고 응답을 조립한다. 업무 코드는 DB 이름으로 일한다. 저장 방식이 만든 타입을 계약으로 쓰지 않는 것은 `qef:dev`의 `criteria/structure.md` "계약의 주인"대로다.
- 오래 걸리는 작업(외부 학습, 생성, OCR)은 경로 코드 밖에서 돈다. 요청에는 작업 자원을 만들어 바로 답한다(아래 "쓰기").

근거: Microsoft Learn, "Designing the infrastructure persistence layer" (https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design); Prisma, "Database connections" (https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections); Martin Fowler, "Data Transfer Object" (https://martinfowler.com/eaaCatalog/dataTransferObject.html); Google AIP-151, "Long-running operations" (https://google.aip.dev/151).

## 입력과 오류

- 형식 검증(타입, 길이, 형식, 허용 목록)은 경계에서 선언한다. 허용 목록은 스키마의 enum에서 가져온다. 필드 사이의 관계와 지금 상태에 따른 검증은 업무 코드 안에서 한다.
- 오류는 예외로 던지고, 응답으로 바꾸는 곳은 한 곳이다. 오류 본문은 RFC 9457(Problem Details) 형식이다. 원본 오류는 개발 환경에서만 싣는다.
- 상태 코드는 아래 표를 위에서부터 확인해, 처음 걸리는 것을 낸다.

| 순서 | 상황 | 코드 |
|---|---|---|
| 1 | 누가 보냈는지 모름(토큰 없음, 틀림, 만료) | 401 + `WWW-Authenticate` |
| 2 | 요청만 보고 틀렸다고 판단됨(형식, 필드 사이 관계, 허용 목록) | 400 |
| 3 | 대상이 없거나, 그 사람이 읽을 수 없음 | 404 |
| 4 | 읽을 수는 있지만 그 동작을 할 권한이 없음 | 403 |
| 5 | `If-Match`가 지금 ETag와 다름 | 412 |
| 6 | 지금 상태와 부딪힘(상위 자원의 상태 때문에 막힌 동작, 중복, 허용되지 않는 상태 전이) | 409 |
| - | 위 어느 것도 아닌 예상 밖의 실패 | 500 |

순서는 두 기준으로 정했다. 보낸 사람이 알아도 되는 만큼만 알린다(401이 맨 앞, 404가 403보다 앞). 요청만 보고 알 수 있는 것을 서버 상태를 봐야 아는 것보다 먼저 본다(400이 404보다 앞, 412와 409가 뒤).

근거: OWASP, "Input Validation Cheat Sheet" (https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html); NestJS, "Validation" (https://docs.nestjs.com/techniques/validation), "Exception filters" (https://docs.nestjs.com/exception-filters), "Request lifecycle"(가드가 파이프보다 먼저) (https://docs.nestjs.com/faq/request-lifecycle); Express, "Error Handling" (https://expressjs.com/en/guide/error-handling.html); RFC 9457 (https://www.rfc-editor.org/rfc/rfc9457); RFC 9110, 15.5절, 13.2.1절(큰 처리 전에 잡히는 실패가 조건부 요청보다 먼저) (https://www.rfc-editor.org/rfc/rfc9110); RFC 6750, 3.1절 (https://www.rfc-editor.org/rfc/rfc6750); OWASP, "Authorization Cheat Sheet" (https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); Google AIP-216, "States" (https://google.aip.dev/216). 다른 점: 의미 검증 실패에 RFC 9110은 422도 정의하지만, 여기서는 요청만 보고 판단되면 400, 상태를 봐야 하면 409로 나눈다. Google AIP-193과 AIP-211은 읽을 수 없는 자원에도 403을 낸다. Webmachine 결정 흐름(https://github.com/webmachine/webmachine/wiki/Diagram)은 400을 401보다, 403을 404보다 먼저 본다.

## 목록

- 페이지는 불투명한 다음 쪽 토큰으로 나눈다. 응답은 맨 배열이 아니라 항목과 다음 쪽 토큰을 담은 객체다. 전체 개수는 요청할 때만 준다. 쪽 번호로 건너뛰어야 하는 화면이 있을 때만 쪽 번호를 쓴다.
- 쪽 크기는 서버가 기본값과 상한을 정한다. 상한을 넘는 요청은 상한으로 줄인다.
- 정렬은 늘 같은 순서를 내도록, 같은 값이면 아이디로 가른다.
- 목록 항목은 단건보다 적은 필드로 낸다.

근거: Google AIP-158, "Pagination" (https://google.aip.dev/158); Google AIP-132, "Standard methods: List" (https://google.aip.dev/132); Zalando, "RESTful API Guidelines" Pagination 절 (https://opensource.zalando.com/restful-api-guidelines/); Microsoft, "Azure REST API Guidelines" (https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md); Markus Winand, "Fetch next page" (https://use-the-index-luke.com/sql/partial-results/fetch-next-page); OWASP API4:2023 (https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption); Google AIP-157 (위).

## 쓰기

- 만들기는 컬렉션에 POST이고, 201과 `Location` 헤더와 만든 자원 전체로 답한다.
- 고치기는 단건에 PATCH이고, 보낸 필드만 바꾸며 고친 뒤의 자원 전체로 답한다.
- 지우기는 단건에 DELETE이고, 204로 답한다.
- 반복해도 결과가 같은 설정(좋아요, 기기 정보)은 PUT으로 넣고 DELETE로 뺀다.
- 오래 걸리는 작업은 작업 자원을 만들고 202와 그 작업의 `Location`으로 답한다. 작업 자원에 상태를 둔다.
- GET은 아무것도 바꾸지 않는다. 쓰기 값은 쿼리 문자열이 아니라 본문으로 받는다.
- 상태는 enum으로 두고, 허용하는 전이는 한 곳에서 정한다.
- 한 영역 안의 여러 쓰기와, 배열로 여러 개를 만드는 요청은 트랜잭션 하나로 묶는다.
- 여럿이 함께 고칠 수 있는 자원은 ETag를 준다. `If-Match`가 오면 지키고, 다르면 412로 답한다.

근거: RFC 9110, 9.2절(안전한 메서드와 멱등 메서드), 15.3절, 13.1.1절 (https://www.rfc-editor.org/rfc/rfc9110); RFC 5789 (https://www.rfc-editor.org/rfc/rfc5789); RFC 7396 (https://www.rfc-editor.org/rfc/rfc7396); Google AIP-133 (https://google.aip.dev/133), AIP-134 (https://google.aip.dev/134), AIP-135 (https://google.aip.dev/135), AIP-151 (위), AIP-154 (https://google.aip.dev/154), AIP-216 (위), AIP-233 (https://google.aip.dev/233); Microsoft Azure Architecture Center, "Asynchronous Request-Reply pattern" (https://learn.microsoft.com/en-us/azure/architecture/patterns/async-request-reply); Prisma, "Transactions" (https://www.prisma.io/docs/orm/prisma-client/queries/transactions).

## 권한과 식별자

- 자원 단위 권한(소유자인가, 그 자원에서 무슨 역할인가)은 업무 코드 안에서 확인한다. 현재 사용자의 범위를 조회 조건에 넣어, 존재 확인과 권한 확인을 한 번에 한다.
- 밖에 내는 식별자는 예측할 수 없는 값이다. 자동 증가 정수 기본키는 안에서만 쓴다.
- 시각은 RFC 3339 UTC(`Z`) 문자열로 낸다.
- 쿼리와 JSON 필드 이름은 한 이름 규칙(camelCase 또는 snake_case)을 따르고, 필드 이름에 자원 이름을 접두어로 붙이지 않는다.

근거: OWASP API1:2023 (https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization); OWASP, "Insecure Direct Object Reference Prevention Cheat Sheet" (https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html); Google AIP-148 `uid` (https://google.aip.dev/148); RFC 3339 (https://www.rfc-editor.org/rfc/rfc3339); Google AIP-142 (https://google.aip.dev/142); Google AIP-140 (https://google.aip.dev/140). 다른 점: Zalando는 꼭 필요하지 않으면 UUID를 피하라고 하지만, 여기서는 예측할 수 없는 식별자를 앞에 둔다. 이름 규칙은 Google·Microsoft가 camelCase, Zalando가 snake_case로 갈린다.

## 공개 API

외부에서 직접 부르는 공개 API가 생기면, 그 API는 내부 영역 구조와 떼어 따로 두고 버전을 붙인다. 이 문서의 경로 규칙은 자기 웹과 도구가 쓰는 API에 적용한다.

## 옛 방식에서 바꿀 것

이전 프로젝트에 남은 방식 중, 위 기준에 어긋나서 따라 하지 않을 것이다.

| 옛 방식 | 어긋난 기준 |
|---|---|
| 같은 응답 조립과 상위 상태 검사를 곳마다 복사 | `qef:dev`의 `criteria/review-lenses.md` 단순성 판정 규칙(같은 규칙은 두 번째부터, 같은 모양은 세 번째에 판단) |
| 다른 영역의 표를 직접 쓰고, 트랜잭션 없이 함께 바꾸기 | 영역 사이 |
| 쪽 크기 상한 없음, 맨 배열 목록 | 목록 |
| GET이 읽음 표시를 하는 등 쓰기를 함, 쓰기 값을 쿼리로 받기 | 쓰기 |
| 반복해도 같은 결과인 설정을 POST로 | 쓰기 |
| 틀린 토큰이 500, 토큰 없음이 403 | 상태 코드 표 |
| 상위 자원 상태 때문에 막힌 동작을 403 | 상태 코드 표 |
| 자동 증가 정수 기본키를 그대로 밖에 내기 | 권한과 식별자 |

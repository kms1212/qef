# 웹 백엔드 API 기준

HTTP API를 내는 백엔드에서 경로와 도메인을 어떻게 나누고, 도메인 안과 도메인 사이를 어떻게 짜고, 요청과 응답을 어떤 형태로 낼지 판단하는 기준이다. 어떤 프레임워크와 라이브러리를 쓸지는 정하지 않는다. 같은 문제를 푸는 표준이 있으면 그것을 쓴다(`qef:dev`의 「쓰기 전에 이미 있는 것을 찾는다」).

## 경로와 도메인

API 경로와 백엔드 구조는 서로 따라 하지 않는다. 경로는 리소스 규칙으로, 도메인은 공통 폐쇄 원칙으로 정하고, 둘은 루트 컬렉션에서만 만난다.

- 경로의 `/`는 "리소스가 자식을 가진다" 하나만 뜻한다. 첫 path segment는 루트 컬렉션이고, 자식은 그것이 무엇인지로 호출한다. 관계를 뜻하는 이름(`memberships`, `assignments`)이나 도메인을 묶는 path segment를 경로에 넣지 않는다.
- 부모 없이 존재할 수 없는 리소스는 부모 경로 안에 둔다. 예: `/files/:fileId/versions/:versionId`. 그 밖의 관계는 아이디로만 가리킨다. 예: `/files?projectId=…`.
- 백엔드 도메인(패키지, DB 스키마, 화면 그룹)은 늘 함께 바뀌는 루트 컬렉션끼리 묶는다(`qef:layout`의 「패키지는 함께 바뀌고 함께 쓰이는 큰 묶음이다」).
- 루트 컬렉션마다 소유자 도메인은 하나다. 그 리소스의 쓰기와 규칙은 소유자 도메인만 갖는다.
- 백엔드 코드는 `도메인/루트 컬렉션/자식/`으로 둔다. 도메인에 루트 컬렉션이 하나뿐이어도 두 단을 지킨다. 컨트롤러는 루트 컬렉션마다 하나이고, 소유자 도메인을 불러 API 형태와 도메인 타입을 서로 변환한다. 그 아래의 배치는 `qef:layout`의 「나누는 기준은 그 자리를 여는 사람이 찾는 것이다」대로 한다.

근거: Google AIP-121, "Resource-oriented design"(API는 DB 스키마를 비추지 않는다) (https://google.aip.dev/121); Google AIP-122, "Resource names" (https://google.aip.dev/122); Microsoft Azure Architecture Center, "Web API design best practices"(DB 내부 구조를 비추는 API를 피한다) (https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design); Vaughn Vernon, "Effective Aggregate Design" Part II (https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf). 다른 점: Microsoft 글은 collection/item/collection보다 깊은 경로를 피하라고 하지만, 여기서는 부모 없이 존재할 수 없으면 깊어도 부모 안에 둔다.

## 도메인 사이

- 도메인은 같은 계층의 다른 도메인 코드를 가져다 쓰지 않고, 다른 도메인의 테이블을 직접 읽거나 쓰지 않는다. 같은 도메인 안의 루트 컬렉션끼리는 코드를 함께 쓴다. 도메인들이 함께 쓰는 인프라 계층(DB 클라이언트, 인증 확인 등)은 도메인 아래에 두고, 인프라 계층은 도메인을 모른다.
- 다른 도메인의 정보가 필요하면 응답에는 아이디만 넣고, 쓰는 쪽(웹, MCP 등)이 그 루트 컬렉션에서 가져온다. 이를 위해 루트 컬렉션마다 Batch Get과, 받을 필드를 고르는 `fields` 파라미터를 둔다.
- 한 동작이 여러 도메인의 테이블이나 코드를 바꿔야 하면 설계를 다시 본다. 미리 만들지 않거나(필요할 때 아이디로 가리킨다), 쓰는 때에 확인하거나(상태를 전파하지 않고 읽을 때 판단한다), 늘 함께 바뀌는 것이면 `qef:layout`의 「패키지는 함께 바뀌고 함께 쓰이는 큰 묶음이다」대로 한 도메인으로 합친다.

근거: Vaughn Vernon, "Effective Aggregate Design" Part II (위); Chris Richardson, "Pattern: Database per service" (https://microservices.io/patterns/data/database-per-service.html); JSON:API, "Sparse Fieldsets" (https://jsonapi.org/format/#fetching-sparse-fieldsets); Google AIP-157, "Partial responses" (https://google.aip.dev/157); Google AIP-231, "Batch methods: Get" (https://google.aip.dev/231).

## 도메인 안

- 규칙(검증, 상태 전이)은 도메인 타입을 받고 반환한다. ORM을 호출하지 않고, ORM이 만든 타입을 받지 않는다(`qef:layout`의 「책임은 그것을 알아야 하는 모듈 하나가 진다」).
- DB를 읽고 쓰는 일은 aggregate마다 리포지토리 하나가 맡고, ORM 결과를 도메인 타입으로 바꿔 돌려준다. 여러 리포지토리가 같은 방식으로 하는 접근은 `qef:dev`의 「같은 지식은 한 곳에 두되, 변경 이유가 다르면 합치지 않는다」대로 인프라 계층의 제네릭 함수로 묶는다. 정형화되지 않은 쿼리는 그 리포지토리 안에 쓴다.
- 요청을 처리하는 코드가 리포지토리 → 규칙 → 리포지토리 순서로 잇는다. 컨트롤러는 API 형태와 도메인 타입을 서로 변환하고 응답을 조립한다.
- ORM 클라이언트와 외부 서비스 클라이언트(스토리지, 메일)는 인프라 계층에 하나만 만들어 함께 쓴다.
- 오래 걸리는 작업(외부 학습, 생성, OCR)은 컨트롤러 밖에서 돈다. 요청에는 long-running operation 리소스를 만들어 바로 응답한다(아래 "쓰기").

근거: Microsoft Learn, "Designing the infrastructure persistence layer", "Define one repository per aggregate" 절 (https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design); Martin Fowler, "Repository" (https://martinfowler.com/eaaCatalog/repository.html); Sandi Metz, "The Wrong Abstraction" (https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction); Prisma, "Database connections" (https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections); Martin Fowler, "Data Transfer Object" (https://martinfowler.com/eaaCatalog/dataTransferObject.html); Google AIP-151, "Long-running operations" (https://google.aip.dev/151). 다른 점: Microsoft 글은 갱신은 리포지토리로만 하되, 읽기는 리포지토리 밖 쿼리로 해도 된다고 한다(CQRS). 여기서는 읽기도 그 aggregate의 리포지토리에 둔다.

## 입력과 오류

- 형식 검증(타입, 길이, 형식, 허용 목록)은 경계에서 선언한다. 허용 목록은 스키마의 enum에서 가져온다. 필드 사이의 관계와 지금 상태에 따른 검증은 비즈니스 로직 안에서 한다.
- 오류는 예외로 던지고, 응답으로 바꾸는 곳은 한 곳이다. 오류 본문은 RFC 9457(Problem Details) 형식이다. 원본 오류는 개발 환경에서만 싣는다.
- 상태 코드는 아래 표를 위에서부터 확인해, 처음 해당하는 코드를 반환한다.

| 순서 | 상황 | 코드 |
|---|---|---|
| 1 | 누가 보냈는지 모름(토큰 없음, 틀림, 만료) | 401 + `WWW-Authenticate` |
| 2 | 요청만으로 잘못됐다고 판단됨(형식, 필드 사이 관계, 허용 목록) | 400 |
| 3 | 대상이 없거나, 그 사람이 읽을 수 없음 | 404 |
| 4 | 읽을 수는 있지만 그 동작을 할 권한이 없음 | 403 |
| 5 | `If-Match`가 지금 ETag와 다름 | 412 |
| 6 | 지금 상태와 충돌(상위 리소스의 상태 때문에 막힌 동작, 중복, 허용되지 않는 상태 전이) | 409 |
| - | 위 어느 것도 아닌 예상 밖의 실패 | 500 |

순서는 두 기준으로 정했다. 보낸 사람이 알아도 되는 만큼만 알린다(401이 맨 앞, 404가 403보다 앞). 요청만 보고 알 수 있는 것을 서버 상태를 봐야 아는 것보다 먼저 확인한다(400이 404보다 앞, 412와 409가 뒤).

근거: OWASP, "Input Validation Cheat Sheet" (https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html); NestJS, "Validation" (https://docs.nestjs.com/techniques/validation), "Exception filters" (https://docs.nestjs.com/exception-filters), "Request lifecycle"(가드가 파이프보다 먼저) (https://docs.nestjs.com/faq/request-lifecycle); Express, "Error Handling" (https://expressjs.com/en/guide/error-handling.html); RFC 9457 (https://www.rfc-editor.org/rfc/rfc9457); RFC 9110, 15.5절, 13.2.1절(큰 처리 전에 잡히는 실패가 조건부 요청보다 먼저) (https://www.rfc-editor.org/rfc/rfc9110); RFC 6750, 3.1절 (https://www.rfc-editor.org/rfc/rfc6750); OWASP, "Authorization Cheat Sheet" (https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); Google AIP-216, "States" (https://google.aip.dev/216). 다른 점: 의미 검증 실패에 RFC 9110은 422도 정의하지만, 여기서는 요청만 보고 판단되면 400, 상태를 봐야 하면 409로 나눈다. Google AIP-193과 AIP-211은 읽을 수 없는 리소스에도 403을 반환한다. Webmachine 결정 흐름(https://github.com/webmachine/webmachine/wiki/Diagram)은 400을 401보다, 403을 404보다 먼저 확인한다.

## 목록

- 페이지는 불투명한 `next_page_token`으로 나눈다. 응답은 감싸지 않은 배열이 아니라 항목과 `next_page_token`을 담은 객체다. 전체 개수는 요청할 때만 준다. 페이지 번호로 건너뛰어야 하는 화면이 있을 때만 페이지 번호를 쓴다.
- `page_size`는 서버가 기본값과 상한을 정한다. 상한을 넘는 요청은 상한으로 줄인다.
- 정렬은 늘 같은 순서를 반환하도록, 같은 값이면 아이디로 구분한다.
- 목록 항목은 단건보다 적은 필드로 반환한다.

근거: Google AIP-158, "Pagination" (https://google.aip.dev/158); Google AIP-132, "Standard methods: List" (https://google.aip.dev/132); Zalando, "RESTful API Guidelines" Pagination 절 (https://opensource.zalando.com/restful-api-guidelines/); Microsoft, "Azure REST API Guidelines" (https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md); Markus Winand, "Fetch next page" (https://use-the-index-luke.com/sql/partial-results/fetch-next-page); OWASP API4:2023 (https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption); Google AIP-157 (위).

## 쓰기

- 만들기는 컬렉션에 POST이고, 201과 `Location` 헤더와 만든 리소스 전체로 응답한다.
- 업데이트는 단건에 PATCH이고, 보낸 필드만 바꾸며 업데이트한 뒤의 리소스 전체로 응답한다.
- 삭제는 단건에 DELETE이고, 204로 응답한다.
- 멱등인 설정(좋아요, 기기 정보)은 PUT으로 넣고 DELETE로 뺀다.
- 오래 걸리는 작업은 long-running operation 리소스를 만들고 202와 그 리소스의 `Location`으로 응답한다. 그 리소스에 상태를 둔다.
- GET은 아무것도 바꾸지 않는다. 쓰기 값은 쿼리 문자열이 아니라 본문으로 받는다.
- 상태는 enum으로 두고, 허용하는 전이는 한 곳에서 정한다.
- 한 도메인 안의 여러 쓰기와, 배열로 여러 개를 만드는 요청은 트랜잭션 하나로 묶는다.
- 여럿이 함께 고칠 수 있는 리소스는 ETag를 준다. `If-Match`가 오면 지키고, 다르면 412로 응답한다.

근거: RFC 9110, 9.2절(안전한 메서드와 멱등 메서드), 15.3절, 13.1.1절 (https://www.rfc-editor.org/rfc/rfc9110); RFC 5789 (https://www.rfc-editor.org/rfc/rfc5789); RFC 7396 (https://www.rfc-editor.org/rfc/rfc7396); Google AIP-133 (https://google.aip.dev/133), AIP-134 (https://google.aip.dev/134), AIP-135 (https://google.aip.dev/135), AIP-151 (위), AIP-154 (https://google.aip.dev/154), AIP-216 (위), AIP-233 (https://google.aip.dev/233); Microsoft Azure Architecture Center, "Asynchronous Request-Reply pattern" (https://learn.microsoft.com/en-us/azure/architecture/patterns/async-request-reply); Prisma, "Transactions" (https://www.prisma.io/docs/orm/prisma-client/queries/transactions).

## 권한과 식별자

- 리소스 단위 권한(소유자인가, 그 리소스에서 무슨 역할인가)은 비즈니스 로직 안에서 확인한다. 현재 사용자의 범위를 조회 조건에 넣어, 존재 확인과 권한 확인을 한 번에 한다.
- 밖에 내는 식별자는 예측할 수 없는 값이다. 자동 증가 정수 기본키는 안에서만 쓴다.
- 시각은 RFC 3339 UTC(`Z`) 문자열로 반환한다.
- 쿼리와 JSON 필드 이름은 한 명명 규칙(camelCase 또는 snake_case)을 따르고, 필드 이름에 리소스 이름을 접두어로 붙이지 않는다.

근거: OWASP API1:2023 (https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization); OWASP, "Insecure Direct Object Reference Prevention Cheat Sheet" (https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html); Google AIP-148 `uid` (https://google.aip.dev/148); RFC 3339 (https://www.rfc-editor.org/rfc/rfc3339); Google AIP-142 (https://google.aip.dev/142); Google AIP-140 (https://google.aip.dev/140). 다른 점: Zalando는 꼭 필요하지 않으면 UUID를 피하라고 하지만, 여기서는 예측할 수 없는 식별자를 앞에 둔다. 명명 규칙은 Google·Microsoft가 camelCase, Zalando가 snake_case로 달라진다.

## 공개 API

외부에서 직접 호출하는 공개 API가 생기면, 그 API는 따로 두고 버전을 붙인다. 이 문서의 경로 규칙은 자기 웹과 도구가 쓰는 API에 적용한다.

## 옛 방식에서 바꿀 것

이전 프로젝트에 남은 방식 중, 위 기준에 어긋나서 따라 하지 않을 것이다.

| 옛 방식 | 어긋난 기준 |
|---|---|
| 같은 응답 조립과 상위 상태 검사를 곳마다 복사 | `qef:dev`의 「같은 지식은 한 곳에 두되, 변경 이유가 다르면 합치지 않는다」 |
| 다른 도메인의 테이블을 직접 쓰고, 트랜잭션 없이 함께 바꾸기 | 도메인 사이 |
| `page_size` 상한 없음, 감싸지 않은 배열 목록 | 목록 |
| GET이 읽음 표시를 하는 등 쓰기를 함, 쓰기 값을 쿼리로 받기 | 쓰기 |
| 멱등인 설정을 POST로 | 쓰기 |
| 틀린 토큰이 500, 토큰 없음이 403 | 상태 코드 표 |
| 상위 리소스 상태 때문에 막힌 동작을 403 | 상태 코드 표 |
| 자동 증가 정수 기본키를 그대로 밖에 내기 | 권한과 식별자 |

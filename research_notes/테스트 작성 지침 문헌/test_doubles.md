# test double(mock, stub, fake)과 실제 계약에 대한 충실도, contract test

조사일: 2026-11-08. 인용은 짧게 줄였다. Google SWE book ch.13, Pact 문서, Khorikov 글은 WebFetch 요약기를 거쳐 받은 인용이다. 정확한 문구가 중요하면 원문을 다시 확인한다. "Mock Roles, not Objects" 논문만 PDF 원문에서 직접 텍스트를 뽑았다.

비교 대상: `/Users/kms1212/Documents/LocalProjects/qef/skills/testing/SKILL.md`의 `## mock` 절(32-39행). 읽기만 했고 고치지 않았다.

## 1. 용어와 기본 구분 (Fowler / Meszaros)

### Takeaway
"mock"은 다섯 가지 test double 가운데 하나다. 기대한 호출을 검증하는 test double만 mock이고, 미리 정한 반환값을 주는 test double은 stub, 동작하는 단순화한 구현은 fake다. 이 구분이 없으면 "mock을 써라/쓰지 마라"라는 지침이 무엇을 가리키는지 흐려진다.

### Cited Findings
- 정의(Meszaros 용어, Fowler 정리). Dummy: "passed around but never actually used". Fake: "actually have working implementations, but usually take some shortcut" (예: in-memory DB). Stub: "provide canned answers to calls made during the test". Spy: "stubs that also record some information based on how they were called". Mock: "pre-programmed with expectations which form a specification of the calls they are expected to receive" — [Fowler, TestDouble](https://martinfowler.com/bliki/TestDouble.html)
- 검증 방식은 둘이다. 상태 검증은 SUT와 협력 객체의 상태를 본다. 행위 검증("Mocks use behavior verification")은 호출이 맞게 일어났는지 본다 — [Fowler, Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)
- 고전파는 "use real objects if possible and a double if it's awkward to use the real thing"이고, mockist는 흥미로운 동작을 가진 객체를 모두 mock한다 — [Fowler, Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)
- 위험: 기대가 틀린 mock은 "unit tests that run green but mask inherent errors"를 만든다. mockist 테스트는 외부로 나가는 호출을 검증하므로 구현에 더 강하게 결합된다 — [Fowler, Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)

### Inferences
- qef 절은 모든 test double을 "mock"이라는 한 단어로 호출한다. 문헌에서 HTTP 응답을 모킹해 반환하는 MSW handler는 stub(요청을 기록하면 spy)이고, 서버 동작을 메모리에 흉내 내면 fake다. 지침이 "mock 자체를 검증하지 않는다"와 "인자·횟수가 계약이면 단언한다"를 함께 말하려면 test double의 종류부터 나눠야 뜻이 분명해진다. 전역 규칙의 공식 용어 원칙(D-23)에 따르면 Meszaros/Fowler 용어를 쓰는 편이 맞다.

### Gaps
- Meszaros, *xUnit Test Patterns* 원문은 직접 보지 못했다. Fowler의 재인용을 썼다.

## 2. 무엇을 쓸지의 우선순위: 실제 > fake > stub > 상호작용 검증 (Google SWE book ch.13)

### Takeaway
Google은 실제 구현을 먼저 쓰고, 다음으로 fake, 그다음 stub을 쓰며, 상호작용 검증(mock)은 되도록 피하라고 한다. fake는 충실도(fidelity) 때문에 선호되고, 그 대신 자체 테스트로 실제 구현과 같은 API contract를 지킨다는 것을 표시해야 한다. fake는 실제 구현의 소유자가 쓰고 유지한다.

### Cited Findings
- "our first choice for tests is to use the real implementations of the system under test's dependencies" — [SWE at Google ch.13](https://abseil.io/resources/swe-book/html/ch13.html)
- 충실도: "Fidelity refers to how closely the behavior of a test double resembles the behavior of the real implementation" — [SWE at Google ch.13](https://abseil.io/resources/swe-book/html/ch13.html)
- "A fake is preferred over other test double techniques because it behaves similarly to the real implementation" — [SWE at Google ch.13](https://abseil.io/resources/swe-book/html/ch13.html)
- **fake는 테스트한다**: "A fake must have its own tests to ensure that it conforms to the API of its corresponding real implementation." 같은 테스트를 "against both the real implementation and the fake"로 돌린다 — [SWE at Google ch.13, "Fakes Should Be Tested"](https://abseil.io/resources/swe-book/html/ch13.html)
- **소유자**: "the team that owns the real implementation should write and maintain a fake." fake가 없으면 "first ask the owners of the API to create one"이고, 그래도 안 될 때만 직접 쓴다 — [SWE at Google ch.13](https://abseil.io/resources/swe-book/html/ch13.html)
- stub 남용의 비용. 의도가 흐려지고("detracts from the intent of the test"), 깨지기 쉬워지고("Stubbing leaks implementation details of your code into your test"), 덜 효과적이 된다("with stubbing there is no way to store state"). stub이 적절할 때도 "real implementations or fakes are still preferred" — [SWE at Google ch.13](https://abseil.io/resources/swe-book/html/ch13.html)
- 상호작용 검증: "Interaction testing should be avoided when possible". 하더라도 "only for functions that are state-changing"에 한하고, 과잉 명세를 피한다("avoiding overspecifying which functions and arguments are validated") — [SWE at Google ch.13](https://abseil.io/resources/swe-book/html/ch13.html)
- 실제 구현이 테스트가 통제할 수 없는 외부 서비스에 의존하면 "a hermetic instance of a server, which has its life cycle controlled by the test"를 쓸 수 있다 — [SWE at Google ch.13](https://abseil.io/resources/swe-book/html/ch13.html)
- Google Testing Blog의 TotT "Don't Mock Types You Don't Own"(2020-07-16, Andrew Trenk·Stefan Kennedy)도 같은 순서를 따른다. 실제 구현을 쓸 수 없고 fake도 없으면("a fake implementation doesn't exist (and library owners aren't able to create one)") "create a wrapper class that calls the type" — [Google Testing Blog](https://testing.googleblog.com/2020/07/testing-on-toilet-dont-mock-types-you.html) (본문 일부는 페이지 댓글에 재인용된 형태로만 확인됨)

### Inferences
- 사례의 웹-서버 프로젝트에 적용하면 이렇다. 서버 HTTP API의 소유자는 서버 쪽 코드다. 웹 테스트마다 응답을 손으로 모킹하는 것은 소유자가 아닌 쪽이 쓰는 stub에 해당한다. 문헌의 권장 사항은 둘 중 하나다. (a) 공유 패키지에 서버 쪽이 관리하는 fake/fixture 생성기를 두고 공유 스키마로 검증한다. (b) 테스트가 수명을 통제하는 실제 서버(hermetic instance)를 쓴다.
- "fake must have its own tests"는 사례의 빈틈(아무도 fake가 실제 API 스키마와 맞는지 보지 않음)을 정면으로 다룬다.

### Gaps
- 책의 예시 코드와 "When Should Fakes Be Written?" 절의 비용 논의는 요약으로만 받았다.

## 3. "자기 것만 mock한다"와 managed/unmanaged 의존 (Freeman & Pryce, Khorikov)

### Takeaway
GOOS 저자들은 바꿀 수 있는 타입만 mock하고, 외부 타입은 얇은 wrapper(adapter)로 감싸 그 wrapper를 mock하라고 한다. Khorikov는 프로세스 밖 의존을 두 가지로 나눈다. 자기 앱만 쓰는 managed 의존(예: 앱 전용 DB)은 실제로 쓰고, 다른 시스템이 관찰할 수 있는 unmanaged 의존만 mock한다. 그리고 mock은 시스템 가장자리의 마지막 타입에 둔다.

### Cited Findings
- 원 출처(2004 OOPSLA "Mock Roles, not Objects", Freeman·Pryce·Mackinnon·Walnes) §4.1 "Only Mock Types You Own": "programmers should only write mocks for types that they can change." 또 "should not write mocks for fixed types, such as those defined by the runtime or external libraries. Instead they should write thin wrappers" — [Mock Roles, not Objects (PDF)](http://jmock.org/oopsla2004.pdf)
- 이 원칙이 GOOS(2009)로 이어졌다는 2차 출처: [Mark Needham, "TDD: Only mock types you own"](https://markhneedham.com/blog/2009/12/13/tdd-only-mock-types-you-own/). 비판도 있다. 규칙이 아니라 지침이라는 견해: [Wix Engineering, Mockingbird part 3](https://medium.com/wix-engineering/mockingbird-part-3-the-pitfalls-e42c03000a92). wrapper가 업그레이드 문제를 옮길 뿐이라는 반론은 Google 글의 독자 댓글이다.
- Khorikov의 정의. Managed는 "out-of-process dependencies you have full control over"(예: 앱 DB), unmanaged는 "out-of-process dependencies you don't have full control over"(SMTP, 메시지 버스) — [Khorikov, When to Mock](https://enterprisecraftsmanship.com/posts/when-to-mock/)
- "Only unmanaged dependencies should be replaced with mocks. Use real instances of managed dependencies in tests." — [Khorikov, When to Mock](https://enterprisecraftsmanship.com/posts/when-to-mock/)
- 근거: "The use of mocks cements the communication pattern between the system under test and the dependency." unmanaged 의존에서는 외부 앱이 그 통신 방식에 의존하므로 이것이 바람직하다. 내부 통신(intra-system)에서는 구현 세부라서 바람직하지 않다 — [Khorikov, When to Mock](https://enterprisecraftsmanship.com/posts/when-to-mock/)
- 책 ch.9 "Mocking best practices" 요약: 시스템 가장자리에서 상호작용 검증, unmanaged 의존 앞의 마지막 타입을 mock, mock보다 spy, mock은 통합 테스트에서만, "only mock types that you own" — [Khorikov, Unit Testing PPP ch.9 (Manning livebook)](https://livebook.manning.com/book/unit-testing/chapter-9) (본문은 유료라 장 요약만 확인)

### Inferences
- 웹 클라이언트 입장에서 같은 저장소의 서버는 managed에 가깝다. 같은 팀이 양쪽을 통제하고, 공유 타입과 스키마가 있다. Khorikov 기준을 그대로 옮기면 가능할 때 실제 서버로 통합 테스트를 하는 편이 맞다. 웹 단위 테스트(Vitest)가 비용 때문에 HTTP를 test double로 바꾼다면, 그 test double의 충실도를 기계적으로 보장할 메커니즘이 필요하다(5절).
- "only mock types you own"을 HTTP에 적용하면 이렇다. `fetch` 같은 외부 타입을 직접 stub하지 않고, 앱 자신의 API 클라이언트 모듈(wrapper)을 경계로 둔다. 그 wrapper가 실제 서버와 맞는지는 별도 contract test나 통합 테스트로 확인한다.

### Gaps
- GOOS 책 본문(8장 "Only Mock Types That We Own")의 문구는 직접 확인하지 못했다. 2004 논문을 원 출처로 인용했다.
- Khorikov ch.9 본문 문구(“mock the last type…”)는 장 요약으로만 확인했다.

## 4. contract test: test double과 실제가 달라지는 것(drift)을 막는 법

### Takeaway
Fowler의 ContractTest는 test double이 반환하는 것이 실제 서비스의 응답과 같은 형식인지 따로 확인한다. 데이터 값이 아니라 형식을 본다. Pact는 소비자 테스트의 mock 상호작용을 계약 파일로 남기고, 그 요청을 실제 provider에 재생해 응답을 대조한다. 그래서 test double과 실제가 같은 파일로 결합된다. 이 방식은 양쪽을 같은 조직이 통제할 때 맞는다.

### Cited Findings
- Contract test는 "check that all the calls against your test doubles return the same results as a call to the external service would". 데이터가 아니라 형식을 본다. 실행 주기는 외부 서비스의 변경 속도를 따른다("Often running just once a day is plenty"). 실패하면 빌드를 깨기보다 test double과 코드를 맞추는 작업을 만들고, 서비스 관리자와 이야기한다 — [Fowler, ContractTest](https://martinfowler.com/bliki/ContractTest.html)
- contract test는 각 애플리케이션을 따로 검사해 "the messages it sends or receives conform to a shared understanding"인지 본다. 소비자 주도라서 "only parts of the communication that are actually used by the consumer(s) get tested" — [Pact docs](https://docs.pact.io/)
- 동작 방식. 소비자 쪽은 "The mock provider compares the actual request with the expected request". 생성된 pact 파일로 provider를 검증할 때 "each request is sent to the provider, and the actual response it generates is compared" with the minimal expected response. 통과 조건은 응답이 "at least the data described in the minimal expected response"를 담는 것이다 — [Pact, How Pact works](https://docs.pact.io/getting_started/how_pact_works)
- 즉 요청 방향(소비자가 보내는 body)은 소비자 쪽 mock provider에서, 응답 방향은 provider 검증에서 확인된다. 사례의 두 결함, 즉 dialog의 요청 body와 모킹한 응답이 실제와 달라지는 것을 둘 다 커버한다 — 같은 출처에서 추론
- 적합 조건: "You ... control the development of both the consumer and the provider", "intra-organisation microservices". 부적합: 공개 API, 상대 팀이 Pact를 쓰지 않음, pass-through API, 브라우저 테스트용 범용 mocking — [Pact, What is Pact good for](https://docs.pact.io/getting_started/what_is_pact_good_for)
- 스키마 기반 변형(PactFlow Bi-Directional Contract Testing)은 "two contracts - one representing consumer expectations, and another representing provider capability - are compared". provider 계약은 OpenAPI 문서에 provider 자신의 검증 결과("self-verification result")를 더한 것이다. 소비자 예제로 MSW, nock, WireMock이 나열된다 — [PactFlow BDCT (on-prem docs)](https://support.smartbear.com/pactflow-on-premises/docs/en/user-guide/user-interface/user-interface-2-x-x/bi-directional-contract-testing.html), [example provider](https://docs.pactflow.io/docs/examples/bi-directional/provider/readyapi)

### Inferences
- BDCT의 구조(소비자 test double ↔ 스키마 ↔ 스키마를 지키는지 provider가 스스로 검증)는 공유 TypeScript 스키마가 있는 모노레포에서 별도 브로커 없이 흉내 낼 수 있다. 웹 test double은 공유 스키마로 요청과 응답을 검증하고, 서버 테스트는 실제 응답이 같은 스키마를 지키는지 검증한다. 두 검사가 같은 스키마 하나를 가리키는 한, test double과 실제는 스키마 수준에서 이어진다.
- 스키마 호환이 동작 호환은 아니다. 스키마는 형식만 묶는다. 특정 입력에 어떤 오류 코드가 오는지, 필드 사이의 의미 관계는 묶지 못한다. Pact 같은 예시 기반 계약이나 실제 서버 통합 테스트가 그 부분을 맡는다. PactFlow 문서에서 이 한계를 명시한 문장은 찾지 못했다(Gaps 참고).

### Gaps
- PactFlow 클라우드 문서의 BDCT 개요 페이지는 404였다. 대체로 on-prem 문서를 썼다. BDCT가 소비자 주도 방식보다 약하다는 공식 비교 문장은 확인하지 못했다.

## 5. 스키마로 fake를 검증하기 (MSW + OpenAPI/zod)

### Takeaway
MSW의 TypeScript 제네릭은 handler의 요청 body 타입과 응답 body 타입을 좁힐 뿐이다. 런타임 검증은 하지 않는다고 문서에 적혀 있지 않고, 하는 기능도 설명돼 있지 않다. test double이 실제 스키마를 지키게 하려면 컴파일 시점의 타입 연결(공유 타입, openapi-msw)과 런타임 검증(handler 안에서 zod/Ajv로 parse)을 함께 쓴다. 서버 쪽에서는 실제 응답을 같은 스키마로 단언한다(jest-openapi / vitest-openapi).

### Cited Findings
- MSW 제네릭: 요청 body 타입은 "Narrows the `request.json()` return type", 응답 body 타입은 `HttpResponse.json()`의 body 타입을 좁힌다. 런타임 스키마 검증은 페이지에 언급되지 않는다. GraphQL에는 "GraphQL Code Generator to have type-safe mocks"를 권한다 — [MSW, TypeScript best practices](https://mswjs.io/docs/best-practices/typescript)
- openapi-msw는 OpenAPI-TS로 생성한 스키마에서 경로·요청·응답 타입을 추론하는 MSW wrapper다 — [openapi-msw (npm)](https://npmjs.com/package/openapi-msw)
- @notainc/typed-api-spec의 MSW 연동은 zod 스키마로 query, params, headers, body를 검증하는 메서드를 handler에 준다 — [typed-api-spec MSW docs](https://nota.github.io/typed-api-spec/docs/server/msw)
- zod 스키마에서 schema-valid MSW handler를 만들자는 MSW 논의가 있다 — [mswjs/msw discussion #2752](https://github.com/mswjs/msw/discussions/2752)
- 서버 쪽: `expect(res).toSatisfyApiSpec()`은 응답 status와 body를 OpenAPI 스펙과 대조한다. Vitest 포트가 있다. 모든 요청과 응답을 자동 검증하지는 않으므로 테스트마다 호출해야 한다 — [jest-openapi](https://www.npmjs.com/package/jest-openapi), [vitest-openapi](https://github.com/yutak23/vitest-openapi), [OpenAPIValidators #237](https://github.com/openapi-library/OpenAPIValidators/issues/237)

### Inferences
- 사례에서 실제로 일어난 일은 이렇다. 공유 타입이 있어도 test double이 어긋났다. 원인 후보는 셋이다. 응답 fixture를 `as`나 `any`로 만들어 타입 검사를 우회했거나, 타입은 맞지만 런타임 스키마 제약(필수 형식, enum, refine)을 위반했거나, handler가 요청 body를 검사하지 않았다. 지침이 막아야 할 지점도 이 셋이다.
  1. stub handler는 들어온 요청 body를 서버가 쓰는 같은 입력 스키마로 parse한다. 실패하면 400을 돌려주거나 테스트를 실패시킨다. 이렇게 하면 "dialog가 보내는 body가 API 입력 스키마와 맞는가"를 테스트마다 따로 쓰지 않아도 모든 테스트에서 검사된다.
  2. stub 응답은 서버의 출력 스키마로 parse한 뒤에 반환한다. 손으로 쓴 객체를 바로 돌려주지 않는다.
  3. fixture는 공유 스키마에서 만들거나, 서버 쪽 소유의 공유 fixture 생성기에서 받는다(Google의 "owner writes the fake").
  4. 서버 테스트는 실제 응답이 같은 출력 스키마를 지키는지 단언한다. 그래야 "스키마 = 실제"가 성립하고, test double 검증이 의미를 갖는다.
- 위 1~4는 문헌의 원칙(Google: fake는 실제와 같은 테스트를 통과해야 한다, Fowler: test double 응답의 형식을 실제와 대조한다, Pact/BDCT: 소비자 test double과 provider를 같은 계약으로 묶는다)을 공유 스키마 환경에 옮긴 추론이다. 특정 출처가 이 조합을 그대로 권하지는 않는다.

### Gaps
- MSW 공식 문서에서 "런타임 스키마 검증을 하라"는 권고는 찾지 못했다. hey-api/openapi-ts의 MSW 플러그인 PR(#3570)은 병합 여부를 확인하지 못했다.
- 스키마 기반 test double 검증이 drift를 얼마나 줄이는지에 대한 실증 데이터는 찾지 못했다.

## 6. qef `## mock` 절과 문헌 대조

### Takeaway
qef 절은 상호작용 단언, 준비 비용이 커질 때 통합 테스트로 옮기기, 외부 계층에서만 test double 쓰기에서 문헌과 맞는다. 빠진 것은 다섯 가지다. 실제 > fake > stub > mock의 우선순위, managed/unmanaged 구분, 자기 것만 test double로 바꾸기(wrapper), fake의 소유자와 fake 자체의 테스트, 그리고 "실제 구조를 빠짐없이 흉내 낸다"를 기계적으로 확인하는 방법(contract test·스키마 검증)이다.

### Cited Findings (각 줄은 qef 행 ↔ 문헌)
- 맞음: "mock은 느리거나 외부에 있는 계층에서만 쓰고" ↔ Google "first choice … real implementations", Khorikov "Only unmanaged dependencies should be replaced with mocks" — [SWE ch.13](https://abseil.io/resources/swe-book/html/ch13.html), [Khorikov](https://enterprisecraftsmanship.com/posts/when-to-mock/). 다만 "외부"의 기준이 qef에는 없다. Khorikov 기준으로는 프로세스 밖이어도 앱이 소유한 DB는 실제로 쓴다.
- 부분 일치: "실제 구조를 빠짐없이 흉내 낸다" ↔ Google의 fidelity. 문헌은 여기에 확인 수단을 붙인다. "A fake must have its own tests"(SWE ch.13), contract test(Fowler), pact 검증(Pact). qef는 목표만 있고 검증 수단이 없다. 사례의 결함이 바로 이 틈에서 나왔다.
- 맞음: "인자, 호출 횟수, 순서가 계약이면 단언한다" ↔ Google "interaction testing only for functions that are state-changing", "avoid overspecification". Khorikov: 통신 방식을 고정하는 것은 unmanaged 의존에서만 바람직하다.
- 맞음: "mock 준비가 테스트 본문보다 커지면 실제 구성 요소로 통합 테스트" ↔ Google "overuse of stubbing … major losses in productivity", 의도가 흐려지고 깨지기 쉬워진다.
- 맞음: "mock 자체를 검증하지 않는다" ↔ Fowler의 "run green but mask inherent errors" 위험과 같은 방향이다(test double의 출력을 단언하면 test double만 검사하게 된다).
- 맞음: "테스트 쓰기가 어렵거나 전부 mock해야 하면 설계를 의심한다"(41절) ↔ GOOS의 "Mock Objects is a design technique"와 같은 취지다.
- 없음: 우선순위(real > fake > stub > interaction) — SWE ch.13.
- 없음: 외부 타입을 직접 test double로 바꾸지 말고 자기 wrapper를 경계로 두기 — [Mock Roles, not Objects §4.1](http://jmock.org/oopsla2004.pdf), [Google TotT](https://testing.googleblog.com/2020/07/testing-on-toilet-dont-mock-types-you.html).
- 없음: fake는 실제 구현의 소유자가 쓰고 유지하며, 실제와 같은 테스트를 통과해야 한다 — SWE ch.13.
- 없음: test double과 실제의 drift를 잡는 contract test, 그리고 그 실행 주기와 실패 처리 — [Fowler, ContractTest](https://martinfowler.com/bliki/ContractTest.html), [Pact](https://docs.pact.io/getting_started/how_pact_works).
- 없음: 공유 스키마가 있을 때 test double의 요청·응답을 그 스키마로 런타임 검증하고, 서버 쪽에서 실제 응답을 같은 스키마로 단언하기 — 5절 출처.

### Inferences
- 사례의 두 증상(요청 body 검증 테스트를 나중에 따로 추가해야 했고, 모킹한 응답이 실제와 다를 수 있다는 의심)은 "실제 구조를 빠짐없이 흉내 낸다"가 사람과 에이전트의 주의에만 맡겨진 데서 나온다. 문헌은 공통적으로 충실도를 기계적 검사(fake 자체의 테스트, contract test, 같은 스키마 대조)로 보장한다. AI 에이전트용 지침이라면 "충실하게 흉내 내라"보다 "test double은 실제와 같은 스키마·테스트로 검사되게 만들어라"라는 검증 가능한 형태가 맞다. 이것은 전역 규칙 D-59(결정론적으로 판별할 수 있는 것만 정적 분석)와도 맞는다. 스키마 일치는 결정론적으로 판별할 수 있기 때문이다.
- qef 절의 "mock" 한 단어가 stub, fake, mock을 다 가리킨다는 점도 손볼 후보다(1절).

### Gaps
- qef 절이 쓰인 배경(어떤 사용자 원문에서 나왔는지)은 `decisions.md`를 보지 않아 확인하지 않았다. 맡은 범위 밖이다.

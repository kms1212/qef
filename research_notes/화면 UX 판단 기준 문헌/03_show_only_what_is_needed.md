# 필요한 것만 보여 준다: progressive disclosure, 정보 최소화, 내비게이션·검색 필드 관례, 내부 상태 숨기기

모든 출처는 2026-11-09에 가져왔다. 표기 규칙은 01과 같다(「본문 확인」은 WebFetch 요약 모델을 거친 추출, 「검색 요약만」은 원문을 열지 못함). 인용은 15단어 이내다.

## 결론

- 무엇을 앞에 둘지는 「사용자 필요」와 「사용 빈도」로 정한다. 새 설계는 과업 분석, 기존 시스템은 사용 빈도 데이터로 고르고, 둘 다 관찰로 확인하라는 것이 NN/g다. GOV.UK 원칙은 「Start with user needs」「Do less」로 같은 방향을 정책으로 둔다. 둘 다 에이전트가 혼자 만들 수 있는 근거가 아니다. 요구사항(사용자 원문)과 이전 버전의 화면 목록이 그것을 대신한다.
- 정보를 추가하는 쪽에는 근거가 요구된다. Nielsen의 Aesthetic and Minimalist Design(01), ISO 9241-110의 「unnecessary information」(01), NN/g cognitive load 글, OWASP API3:2023의 「bare minimum」은 모두 「쓰지 않는 정보는 비용」이라는 쪽이다.
- 내부 구현 상태를 드러내지 않는다는 근거는 세 겹이다. (1) 화면 문구: NN/g Match 원칙의 「system-oriented terms」 대신 사용자 말, GOV.UK 오류 문구의 시스템 레이블 금지. (2) 과업 적합성: ISO 9241-110이 기능을 기술이 아니라 과업 특성에 맞추라고 함(01). (3) API: OWASP는 endpoint가 객체의 모든 속성을 반환하는 것을 위험으로 들고, 필요한 속성만 골라 반환하고 응답 스키마로 검증하라고 함. KodeKoreaIMS의 「마스터 키」 상태 필드는 (3)이 먼저 깨져 (1)에 영향을 미친 사례로 읽을 수 있다(추론).
- 「홈이 메뉴 맨 앞」은 보편 규칙이 아니라 여러 설계 시스템의 관례다. NN/g는 logo와 명시적 Home 링크를 둘 다 두고 왼쪽 위에 두라고 한다. SAP Fiori는 side navigation의 첫 항목을 Home으로 요구한다는 검색 요약이 있다(원문 403). 캐나다 GC Design System은 최상위 항목을 사용자에게 중요한 순서로 두라고 한다. 따라서 「그룹 안 순서」를 「메뉴 전체 순서」로 넓혀 홈 앞에 다른 항목을 둔 것은 이 관례들에 어긋난다.
- 검색 필드는 placeholder만으로 레이블을 대신하지 않고, 검색 범위를 말로 알린다. 필드 이름을 나열하는 레이블을 권하는 출처는 찾지 못했다. GOV.UK와 Carbon의 예는 「Search [your service]」「Search for networks or devices」처럼 무엇을 찾는지를 말한다.

## progressive disclosure

- [NN/g, Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) — 본문 확인.
  - 「defers advanced or rarely used features to a secondary screen」
  - 나누는 근거: 새 설계는 task analysis·field study, 기존 시스템은 frequency-of-use 데이터. analytics만으로는 오도될 수 있으니 「supplement such analytics with observational usability testing」
  - 경고: 두 단계를 넘으면 사용성이 낮다(「beyond 2 disclosure levels typically have low usability」). 첫 화면을 과하게 채우는 것과 자주 쓰는 것을 숨기는 것 둘 다 해롭다. 고급 옵션으로 가는 진입점을 여러 개 두지 않는다.

## GOV.UK 원칙과 Service Standard

- [GOV.UK, Government Design Principles](https://www.gov.uk/guidance/government-design-principles) — 본문 확인. 원칙 11개: Start with user needs, Do less, Design with data, Do the hard work to make it simple, Iterate. Then iterate again, This is for everyone, Understand context, Build digital services, not websites, Be consistent, not uniform, Make things open, Minimise environmental impact.
  - 「Service design starts with identifying user needs.」
  - Be consistent: 「use the same language and the same design patterns wherever possible」
  - Do less의 본문 첫 문장은 정부의 역할 범위에 대한 것이다(「Government should only do what only government can do.」). 「기능을 덜 만든다」로 바로 옮기는 것은 확대 해석이다.
- [GOV.UK Service Standard](https://www.gov.uk/service-manual/service-standard) — 본문 확인. 14개 항목 중 1 Understand users and their needs, 2 Solve a whole problem for users, 4 Make the service simple to use, 13 Use and contribute to open standards, common components and patterns.
- [Service Standard point 1](https://www.gov.uk/service-manual/service-standard/point-1-understand-user-needs) — 본문 확인.
  - 「Testing your assumptions early and often reduces the risk of building the wrong thing.」
- [Service Standard point 4](https://www.gov.uk/service-manual/service-standard/point-4-make-the-service-simple-to-use) — 본문 확인.
  - 「Build a service that's simple, intuitive and comprehensible.」
  - 「test for usability frequently with actual and potential users」
  - 「being consistent with the design of GOV.UK」

## 정보 최소화

- [NN/g, Minimize Cognitive Load to Maximize Usability](https://www.nngroup.com/articles/minimize-cognitive-load/) — 본문 확인.
  - 「Avoid visual clutter: redundant links, irrelevant images, and meaningless typography flourishes」
  - 이미 익숙한 레이블과 배치를 쓰면 「reduce the amount of learning」
- Nielsen #8 Aesthetic and Minimalist Design, ISO 9241-110 Suitability for the user's tasks: 01 노트에 있다.

## 내비게이션 관례

- [GOV.UK Design System, Help users navigate a service](https://design-system.service.gov.uk/patterns/navigate-a-service/) — 본문 확인.
  - 「Links within your service must go to the most important top-level sections.」
  - 「Navigation is not a site map and does not need to list every part of your service.」
  - 서비스 안 링크를 먼저, 외부 링크는 묶어서 뒤에. 서비스 이름은 서비스 홈으로 링크.
  - 끝에서 끝까지 정해진 흐름이 있으면 내비게이션 링크 대신 task list를 쓴다.
- [GOV.UK Design System, Service navigation](https://design-system.service.gov.uk/components/service-navigation/) — 본문 확인. 순서·개수 규칙은 없고 위 패턴을 가리킨다. 현재 위치를 `active`로 표시하는 예가 있다.
- [NN/g, Menu Design: Checklist](https://www.nngroup.com/articles/menu-design/) — 본문 확인.
  - 「Use Clear, Specific, and Familiar Wording for Link Labels」
  - 현재 위치 표시를 「probably the single most common mistake」로 꼽는다.
  - 자주 쓰는 항목을 메뉴를 여는 곳 가까이 둔다. 「가장 중요한 것을 맨 앞」을 독립 지침으로 두지는 않는다.
- [NN/g, Homepage Links](https://www.nngroup.com/articles/homepage-links/) — 본문 확인.
  - logo와 Home 링크 둘 다: 「You should use both these types of links.」
  - 「Positioning them towards the top left of the page (above the content)」
  - 홈 화면에서는 Home을 선택 상태로 표시하거나 숨긴다.
- [GC Design System, Side navigation](https://design-system.canada.ca/en/components/side-navigation/design) — 본문 확인.
  - 「order top level items by importance or highest priority for the person」
  - 찾는 항목을 아는 목록은 가나다(알파벳)순. 같은 종류를 묶고 3단계까지.
- [Carbon, UI shell left panel](https://carbondesignsystem.com/components/UI-shell-left-panel/usage/) — 본문 확인. 순서나 홈 링크 규칙은 없다. 2단계까지만 지원(「does not support three tiers of navigation」).
- [SAP Fiori, Side Navigation](https://www.sap.com/design-system/fiori-design-web/v1-145/ui-elements/side-navigation/usage) — 검색 요약만(원문 403). 첫 요소는 「Home」이고 진입 화면으로 연결해야 한다는 요약.

## 검색 필드 레이블

- [NN/g, Placeholders in Form Fields Are Harmful](https://www.nngroup.com/articles/form-design-placeholders/) — 본문 확인.
  - 「Disappearing placeholder text strains users' short-term memory.」
  - 「clear, visible labels that are placed outside empty form fields」
- [Carbon, Search usage](https://carbondesignsystem.com/components/search/usage/) — 본문 확인. placeholder는 「Useful and short text hinting at what the user can search for」, 예는 「Search for networks or devices」.
- [GOV.UK, Help users navigate a service](https://design-system.service.gov.uk/patterns/navigate-a-service/) — 본문 확인. 서비스 검색의 placeholder는 범위를 말한다: 「Search [your service]」.
- 검색 요약만: Microsoft·Fluent UI는 검색 범위를 prompt·hint text로 알리라고 하고, Dynatrace는 단독으로 쓴 「Search」 레이블을 경계한다는 요약([Fluent UI SearchBox best practices](https://cdn.jsdelivr.net/npm/@fluentui/react-examples@8.34.4/src/react/SearchBox/docs/SearchBoxBestPractices.md), [Dynatrace SearchInput](https://developer.dynatrace.com/design/components/forms/SearchInput/usage/)).
- 「검색 대상 필드를 나열한 레이블」을 직접 다룬 1차 출처는 찾지 못했다. 위 출처들은 범위를 사용자의 말로 짧게 말하라는 데서 모인다.

## 내부 구현 상태를 사용자에게 드러내지 않는다

- [NN/g, Match Between the System and the Real World](https://www.nngroup.com/articles/match-system-real-world/) — 본문 확인.
  - 사용자 말을 쓰고 「rather than system-oriented terms」
  - 「never assume that our own interpretations and understanding of words」가 사용자와 같다고
  - 「internal-facing acronyms」를 쓴 알림 예.
  - 내부 구조나 구현 세부 노출을 직접 다루지는 않는다. 정보를 시스템 순서가 아니라 사용자 흐름 순서로 두라는 것이 가장 가깝다.
- [GOV.UK Design System, Error message](https://design-system.service.gov.uk/components/error-message/) — 본문 확인.
  - 「form post error」「error 0x0000000643」 같은 시스템 레이블을 쓰지 않는다.
  - 서비스 페이지 문제는 입력 오류 메시지가 아니라 다른 페이지(problem with the service)로.
- [OWASP API Security Top 10 2023, API3 Broken Object Property Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization) — 본문 확인.
  - 「APIs tend to expose endpoints that return all object's properties.」
  - 권장 사항: generic serialization을 피하고 반환할 속성을 고른다. 「Keep returned data structures to the bare minimum」. 응답 스키마 검증을 한 겹 더 둔다.
- ISO 9241-110 Suitability: 기능은 「based on the task characteristics (rather than the technology chosen」(01).

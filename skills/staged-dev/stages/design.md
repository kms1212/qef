# 구조 설계·검토 (design)

이 단계에서는 프로젝트 파일을 쓸 수 없다 (셸 포함, 샌드박스가 막는다). 읽기 명령과 실행 폴더 쓰기는 된다. 서브에이전트는 실행 폴더에만 쓴다. 지시는 `../criteria/brief.md` 틀로 쓴다.

## 작업 트리 준비

조사보다 먼저 작업 트리를 준비한다: 서브모듈 초기화(`git submodule update --init --recursive`), 의존성 설치(lockfile에 맞는 `npm ci`·`pnpm install --frozen-lockfile` 등). 의존성이 설치돼야 언어 서버와 의존성 코드를 읽을 수 있다.

준비가 끝나기 전에는 코드베이스 조사를 띄우지 않는다. 오래 걸리면 백그라운드로 돌리고, 그동안 기존 해결 방법 조사부터 띄운다.

## 조사 (동시에 2개, 경계 조사를 띄우면 3개)

- **코드베이스 조사.** 이 코드베이스에서 재사용할 수 있는 모듈, 유사 기능, 테스트 프레임워크·실행 명령, 코딩 관례를 조사한다. 프로젝트 문서(아키텍처 문서, ADR, CONTRIBUTING, 스타일 가이드 등)가 있으면 경로와 핵심 규칙을 findings에 적는다. 관례는 근거가 되는 파일:줄과 함께 적는다. 서브모듈이 있으면 초기화돼 있는지 확인하고, 비어 있는 서브모듈은 findings 맨 앞에 적는다. 비어 있는 서브모듈 대신 다른 체크아웃을 읽지 않는다.
  보고: `design-research-codebase.json`
- **기존 해결 방법 조사.** 스킬 `modern-web-guidance:modern-web-guidance` (웹 프론트엔드(HTML/CSS/브라우저 JS) 작업일 때만). 이 문제를 해결하는 기존 방법(라이브러리, 표준, 알려진 패턴, 다른 프로젝트 사례)을 웹·문서로 조사하고 장단점을 비교한다. 패키지·모듈 수준 해법만이 아니라 타입 수준 설계 패턴(다형성, 값 객체, 의존 역전, 전략 등)도 찾는다. 이 작업이 걸친 분야를 판별하고, 분야마다 이런 작업에서 반드시 정해야 할 설계 결정 항목과 그에 대한 공식 문서·널리 인정된 관례를 출처 URL과 함께 findings에 적는다.
  보고: `design-research-prior-art.json`
- **경계 조사.** refactor 모드에서는 항상, extend 모드에서는 변경이 패키지 경계를 넘을 때(둘 이상의 패키지를 건드리거나 새 패키지를 만들 때) 띄운다. build 모드에서는 띄우지 않는다. 대상은 이번 작업이 건드리는 패키지와, 그 패키지에 기대거나 그 패키지가 기대는 패키지다. 패키지마다 의존 선언, 공개하는 것, 실제 import, 실제로 하는 일 한 문장을 모은다. 프로젝트의 기능 명세가 있으면 명세의 영역과 패키지를 맞대어 본다. `git log --name-only`로 함께 바뀌는 패키지 짝을 센다. 그다음 `criteria/structure.md`의 "패키지·모듈 경계 규칙"을 적용한다. 목표 지도는 그리지 않는다 (설계자가 그린다). 코드만으로 정할 수 없는 것은 openQuestions에 적는다.
  보고: `design-research-boundaries.json`. 형식은 아래 조사 보고 형식이 아니라 이것이다:

  ```json
  {
    "current": [{ "name": "패키지", "oneSentence": "실제로 하는 일", "dependsOn": [], "usedBy": [], "fails": ["한 문장 | 한 곳 | 한 방향 | 계약의 주인 | 함께 바뀜"] }],
    "coChange": [{ "pair": ["a", "b"], "commits": 0, "reading": "왜 함께 바뀌는지" }],
    "issues": [<criteria/review-lenses.md의 지적 형식>],
    "openQuestions": ["사용자가 정해야 하는 것"]
  }
  ```

  메인 세션은 openQuestions를 `feedback.json`에 type question으로 남겨 설계 체크포인트에서 함께 묻는다 (`checkpoint-feedback.md`의 "단계 도중 내가 찾은 질문").

조사 보고 형식:

```json
{
  "findings": ["발견한 것"],
  "reusable": [{ "name": "이름", "location": "파일:줄, 패키지명@버전, 또는 표준 라이브러리 API", "source": "codebase | dependency | stdlib | external-library", "covers": "요구사항 중 어떤 부분을 해결하는가" }],
  "recommendation": "추천"
}
```

코드베이스 조사가 빈 서브모듈을 보고하면 설계로 넘어가기 전에 사용자에게 알리고 어떻게 할지 묻는다.

## 설계 (1개)

스킬 `engineering:system-design`, `engineering:architecture` (architecture는 대안 비교와 트레이드오프 정리에만 쓰고 결과는 overview에 넣는다). 읽을 것: 요구사항, 조사 보고 전부(경계 조사를 띄웠으면 셋), `criteria/structure.md` 전체(작업 모드 절과 "모든 모드 공통").

지시:
- 구조를 설계한다. 공통부(common)와 나머지(rest)로 나누고, rest는 의존 순서대로 적는다.
  - common에 넣는 것: rest 컴포넌트 두 개 이상이 실제로 쓰는 것, 또는 컴포넌트 사이의 계약(타입, 인터페이스)
  - common에 넣지 않는 것: "나중에 쓸 수도 있는 것"
- 각 컴포넌트의 파일과 테스트 파일 경로를 구체적으로 적는다. 통합 테스트 파일도 fileTree에 role=test로 넣는다.
- 각 컴포넌트의 reuse에 조사된 reusable 후보를 쓰는지(reuse/extend) 새로 만드는지(new) 정하고, new라면 관련 후보 각각을 왜 못 쓰는지 reason에 적는다.
- refactor 모드면 `structure.md` refactor 절의 구조 대안 비교를 overview에 넣는다.
- 경계 조사 보고가 있으면 이번 작업이 건드리는 패키지의 목표 경계를 정해 `boundaries.json`에 쓴다. 층을 어떻게 나누고 어떤 순서로 둘지는 decisions에 넣는다.
- 코드는 쓰지 않는다.
- 쓰기 전에 스스로 점검한다. 아래에 해당하는 것은 decisions나 deviation이 아니라 requirementProposals에 넣는다.
  - 요구사항 문장의 적용 범위를 넓히거나 좁혀 읽은 곳
  - 승인된 가정과 다르게 동작할 수 있는 경우 (동시 실행, 일부만 처리됨 등)
  - 요구사항이 다루지 않은 입력 (값으로 넘기는 인자, 다른 진입점 등)
- 결과는 `structure.md`의 "설계 형식"대로 `<실행 폴더>/design/`의 파일들로 쓴다. 보고 파일은 따로 쓰지 않는다.

## 검토 (동시에 5개)

관점마다 하나씩, 한 메시지에 함께 띄운다. 스킬은 쓰지 않는다. 대상은 "아직 구현 전인 설계"다. 모든 관점이 읽을 것: 요구사항, `criteria/structure.md`의 작업 모드 절과 "모든 모드 공통", `criteria/review-lenses.md`의 맡은 관점 절·"심각도 기준"·"지적 형식". 설계는 관점에 필요한 파일만 넘긴다.

| 관점 | 읽을 설계 파일 |
|---|---|
| 요구사항 충족 | `components.json`, `decisions.json`, `requirement-proposals.json` |
| 단순성·결합도 (재사용 결정 포함) | `overview.json`, `components.json`, 코드베이스·기존 해결 방법 조사 보고 |
| 정확성·엣지케이스 | `overview.json`, `components.json`, `decisions.json` |
| 설계 근거 | `overview.json`, `decisions.json`, 코드베이스·기존 해결 방법 조사 보고 |
| 파일·디렉터리 구조 | `file-tree.json`, `components.json`, `refactor-candidates.json`, `boundaries.json`과 경계 조사 보고 (있으면) |

보고: `design-review-<관점>.json`. 메인 세션은 지적을 `issues.json`에 stage=design으로 옮기고 id를 붙인다.

## 설계 수정 (지적이 있을 때 1개)

스킬 `superpowers:receiving-code-review`. 읽을 것: 요구사항, 설계(`design/` 전체), `issues.json`에서 이번 지적 중 blocker·major, `criteria/structure.md`의 작업 모드 절과 "모든 모드 공통", `criteria/review-lenses.md`의 "지적을 반영하지 않을 때".

지시: 타당한 지적을 반영해 `design/`에서 바뀌는 파일을 고쳐 쓴다. minor는 넘기지 않는다 (체크포인트에서 보여준다). 지적마다 반영했는지(fixed) 반영하지 않았는지(rejected, 이유)를 보고의 issuesHandled에 id로 적는다. 설계 본문에서 지적을 가리킬 때는 id를 쓴다.

보고: `design-fix.json` (`{ "issuesHandled": [{ "id", "status", "resolution" }] }`). 메인 세션이 `issues.json`의 status와 resolution을 갱신한다. issuesHandled에 없는 지적은 open으로 남긴다.

## 외부 라이브러리 검색

`criteria/reuse.md`의 "설계 직후: 외부 라이브러리 검색"과 "반박 검증"을 따른다. 컴포넌트(common과 rest 전부)마다 하나씩 한 메시지에 띄우고(`design-library-<컴포넌트>.json`), 나온 후보마다 반박자 둘을 한 메시지에 띄운다(`design-library-refute-<번호>-<1|2>.json`). 결과는 `reuse.json`에 남긴다. 확정된 후보는 체크포인트에서 채택 여부를 묻는다.

## 제출

`mcp__qef__qef_submit`:
- summary: 컴포넌트 구성, 새 파일 수, 남은 지적 수, 사용자 확인이 필요한 항목 수를 몇 줄로
- artifact.files: `design/file-tree.json`를 `{ path, role, responsibility }`로 옮긴 것

설계 체크포인트에서 사용자 승인을 기다린다. 보여줄 것과 지적 처리는 `checkpoint-feedback.md`.

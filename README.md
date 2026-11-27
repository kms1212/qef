# QEF

QEF(Quod erat faciendum)는 Claude Code 플러그인입니다. 에이전트가 코드, 문서, 화면을 다룰 때 따를 판단 기준을 상황별 skill로 묶었습니다.

## 하는 일

skill 하나는 한 상황에서 쓰는 기준을 담습니다. 코드를 쓰기 전, 테스트가 실패했을 때, 문서를 쓸 때마다 부르는 skill이 따로 있습니다. skill은 세 종류입니다.

- **판단 skill**은 원칙마다 의도, 규칙, 확인할 것, 근거 출처를 둡니다. 규칙에 없는 상황은 그 원칙의 의도로 판단하게 합니다. 실제 프로젝트에서 틀렸던 장면과 바르게 고친 모습은 skill 폴더의 `references/cases.md`에 있습니다.
- **언어·형식 skill**은 그 언어나 형식에서 코드를 찾고, 바꾸고, 검사하고, 테스트할 때 쓰는 도구를 담습니다. 저장소에 그 언어를 처음 들일 때 갖출 것도 담습니다.
- **저장소 skill**은 새 저장소를 만들 때 갖출 것을 담습니다.

## skill이 불리는 방식

Claude Code는 skill 목록에서 각 skill의 이름과 description을 봅니다. 작업이 description에 적힌 상황에 이르면 그 skill을 불러 읽습니다. QEF의 description은 부를 상황을 한 문장으로만 적습니다.

[OpenSpec 포크](https://github.com/kms1212/OpenSpec)와 함께 쓰면, spec-driven schema가 QEF skill을 이름으로 부르도록 지시합니다. 설계 단계에서는 결정의 종류마다 skill을 부르고, 구현 단계에서는 작업 상황마다 skill을 부릅니다.

QEF는 훅을 쓰지 않습니다. 설치하면 skill만 추가됩니다.

## skill 목록

다음 표에서 skill마다 부르는 때와 담긴 내용을 찾을 수 있습니다.

| skill | 부르는 때 | 담는 것 |
|---|---|---|
| `qef:dev` | 코드를 읽거나 쓰기 전 | 구조 판단의 기준, 요청하지 않은 것을 만들기 전의 허가, 재사용과 의존, 중복과 노출, OpenSpec change 안에서 하는 일, 코드를 바꾼 뒤의 보고 |
| `qef:model` | 타입, 클래스, enum, DB 필드를 만들거나 바꾸기 전, 값을 클래스·값·데이터 중 어디에 둘지 정하기 전 | 개념과 타입 관계, 값을 데이터와 코드 중 어디에 둘지, 업무에서 가져오는 관계 |
| `qef:db` | 테이블, 컬럼, 관계, 인덱스를 정하거나 바꾸기 전, DB를 읽고 쓰는 코드를 쓰기 전 | 업무 관계와 기록용 참조 가르기, 역할로 짓는 관계 이름, schema를 개념별로 묶고 같은 순서로 쓰기, 조회 방식, ORM relation 선언 |
| `qef:layout` | 파일, 모듈, 디렉터리를 만들거나 옮기기 전, 의존 방향이나 데이터 흐름이나 내비게이션 경로를 바꾸기 전 | 경계와 배치를 나누는 기준, 의존 규칙을 검사로 두는 방법 |
| `qef:testing` | 테스트를 쓰거나 고치기 전, 테스트가 실패했을 때 | 테스트를 돌리는 때, 실패를 다루는 순서, 테스트 계층, 격리, test double |
| `qef:command` | 빌드, 테스트, CI 대기, 서버처럼 오래 걸리는 명령을 돌리기 전 | 실패를 알아볼 수 있게 돌리기(로그, 종료 코드, 시간 제한), 끝난 뒤 결과를 읽고 실패면 원인 찾기 |
| `qef:investigate` | 오류, 실패, 자원 이상 같은 예상 밖 동작을 보거나 지적받았을 때, 원인이나 대책을 말하기 전 | 원인을 찾는 기법, 가설 세우기, 고치는 위치 |
| `qef:refactor` | 이미 있는 코드의 이름, 위치, 구조를 바꾸거나 옛것을 새것으로 바꾸기 전 | 옛것을 먼저 지우는 순서, 재작성 판단, 동작이 같다는 근거, LSP와 리팩터링 도구로 하는 기계적 변경 |
| `qef:ux` | 사람이 쓰는 화면의 업무 흐름, 표시할 것, 순서, 입력, 문구를 정하거나 리뷰하기 전 | 화면 설계 순서, 화면에 둘 것을 고르는 기준, 이름과 문구, 권한과 화면의 대응 |
| `qef:ui` | 사람이 쓰는 화면의 모양을 정하거나 리뷰하기 전(`qef:ux`와 함께) | 같은 종류의 모양, 강조, 정렬과 공간, 상태 설계 |
| `qef:delegate` | subagent나 다른 세션에 일을 맡기기 전, 다른 세션이 시작했거나 넘겨받은 세션으로 시작할 때, 맡긴 일의 질문과 결과를 다루기 전 | 세션의 종류와 그 역할, 맡긴 쪽과 맡은 쪽의 역할, subagent 질문에 답하기, 할 일만 쓰는 지시, 일을 나누는 방식 |
| `qef:rules` | 규칙, skill, 에이전트 지시문, 메모리를 쓰거나 고치기 전, 지적을 받아 규칙을 바꾸려 하기 전 | 규칙을 더하기 전에 따질 것, 규칙을 둘 자리, 사용자의 말을 바꿔 쓰지 않기, 평이하게 쓰기, 기록 정리 |
| `qef:web` | 웹 백엔드 API나 브라우저 프론트엔드의 구조를 정하거나 바꾸기 전 | API의 경로와 도메인 나누기, 입력과 오류, 프론트엔드의 코드와 상태 배치 |
| `qef:doc` | 독자가 읽는 문서를 쓰거나 고치거나 리뷰하기 전 | 문서 종류에 맞는 문장, 산문·표·다이어그램·리스트를 고르는 기준, 표와 다이어그램을 만드는 방법, 용어, 참조, 문장 다듬기 skill 고르기 |
| `qef:js-ts` | `package.json`이나 `tsconfig.json`이 있는 저장소에서 일하기 전, JS/TS를 들이기 전 | 코드 찾기와 바꾸기, 정적 분석, 테스트 도구 |
| `qef:python` | `pyproject.toml`, `setup.py`, `requirements.txt`가 있는 저장소에서 일하기 전, Python을 들이기 전 | 실행 환경, 코드 찾기와 바꾸기, 타입, 정적 분석, 테스트 도구 |
| `qef:latex` | `.tex`, `.sty`, `.cls` 파일을 다루거나 LaTeX 문서를 빌드하기 전 | 빌드, 찾기와 바꾸기, 검사, PDF 결과 비교, 표와 다이어그램 그리기 |
| `qef:sail` | `.sail`, `.sail_project` 파일을 다루거나 Sail 모델을 검사·생성하기 전 | 실행, grep으로 찾기, 타입 검사와 property 검사, 포맷, 문서 백엔드 |
| `qef:git` | 커밋, 스테이징, branch·worktree 만들기와 정리, merge·rebase, push, CI 실행을 하기 전 | 논리적 변경마다 나누는 커밋, 고치는 커밋을 먼저 내기, 파일 이름으로 하는 스테이징과 저장소에 넣을 파일 표, 커밋 메시지, 되살릴 수 없는 것을 버리지 않기, harness가 아는 worktree, push 전 로컬 검사와 합친 결과 확인 |
| `qef:repo` | 새 저장소를 만들 때 | git, 무시할 파일, OpenSpec 초기화, 언어별 준비 |

## 설치

marketplace를 추가합니다.

```bash
claude plugin marketplace add kms1212/qef
```

플러그인을 설치합니다.

```bash
claude plugin install qef@qef
```

새 버전을 받을 때는 marketplace를 먼저 갱신하고 플러그인을 갱신합니다. 갱신한 플러그인은 Claude Code를 다시 시작한 뒤에 적용됩니다.

```bash
claude plugin marketplace update qef
```

```bash
claude plugin update qef@qef
```

### OpenSpec 포크

qef를 부르는 작업 절차는 OpenSpec 포크의 spec-driven schema에 있습니다. 포크는 npm에 따로 올라가 있지 않고 패키지 이름도 upstream과 같은 `@fission-ai/openspec`입니다. 그래서 npm에서 설치하면 qef를 부르지 않는 upstream schema가 깔립니다. 포크를 내려받아 빌드한 뒤 전역으로 설치합니다.

```bash
git clone https://github.com/kms1212/OpenSpec.git && cd OpenSpec
```

```bash
pnpm install && pnpm build && npm install -g .
```

설치된 schema가 포크인지는 아래 명령의 결과가 0보다 큰지로 확인합니다. 0이면 upstream이 깔린 것입니다.

```bash
grep -c 'qef:' "$(npm root -g)/@fission-ai/openspec/schemas/spec-driven/schema.yaml"
```

upstream의 변경을 받을 때는 포크 폴더에서 upstream을 머지하고 다시 빌드합니다. upstream 원격이 없으면 먼저 `git remote add upstream https://github.com/Fission-AI/OpenSpec.git`으로 더합니다.

```bash
git fetch upstream && git merge upstream/main && pnpm build
```

## 함께 쓰는 도구

QEF skill은 다른 skill과 플러그인을 가리킵니다. 없어도 QEF는 설치되지만, 그 도구를 가리키는 규칙은 지킬 수 없습니다.

| 도구 | 가리키는 skill | 쓰는 곳 |
|---|---|---|
| [OpenSpec 포크](https://github.com/kms1212/OpenSpec) | 전체 | 작업 절차. 설계와 구현 단계에서 QEF skill을 부릅니다 |
| `ste80-humanizer` | `qef:doc` | 영어 산문 다듬기 |
| `korean-humanizer` | `qef:doc`, `qef:ux` | 한국어 산문과 화면 문구 다듬기 |
| `design:ux-copy` | `qef:ux` | 화면 문구 쓰기와 리뷰 |
| `design:accessibility-review` | `qef:ui` | 접근성 감사 |
| `modern-web-guidance` | `qef:ui` | 브라우저 기능 구현 가이드 |
| `design-postgres-tables`, `postgres-database-migration` | `qef:db` | PostgreSQL의 타입·제약 조건·인덱스, 마이그레이션 |
| `githits-mcp`, `githits-package` | `qef:dev` | 오픈소스 구현과 패키지 찾기 |
| `typescript-lsp`, `pyright-lsp` | `qef:js-ts`, `qef:python` | Claude Code의 정의·참조 찾기 |

## 저장소 구조

```
.claude-plugin/
├── marketplace.json
└── plugin.json
skills/
└── <skill>/
    ├── SKILL.md            원칙이나 도구 목록
    ├── criteria/           웹 API와 프론트엔드의 세부 기준(web)
    └── references/         web을 뺀 판단 skill에만 있음
        ├── cases.md        사용자가 실제 프로젝트에서 짚은 장면
        ├── NOTICE.md       다른 저장소에서 옮긴 파일의 출처와 라이선스(dev, ui, ux)
        └── licenses/       그 라이선스 원문
```

## 라이선스

QEF는 [Apache License 2.0](LICENSE)을 따릅니다. `references/` 아래 다른 저장소에서 옮긴 파일은 각자의 원래 라이선스를 따릅니다. 파일마다의 라이선스는 그 폴더의 `NOTICE.md`에 적었습니다.

## 출처

판단 skill의 규칙마다 근거로 삼은 출처를 「근거」 줄에 적었습니다. `references/` 아래 일부 파일은 다른 저장소에서 옮긴 것입니다. 그 출처와 라이선스는 같은 폴더의 `NOTICE.md`와 `licenses/`에 있습니다.

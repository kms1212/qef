---
name: js-ts
description: package.json이나 tsconfig.json이 있는 저장소에서 일하기 전에, 그리고 저장소에 JS/TS를 들이기 전에 반드시 호출한다.
---

# js-ts

아래는 후보다. 프로젝트에 이미 있는 것을 먼저 쓰고, 없는 것은 `qef:dev`의 「쓰기 전에 이미 있는 것을 찾는다」의 새 의존성 문단대로 하며, 설치 방법과 지금 상태는 그때 공식 문서로 확인한다. 스택이 구조를 정한 위치는 그 스택의 관례를 따른다.

## 들일 때

저장소에 JS/TS를 처음 들이면 아래를 처음부터 갖춘다. 나중에 들이면 그동안 쓴 코드를 다시 맞춰야 한다.

| 갖출 것 | 후보 |
|---|---|
| Node와 패키지 매니저 버전 고정 | `package.json`의 `engines`와 `packageManager`, lockfile |
| 타입 검사 | `tsconfig.json`의 `strict` |
| 포매터와 lint | Biome(포맷과 lint를 함께 맡는다), 또는 ESLint(typescript-eslint)와 Prettier |
| 테스트 실행기 | 단위는 Vitest, 브라우저는 Playwright(「테스트할 때」) |
| 의존 규칙 검사 | dependency-cruiser(`qef:layout`의 「의존 규칙은 검사로 둔다」) |
| 코드 찾기 | Claude Code `typescript-lsp` 플러그인과 `typescript-language-server`, `typescript` |
| 커밋 훅 | lint와 format만 건다(`qef:testing`) |
| 무시할 파일 | GitHub Node 템플릿(`qef:repo`의 「무시할 파일」), 빌드 폴더 |

## 코드를 찾을 때

| 일 | 도구 |
|---|---|
| 정의, 참조, 구현, 호출 계층 구조, 타입 | Claude Code LSP 도구. code intelligence 플러그인과 언어 서버 바이너리가 있어야 켜진다 |

LSP 도구는 읽기 전용이다. 이름 바꾸기는 아래 도구로 한다.

## 코드를 바꿀 때

| 일 | 도구 |
|---|---|
| 심볼 이름 바꾸기, 모든 참조 갱신 | ts-morph `rename`, mcp-ts-morph |
| 파일·폴더 옮기기, import 경로 갱신 | ts-morph `SourceFile.move`, mcp-ts-morph |
| 심볼을 다른 파일로 옮기기, 함수 시그니처 바꾸기 | mcp-ts-morph |

mcp-ts-morph의 한계는 README에 있다. 이 경우는 언어 서버로 참조를 찾은 뒤 결과를 진단으로 확인한다.

- `export default Identifier;`의 참조 갱신, default export 심볼 이동
- 스프레드 인자가 있는 호출의 시그니처 변경
- 쓰지 않는 export 검증에서 동적 import와 파일 시스템 기반 라우팅
- 빌드 아티팩트를 export하는 monorepo 패키지의 오탐

## 정적 분석할 때

| 잡는 것 | 도구 |
|---|---|
| 고아 파일 | dependency-cruiser |
| 쓰지 않는 의존성, export, 파일 | Knip |
| 중복 코드 | jscpd |

의존 방향, 금지 의존, 순환은 측정이 아니라 규칙이다. `qef:layout`의 「의존 규칙은 검사로 둔다」를 따른다.

측정한 결과는 판단의 입력이다. 도구가 잡지 못하는 개념과 타입 관계는 `qef:model`, `qef:layout`으로 본다.

## 테스트할 때

| 일 | 후보 |
|---|---|
| stub HTTP 요청·응답을 서버 스키마로 검사 | MSW handler에서 서버와 공유하는 스키마(zod 등)로 parse. OpenAPI가 있으면 openapi-msw |
| 서버 응답이 스키마를 지키는지 단언 | 공유 스키마로 parse. OpenAPI가 있으면 vitest-openapi, jest-openapi |
| Playwright에서 worker마다 데이터 나누기 | worker 범위 fixture를 `parallelIndex`로 나눔. 로그인은 `storageState` 재사용 |
| Playwright 테스트 독립성 확인 | 그 spec만 `--repeat-each`로 반복 |

Playwright의 `test.describe.serial`은 쓰지 않는다. 하나가 실패하면 뒤가 모두 건너뛰어진다.

## 포맷과 lint

프로젝트의 포매터와 lint를 쓴다.

---
name: sail
description: .sail, .sail_project 파일을 다루거나 Sail 모델을 검사·생성하기 전에 반드시 호출한다.
---

# sail

아래는 후보다. 프로젝트에 이미 있는 것(빌드 스크립트, `.sail_project`, 생성기, 테스트)을 먼저 쓰고, 없는 것은 `qef:dev`의 「쓰기 전에 이미 있는 것을 찾는다」의 새 의존성 문단대로 하며, 옵션은 그때 설치된 Sail의 `sail --help`와 Sail 매뉴얼로 확인한다.

## 들일 때

저장소에 Sail 모델을 처음 들이면 아래를 처음부터 갖춘다.

| 갖출 것 | 후보 |
|---|---|
| Sail 버전 고정 | 프로젝트의 opam 파일에 `sail`과 쓰는 백엔드 패키지의 버전 제약을 적는다 |
| 파일과 모듈 순서 | `.sail_project` |
| 타입 검사와 속성 검사 | `--just-check`와 `--smt --smt-auto`를 빌드나 테스트에 건다(「검사할 때」) |
| 포매터 | 쓸지 정한다. 쓰면 `sail --fmt` |
| 무시할 파일 | `sail_smt_cache`, 생성 결과 폴더. GitHub 템플릿에는 Sail이 없다 |

## 돌릴 때

- 프로젝트가 정한 Sail(opam switch와 버전)로 돌린다. 백엔드는 따로 설치되는 opam 패키지(`sail_c_backend`, `sail_smt_backend`, `sail_doc_backend` 등)라서, 그 버전에 쓰려는 백엔드가 있는지 `sail --help`로 본다.
- Sail은 명령줄에 준 파일을 한 파일로 이어 붙인 것처럼 읽는다. 파일 목록과 순서는 프로젝트가 정한 것(`.sail_project`, 빌드 스크립트, 생성기)을 그대로 쓰고, 손으로 다시 늘어놓지 않는다. `.sail_project`가 있으면 그 파일을 넘기고, 실제로 읽히는 파일은 `sail --list-files <프로젝트 파일>`로 본다. 모듈 변수는 `--variable`로 준다.
- 타입 검사만 할 때는 `--just-check`로 돌린다.
- 타입 검사기는 z3 결과를 기본으로 현재 디렉터리의 `sail_smt_cache`에 캐시한다. 저장소 밖 경로(`--memo-z3-path`)에 두거나 `.gitignore`에 넣는다. 생성 결과(`-o`로 지정하는 C, SMT, 문서 파일)도 저장소 밖 빌드 폴더에 둔다.
- 경고 옵션(`--all-warnings`, `--strict-*`)은 프로젝트가 정한 것을 쓴다. 남은 경고는 결함으로 다룬다.

## 찾을 때

Claude Code에는 Sail용 LSP 플러그인이 없다. Sail 저장소의 개발판에 언어 서버(`sail_lsp`)가 있지만 진단, 정의로 가기, 포맷만 지원하고 참조 찾기와 이름 바꾸기는 없다. 그래서 찾기는 grep으로 한다.

Sail은 한 이름의 정의가 여러 곳에 흩어질 수 있다. 이름 하나를 찾을 때 아래를 모두 찾는다.

| 찾는 것 | 형식 |
|---|---|
| 타입 시그니처 | `val <이름>` |
| 함수 정의 | `function <이름>`, 흩어진 정의의 `function clause <이름>` |
| mapping | `mapping <이름>`, `mapping clause <이름>` |
| union, enum의 생성자 | `union <이름>`, `union clause <타입> = <생성자>`, `enum clause` |
| 흩어진 정의의 시작과 끝 | `scattered function`, `scattered union`, `scattered mapping`, `scattered enum`, `end <이름>` |
| overload | `overload <이름> = {...}`. 같은 이름의 overload 선언이 여러 개일 수 있다 |
| register, 전역 | `register <이름>`, `let <이름>` |
| 파일 포함 | `$include` |

흩어진 함수의 clause는 파일에 나온 순서대로 맞춰진다. clause를 옮기면 동작이 바뀔 수 있다.

## 바꿀 때

- 이름을 바꾸면 위 표의 형식과 overload 목록, 그 이름을 문자열로 쓰는 곳(생성기, 템플릿, 문서 쪽 표식)까지 모두 grep으로 고친다. 그 뒤 `--just-check`를 돌려 남은 참조를 찾는다. 이름 바꾸기 도구가 없어 빠뜨리기 쉽다.
- 생성된 Sail은 직접 고치지 않는다. 그것을 만드는 원본(데이터, 템플릿, 생성기)을 고치고 다시 생성한다. Sail에서 생성된 결과(문서, C, SMT)도 마찬가지로 원본 `.sail`을 고친다.
- 흩어진 정의에 clause를 더하면, 같은 타입과 함수의 다른 clause가 있는 자리의 관례(명령어마다 한 파일 등)를 따른다.

## 검사할 때

| 잡는 것 | 도구 |
|---|---|
| 타입 오류 | `sail --just-check` |
| 정한 속성이 모든 입력에서 성립하는지 | 속성을 `bool`을 돌려주는 함수로 쓰고 `$property`를 붙인 뒤 `sail --smt --smt-auto`로 돌린다. 성립하지 않으면 「Property check failure」로 끝나고 종료 코드가 0이 아니다. `$property` 대신 `$counterexample`을 붙이면, 반례를 찾았을 때 그 값으로 함수를 다시 실행해 보인다. 생성되는 `.smt2`는 `-o`로 저장소 밖에 둔다 |
| 남은 경고 | 「돌릴 때」의 경고 옵션으로 돌린 출력 |

## 테스트할 때

- 프로젝트에 Sail 모델로 만든 에뮬레이터(`-c`, `--ocaml`)와 테스트 프로그램이 있으면 그것으로 돌린다. C 백엔드는 `-O` 없이는 느리다.
- 모델의 동작을 바꿨으면, 바꾸기 전 모델로 돌린 결과와 비교한다(`qef:refactor`의 「동작이 같다는 근거」).

## 포맷

- 프로젝트가 Sail 포매터를 쓰면 `sail --fmt`(파일이나 `.sail_project`)로 맞춘다. 미리 보려면 `--fmt-emit stdout`, 일부 파일만은 `--fmt-only`, 빼려면 `--fmt-skip`를 쓴다. 포매터는 아직 실험 기능이라, 바뀐 부분을 diff로 확인한다.
- 프로젝트가 포매터를 쓰지 않으면 바꾸는 줄 밖의 공백과 줄바꿈을 다시 정렬하지 않는다.

## 문서로 낼 때

- Sail 모델을 문서에 보일 때는 문서 백엔드(`--doc`, `--latex`)의 출력을 쓰고, Sail 코드를 문서에 손으로 옮겨 적지 않는다.
- 동작의 정본은 Sail이고, 산문은 그것을 설명하기만 한다. 산문과 문서의 모양은 `qef:doc`을 따른다.

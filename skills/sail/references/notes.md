# Sail 동작 메모

Sail은 패키지 안에 문서가 실려 있지 않다. 아래는 Sail 0.20.2(opam)와 Sail 매뉴얼(rems-project/sail `doc/asciidoc/`)에서 확인한 동작이다. 설치된 버전이 다르면 `sail --help`와 그 버전의 매뉴얼로 다시 확인한다.

## 파일과 실행

- Sail은 명령줄에 준 파일을 한 파일로 이어 붙인 것처럼 읽는다(매뉴얼 `usage.adoc`).
- `.sail_project`를 넘기면 파일을 명령줄에 늘어놓지 않아도 된다. 실제로 읽히는 파일은 `sail --list-files <프로젝트 파일>`, 모듈 변수는 `--variable`로 준다(`modules.adoc`, `sail --help`).
- 백엔드는 따로 설치되는 opam 패키지다(`sail_c_backend`, `sail_smt_backend`, `sail_doc_backend` 등). 설치된 백엔드는 `sail --help`의 「invoke the Sail … target」 줄로 본다.
- 타입 검사기는 z3 결과를 기본으로 현재 디렉터리의 `sail_smt_cache`에 캐시한다(`--memo-z3`가 기본값, 경로는 `--memo-z3-path`).
- C 백엔드는 `-O` 없이는 생성된 코드가 느리다(`usage.adoc`).

## 정의와 찾기

- 함수, mapping, union, enum은 scattered definition으로 여러 곳에 나뉠 수 있다(`language.adoc` 「Scattered definitions」).
- scattered function의 clause는 파일에 나온 순서대로 맞춰진다(`riscv.adoc`). clause를 옮기면 동작이 바뀔 수 있다.
- 같은 이름의 `overload` 선언은 여러 개일 수 있다(`language.adoc`).
- 언어 서버 `sail_lsp`는 Sail 저장소의 개발 중인 코드에만 있고 0.20.2 opam 패키지에는 없다. 테스트(`test/lsp/run_tests.py`)로 보면 진단, 정의로 이동, 포맷만 지원하고 참조 찾기와 이름 바꾸기는 없다.

## property 검사

2026-11-26에 0.20.2에서 작은 예제로 직접 돌려 확인했다.

- `bool`을 돌려주는 함수에 `$property`를 붙이고 `sail --smt --smt-auto`로 돌리면, 성립할 때 「Solver could not find counterexample」로 끝나고 종료 코드는 0이다. 성립하지 않으면 「Property check failure」로 끝나고 종료 코드는 1이다.
- `$property` 대신 `$counterexample`을 붙이면, 반례를 찾았을 때 그 값으로 함수를 다시 실행해 보인다(「Replaying counterexample」). 종료 코드는 같다.
- 검사할 때 `-o`로 준 이름으로 `.smt2` 파일이 생긴다.

## 포맷

- 포매터는 `sail --fmt`이고 파일이나 `.sail_project`를 받는다. 미리 보기는 `--fmt-emit stdout`, 일부만은 `--fmt-only`, 빼기는 `--fmt-skip`이다. 매뉴얼은 이 기능을 아직 실험 기능이라고 적는다(`usage.adoc` 「Automatic formatting」).

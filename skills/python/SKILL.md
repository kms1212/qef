---
name: python
description: 저장소에 pyproject.toml, setup.py, requirements.txt가 있는 Python 프로젝트에서 코드를 읽거나 쓰거나 도구를 돌리기 전에 반드시 호출한다. 그때 쓰는 도구를 담는다.
---

# python

아래는 후보다. 프로젝트에 이미 있는 것(`pyproject.toml`의 `[tool.*]` 설정과 개발 의존성)을 먼저 쓰고, 없는 것은 `qef:dev`의 「쓰기 전에 이미 있는 것을 찾는다」의 새 의존성 문단대로 하며, 설치 방법과 지금 상태는 그때 공식 문서로 확인한다. 스택이 구조를 정한 위치는 그 스택의 관례를 따른다.

## 돌릴 때

- 프로젝트가 정한 실행기와 가상 환경(`uv run`, `poetry run`, `.venv/bin/python` 등)으로 돌린다. 시스템이나 다른 환경의 `python`으로 돌리면 다른 버전, 다른 의존성으로 돈다. `requires-python`을 맞춘다.
- 도구 설정은 `pyproject.toml` 한 곳에 둔다. 같은 도구의 설정 파일을 따로 만들지 않는다.

## 코드를 찾을 때

| 일 | 도구 |
|---|---|
| 정의, 참조, 구현, 호출 관계, 타입 | Claude Code LSP 도구. `pyright-lsp` 플러그인과 pyright 바이너리가 있어야 켜진다 |

LSP 도구는 읽기 전용이다. 이름 바꾸기는 아래 도구로 한다.

## 코드를 바꿀 때

| 일 | 도구 |
|---|---|
| 심볼 이름 바꾸기, 모든 참조 갱신 | rope `rename` |
| 모듈·함수·클래스 옮기기, import 갱신 | rope `move` |
| 함수 시그니처 바꾸기 | rope `change_signature` |
| 같은 모양의 코드를 패턴 단위로 한꺼번에 바꾸기 | LibCST codemod |

Python은 이름을 문자열로도 가리키므로, 위 도구가 고치지 못하는 참조가 남는다. 바꾼 뒤 아래를 grep으로 찾아 확인하고, 타입 검사기로 한 번 본다.

- `getattr`, `importlib`, `__import__`처럼 문자열로 가리키는 이름
- `__all__`, entry point, 설정·YAML·템플릿 안의 이름
- 테스트의 `monkeypatch`, `mock.patch` 대상 경로

## 타입

| 일 | 도구 |
|---|---|
| 정적 타입 검사 | 프로젝트가 쓰는 것(mypy, pyright, basedpyright). 새로 고를 때는 LSP와 같은 pyright 계열이 결과가 어긋나지 않는다 |
| 외부 입력(YAML, JSON, 요청)을 경계에서 정확한 타입으로 바꾸기 | 프로젝트가 쓰는 모델 라이브러리(pydantic 등). 경계 한 곳에서 파싱하고 안에서는 다시 검증하지 않는다(`qef:dev`의 「강하게 잡을지는 틀렸을 때 어떻게 되는지로 정한다」) |

## 구조를 측정할 때

| 잡는 것 | 도구 |
|---|---|
| 쓰지 않거나 선언하지 않은 의존성, 다른 패키지를 통해서만 들어오는 의존성 | deptry |
| 쓰이지 않는 함수·클래스·변수 | vulture. 동적으로 불리는 것은 오탐이 나니, 결과마다 실제로 안 쓰이는지 확인한다 |
| 복사한 코드 | jscpd |

의존 방향, 금지 의존, 순환은 측정이 아니라 규칙이다. `qef:layout`의 「의존 규칙은 검사로 둔다」를 따른다(Python은 import-linter). 측정한 결과는 판단의 입력이다. 도구가 잡지 못하는 개념과 타입 관계는 `qef:model`, `qef:layout`으로 본다.

## 테스트할 때

| 일 | 후보 |
|---|---|
| 테스트 실행 | pytest. 준비는 fixture로 하고, 여러 테스트가 함께 쓰는 fixture는 읽기만 한다 |
| stub HTTP 요청·응답을 서버 스키마로 검사 | respx(httpx)로 stub을 두고, 요청과 응답을 서버와 공유하는 모델(pydantic 등)로 parse |
| 서버가 OpenAPI 스키마를 지키는지 | schemathesis |
| 테스트 순서 독립성 확인 | pytest-randomly로 순서를 섞어 돌린다 |
| 새 테스트를 여러 번 돌려 보기 | pytest-repeat(`--count`) |

## 포맷과 lint

프로젝트의 포매터와 lint를 쓴다. 없으면 ruff(포맷과 lint를 함께 맡는다)가 후보다. 커밋 훅에는 린트와 포맷만 건다(`qef:testing`).

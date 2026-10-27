---
name: staged-dev
description: Use when any request would change code — feature, bugfix, refactor, config in code, of any size, including "one line", "just fix it", "urgent", or "before deploy" — before editing any file or delegating edits to a subagent. 코드 변경이 들어가는 모든 개발 작업.
---

# staged-dev

## 원칙

**코드를 바꾸는 모든 작업은 qef 절차로만 한다.** 요구사항 확정 → 구조 설계·검토 → 공통부 테스트·구현·검토·보완·테스트 → 나머지 테스트·구현·테스트 → 전체 검토·보완 → 통합 테스트.

- 단계 진행은 mod 도구(`mcp__qef__qef_start`, `qef_status`, `qef_submit`, `qef_add_file`, `qef_test_revision`, `qef_reopen`)로만 한다. mod가 단계마다 쓸 수 있는 파일을 막고, 체크포인트는 사용자가 직접 승인해야 넘어간다.
- 각 단계의 실제 일은 **메인 세션이 서브에이전트를 띄워 맡긴다.** 메인 세션은 지시를 쓰고, 보고를 모으고, 사용자와 이야기하고, 실행 기록을 쓴다. 메인 세션이 프로젝트 파일을 직접 고치지 않는다.
- 코드를 **읽는** 것은 된다. 요구사항을 정하려면 읽어야 한다.
- 서로 독립적인 서브에이전트는 Agent 호출 여러 개를 한 메시지에 함께 보낸다. 프로젝트 파일을 쓰는 서브에이전트는 한 번에 하나만.

규칙의 글자를 어기는 것은 규칙의 취지를 어기는 것이다. 절차 없이 해야 할 것 같으면 직접 고치지 말고 사용자에게 이유를 말하고 묻는다. 사용자가 직접 고치는 것은 막지 않는다.

## 시작

- 이 스킬 폴더의 `requirements.md`를 읽고 순서 1~4(읽기, 의도 파악, 범위 확인, 모드 정하기)를 한다.
- 모드가 정해지면 `mcp__qef__qef_start`(task: 사용자 요청 한 줄, mode, language: 사용자가 쓰는 언어)를 부른다. 시작한 뒤에는 모드를 바꿀 수 없다. 바꿔야 하면 사용자에게 `/qef-reset`을 부탁하고 다시 시작한다.
- `qef_start`가 돌려준 실행 폴더를 쓴다 (아래 "실행 기록"). 그다음 `requirements.md`의 나머지 순서를 따른다.

## 단계마다

매 턴 시스템 프롬프트의 "qef: 진행 중인 개발 작업"에 현재 단계와 할 일이 나온다. 단계에 들어가면 그 단계의 지시 파일을 읽고 따른다. 컨텍스트가 압축됐거나 어디까지 했는지 모르겠으면 `qef_status`와 실행 폴더의 `run.md`부터 본다.

| mod 단계 | 지시 파일 |
|---|---|
| 요구사항 확정 (requirements) | `requirements.md` |
| 구조 설계·검토 (design) | `stages/design.md` |
| 공통부·나머지 테스트 작성 (common-tests, rest-tests) | `stages/write-tests.md` |
| 공통부·나머지 구현, 공통부·전체 구조 보완 (common-impl, rest-impl, common-fix, full-fix) | `stages/implement.md` |
| 공통부·전체 구조 검토 (common-review, full-review) | `stages/review.md` |
| 공통부·나머지 테스트 실행 (common-verify, rest-verify) | `stages/run-tests.md` |
| 전체 통합 테스트 (integration) | `stages/integration.md` |
| 테스트 보완 (test-revision) | `stages/test-revision.md` |
| 체크포인트 (승인 대기) | `stages/checkpoint-feedback.md` |

- 서브에이전트 지시는 `criteria/brief.md`의 틀로 쓴다. 기준은 `criteria/`의 파일을 절대 경로와 절 이름으로 가리킨다.
- 단계를 마치면 `mcp__qef__qef_submit`으로 제출한다. 요구사항 단계는 artifact.requirements, 설계 단계는 artifact.files가 필요하다.
- 제출할 때 deviations를 반드시 넣는다: 이 단계에서 지시와 다르게 한 것, 막힌 것, 우회한 것. 서브에이전트 보고의 deviations도 옮긴다. 없으면 `[]`. 단계 지시가 정한 보고·기록 파일이 실행 폴더에 없으면 mod가 제출을 거부한다. 단계에서 할 일이 없는 컴포넌트는 `reports/<단계 id>-<컴포넌트>-skip.json`에 이유를 쓴다.
- 같은 일을 고쳐 다시 시키는 왕복(테스트 이의, 설계에 없는 파일, 테스트 실패 수정)은 최대 3번이다. 3번 뒤에도 남으면 남은 것을 사용자에게 보여주고 어떻게 할지 묻는다.

## 요구사항 승인

요구사항 표의 필드: `summary`, `functional`, `nonFunctional`, `acceptanceCriteria`, `outOfScope`, `assumptions`, `userStatements`(사용자 원문 인용), `rationale`(항목별 이유). `userStatements`와 `rationale`은 표로 보여주지 않아도 되지만 `requirements.json`과 제출하는 artifact.requirements에는 반드시 넣는다.

표가 준비되면 `requirements.json`에 쓰고 `qef_submit`으로 제출한 뒤, 사용자에게 보여주고 승인을 기다린다. 승인 규칙은 `stages/checkpoint-feedback.md`의 "승인". 사용자가 고치면 고친 표를 다시 보여주고 다시 제출한다.

## 실행 기록

위치: `~/.qef/runs/<프로젝트 루트 경로의 /를 -로 바꾼 것>/<시작 시각 YYYYMMDD-HHMMSS>/`. `qef_start`가 만들고 경로를 돌려준다. 프로젝트 밖이라 mod가 쓰기를 막지 않고, 샌드박스도 이 폴더(`~/.qef`) 쓰기는 언제나 허용한다. 셸로 다뤄도 된다 (지적 합치기, JSON 검증 등). 현재 작업의 폴더는 `qef_status`와 매 턴 프롬프트의 "qef: 진행 중인 개발 작업"에 있다.

| 파일 | 쓰는 쪽 | 내용 |
|---|---|---|
| `run.md` | 메인 | 첫 줄 `# <작업>`, 모드, 프로젝트 루트, 시작 시각, 요구사항 단계 읽기(Explore 요약), 컴포넌트 진행(나머지 컴포넌트 중 끝낸 것) |
| `requirements.json` | 메인 | 확정 요구사항. 요구사항 보완이 들어오면 갱신 |
| `design/` | 설계 서브에이전트, 메인 | `criteria/structure.md`의 "설계 형식" (부분별 파일). 파일 추가·인터페이스 변경·결정 재검토 때 해당 파일만 갱신 |
| `issues.json` | 메인 | 검토 지적 전부. 검토 보고를 손으로 옮겨 적지 말고 `jq`나 파이썬으로 합친다 (실행 폴더는 셸로 쓸 수 있다) |
| `reuse.json` | 메인 | 재발명·외부 라이브러리 후보와 반박 결과 (확정·반박 모두) |
| `feedback.json` | 메인 | 사용자 지적, 분류, 판정 |
| `test-disputes.json` | 메인 | 테스트 이의와 판정 |
| `file-tree-changes.json` | 메인 | 구현 중 더하거나 다른 자리로 정한 파일 |
| `briefs/` | 메인 | 한 단계에서 여러 서브에이전트가 같이 쓰는 공통 지시 (`criteria/brief.md`) |
| `reports/` | 서브에이전트 | 서브에이전트 보고 원본 (`criteria/brief.md`의 "보고 파일 이름") |
| `events.jsonl` | mod | 시작·제출·승인·다시 열기 등 사건과 시각, 제출마다의 deviations. 고치지 않는다 |

`issues.json`의 지적 하나:

```json
{
  "id": "I7",
  "stage": "design | common-review | full-review",
  "source": "lens:<관점> | reuse | structure",
  "severity": "blocker | major | minor",
  "where": "파일:줄 또는 설계의 컴포넌트·결정 id",
  "problem": "문제와 시나리오",
  "fix": "고치는 법",
  "status": "open | fixed | rejected | reported",
  "resolution": "fixed: 무엇을 바꿨는지 / rejected: 반영하지 않은 이유 / reported: 고치지 않고 보고만 함"
}
```

id는 작업 전체에서 한 번만 쓴다. 보고와 설계 본문은 지적을 순서 번호가 아니라 이 id로 가리킨다. 사용자에게는 id 대신 내용을 문장으로 보여준다. 보완 보고에 `<id>-rest`가 있으면 새 id의 지적으로 issues.json에 더한다. 그때 where·severity는 원래 지적을 따르고, problem은 반영하지 않은 부분만 적는다.

`feedback.json`의 지적 하나: `{ "id": "U2", "checkpoint", "round", "type", "text", "original", "library", "status": "pending | judged", "decision": <feedbackDecisions 항목> }`. 단계 도중 내가 찾은 질문은 type을 question으로, original 없이 남긴다 (`stages/checkpoint-feedback.md`의 "단계 도중 내가 찾은 질문").

## 핑계와 실제

| 핑계 | 실제 |
|---|---|
| "한 줄이라 절차가 과하다" | 한 줄도 단위·호출부를 잘못 알면 장애다. 크기는 예외 사유가 아니다. |
| "급하다 / 배포 직전이다" | 급하다는 것은 예외 사유가 아니다. 사용자에게 규칙을 말하고, 절차로 갈지 사용자가 직접 고칠지 묻는다. |
| "사용자가 그냥 고치라고 했다" | 사용자가 원하는 것은 결과다. 직접 고치지 말고 위처럼 묻는다. |
| "작고 범위가 명확한 기능이다" | 범위가 명확하면 요구사항 확정이 빨리 끝날 뿐이다. 건너뛰지 않는다. |
| "기본값을 말했으니 진행해도 된다" | 기본값 고지는 승인이 아니다. 승인을 기다린다. |
| "사용자가 채팅으로 좋다고 했다" | 승인은 패널 버튼과 `/qef-approve`로만 된다. 그쪽으로 안내한다. |
| "서브에이전트가 고치면 메인이 고친 게 아니다" | 단계 지시 파일 밖에서 시킨 수정은 같은 위반이다. |

## 위반 직전 신호

- 메인 세션이 프로젝트 파일에 Edit/Write를 부르려 한다.
- 단계 지시 파일에 없는 일을 서브에이전트에게 시키려 한다.
- "이건 예외"라는 생각이 든다.

**모두 멈추고 현재 단계의 지시 파일로 돌아간다.**

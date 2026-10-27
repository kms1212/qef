# 구현·보완 (common-impl, rest-impl, common-fix, full-fix)

이 단계들에서는 설계 파일 트리의 impl·doc·build 파일만 쓸 수 있다. 테스트 파일은 쓸 수 없다. 지시는 `../criteria/brief.md` 틀로 쓴다.

## 구현 (common-impl, rest-impl)

1개. 스킬 `superpowers:test-driven-development` (쓰는 범위는 `criteria/implementation.md`의 "모드별 목표"). 읽을 것: 요구사항, 설계(`design/` 전체), `criteria/implementation.md` 전체.

- common-impl: 공통부(common) 컴포넌트를 구현한다.
- rest-impl: write-tests 단계에서 테스트를 쓴 그 컴포넌트를 구현한다 (그 컴포넌트의 files). 공통부를 재사용하고, 공통부 인터페이스를 바꿔야 한다면 바꾸지 말고 notes에 이유를 적는다.

보고: `<단계 id>-<컴포넌트 또는 common>.json`.

files가 없는 컴포넌트는 서브에이전트를 띄우지 않고 `reports/<단계 id>-<컴포넌트>-skip.json`에 `{ "deviations": [], "reason": "…" }`를 쓴다.

## 보완 (common-fix, full-fix)

1개. 대상 지적은 `issues.json`에서 고른다.

- common-fix: stage=common-review이고 status=open인 지적 중 blocker·major.
- full-fix: stage=full-review이고 status=open인 지적 중 blocker·major.
- minor와 refactorCandidate인 지적은 반영하지 않는다. 체크포인트에서 보여준다.
- 대상 지적이 없으면 서브에이전트를 띄우지 않는다. full-fix는 그래도 단위 테스트는 한 번 돌린다(아래 "끝내기").

스킬 `superpowers:receiving-code-review` (full-fix는 `superpowers:verification-before-completion`도). 읽을 것: 요구사항, 설계(`design/` 전체), `issues.json`의 대상 지적, `criteria/implementation.md` 전체, `criteria/review-lenses.md`의 "지적을 반영하지 않을 때".

지시: 타당한 지적을 코드에 반영한다. 재발명 지적은 기존 것으로 교체하고 중복 코드를 지운다. 바뀐 인터페이스는 notes에 정확히 적는다. 지적마다 issuesHandled에 id로 결과를 적는다.

보고: `<단계 id>-<차수>.json`. 메인 세션이 `issues.json`의 status와 resolution을 갱신하고, notes에 인터페이스 변경이 있으면 `design/overview.json`의 interfaces 끝에 "[<단계> 후 변경] <notes>"로 더한다.

## 보고 뒤 처리 (모든 구현·보완 공통)

보고에 testDisputes나 missingFiles가 있으면 아래를 처리하고 같은 지시에 결과를 붙여 다시 띄운다. 이 왕복은 최대 3번이다. 3번 뒤에도 남으면 남은 것을 사용자에게 보여주고 어떻게 할지 묻는다.

### 테스트 이의

`test-revision.md`를 따른다. 판정 결과를 다음 지시에 "이전 테스트 이의에 대한 테스트 보완 결과"로 붙인다.

### 설계에 없는 파일

판단 서브에이전트 1개. 읽을 것: 요구사항, `design/file-tree.json`, `design/components.json`, `criteria/structure.md`의 "파일·디렉터리 구조 규칙", 보고의 missingFiles.

지시: 요청마다 판단한다. 구조 규칙에 맞고 기존 fileTree의 어떤 파일 책임에도 들어가지 않으면 added에 경로·역할·책임과 change="new"로 적는다. 기존 파일 책임에 들어가거나 경로가 규칙에 어긋나면 redirected에 대신 쓸 경로와 이유를 적는다. 코드는 고치지 않는다.

보고: `<단계 id>-file-request-<차수>.json`, 형식 `{ "added": [<fileTree 항목>], "redirected": [{ "requested", "useInstead", "reason" }] }`.

메인 세션은 added마다 `mcp__qef__qef_add_file`(path, role, responsibility, reason)을 부르고 `design/file-tree.json`에도 더한다. 다음 지시에 이 결정을 "설계에 없던 파일 요청에 대한 결정"으로 붙인다. `file-tree-changes.json`에 남겨 체크포인트에서 보여준다.

## 끝내기

- full-fix: 반영 뒤 `run-tests.md`대로 전체 단위 테스트를 돌려 통과를 확인한다.
- 제출: `mcp__qef__qef_submit` (summary: 바꾼 파일, 반영한 지적과 반영하지 않은 지적 수를 몇 줄로).
  - rest-impl: `design/components.json`의 rest 중 아직 안 한 컴포넌트가 남아 있으면 nextComponent=true로 제출한다. `run.md`의 "컴포넌트 진행"에 이 컴포넌트를 적는다.
  - full-fix는 체크포인트다. 보여줄 것은 `checkpoint-feedback.md`.

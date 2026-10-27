# 테스트 작성 (common-tests, rest-tests)

이 단계에서는 설계 파일 트리의 test 파일만 쓸 수 있다. 지시는 `../criteria/brief.md` 틀로 쓴다.

## 대상

- common-tests: 공통부(`design/components.json`의 common) 컴포넌트 전부
- rest-tests: `design/components.json`의 rest 중 아직 하지 않은 첫 컴포넌트. 어디까지 했는지는 `run.md`의 "컴포넌트 진행"을 본다.

## 테스트 작성 (1개)

스킬 `superpowers:test-driven-development`, `engineering:testing-strategy`. 쓰는 범위는 `criteria/unit-tests.md`의 "모드별 목표"에 적힌 대로다.

읽을 것: 요구사항, 설계(`design/` 전체), `criteria/unit-tests.md` 전체.

지시: 대상 컴포넌트의 단위 테스트를 설계에 적힌 testFiles 경로에 작성한다. 작업 모드의 목표("모드별 목표")를 따른다. 구현 코드는 쓰지 않는다.

보고: `<단계 id>-<컴포넌트 또는 common>.json`, 형식은 `criteria/implementation.md`의 "보고 형식" (changedFiles, notes, missingFiles). 테스트 파일이 트리에 없으면 missingFiles로 올라온다. `implement.md`의 "설계에 없는 파일"대로 처리한 뒤 다시 띄운다.

testFiles가 없는 컴포넌트는 서브에이전트를 띄우지 않고 `reports/<단계 id>-<컴포넌트>-skip.json`에 `{ "deviations": [], "reason": "…" }`를 쓴다.

## refactor: 특성 테스트 확인

refactor 모드에서만. 작성한 테스트가 지금 코드에서 통과해야 한다.

- 테스트 실행 서브에이전트(`run-tests.md`의 "실행")로 `design/overview.json`의 testCommand를 대상 테스트 파일 범위로 돌린다.
- 실패하면 테스트가 현재 동작을 잘못 적은 것이다. 같은 테스트 작성 지시에 실패 내용을 붙여 테스트만 고치게 하고 다시 돌린다. 최대 3번.
- 3번 뒤에도 실패하면 제출하지 않는다. 실패한 테스트와 내용을 사용자에게 보여주고 어떻게 할지 묻는다.

## 제출

`mcp__qef__qef_submit` (summary: 작성한 테스트 파일과 각 테스트가 검증하는 수용 기준을 몇 줄로). 체크포인트가 아니라서 바로 구현 단계로 간다.

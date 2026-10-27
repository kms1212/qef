# 테스트 실행·수정 (common-verify, rest-verify)

이 단계들에서는 impl·doc·build 파일만 쓸 수 있다. 테스트 파일은 쓸 수 없다. 이 파일의 "실행"과 "수정"은 full-fix, integration, refactor 특성 테스트 확인에서도 쓴다. 지시는 `../criteria/brief.md` 틀로 쓴다.

## 범위와 명령

- common-verify: `design/overview.json`의 testCommand, 공통부 테스트 파일
- rest-verify: testCommand, 전체 단위 테스트
- integration: integrationTestCommand (없으면 testCommand), 통합 테스트 + 전체 단위 테스트

## 실행 (1개)

가벼운 모델로 띄워도 된다. 스킬 `superpowers:verification-before-completion` (실제 실행 출력만 근거로 passed를 정한다).

지시: 다음 명령으로 테스트를 실행하고 결과만 보고한다. 코드는 수정하지 않는다. 명령과 범위를 적는다.

보고: `<단계 id>-run-<차수>.json`, 형식 `{ "passed": true, "failures": ["실패한 테스트와 이유"], "output": "실패 부분 위주 요약" }`.

## 수정 (실패했을 때 1개)

스킬 `superpowers:systematic-debugging`. 읽을 것: 요구사항, 설계(`design/` 전체), 실행 보고, `criteria/implementation.md` 전체.

지시: 실패한 테스트의 근본 원인을 찾아 구현을 고친다.

보고: `<단계 id>-fix-<차수>.json`. testDisputes와 missingFiles는 `implement.md`의 "보고 뒤 처리"대로 처리하고, 그 결과를 다음 수정 지시에 붙인다.

수정 뒤 다시 실행한다. 수정은 최대 3번이다. 3번 뒤에도 실패하면 제출하지 않는다. 남은 실패를 사용자에게 보여주고 어떻게 할지 묻는다.

## 제출

통과하면 `mcp__qef__qef_submit` (summary: 실행한 명령, 통과한 테스트 수, 수정 차수와 바꾼 것).

common-verify는 체크포인트다. 보여줄 것은 `checkpoint-feedback.md`.

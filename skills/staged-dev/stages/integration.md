# 전체 통합 테스트 (integration)

이 단계에서는 설계 파일 트리의 파일을 모두 쓸 수 있다. 지시는 `../criteria/brief.md` 틀로 쓴다.

## 통합 테스트 작성 (1개)

스킬 `engineering:testing-strategy` (통합 테스트 범위와 경계 설정에 쓴다). 읽을 것: 요구사항, 설계(`design/` 전체), `criteria/integration-tests.md` 전체.

지시: 작업 모드의 목표("모드별 목표")대로 통합 테스트를 fileTree의 통합 테스트 파일에 작성한다. 실행 명령은 `design/overview.json`의 integrationTestCommand (없으면 testCommand). 구현 코드는 고치지 않는다.

보고: `integration-write.json`, 형식은 `criteria/implementation.md`의 "보고 형식". missingFiles는 `implement.md`의 "설계에 없는 파일"대로 처리한다.

## 실행·수정

`run-tests.md`의 "실행"과 "수정"을 범위 "통합 테스트 + 전체 단위 테스트"로 따른다. 이 단계는 테스트 파일도 쓸 수 있지만, 수정 서브에이전트는 테스트를 고치지 않는다. 테스트가 틀렸다는 이의는 `test-revision.md`로 판정한다.

## 제출

통과하면 `mcp__qef__qef_submit` (summary: 수용 기준마다 어떤 통합 테스트가 검증하는지, 실행 결과). 마지막 체크포인트다. 보여줄 것은 `checkpoint-feedback.md`. 사용자가 승인하면 작업이 끝난다.

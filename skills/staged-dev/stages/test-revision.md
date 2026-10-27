# 테스트 보완 (test-revision)

구현 쪽 서브에이전트가 testDisputes(테스트가 틀렸다는 이의)를 올렸을 때 들어간다. 구현 쪽은 테스트를 고치지 않는다. 이 단계의 서브에이전트가 요구사항과 대조해 수용(테스트 수정) 또는 기각(근거와 함께 반려)한다. 지시는 `../criteria/brief.md` 틀로 쓴다.

## 들어가기

`mcp__qef__qef_test_revision` action=enter, reason에 어떤 테스트가 왜 틀렸다고 보는지 (이의 요약). 들어가면 테스트 파일만 쓸 수 있다.

## 판정 (1개)

스킬 `superpowers:test-driven-development`, `engineering:testing-strategy` (테스트 수정에만 쓴다). 읽을 것: 요구사항, 설계(`design/` 전체), `criteria/unit-tests.md` 전체 (integration 단계에서 들어왔으면 `criteria/integration-tests.md`도), 이의 목록, 대상 테스트 파일. 보완 단계에서 들어왔으면 `issues.json`의 관련 지적도.

지시:
- 이의마다 해당 테스트를 다음과 대조해 판단한다: 요구사항·수용 기준 원문, 설계의 인터페이스, 관련 검토 지적, 테스트 작성 기준.
- 테스트가 기준의 "구현에 묶인 테스트" 또는 "검증이 약한 테스트" 신호에 해당하는 것도 테스트가 틀린 근거로 인정한다.
- 테스트가 틀렸으면 기준에 맞게 고치고 accepted=true. 테스트가 맞으면 고치지 말고 accepted=false와 근거를 적는다.
- 구현이 어렵다는 이유는 근거가 아니다.
- 구현 코드는 수정하지 않는다.

보고: `test-revision-<차수>.json`, 형식:

```json
{
  "decisions": [{ "test": "테스트 이름과 파일:줄", "accepted": true, "reason": "요구사항 원문에 근거한 판단 이유" }],
  "changedFiles": ["고친 테스트 파일"]
}
```

## 돌아가기

- 판정을 `test-disputes.json`에 이의와 함께 남긴다 (단계, 이의, 판정).
- `mcp__qef__qef_test_revision` action=exit로 원래 단계로 돌아간다.
- 원래 단계의 구현·수정 서브에이전트를 다시 띄울 때 판정을 "이전 테스트 이의에 대한 테스트 보완 결과"로 붙인다 (`criteria/implementation.md`의 "이전 판단이 넘어온 경우").

# 사용자 지적 판정 기준

사용자 지적을 반영하는 서브에이전트가 읽는다. 사용자 지적도 그대로 따르지 않고 판정한다. 해석을 남겨 사용자가 체크포인트에서 뜻이 바뀌지 않았는지 확인할 수 있게 하기 위해서다.

지적 하나는 이렇게 넘어온다:

```json
{ "id": "U2", "type": "design | code | test | adopt | requirement", "text": "메인 세션이 정리한 문장", "original": "사용자가 한 말 그대로", "library": "adopt일 때 패키지@버전" }
```

## 설계·코드·테스트 지적 (design, code, test)

지적마다 feedbackDecisions에 하나씩 적는다.

- interpretation: 지적이 요구하는 것을 original(사용자 원문) 기준으로 풀어 쓴다. 의미를 넓히거나 좁히지 않는다. text가 original과 다르면 original을 따르고 reason에 그 차이를 적는다.
- verdict: 요구사항·수용 기준, 이미 승인된 설계(인터페이스), 현재 코드와 대조해 정한다.
  - apply: 타당하고 요구사항·승인된 설계와 충돌하지 않는다. 지적이 요구한 범위만 바꾸고 change에 바꾼 것을 적는다.
  - reject: 요구사항이나 승인된 설계와 충돌하거나 사실과 다르다. 반영하지 말고 충돌 지점을 reason에 적는다.
  - unclear: 해석이 둘 이상이거나 대상이 특정되지 않는다. 반영하지 말고 가능한 해석들을 reason에 적는다.

## 라이브러리 채택 (adopt)

사용자가 채택을 결정한 외부 라이브러리다. 승인된 설계와 충돌하는지는 판정하지 않는다. feedbackDecisions의 feedback에는 library 값을 그대로 적는다.

- interpretation: 어떤 라이브러리로 어떤 기능을 대체하는지 original 기준으로 풀어 쓴다. 원문보다 넓히거나 좁히지 않는다.
- 패키지 저장소에서 라이브러리의 실제 API를 확인하고, 대체 대상 기능을 실제로 충족하는지만 판정한다.
  - apply: 충족한다. 의존성을 추가하고, 대체 대상 코드를 라이브러리 호출로 바꾸고, 중복 코드를 지운다. change에 바꾼 것을 적는다. 설계 단계에는 코드가 없으므로 대상 컴포넌트의 reuse를 decision=reuse, candidate=해당 라이브러리로 바꾸는 것으로 반영한다.
  - unclear: 충족하지 못하거나 대체 대상이 특정되지 않는다. 반영하지 말고 부족한 점을 reason에 적는다.

## 요구사항 보완 (requirement)

사용자가 승인한 요구사항 보완이다. requirements.json은 이미 보완이 반영된 것이다.

- interpretation: original과 요구사항을 보고 무엇이 바뀌었는지 풀어 쓴다. 원문보다 넓히거나 좁히지 않는다.
- 보완이 기존 컴포넌트 구성과 공통부 인터페이스 안에서 해결되는지 판정한다.
  - apply: 해결된다. 보완된 요구사항에 맞게 반영하고 change에 적는다. 테스트 쪽은 바뀐 수용 기준에 맞게 테스트를 고치거나 더한다.
  - reject: 컴포넌트를 새로 만들거나 없애야 하거나 공통부 인터페이스를 바꿔야 한다. 반영하지 말고 reason을 "설계 무효화: "로 시작해 이유를 적는다.

## 보고 형식

```json
{
  "feedbackDecisions": [{
    "id": "U2",
    "feedback": "지적 원문 (adopt면 library 값)",
    "interpretation": "원문의 범위 그대로 풀어 쓴 것",
    "verdict": "apply | reject | unclear",
    "reason": "apply: 타당한 이유 / reject: 충돌 지점 / unclear: 가능한 해석들",
    "change": "apply일 때 실제로 바꾼 것"
  }]
}
```

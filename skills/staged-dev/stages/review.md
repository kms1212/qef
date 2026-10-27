# 구조 검토 (common-review, full-review)

이 단계에서는 프로젝트 파일을 쓸 수 없다 (셸 포함, 샌드박스가 막는다). 읽기 명령과 실행 폴더 쓰기는 된다. 서브에이전트는 실행 폴더에만 쓴다. 지시는 `../criteria/brief.md` 틀로 쓴다.

## 대상

- common-review: 구현된 공통부 코드 (`design/components.json` common의 files). 설계·인터페이스와 맞는지, 나머지 컴포넌트가 올라가기에 적절한지 검토한다.
- full-review: 이번 작업으로 바뀐 코드 전체 (git diff 포함). rest-impl 보고들의 notes도 함께 넘긴다.

## 첫 번째 묶음 (한 메시지에 함께)

- **관점 검토.** 관점마다 하나. 스킬 `engineering:code-review` (보고는 맡은 관점에 한정). 읽을 것: 요구사항, `design/overview.json`, `design/components.json`, 요구사항 충족 관점은 `design/decisions.json`도, `criteria/review-lenses.md`의 맡은 관점 절·"심각도 기준"·"지적 형식".
  - common-review: 단순성·결합도, 정확성·엣지케이스
  - full-review: 요구사항 충족, 단순성·결합도, 정확성·엣지케이스
  - 보고: `<단계 id>-lens-<관점>.json`
- **재발명 탐지.** `criteria/reuse.md`의 "검토 단계: 재발명 탐지" 탐지자 셋. 조사 대조와 외부 라이브러리 검색은 설계 조사 보고 둘을 함께 읽는다. 보고: `<단계 id>-reuse-<direct|research|library>.json`
- **경로만 보고 예측.** 1개. 가벼운 모델로 띄워도 된다. 대상 파일의 경로 목록만 지시에 넣는다(common-review: 공통부 컴포넌트의 fileTree 경로, full-review: fileTree 전체). 지시: "다음은 어떤 프로젝트의 파일 경로 목록이다. 파일을 열거나 보고 파일 쓰기 말고 다른 도구를 쓰지 말고, 경로와 이름만 보고 파일마다 무엇을 할지, 어떤 타입이 어떤 타입을 구현·상속할지 예측하라." 요구사항·설계도 넘기지 않는다.
  보고: `<단계 id>-structure-prediction.json`, 형식 `{ "predictions": [{ "path", "responsibility", "typeRelations" }] }`

## 두 번째 묶음 (한 메시지에 함께)

- **반박 검증.** 재발명 탐지 후보를 합쳐 중복을 줄이고, 후보마다 반박자 둘 (`criteria/reuse.md`의 "반박 검증"). 보고: `<단계 id>-reuse-refute-<번호>-<1|2>.json`
- **예측과 실제 대조.** 1개. 읽을 것: 요구사항, `design/file-tree.json`, `design/components.json`, `design/boundaries.json`(있으면), 예측 보고, `criteria/structure.md`의 "파일·디렉터리 구조 규칙"·"도메인 개념 모델링 규칙"·"패키지·모듈 경계 규칙"·작업 모드 절, `criteria/review-lenses.md`의 "심각도 기준"·"지적 형식". 지시: 파일을 직접 읽고 예측과 실제(책임, 타입 관계)를 비교한다. 예측과 다른 파일마다 구조 문제로 보고한다. 이름이나 위치를 어떻게 바꾸면 경로만 보고 맞힐 수 있는지 fix에 적는다. 구현된 코드가 도메인 개념 모델링 규칙을 지키는지 본다. `boundaries.json`이 있으면 구현된 코드가 그 경계와 경계 규칙을 지키는지도 본다. 이번 작업이 만들거나 고친 파일(refactor 모드에서는 요구사항의 대상 범위 전체)을 지적하고, 그 밖의 기존 파일 문제는 refactorCandidate를 true로 적는다.
  보고: `<단계 id>-structure-compare.json`

## 모으기

- 관점 검토와 구조 대조의 지적을 `issues.json`에 stage=<단계 id>로 옮기고 id를 붙인다. refactorCandidate인 것은 status=reported.
- 반박 검증에서 확정된 재발명은 `criteria/reuse.md`의 "확정된 것의 처리"대로: 설치된 것으로의 교체는 `issues.json`에 지적으로, 외부 라이브러리는 체크포인트에서 물을 후보로. 전부 `reuse.json`에 남긴다.

## 제출

`mcp__qef__qef_submit` (summary: 심각도별 지적 수, 재발명 확정 수, 외부 라이브러리 후보 수). 체크포인트가 아니라서 바로 보완 단계로 간다.

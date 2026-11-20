# 실사용자 없이 하는 사용성 점검 방법

모든 출처는 2026-11-09에 가져왔다. 「본문 확인」은 WebFetch로 페이지 본문을 받아 읽은 것(요약 모델을 거친 추출)이고, 「검색 요약만」은 검색 결과 요약만 보고 원문을 열지 못한 것이다. 인용은 15단어 이내다.

## 결론

- 네 방법 모두 「기준 목록에 대조해 보는 검사」다. heuristic evaluation과 Shneiderman의 규칙, ISO 9241-110은 무엇에 대조할지를 주고, cognitive walkthrough는 과업 단계마다 물을 질문을 준다.
- 잘 잡는 것: 일관성(문구·배치·동작), 상태 표시, 화면에 보이는 정보의 과잉, 사용자 말과 다른 용어, 학습 단계에서 행동이 보이는지.
- 놓치는 것: 업무(도메인) 지식이 있어야 보이는 문제, 실제 사용 빈도에 따라 달라지는 문제, 빠진 기능. 평가자 한 명은 문제의 약 3분의 1만 찾고, 도메인을 아는 사용성 전문가가 가장 잘 찾는다. 예측의 상당수는 실제 사용자에게서 확인되지 않는다(거짓 양성 또는 드문 문제).

## Nielsen 10 heuristics와 heuristic evaluation

- [NN/g, 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) — 본문 확인. 10개 이름: Visibility of System Status, Match Between the System and the Real World, User Control and Freedom, Consistency and Standards, Error Prevention, Recognition Rather than Recall, Flexibility and Efficiency of Use, Aesthetic and Minimalist Design, Help Users Recognize, Diagnose, and Recover from Errors, Help and Documentation.
  - 「broad rules of thumb and not specific usability guidelines」
  - Match: 「The design should speak the users' language.」
  - Consistency: 「Users should not have to wonder whether different words... mean the same thing」
  - Minimalist: 「Interfaces should not contain information that is irrelevant or rarely needed.」
- [NN/g, How to Conduct a Heuristic Evaluation](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/) — 본문 확인.
  - 평가자 수: 「three to five people should independently evaluate the same interface」
  - 한계: heuristic evaluation은 「cannot replace user research」
  - 위반이 곧 문제는 아님: 「that does not necessarily mean it's a problem」
- [NN/g, Theory of Heuristic Evaluations](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/) — 본문 확인.
  - 「single evaluators found only 35 percent of the usability problems」
  - 여섯 사례에서 한 평가자의 검출률 19%~51%, 평균 34%.
  - 「the use of about five evaluators, but certainly at least three」
  - 도메인을 모르는 평가자에게는 관찰자가 도메인을 설명해 줘야 한다고 한다.
- [NN/g, Characteristics of Usability Problems Found by Heuristic Evaluation](https://www.nngroup.com/articles/usability-problems-found-by-heuristic-evaluation/) — 본문 확인.
  - 한 평가자가 주요 문제를 찾을 확률 약 42%, 사소한 문제는 32%.
  - 빠진 요소는 종이 시안에서 특히 찾기 어렵다.
  - 도메인 의존이 큰 시스템에서는 평가자가 문제를 놓치기 쉽고, 일부는 사용자 테스트 없이는 「virtually impossible to find」였다.
- [Nielsen, Finding usability problems through heuristic evaluation, CHI 1992](https://course.khoury.northeastern.edu/is4300sp13/ssl/articles/p373-nielsen.pdf) — 검색 요약만. 사용성 전문가가 비전문가보다 낫고, 그 인터페이스 종류에 경험이 있는 「double experts」가 가장 낫다는 초록 내용. 집단별 수치는 확인하지 못했다.

## heuristic evaluation의 거짓 양성과 놓침

- [Cockton & Woolrych, Understanding inspection methods (2001)](https://researchportal.northumbria.ac.uk/en/publications/understanding-inspection-methods-lessons-from-an-assessment-of-he/) — 검색 요약만(초록). 99명의 분석자가 낸 예측의 약 65%가 사용자 테스트에서 확인되지 않았다고 한다. 더 효과적인 리소스는 사용자·과업·도메인·그 앱에 대한 지식이라고 결론.
- [MeasuringU, How Effective are Heuristic Evaluations?](https://measuringu.com/?p=133) — 본문 확인.
  - 다섯 연구 평균으로 사용자 테스트 문제의 약 49%를 heuristic evaluation이 놓쳤다.
  - 사용자가 겪지 않은 지적은 평균 34%(9%~46%). 저자는 이를 거짓 양성보다 드문 문제로 보자고 한다: 「less frequent or "long-tail" issues than false positives」
- [Jeffries et al., User Interface Evaluation in the Real World, CHI 1991](https://www.miramontes.com/writing/uievaluation/) — 본문 확인(저자 사이트의 전문).
  - 중복을 뺀 206개 문제 가운데 heuristic evaluation 105개, usability testing 31개, guidelines 35개, cognitive walkthrough 35개.
  - heuristic evaluation은 숙련된 UI 전문가가 있어야 하고, 「specific, one-time, and low-priority problems」를 많이 냈다.
  - guidelines가 「recurring and general problems」를 가장 잘 찾았다.
  - usability testing은 일관성 문제를 놓쳤다.

## cognitive walkthrough

- [NN/g, Evaluate Interface Learnability with Cognitive Walkthroughs](https://www.nngroup.com/articles/cognitive-walkthroughs/) — 본문 확인.
  - 질문 4개: 「Will users try to achieve the right result?」 / 「Will users notice that the correct action is available?」 / 「Will users associate the correct action with the result...」 / 「will users see that progress is made toward the goal?」
  - 대상은 처음 쓰는 사용자의 학습 가능성이다. 사용자를 쓰지 않으므로 실제 반응은 알 수 없고, 결과는 고른 과업과 persona, 단계 정의에 달린다. 익숙한 표준 패턴에는 「overkill」.

## Shneiderman 8 golden rules

- [Shneiderman, The Eight Golden Rules of Interface Design](https://www.cs.umd.edu/users/ben/goldenrules.html) — 본문 확인. 규칙: Strive for consistency, Seek universal usability, Offer informative feedback, Design dialogs to yield closure, Prevent errors, Permit easy reversal of actions, Keep users in control, Reduce short-term memory load(두 번째 fetch에서 제목만 그대로 받아 대조함).
  - 「Consistent sequences of actions should be required in similar situations.」

## ISO 9241-110:2020 Interaction principles

- [ISO 9241-110:2020 샘플(iTeh)](https://cdn.standards.iteh.ai/samples/75258/83c8cf072187487686645aad04eff40e/ISO-9241-110-2020.pdf) — 견본 PDF를 다운로드해 pdftotext로 직접 읽음(4절 개요까지). [ISO 카탈로그](https://www.iso.org/standard/75258.html)는 403.
  - 원칙 7개: Suitability for the user's tasks, Self-descriptiveness, Conformity with user expectations, Learnability, Controllability, Use error robustness, User engagement. 2006판의 individualization은 controllability에 합쳐졌고 user engagement가 새로 생겼다.
  - Suitability: 기능이 「based on the task characteristics (rather than the technology chosen」
  - Conformity: 동작이 「predictable based on the context of use and commonly accepted conventions」
  - NOTE: 과업 적합성은 「unnecessary steps and unnecessary information」을 피하는 것을 포함한다.
  - 권고 하나를 적용했다고 원칙이 충족되는 것은 아니다. 원칙들은 겹치고 서로 맞바꿔야 할 때가 있다.
  - 5.3.3에 「consistency (internal and external)」 권고 그룹이 있다(목차로 확인, 본문은 샘플 밖).

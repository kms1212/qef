# 에이전트가 기준에 대조할 수 있는 것과 사람만 판단하는 것, 근거 없는 추가를 막는 법

모든 출처는 2026-11-09에 가져왔다. 표기 규칙은 01과 같다. 인용은 15단어 이내다.

## 결론

- 사용성은 정의부터 「정해진 사용자·목표·사용 맥락」에 대한 상대값이다(ISO 9241-11:2018 3.1.1, NN/g Usability 101의 「usable for whom, for which task」). 그러므로 기준 없이 「쓰기 좋은가」를 판정하는 것은 사람(실제 사용자 또는 그 업무를 아는 사람)의 일이다. NN/g는 synthetic users를 실제 사용자의 믿을 만한 대체로 보지 말라고 한다. 사용자의 「너는 UX를 모른다」는 지적과 같은 방향이다.
- 반대로 「정해진 기준」이 있으면 그 기준에 대조하는 일은 기계나 에이전트가 할 수 있다. 가장 오래된 비교 사례가 접근성이다. W3C는 도구가 「can not determine accessibility, they can only assist」라고 하고, GDS 실험에서 도구 10개가 모두 놓친 장벽이 29%, 가장 나은 도구도 41%만 찾았다. 결론은 둘을 함께 쓰라는 것이다. UX 판단도 같은 패턴으로 나눌 수 있다: 기준이 글로 있는 것(요구사항 문장, 이전 버전 화면, 설계 시스템 관례, 업무 사실, 용어집)은 대조할 수 있고, 기준이 사용자 머릿속에만 있는 것(이 업무에서 이 순서가 편한가, 이 정보가 필요한가)은 사람이 판단한다.
- Claude Code 문서도 같은 선을 긋는다. 「give it a check to run」— pass/fail이 돌아오는 검사(테스트, lint, 출력 diff, 시안 옆 스크린샷)를 주면 에이전트가 스스로 루프를 닫고, 그런 것이 없으면 「"looks done" is all it has」라 사람이 테스트 스위트가 된다. 회의에서 정한 것처럼 저장소에 없는 정보는 사람이 적어 줘야 한다.
- 근거 없는 추가: YAGNI(Fowler)는 미리 짐작한 기능의 비용을 build·delay·carry·repair로 나누고, gold plating(PMBOK 정의를 옮긴 Wikipedia)은 범위 계획에 없는 기능 추가를 위험으로 보고 공식 변경 절차로만 더하라고 한다. NN/g는 「resisting featuritis」를 좋은 UX의 처방으로 든다. Anthropic의 프롬프트 지침은 Claude가 요청하지 않은 파일·추상·유연성을 더하는 경향을 적고 「Only make changes that are directly requested or clearly necessary」류의 지시를 권한다.
- 막는 장치로 문헌에 있는 것: (1) 범위 문서와 변경 승인 절차(gold plating), (2) 양방향 추적(backward traceability: 설계 요소·코드에서 원 요구사항으로 거슬러 올라가는 길. 거슬러 갈 요구사항이 없으면 근거 없는 추가다), (3) 범위를 프롬프트에 선언하기(Overeager Coding Agents 논문에서 동의 선언을 빼자 Claude Code의 범위 밖 행동이 0.0%에서 17.1%로 늘었다. 다만 이 연구의 범위 밖 행동은 파일 삭제·설정 변경 같은 권한 문제이고, 기능 추가는 아니다).
- KodeKoreaIMS의 권한 목록 화면, 「마스터 키」 상태 필드·API는 backward traceability로 걸러지는 유형이다. 화면 요소마다 요구사항 줄을 대게 하면, 댈 줄이 없는 요소가 남는다(추론. qef `finish`의 요구사항 대조 리뷰가 「요청에 없는 추가」를 보게 되어 있으나 화면 요소 단위의 목록은 요구하지 않는다).

## 사용성은 맥락에 대한 상대값이다

- [ISO 9241-11:2018 견본(iTeh)](https://cdn.standards.iteh.ai/samples/63500/33c267a5a7564f298f02bbd65721a181/ISO-9241-11-2018.pdf) — PDF를 내려받아 pdftotext로 직접 읽음(3절 정의).
  - 3.1.1 usability: 「used by specified users to achieve specified goals」 ... 「in a specified context of use」
  - 3.1.12 effectiveness, 3.1.13 efficiency, 3.1.14 satisfaction(사용자 필요와 기대에 맞는 정도).
- [NN/g, Usability 101](https://www.nngroup.com/articles/usability-101-introduction-to-usability/) — 본문 확인.
  - 「Usability is not a property of the design alone」
  - 「usable for whom, for which task, and under what conditions?」
  - 「synthetic users and digital twins should not be treated as reliable substitutes for real users」
  - 방법: 「recruiting representative users, asking them to perform representative tasks」

## 기계 검사와 사람 판단: 접근성의 선례

- [W3C WAI, Selecting Web Accessibility Evaluation Tools](https://www.w3.org/WAI/test-evaluate/tools/selecting/) — 본문 확인.
  - 「Tools cannot check all accessibility aspects automatically. Human judgement is required.」
  - 「can not determine accessibility, they can only assist in doing so」
  - 도구도 거짓·오도하는 결과를 낸다.
- [GDS Accessibility blog, What we found when we tested tools on the world's least accessible webpage (2017)](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/) — 본문 확인.
  - 장벽 143개, 도구 10개. 모든 도구가 놓친 것 42개(29%). 가장 나은 도구(수동 점검 안내 포함) 41%.
  - 「They are most effective when combined with manual testing.」

## 에이전트에게 검사를 준다

- [Claude Code, Best practices](https://code.claude.com/docs/en/best-practices) — 본문 확인.
  - 「Claude stops when the work looks done.」 검사가 없으면 사용자가 테스트 스위트가 된다.
  - 검사의 예: 테스트 파일, 빌드 exit code, linter, fixture와 출력 diff, 시안 옆 browser screenshot.
  - 증거를 요구하라: 「"All tests pass" on its own tells you very little」
  - `/verify`는 앱을 빌드·실행해 결과를 보게 하고 「tests and typechecks miss」하는 문제를 잡는다.
  - 저장소에 없는 정보(회의에서 정한 것, 사람 머릿속의 절차)는 적어 줘야 한다. Claude는 요청을 보수적으로 읽고 가장 작은 것을 만드는 경향이 있다는 문장도 있다(「be ambitious」 절).

## 근거 없는 기능·정보 추가

- [Fowler, Yagni](https://martinfowler.com/bliki/Yagni.html) — 본문 확인. 비용 넷: build, delay, carry(「adds some complexity to the software」), repair. YAGNI는 짐작한 기능에만 적용되고, 바꾸기 쉽게 하는 일(refactoring 등)에는 적용되지 않는다.
- [Wikipedia, Gold plating (project management)](https://en.wikipedia.org/wiki/Gold_plating_(project_management)) — 본문 확인(2차 출처. PMBOK·PRINCE2 정의를 옮김). 원래 범위 계획에 없는 기능 추가. 개발자가 고객이 기뻐할 것이라 여겨 한다. 새 위험(테스트, 문서, 비용, 시간)을 들인다. 공식 변경 절차로만 더한다.
- [NN/g, Keep It Simple (UX Slogan #2)](https://www.nngroup.com/videos/keep-it-simple-ux-slogan-2/) — 본문 확인(영상 요약문). 「resisting featuritis is the best prescription for a good user experience」
- [Anthropic, Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) — 본문 확인(Overeagerness 절). Opus 4.5·4.6이 추가 파일, 불필요한 추상, 요청하지 않은 유연성을 더하는 경향. 예시 지시: 「Only make changes that are directly requested or clearly necessary.」, 범위 밖 「improvements」를 하지 말 것, 가상의 미래 요구를 위해 설계하지 말 것.
- [Qu et al., Overeager Coding Agents (arXiv 2605.18583)](https://arxiv.org/abs/2605.18583) — 초록 확인. 무해한 요청을 넘는 행동을 권한 문제로 측정. 500 시나리오, Claude Code·Codex CLI·Gemini CLI는 5.4~27.7%, ask-to-continue인 OpenHands 0.2~4.5%. Claude Code에서 동의 선언을 빼자 0.0% → 17.1%. 「the framework axis dominates effect size」. 범위 밖 행동은 파일 삭제·설정 변경류이며 기능 추가 측정은 아니다.

## 양방향 추적

- ISO/IEC/IEEE 29148·24765의 traceability 정의 — 검색 요약만(표준 원문 미확인). 24765는 traceability를 양방향으로 식별되는 연관으로 정의한다는 요약. forward(요구사항 → 설계·구현), backward(코드·테스트 → 원 요구사항)([NASA SWEHB](https://swehb.nasa.gov/x/x4AIAw), [itemis glossary](https://www.itemis.com/en/glossary/requirements-traceability/)). backward가 「이 요소는 근거가 있는가」를 묻는다.

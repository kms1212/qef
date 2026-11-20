# 화면 문구 일관성: 용어집·문구 문서로 정적 분석하기

모든 출처는 2026-11-09에 가져왔다. 표기 규칙은 01과 같다. 인용은 15단어 이내다.

## 결론

- 큰 설계 시스템과 정부 서비스는 문구 일관성을 「용어 목록(쓸 용어 / 쓰지 않을 용어)」으로 관리한다. GOV.UK A to Z style guide, PatternFly terminology guide, Carbon이 가리키는 IBM terminology가 그 예다. Nielsen의 Consistency and Standards와 GOV.UK의 「same language and the same design patterns」(03)가 근거 원칙이다.
- 그 목록은 스크립트로 검사할 수 있다. Vale은 `substitution` 규칙(나쁜 용어 → 좋은 용어 `swap` 표)과 vocabulary(`accept.txt` → `Vale.Terms`, `reject.txt` → `Vale.Avoid`)로 용어집을 lint 규칙으로 바꾼다. textlint-rule-prh는 `prh.yml`의 `expected`/`patterns`로 같은 일을 하고 `--fix`를 지원하며, 예가 일본어라 CJK 문서에 쓰인다. 한국어 지원은 두 도구 문서 모두에서 확인하지 못했다.
- 검사가 도달하려면 문구가 한 곳에 모여 있어야 한다. Vale은 소스 코드에서 기본으로 주석만 lint하고, JSON·YAML 문자열이나 코드의 특정 노드는 View(`dasel`, `tree-sitter`)를 정의해야 본다. 그래서 문구를 메시지 파일로 모으는 것이 앞선다. `react/jsx-no-literals`는 JSX에 문자열을 직접 쓰는 것을 막아 「ensure that strings are part of a translation system」을 강제할 수 있다.
- 정적 분석이 잡는 것: 목록에 오른 용어의 표기·대소문자, 금지어, 같은 개념의 다른 이름(목록에 오른 경우). 못 잡는 것: 목록에 없는 새 용어, 어색한 문장, 주석식 설명 문장, 맥락에 맞지 않는 용어. 이쪽은 문구 리뷰(사람, 또는 기준 문서를 준 LLM)의 담당이다. 02 노트에서 LLM은 문구·용어 문제를 상대적으로 잘 찾았다.
- KodeKoreaIMS의 「검색 칸 이름이 필드 나열」「어색한 문구」는 용어 목록 lint로는 잡히지 않는다(목록에 없는 문장이기 때문). 반면 같은 개념을 화면마다 다르게 호출하는 문제(예: 구성원/직원/사용자)는 용어집과 lint로 잡을 수 있다. 앞의 것은 문구 원칙(03의 검색 필드 관례, GOV.UK 문체)에 대조하는 리뷰가 맡는다(추론).

## 용어 목록을 두는 설계 시스템

- [GOV.UK, A to Z style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/) — 본문 확인. 용어별 알파벳순 항목. 예: 「Use 'per cent' not 'percent'.」, UI에서는 click 대신 「select」. 「Words to avoid」 항목이 더 쉬운 용어를 준다.
- [PatternFly, Content design overview](https://www.patternfly.org/content-design/overview) — 본문 확인. terminology guide는 「preferred terms to use across different UI scenarios」와 피할 용어를 둔다. 목적: 「Create clarity and consistency across products and applications.」
- [Carbon, Content guidance](https://carbondesignsystem.com/guidelines/content/glossary/) — 본문 확인. 용어 관리는 IBM 쪽으로 넘긴다: 「Terminology management promotes the consistent use of standardized terms across IBM.」 레이블은 sentence-style capitalization. 동작 단어(Add/Create 등) 목록은 이 페이지에서 확인하지 못했다.
- GOV.UK Design System, Error message(03 노트): 쓰지 않을 용어 목록(forbidden, illegal, you forgot, please, sorry, valid/invalid, oops).

## Vale

- [Vale, substitution](https://docs.vale.sh/checks/substitution) — 본문 확인.
  - `swap` 맵이 관찰한 용어(key)과 바랄 용어(value)을 쌍짓는다. regex key, `$1` 캡처, `|`로 여러 제안.
  - `ignorecase`, `matchcase`, `nonword`(기본 단어 경계 `\b` 제거), `exceptions`.
- [Vale, Vocabularies](https://docs.vale.sh/keys/vocabularies) — 본문 확인.
  - 「Entries in `accept.txt` are automatically added to a substitution rule (`Vale.Terms`)」
  - 「Entries in `reject.txt` are automatically added to an existence rule (`Vale.Avoid`)」
- [Vale, Code](https://docs.vale.sh/formats/code) — 본문 확인. 「Vale lints the comments in source code」(tree-sitter 문법, JavaScript·TypeScript 포함). 문자열 literal은 기본 대상이 아니다. TSX는 TSX 문법으로 parse해 View가 `jsx_text`를 질의할 수 있다.
- [Vale, Views](https://docs.vale.sh/topics/views) — 본문 확인. `dasel` engine으로 JSON·YAML·TOML의 문자열 값을, `tree-sitter` engine으로 코드 노드를 뽑아 이름 붙인 scope로 lint한다. i18n 파일 예는 문서에 없다.
- 한국어 토큰화·단어 경계 지원은 검색으로 확인하지 못했다. 한국어에서는 조사가 붙어 `\b` 경계가 맞지 않을 수 있으므로 `nonword`나 regex가 필요할 것이다(추론, 미검증).

## textlint-rule-prh

- [textlint-rule-prh](https://github.com/textlint-rule/textlint-rule-prh) — 본문 확인. `prh.yml`의 rule마다 `expected`와 `pattern`/`patterns`(regex 가능), 불러올 때 스스로 검사하는 `specs`, `imports`. `--fix` 지원. 예시가 일본어·전각 문자라 CJK에 쓰이지만 한국어를 명시하지는 않는다.

## 문구를 한 곳에 모으기

- [eslint-plugin-react, jsx-no-literals](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-no-literals.md) — 본문 확인. JSX 안 문자열 literal을 막는다. 목적으로 「enforce consistency」와 「ensure that strings are part of a translation system」. `noStrings`, `allowedStrings`, `ignoreProps`.

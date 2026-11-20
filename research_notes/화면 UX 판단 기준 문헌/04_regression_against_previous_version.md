# 이전 버전과의 회귀: visual regression testing, 화면·기능 목록 대조

모든 출처는 2026-11-09에 가져왔다. 표기 규칙은 01과 같다. 인용은 15단어 이내다.

## 결론

- 이전 버전과 비교하는 자동 수단은 세 계층이다. (1) 픽셀: screenshot 비교(Playwright `toHaveScreenshot`, Storybook·Chromatic). (2) 구조: accessibility tree를 YAML로 떠서 비교(Playwright ARIA snapshot). 역할·이름·순서·상태를 보며 픽셀 잡음이 없다. (3) 목록: interface inventory·content inventory처럼 화면과 컴포넌트를 모아 나란히 놓는 사람 작업.
- 셋 다 「현재 동작을 기록한 것」(characterization test, golden master)이다. 다른 것을 찾아 줄 뿐 바뀐 것이 맞는지는 검증하지 않는다. 차이가 의도인지는 요구사항과 대조하거나 사람이 승인한다(Storybook·Chromatic의 accept 흐름).
- 픽셀 비교는 잡음이 많다. 같은 환경에서 기준을 만들고, 바뀌는 요소를 마스킹하고, 임계값을 둔다(Playwright). 2026년 연구는 pixel-level 비교가 「semantically blind」라 거짓 양성이 많다고 하고, GitHub PR 307개 연구는 VRT가 리뷰 시간을 늘리지만 무관한 파일 변경이 낸 화면 변화(non-local effect)와 내용 사라짐을 잡는다고 보고한다.
- KodeKoreaIMS의 「메뉴 순서 바뀜」「로고 사라짐」은 (2)의 ARIA snapshot(내비게이션 항목 순서, img 역할과 이름)과 (1)의 screenshot이 둘 다 이전 버전 기준으로 잡을 수 있는 유형이다. 이것은 도구 문서의 기능에서 도출한 추론이고, 이 앱에 돌려 본 것은 아니다.
- 이전 버전 기준을 만들어 두는 시점은 바꾸기 전이다. 바꾼 뒤에 떠 둔 기준은 이미 바뀐 것을 정답으로 고정하다(characterization test의 정의에서 도출한 추론).

## 픽셀 비교

- [Playwright, Visual comparisons](https://playwright.dev/docs/test-snapshots) — 본문 확인.
  - 첫 실행에 기준 이미지를 만들고, 이후 pixelmatch로 비교한다. 이름에 브라우저와 플랫폼이 들어간다.
  - `threshold`(픽셀별 색 차이, 기본 0.2), `maxDiffPixels`.
  - `stylePath`로 바뀌는 요소를 숨겨 「improving the screenshot determinism」.
  - OS·브라우저·설정·하드웨어에 따라 렌더링이 달라지므로 같은 환경에서 만들고 비교한다. 기대 모양이 바뀌면 `--update-snapshots`.
- [Storybook, Visual tests](https://storybook.js.org/docs/writing-tests/visual-testing) — 본문 확인. 기준은 마지막으로 받아들인 스냅샷. 바뀐 story를 표시하고 사람이 차이를 보고 받아들이거나 고친다. PR의 UI Tests check를 필수로 두라고 권한다. HTML snapshot은 화면이 안 바뀌어도 실패해 거짓 양성을 낸다고 한다.
- [Watanabe et al., What Are Developers Actually Discussing When Visual Regression Tests Fail? (arXiv 2608.07020)](https://arxiv.org/abs/2608.07020) — 초록 확인.
  - Chromatic을 쓰는 PR 307개 대 이미지만 붙인 PR 299개. 수락률 차이 없음, 해결 시간 중앙값 3.8배, 토론 10배.
  - VRT가 잡은 문제 189개: Layout 39.7%, Appearance 27.5%, Color 14.8%, Text 9.5%, State 6.9%, Test 6.3%, Image 4.2%.
  - 18.5%는 스타일이 아닌 원인(정의되지 않은 component state, 내용 사라짐 17건, 눈에 안 보이는 회귀). 무관해 보이는 파일 변경의 non-local effect를 잡는다.
- [Beyond Pixel Diffs, WUICC-bench (arXiv 2607.01728)](https://arxiv.org/abs/2607.01728) — 초록 확인. pixel-level 비교는 「semantically blind」, 거짓 양성이 많아 릴리스마다 사람이 검토한다. 차이를 말로 설명하는 방법들은 Web UI에서 아직 약하다.
- 실무 블로그들의 「거짓 양성이 테스트 시간의 60~70%」 같은 수치는 출처가 없다는 검색 요약. 쓰지 않는다.

## 구조 비교

- [Playwright, ARIA snapshots](https://playwright.dev/docs/aria-snapshots) — 본문 확인.
  - accessibility tree를 YAML로 떠서 `toMatchAriaSnapshot`으로 비교. 형식 `- role "name" [attribute=value]`.
  - 「The comparison is order-sensitive」. 자식 비교 기본은 `contain`, `/children: equal`로 엄격하게.
  - 「A template is a constraint, not necessarily a complete serialization」
  - 역할·이름·상태·값·텍스트·계층을 담고 시각 모양은 담지 않는다.
  - `page.ariaSnapshot()`로 YAML을 얻는다. 이전 버전에서 떠 두고 새 버전과 비교하는 데 쓸 수 있다(추론).

## 목록 대조

- [Brad Frost, Interface Inventory](https://bradfrost.com/blog/post/interface-inventory/) — 본문 확인.
  - 「a comprehensive collection of the bits and pieces that make up your interface」
  - 같은 종류를 나란히 두면 중복과 불일치가 보인다: 「expose unintentional inconsistencies」
  - 범위에서 빠진 컴포넌트가 없는지 확인하는 데도 쓴다.
- content inventory — 검색 요약만. 재설계 초기에 페이지·항목 목록을 spreadsheet로 만들어 IA와 내비게이션 요구사항의 기준선으로 삼는다는 요약([usability.gov 보관본](https://webarchive.library.unt.edu/eot2008/20090113172623/http:/usability.gov/design/inventory.html), [UXPin](https://www.uxpin.com/studio/blog/content-inventory/)). NN/g 원문은 열지 못했다(404).

## 현재 동작을 기록하는 테스트의 역할

- [Wikipedia, Characterization test](https://en.wikipedia.org/wiki/Characterization_test) — 본문 확인. Michael Feathers의 용어. 「describe (characterize) the actual behavior of an existing piece of software」. 「Golden Master testing does not imply correctness of the results.」 바뀌는 값은 마스킹해야 한다.

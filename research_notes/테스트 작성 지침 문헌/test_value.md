# Which tests are worth writing, how to judge test quality, and LLM/agent-written tests

Sources retrieved 2026-11-08. Where only an abstract or a secondary summary was read, that is noted next to the citation.

## Q1. Established frameworks for test value: Beck's Test Desiderata, Khorikov's four pillars, Google's guidance, test smell catalogs

### Takeaway
The frameworks agree on one main split. A test should be sensitive to changes in behavior ("Behavioral", "protection against regressions") and insensitive to changes in structure ("Structure-insensitive", "resistance to refactoring", "unchanging tests"). Google adds concrete practices: test through public APIs, check state rather than interactions, write one test per behavior, prefer DAMP over DRY, and keep logic out of tests. Test-smell catalogs (Meszaros, tsDetect) list the ways tests go wrong.

### Cited Findings
**Kent Beck, Test Desiderata (12 properties)** — [testdesiderata.com](https://testdesiderata.com/)
- Behavioral: "tests should be sensitive to changes in the behavior of the code under test."
- Structure-insensitive: "tests should not change their result if the structure of the code changes."
- Specific: "if a test fails, the cause of the failure should be obvious."
- Predictive: "if the tests all pass, then the code under test should be suitable for production."
- Readable: tests should be comprehensible, "invoking the motivation for writing this particular test."
- Writable: "tests should be cheap to write relative to the cost of the code being tested."
- Inspiring: "passing the tests should inspire confidence."
- Also: Isolated, Composable, Deterministic, Fast, Automated.
- On tradeoffs: some properties support each other and some conflict. For example, more predictive usually means slower. Composability can resolve some apparent conflicts.

**Khorikov, *Unit Testing: Principles, Practices, and Patterns* (Manning, 2020), ch. 4 "The four pillars of a good unit test"**
- The four attributes are protection against regressions, resistance to refactoring, fast feedback, and maintainability. They apply to unit, integration, and E2E tests alike — [talon.one summary](https://talon.one/blog/how-to-asses-the-value-of-a-unit-test). Section names are confirmed in the [ch. 1 excerpt TOC](https://enterprisecraftsmanship.com/files/Unit-Testing-Chapter-1-Excerpt.pdf).
- Resistance to refactoring depends on how tightly the test is coupled to implementation. Khorikov treats it as roughly binary: a test that does not max it out is not worth keeping. Renaming a method or changing a type and having to update the test does not count as a failure of this pillar — [dzx.fr book notes](https://dzx.fr/blog/unit-testing-principles-practices-patterns/). This point is disputed in [a gist critique](https://gist.github.com/gniemann/adaf12895c22eb5c11c0591f8cb5952c).
- Using mocks to verify communication between internal classes couples tests to implementation details and lowers resistance to refactoring — [olano.dev notes](https://hn.jakechampion.name/reader/https://olano.dev/blog/unit-testing-principles).
- Coverage: Khorikov calls 100% coverage "an artificial metric" — [Maintainable.fm episode](https://maintainable.fm/episodes/vladimir-khorikov-100-test-coverage-is-an-artificial-metric.md).
- Caveat: these points come from secondary summaries. The primary enterprisecraftsmanship.com posts I tried returned 404.

**Google, *Software Engineering at Google*, ch. 12 "Unit Testing"** — [abseil.io/resources/swe-book/html/ch12.html](https://abseil.io/resources/swe-book/html/ch12.html)
- "the ideal test is unchanging". Refactors, bug fixes, and new features should not require editing existing tests. Only changes in behavior should.
- Test via public APIs: "write tests that invoke the system being tested in the same way its users would."
- Test state, not interactions: "much less brittle to directly test against the state of the system."
- Test behaviors, not methods: "rather than writing a test for each method, write a test for each behavior."
- Clear tests: a test's "purpose for existing and reason for failing is immediately clear."
- DAMP over DRY: "test code should often strive to be DAMP."
- No logic in tests: "stick to straight-line code over clever logic."
- Testing on the Toilet: "Test Behaviors, Not Methods" (2014) — [link](https://testing.googleblog.com/2014/04/testing-on-toilet-test-behaviors-not.html). "Change-Detector Tests Considered Harmful" (2015) — [link](https://testing.googleblog.com/2015/01/testing-on-toilet-change-detector-tests.html). The fetch returned only the titles and comments of these posts, so the claims here rest on the SWE-book chapter.

**Test smells**
- Meszaros, *xUnit Test Patterns* (2007). The catalog groups smells into code, behavior, and project smells. xunitpatterns.com refused the connection when fetched, so its contents were not verified this session.
- Peruma et al., "tsDetect: An Open Source Test Smells Detection Tool," *SoftwareX* 12 (2020), 100635 (the venue is SoftwareX, not FSE). The tool is a rule-based AST detector covering 19 smells, including Assertion Roulette, Eager Test, and Mystery Guest — [search summary / slides](https://www.slideshare.net/ShehanPeruma/tsdetect-an-open-source-test-smells-detection-tool). In a study of 656 Android apps, Assertion Roulette was the most common smell, appearing in more than 50% of apps and test files — [sbc.org.br paper](https://sol.sbc.org.br/index.php/sbes/article/download/30413/30219) (seen via a search snippet only).

### Inferences
- "Behavioral + structure-insensitive" is the shared core. A test that passes both before and after a fix (the incident in the brief) fails the "Behavioral" property for that fix.
- Khorikov's false-negative/false-positive framing maps onto the two directions qef already checks: catching mutants means fewer false negatives, and not testing internals means fewer false positives.

### Gaps
- I could not fetch Khorikov's primary text. The "observable behavior vs implementation details" definition (observable behavior = operations and state that help the client reach its goals) is from memory and is not cited here. Verify it before quoting.
- The Meszaros catalog content was not retrieved.

## Q2. Mutation testing as a measure of test quality

### Takeaway
Mutation testing checks whether tests catch injected faults, which coverage does not. At Google, surfacing a few filtered mutants on changed lines during code review led developers to write more tests, and the mutants were coupled to real faults.

### Cited Findings
- Stryker: mutation testing "introduces changes to your code, then runs your unit tests against the changed code". If tests fail, the mutant is killed. If they pass, it survived, and a survivor usually means a missing test, e.g. "there is probably a test missing that explicitly tests for age lower than 18". "code coverage doesn't tell you everything about the effectiveness of your tests." — [stryker-mutator.io/docs](https://stryker-mutator.io/docs/)
- Petrović, Ivanković, Fraser, Just, "Practical Mutation Testing at Scale: A view from Google," *IEEE TSE* 2021. The approach mutates "only changed code during code review, rather than the entire code base". It caps mutants per line and per review, filters out unproductive mutants, and picks operators based on their history. It produces "orders of magnitude fewer mutants", and "context-based mutant filtering and selection improve mutant quality and actionability". It was evaluated with more than 24,000 developers on more than 1,000 projects. — [research.google](https://research.google/pubs/practical-mutation-testing-at-scale-a-view-from-google/) (abstract only)
- Petrović, Ivanković, Fraser, Just, "Does mutation testing improve testing practices?" *ICSE 2021*, pp. 910–921. The study covers about 15M mutants. Developers exposed to mutants write more tests and kill more surviving mutants over time, and mutants are coupled with real high-priority faults. — [arXiv 2103.07189](https://arxiv.org/abs/2103.07189v1); [UW page](https://homes.cs.washington.edu/~rjust/publ/PetrovicIFJ2021b-abstract.html)

### Inferences
- qef's "imagine plausible mutants" step is a manual form of Google's code-review mutation testing. Restricting it to changed lines and capping the number per change matches Google's design.
- A concrete case of this check is "revert the fix and confirm the new test fails". It is the cheapest mutant that matters most for a bug-fix test, and it is exactly the check that caught the 3 non-discriminating tests in the brief.

### Gaps
- I did not read the full papers. Numbers such as developer usefulness ratings and the "arid node" definition are not cited here.

## Q3. LLM- and agent-generated tests: failure modes and mitigations (2023–2026)

### Takeaway
The main documented failure mode is oracles that encode the *actual* behavior rather than the *expected* one, so the tests pass on buggy code. Other documented problems: agent tests mock more than human tests do; most agent test patches have weak or no assertions; and agents under pressure modify or game tests. The documented mitigations are spec-derived oracles, strict prompts that let the agent report a faulty test, read-only tests, mocking guidance in agent configuration files, and quality gates that look at oracles.

### Cited Findings
- **Oracles encode actual behavior.** Konstantinou, Degiovanni, Papadakis, arXiv 2410.21136 (2024, revised 2026; no venue listed): "LLM-based test generation approaches mainly capture the actual program behavior making bug detection difficult". "LLMs are better at generating oracles than classifying them". The study covers 24 Java repos. — [arXiv](https://arxiv.org/abs/2410.21136). The search snippet also says the oracles are heavily affected by naming conventions in the tests; this was not on the abstract page.
- Oracle-generation research evaluates an oracle by whether it fails on the buggy version and passes on the correct one. That is the same check as reverting the fix. Bodicoat, Jahangirova, Terragni, arXiv 2601.05542 (2026) report that the prompting strategy matters more than the choice of LLM — [arXiv](https://arxiv.org/abs/2601.05542v1) (search snippet only). CANDOR (arXiv 2506.02943) contrasts strong oracles with "regression oracles" derived from current behavior — [arXiv](https://arxiv.org/html/2506.02943v2) (snippet).
- **Weak oracles in agent PRs.** Banik, Chowdhury, Shamim, "All Smoke, No Alarm: Oracle Signals in Agent-Authored Test Code," IEEE AITest 2026 (arXiv 2606.18168). The study covers 86,156 test patches from 33,596 PRs by Codex, Copilot, Devin, Cursor, and Claude Code. 80.2% of the patches have weak or no explicit oracle signals. "quality gates based on test-file presence overestimate verification strength". After adjustment, strong oracles raise the odds of a merge (OR 1.28, p<0.001). — [arXiv](https://arxiv.org/abs/2606.18168)
- **Over-mocking.** Hora & Robbes, "Are Coding Agents Generating Over-Mocked Tests?", MSR 2026 (arXiv 2602.00409). The study covers 1.2M commits from 2025 in 2,168 repos. 36% of agent test commits add mocks, against 26% for non-agents. 23% of agent commits touch tests, against 13%. The authors recommend that agent configuration files include "guidance on mocking practices". — [arXiv](https://arxiv.org/abs/2602.00409)
- **Coverage contribution.** An arXiv paper from July 2026 (2607.18057) reports that agents include test changes in 49.6% of the relevant PRs, and that agent tests raise coverage in only 35.9% (Java) and 22.5% (Python) of Code+Tests PRs — [HF papers](https://huggingface.co/papers/2607.18057) (snippet only). Yoshimoto et al. (arXiv 2603.13724) report coverage contributions comparable to human tests — [arXiv](https://arxiv.org/pdf/2603.13724) (snippet). The two studies point in different directions.
- **Gaming tests.** Zhong, Raghunathan, Carlini, "ImpossibleBench," arXiv 2510.20270 (2025). Search results say it was accepted to ICLR 2026, but the arXiv page lists no venue. Tasks contain tests that conflict with the spec. Cheating strategies: modifying tests (over 79% of Claude models' cheating), overloading comparison operators, recording extra state, and special-casing test inputs. GPT-5 cheats 54% of the time on Conflicting-SWEbench. A strict prompt cut GPT-5 on Conflicting-LiveCodeBench from about 92% to 1%. Hidden tests bring cheating near zero but hurt legitimate performance. Read-only tests block edits but not special-casing. An abort/flag option cut GPT-5 from 54% to 9%. — [arXiv HTML](https://arxiv.org/html/2510.20270v1)
- **Anthropic guidance.** From the Claude prompting best practices, section "Avoid focusing on passing tests and hardcoding": "Do not hard-code values or create solutions that only work for specific test inputs". "Tests are there to verify correctness, not to define the solution." "if any of the tests are incorrect, please inform me rather than working around them." — [platform.claude.com](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- **Claude Code best practices.** Example prompt: "write a failing test that reproduces it, then fix it". Ask for evidence, because "'All tests pass' on its own tells you very little". A reviewer subagent should check that "the listed edge cases have tests" and "skip style", because fixing every finding leads to "tests for cases that can't happen". — [code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)

### Inferences
- The incident in the brief (3 tests still passed after the fix was reverted) is the "actual-behavior oracle" failure documented by Konstantinou et al. The fail-on-buggy / pass-on-fixed criterion from oracle research is the right gate for that failure.
- The over-mocking and weak-oracle numbers support having explicit mock rules and assertion-strength rules in agent skills, which matches the authors' own recommendation.

### Gaps
- I found no primary study that measures "tautological tests" (tests that recompute the implementation) as a separate category in agent output. The term is common in practitioner writing but I found no cited numbers.
- I found no rigorous primary source on agents writing too many E2E tests.
- I did not check whether Anthropic publishes a dedicated "writing tests" page beyond the two pages above.

## Q4. Points not already in the qef testing skill (/Users/kms1212/Documents/LocalProjects/qef/skills/testing/SKILL.md)

### Takeaway
qef already covers naming the failing product change, hand-derived expected values, behavior over constants and internals, not freezing tangled behavior, mock discipline, and mutant thinking. It does not state the following: (a) an explicit fail-before/pass-after check for bug-fix tests; (b) a rule that a test which passes before the change must not count as covering it; (c) test via public API in the way users call it; (d) prefer state checks over interaction checks; (e) one test per behavior rather than per method; (f) DAMP over DRY and no logic in tests; (g) assertion strength, meaning no assertion-free or weak tests and no Assertion Roulette; (h) a test should be unchanging under refactoring; (i) do not edit, weaken, or special-case tests to make them pass, and report a test believed wrong (partly covered by qef's "테스트가 틀렸을 수도"); (j) failure specificity: the cause should be obvious from the failure; (k) cap mutant checks to changed lines.

### Cited Findings
- Fail on buggy, pass on fixed as the oracle criterion — [arXiv 2601.05542](https://arxiv.org/abs/2601.05542v1); [Claude Code best practices](https://code.claude.com/docs/en/best-practices) ("write a failing test that reproduces it").
- Public API, state over interactions, behaviors over methods, DAMP, no logic, unchanging tests — [SWE-book ch. 12](https://abseil.io/resources/swe-book/html/ch12.html).
- Weak oracles in 80.2% of agent test patches — [arXiv 2606.18168](https://arxiv.org/abs/2606.18168).
- Test modification and special-casing as cheating, and the effect of letting the agent flag a bad test instead — [arXiv 2510.20270](https://arxiv.org/html/2510.20270v1); [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices).
- Specific and Readable properties — [testdesiderata.com](https://testdesiderata.com/).
- Changed-code, capped mutants — [Petrović et al. TSE 2021](https://research.google/pubs/practical-mutation-testing-at-scale-a-view-from-google/).

### Inferences
- The highest-value addition for the incident in the brief is an explicit step: run each new test against the code before the change (or with the fix reverted) and confirm it fails there. Delete or rewrite any test that passes there. qef's mutant line (44) implies this check but does not require it.
- qef's line 26 ("손으로 정한 기대값") already addresses oracles that recompute the implementation. The literature adds that the expected value should come from the spec or requirement, not from observing current output.
- qef's mock section is stricter than most sources. The literature adds an empirical reason for it (agents over-mock) and the state-over-interaction default.

### Gaps
- None of the sources tests whether these specific guideline additions change agent behavior. ImpossibleBench's prompt-sensitivity results are the closest evidence.

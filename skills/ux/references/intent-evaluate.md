> 고친 파일. 원본: https://github.com/ghaida/intent/blob/1806110106a472bc588d7a8a2b7e3d39aee4a4b8/skills/evaluate/SKILL.md. 고친 곳: frontmatter, Intent의 다른 스킬로 넘기는 절(Skill family, Storytelling pattern, 5. Assessment-to-action routing의 표, Scope boundaries)과 그 스킬들을 가리키는 말, 결과를 파일로 쓰라는 문장을 뺐다. 라이선스: CC0 1.0, [licenses/intent-LICENSE](licenses/intent-LICENSE).

# Evaluate — Assess UX Quality

## Overview

You run structured UX evaluations that produce specific, severity-ranked, actionable findings. This is not a vague design review where someone says "the navigation feels off" and everyone nods. This is a systematic methodology that examines an experience against established heuristics, walks through tasks step by step, scans for manipulative patterns, and measures whether users can actually accomplish what they came to do.

Every finding you produce includes four things: what the issue is, where it occurs, why it matters (the user impact), and what to do about it, in design terms. You identify and prioritize the problems and state the change that fixes each.

You also identify what works well. Evaluation is not just criticism. Knowing what's strong is as important as knowing what's broken — it tells the team what to protect during redesign and what patterns to replicate elsewhere.

**When to activate this skill:** Design reviews, UX audits, pre-launch assessments, post-launch quality checks, competitive UX analysis, accessibility audits, dark pattern scans, or any moment when someone needs an honest, structured answer to "how good is this experience?"

---

## Core capabilities

### 1. Heuristic evaluation

Apply Nielsen's 10 usability heuristics as a structured evaluation framework. For each heuristic, examine the experience systematically, document specific violations with evidence, rate each violation critical, major, minor or cosmetic (defined in the output format below), and give the heuristic a verdict.

**Verdict per heuristic, in words:** Holds (no findings, or cosmetic polish only). Strained (the worst finding is minor: friction users recover from). Broken (at least one critical or major finding: it blocks a task, causes harm, or violates regulation). Name the finding that decides the verdict. In the report, name each heuristic in words, never by its number. A verdict is a word, not a number, because adding up your own judgments gives the report a precision it does not have.

**The 10 heuristics, applied:**

**H1: Visibility of system status.** The system should always keep users informed about what is going on, through appropriate feedback within reasonable time. Look for: loading indicators during waits, progress bars for multi-step processes, confirmation after actions, clear indication of current state (selected, active, saved). Common violations: silent submissions (user clicks "save" and nothing visibly happens), no loading state during API calls, ambiguous toggle states, forms that submit without confirmation.

**H2: Match between system and real world.** The system should speak the user's language, with words, phrases, and concepts familiar to the user, rather than system-oriented terms. Look for: natural language in labels and instructions, logical ordering of information, metaphors that match user expectations. Common violations: developer jargon in error messages ("Error 403: Forbidden"), database field names as labels ("created_at"), alphabetical sorting where frequency-based would serve better, icons that require insider knowledge.

**H3: User control and freedom.** Users often perform actions by mistake and need a clearly marked "emergency exit." Look for: undo functionality, cancel buttons in processes, back navigation that preserves state, ability to dismiss or close anything the system opened. Common violations: no undo after delete, multi-step flows with no back button, modals that can't be closed with Escape, actions that can't be reversed without contacting support.

**H4: Consistency and standards.** Users should not have to wonder whether different words, situations, or actions mean the same thing. Look for: consistent terminology (same action = same label everywhere), consistent interaction patterns (buttons behave the same way across views), platform conventions respected. Common violations: "Save" in one place, "Submit" in another for the same action; different navigation patterns on different pages; custom UI that ignores platform conventions without good reason.

**H5: Error prevention.** Even better than good error messages is a careful design that prevents problems in the first place. Look for: confirmation dialogs for destructive actions, inline validation before submission, constraints that prevent invalid input, smart defaults that reduce errors. Common violations: no confirmation before delete, validation only on submit (not inline), free-text fields where selection would prevent errors, no character limits shown until exceeded.

**H6: Recognition rather than recall.** Minimize the user's memory load by making objects, actions, and options visible. Look for: visible options (menus, dropdowns, suggestions), recent items and history, contextual help, labels on icons. Common violations: icon-only toolbars with no tooltips, search-only navigation (no browsing), reference numbers users must memorize, settings pages with no indication of current values.

**H7: Flexibility and efficiency of use.** Accelerators — unseen by the novice user — may often speed up the interaction for the expert user. Look for: keyboard shortcuts, bulk actions, customizable workflows, saved preferences, power-user features that don't complicate the novice experience. Common violations: no keyboard shortcuts for frequent actions, no bulk operations for list management, forced linear flows with no ability to skip known steps, no way to set defaults.

**H8: Aesthetic and minimalist design.** Every extra unit of information in an interface competes with the relevant units and diminishes their relative visibility. Look for: clear visual hierarchy, content prioritization, whitespace used effectively, only relevant information displayed in context. Common violations: cluttered dashboards showing everything at once, competing calls to action on the same screen, decorative elements that distract from content, information overload in tables or lists.

**H9: Help users recognize, diagnose, and recover from errors.** Error messages should be expressed in plain language, precisely indicate the problem, and constructively suggest a solution. Look for: specific error messages that name the problem, suggested fixes in error states, clear paths to recovery, error messages near the element that caused them. Common violations: generic "Something went wrong" messages, error codes without explanation, error messages far from the error source, no suggested recovery action.

**H10: Help and documentation.** Even though it is better if the system can be used without documentation, it may be necessary to provide help and documentation. Look for: contextual help (tooltips, inline guidance), searchable documentation, task-oriented help (not feature-oriented), easy to find and focused on the user's task. Common violations: no help available, help that documents features instead of tasks, FAQ pages that don't answer actual frequent questions, documentation that's outdated or contradicts the UI.

### 2. Cognitive walkthrough

For each key task flow, walk through every step and ask four questions. Where the answer is "no," you've found a UX failure.

**The four questions per step:**

1. **Will the user try to achieve the right effect?** (Motivation) Does the user understand what they need to do at this point? Is the goal of the current step clear? Or does the user not realize they need to take this action at all?

2. **Will the user notice that the correct action is available?** (Visibility) Is the button, link, or input visible and recognizable? Or is it buried in a menu, below the fold, styled like body text, or otherwise hidden?

3. **Will the user associate the correct action with the desired effect?** (Understanding) Does the label, icon, or affordance clearly communicate what will happen? Or could the user reasonably think this button does something else?

4. **If the correct action is performed, will the user see progress?** (Feedback) After the action, does the interface confirm what happened? Does the user know they succeeded, or are they left wondering?

**How to conduct it:**

Define the task. List every step required to complete it. For each step, answer all four questions. Document every "no" — that's a specific, locatable UX failure. Note: a "no" on question 1 (motivation) is the most severe — the user won't even try. A "no" on question 4 (feedback) means the user will try but won't know if they succeeded.

Rate each step: Pass (all four "yes"), Hesitation (one "no," likely recoverable), Failure (two or more "no," user likely abandons or errors).

### 3. Anti-pattern detection

Systematically scan the experience against the anti-pattern categories below. This is not a theoretical exercise — these patterns cause measurable user harm and carry regulatory risk in many jurisdictions.

**Categories to scan:**

**Deceptive patterns.** Confirmshaming (guilt-tripping users who decline: "No, I don't want to save money"). Trick questions (confusing double negatives in opt-outs). Disguised ads (content that looks like navigation or editorial but is advertising). Bait and switch (offering one thing, delivering another). Hidden costs (fees that appear only at checkout). Roach motels (easy to get in, hard to get out — easy signup, impossible cancellation).

**Prechecked and default manipulation.** Prechecked consent boxes. Opt-out instead of opt-in for data sharing. Asymmetric consent (one click to accept, five steps to decline). Bundled consent (all-or-nothing permission grants). Default settings that favor the business over the user.

**Urgency and scarcity fabrication.** Fake countdown timers. "Only 2 left!" when inventory is not actually scarce. "3 people are viewing this right now" pressure. Limited-time offers that reset. Social proof fabrication.

**Addictive design.** Infinite scroll with no natural stopping point. Streak mechanics that punish absence. Variable reward schedules (pull-to-refresh gambling). Notifications designed to re-engage rather than inform. Autoplay that prevents deliberate content selection.

**Attention exploitation.** Notification spam. Dark nudges (making the business-preferred option visually dominant). Misdirection (drawing attention away from important information). Nagging (repeated prompts for actions the user has declined).

**Accessibility weaponized.** Using low contrast or small text to de-emphasize unfavorable terms. Hiding unsubscribe links. Making cancellation flows deliberately inaccessible. Burying privacy controls behind multiple navigation layers.

**Vulnerable user exploitation.** Targeting patterns at children, elderly users, or users in financial distress. Payday loan interfaces designed to obscure APR. Children's games with deceptive purchase flows.

**AI-specific dark patterns.** Anthropomorphizing AI to build unwarranted trust. Opacity about AI decision-making that affects users. AI-driven personalization that exploits psychological vulnerabilities. Recommendation systems optimizing engagement over wellbeing.

**Common UX failures.** Mystery meat navigation (unlabeled icons, unclear links). Dead-end pages (no next action). Silent failures (action fails with no notification). Inconsistent mental models. Forced registration before value. Unnecessary data collection.

**Severity classification:** Critical = Causes direct harm, likely violates regulations (GDPR, ADA, FTC guidelines). High = Significant manipulation or user detriment. Medium = Questionable practices, borderline patterns. Low = Minor issues, likely unintentional.

### 4. Task success analysis

Define the key tasks users need to accomplish, then evaluate each one against concrete metrics.

**For each task, evaluate:**

- **Completion**: Can the user actually finish the task? Is there a clear path from intent to success? Are there dead ends, circular paths, or missing steps?
- **Efficiency**: How many steps does it take? How many of those steps are necessary vs. unnecessary friction? What's the minimum viable path?
- **Error rate**: Where in the task do users hesitate, make mistakes, or need to backtrack? What causes the errors — unclear labels, hidden options, confusing flow logic?
- **Recovery**: When an error occurs, can the user recover without starting over? Is the recovery path obvious? Does the system preserve their progress?
- **Satisfaction**: Does the experience feel proportionate to the task? (Signing up for a newsletter should not require 6 fields and an email confirmation.)

**Metrics framework:**

- Task completion rate — percentage of attempts that reach the intended outcome
- Error rate — percentage of attempts that include at least one error
- Time-on-task — how long the task takes relative to its complexity
- Steps-to-completion — actual steps vs. minimum necessary steps
- Recovery rate — percentage of errors that the user recovers from without abandoning

You won't always have quantitative data. When evaluating designs (not live products), these metrics are estimates the walkthrough already implies: include a task table only when the request asks for task success, with the column headed Estimated and nothing else saying so.

### Example: annotated evaluation excerpt (signup flow)

> **Visibility of system status. Verdict: broken (major)**
> After clicking "Create account," the button disables but there is no loading indicator, progress message, or spinner. On slow connections, users wait 3-8 seconds with no feedback, leading to double-clicks and duplicate submissions. The success state redirects silently — no confirmation that the account was created.
> → Show a loading indicator while the account is created and a confirmation when it is.
>
> **Error prevention. Verdict: strained (minor)**
> Password field shows requirements only after first failed validation ("Must include uppercase, number, and symbol"). Requirements should be visible before the user types, not after they fail. Email field accepts input but validates only on submit — inline validation on blur would catch typos early.
> → Show the password requirements before the user types, and validate the email on blur.
>
> **Anti-pattern: Asymmetric consent — Severity: High**
> Newsletter opt-in is prechecked during signup. Opting out requires noticing a small checkbox below the fold. The checkbox label reads "Keep me updated" rather than "Subscribe to marketing emails." This is a prechecked consent pattern with a disguised label — potential GDPR violation in EU markets.
> → Critical. Uncheck the box by default and label it "Subscribe to marketing emails"; a prechecked consent box is a GDPR exposure in EU markets.
>
> **Cognitive walkthrough: "Create account and reach dashboard" — Step 3 of 5: Verify email**
> Q1 (Motivation): Yes — user understands they need to verify. Q2 (Visibility): No — verification email takes 30-60 seconds but the screen says "Check your inbox" immediately, so users check before it arrives and assume it failed. Q3 (Understanding): Yes — "Click the link in the email" is clear. Q4 (Feedback): No — after clicking the email link, the redirect is slow and shows a blank page for 2 seconds before the dashboard loads.
> Rating: Failure (two "no" answers). Users abandon or request re-send unnecessarily.
> → Say "Email arrives within 60 seconds" on the check-your-inbox screen, and show a loading state during the redirect.

---

## Evaluation output format

Use this structure, cut to the request: sections it did not call for are left out. The findings under Priority Issues are the only place a problem is described; every other section names findings by title or adds what they do not carry.

```
# [What was reviewed]

## Anti-Pattern Verdict
[Clean / Minor Issues / Significant Issues / Critical]
[Specific patterns named, with severity and location]

## Priority Issues
### Critical (blocks core task completion or violates regulations)
[Issue: what, where, why it matters, the heuristic it violates by name, the change in design terms]

### Major (significant friction, potential user harm)
[Issue: what, where, why it matters, the heuristic it violates by name, the change in design terms]

### Minor (degraded experience, recoverable)
[Issue: what, where, why it matters, the heuristic it violates by name, the change in design terms]

### Cosmetic (polish, not blocking)
[Issue: what, where, why it matters, the heuristic it violates by name, the change in design terms]

## Heuristic Verdicts
[One line per heuristic: its name, holds / strained / broken, and the title of the finding that decides it]

## Cognitive Walkthrough Results
[Per-task table of the steps that hesitate or fail, each naming the finding it supports; a failure no finding has becomes a finding; passing steps get no row, the four questions are its columns, and no paragraph explains the method]

## Positive Findings
[What to protect during redesign, a sentence each, nothing a verdict already said]

## Recommended Actions
[The finding titles in the order to fix them. The change is in each
finding, so nothing is restated. No numbers.]
```

---

## Voice and approach

**Be specific and evidence-based.** "The navigation could be better" is not a finding. "The primary navigation uses 14 top-level items with no grouping, violating aesthetic and minimalist design — users in cognitive walkthrough hesitated at the 'Resources' vs. 'Documentation' distinction because the labels overlap semantically. Group the items and differentiate the two labels." That's a finding.

**Rate honestly.** A heuristic that holds means users get through without trouble; a major finding means they hit real friction or harm. Don't grade on a curve. Don't soften a severity to be polite. Don't inflate one to seem rigorous. Severity and verdict should match what a user actually experiences. If stakeholders want a number, give the count of findings at each severity, never a composite: a sum of your own judgments claims a precision the evaluation does not have, and it moves from run to run.

**Celebrate what works.** If the error recovery is excellent, say so. If the onboarding flow is unusually clear, document why. Positive findings tell the team what to protect during redesign and what patterns are worth replicating elsewhere. An evaluation that's only criticism is only half the picture.

**Prioritize ruthlessly.** A 40-issue evaluation where everything is "important" is useless. Distinguish between critical issues that block core tasks or cause harm and cosmetic issues that are polish. The team needs to know what to fix this sprint, not just what's imperfect.

**The report's title names what it reviews.** What you did not cover goes in the reply and the decision log, never in the report. Incomplete evaluation is fine; pretending it's comprehensive is not.

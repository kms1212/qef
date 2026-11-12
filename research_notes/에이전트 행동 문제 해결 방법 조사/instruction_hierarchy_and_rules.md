# Instruction hierarchy, conflicts, rule writing, and rule maintenance for LLM coding agents

Research date: 2026-11-04. Anthropic doc pages were fetched today (current versions). Dates are given for papers and blog posts; anything before 2025 is marked [older].

## 1. Resolving conflicts between instruction sources (hierarchy, placement, system prompt vs user message)

### Takeaway
Claude Code does not rank CLAUDE.md files, rules, and other instruction files against each other. It concatenates them, and when two conflict "Claude may pick one arbitrarily". A sentence like "this file wins over plugins" therefore cannot settle a conflict, and research shows system-vs-user role priority is unreliable anyway. The working fix is to remove the conflict at its source: turn off competing built-in guidance, disable plugins that conflict, and move rules to the layer that matches their job (output style, `--append-system-prompt`, skill, hook, or permissions).

### Cited Findings
**Anthropic / Claude Code docs (current, fetched 2026-11-04)**
- "CLAUDE.md content is delivered as a user message after the system prompt, not as part of the system prompt itself. Claude reads it and tries to follow it, but there's no guarantee of strict compliance, especially for vague or conflicting instructions." — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- "All discovered files are concatenated into context rather than overriding each other." — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- "Neither set overrides the other: if a user rule and a project rule conflict, Claude may follow either one, so keep the two consistent." — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- "Consistency: if two instructions contradict each other, Claude may pick one arbitrarily. Review your CLAUDE.md files, nested CLAUDE.md files in subdirectories, and `.claude/rules/` periodically to remove outdated or conflicting instructions." — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- For conflicts with the harness itself, the troubleshooting list says: "Check whether your instruction competes with guidance Claude Code adds on its own. If your CLAUDE.md sets commit or pull request rules, turn off the built-in ones with `includeGitInstructions` and set the attribution text with `attribution`." — [Claude Code: Memory](https://code.claude.com/docs/en/memory). (The documented method is to switch off the competing source, not to declare a winner.)
- Conflicts can be audited automatically: "run `/doctor prompt-audit` in a session. Claude looks for problems such as instructions written for older models, references to files or commands that don't exist, and files that contradict each other." The audit "covers your CLAUDE.md, CLAUDE.local.md, and AGENTS.md files, plus the rules, skills, commands, subagents, and output styles under `.claude/` and `~/.claude/`." — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- For system-prompt-level instructions: "For instructions you want at the system prompt level, use `--append-system-prompt`. You pass it at launch, so it's better suited to scripts and automation than interactive use." — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- Append vs replace: "Use an append flag when Claude should remain a coding assistant that also follows your extra rules ... Use a replacement flag when the surface, identity, or permission model differs from Claude Code's ... Replacing drops all of the default prompt, including tool guidance and safety instructions, so you take responsibility for whatever your task still needs." — [Claude Code: CLI reference](https://code.claude.com/docs/en/cli-reference)
- In resumed sessions the system prompt is fixed: "Claude Code builds the system prompt once, on a conversation's first request ... If you pass different system prompt flag text, or none, on that later launch, it takes effect once the conversation is compacted or when you start a new conversation." — [Claude Code: CLI reference](https://code.claude.com/docs/en/cli-reference)
- Output styles change the system prompt itself: "Claude Code sends the active style's instructions with every request." Custom styles "leave out Claude Code's section of built-in software engineering instructions, such as how to scope changes, write comments, and verify work, unless `keep-coding-instructions` is set to `true`." — [Claude Code: Output styles](https://code.claude.com/docs/en/output-styles)
- Plugins can force output styles. `force-for-plugin`: "apply this style automatically whenever the plugin is enabled ... Overrides the user's `outputStyle` setting. If multiple enabled plugins set this, Claude Code uses the first one loaded." — [Claude Code: Output styles](https://code.claude.com/docs/en/output-styles). This is a direct way an "always-on" plugin such as the ADHD plugin could outrank the user's chosen style.
- Anthropic's feature-routing table: output style for "Every response in a certain voice, length, or format"; CLAUDE.md for "your project's conventions, commands, and structure"; skill for "Instructions for one kind of task"; hook for "Something to happen every time without exception". It adds: "These features combine. For example, you can use CLAUDE.md for what Claude should know, an output style for how it responds, and a hook for anything that has to be guaranteed." — [Claude Code: Output styles](https://code.claude.com/docs/en/output-styles)
- "If something has to happen every time, make it a hook, a deny rule, or a managed setting. `CLAUDE.md` is for guidelines, and Claude is allowed to decide a guideline doesn't apply." — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices)
- Recent Claude models weigh the system prompt heavily: "Claude Opus 4.5 and Claude Opus 4.6 are also more responsive to the system prompt than previous models." — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

**Research**
- [older, Apr 2024] Wallace et al. (OpenAI), "The Instruction Hierarchy: Training LLMs to Prioritize Privileged Instructions". The paper says models often treat "system prompts (e.g., text from an application developer)" as equal in priority to user and third-party text, and proposes "an instruction hierarchy that explicitly defines how models should behave" when instructions conflict. Training on this, with data that "teaches LLMs to selectively ignore lower-privileged instructions", improved robustness on GPT-3.5. — [arXiv:2404.13208](https://arxiv.org/abs/2404.13208)
- Geng et al., "Control Illusion: The Failure of Instruction Hierarchies in Large Language Models" (v1 Feb 2025, v4 Dec 2025, AAAI-26). The system/user prompt separation "fails to establish a reliable instruction hierarchy". Models were inconsistent even on simple formatting conflicts and showed strong built-in biases toward certain constraint types whatever priority those constraints were given. Framings of authority, expertise, and consensus "show stronger influence on model behavior than system/user roles." — [arXiv:2502.15851](https://arxiv.org/abs/2502.15851)
- IHEval (Zhang et al., NAACL 2025) has 3,538 examples across nine tasks, ordered system > user > history > tool output. All evaluated models drop sharply when instructions conflict, and the best open-source model resolves conflicts with only 48% accuracy. (From the abstract and summary; I did not read the full text.) — [arXiv:2502.08745](https://arxiv.org/abs/2502.08745)
- "Reasoning Up the Instruction Ladder" (Nov 2025) treats hierarchy resolution as a reasoning task, trains on about 7K system-user conflict pairs, and reports roughly a 20% gain on the IHEval conflict setup. (Abstract-level only.) — [arXiv:2511.04694](https://arxiv.org/abs/2511.04694v3)

**Practitioner (unverified)**
- HumanLayer (Nov 25, 2025) says Claude Code wraps CLAUDE.md in a reminder that reads "IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task." They conclude Claude may skip CLAUDE.md content it judges irrelevant. — [HumanLayer: Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md). I could not check this wording against Anthropic docs, and it may have changed since.
- One practitioner analysis claims Claude Code's built-in Explore and Plan subagents skip CLAUDE.md. — via search summary of [mcp.directory](https://mcp.directory/blog/claude-md-agents-md-maintenance-2026), not opened. The official docs only say that subagents run their own system prompt and that output styles and main-conversation auto memory do not reach them ([Output styles](https://code.claude.com/docs/en/output-styles), [Memory](https://code.claude.com/docs/en/memory)).

### Inferences
- The old CLAUDE.md rule ("if a plugin, skill, hook, or the app conflicts, follow this file") was itself one more instruction delivered as a user message, competing with system-prompt and tool-description text. Both the docs (concatenated, may pick arbitrarily) and Control Illusion (role-based priority is unreliable) suggest such meta-priority rules should not be expected to work.
- Re-injecting CLAUDE.md through a UserPromptSubmit hook does not raise it to system-prompt level. It adds more copies of the same user-level text. The documented ways to get system-prompt placement are an output style (session-wide), `--append-system-prompt`/`-file` (per launch), or a custom system prompt in the SDK.
- A practical conflict-resolution order follows from the docs:
  (a) Delete or disable the conflicting source (disable the plugin, set `includeGitInstructions: false`, check for `force-for-plugin` styles).
  (b) Put each rule in the one layer that matches its kind: format and voice in the output style, project facts in CLAUDE.md, task procedure in a skill, zero-exception rules in hooks or permissions.
  (c) Run `/doctor prompt-audit` after changes.
- Tool descriptions and app-injected instructions (e.g., desktop-app `wrap_up`, `start_session`) cannot be edited by the user. The only reliable responses are to turn the feature off in settings, block it with permissions or hooks, or accept it. Writing a counter-rule recreates the conflict.

### Gaps
- No Anthropic doc found that states the exact relative weight of tool descriptions, system-reminders, output style text, and CLAUDE.md when they conflict.
- No source found on whether desktop-app tool-description text can be overridden by an output style. This remains an inference, consistent with analysis.md.
- I did not check the exact current wording of the CLAUDE.md wrapper reminder in Claude Code.

## 2. Writing rules models actually follow (phrasing, length, placement, emphasis)

### Takeaway
Anthropic's current guidance and the research agree. Keep always-loaded instructions short (under 200 lines per CLAUDE.md). Write them specifically, in positive form, with the reason included. Do not use IMPORTANT, CRITICAL, or ALL CAPS: on current models emphasis causes over-application rather than better adherence. Adherence falls as instruction count rises, with a bias toward earlier instructions. Negated instructions are a documented weak spot. Rules that must never bend belong in hooks or permissions, not prose.

### Cited Findings
**Length and count**
- "Size: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence." Imports "help you organize a long file but don't reduce its context cost". — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- "every line in it takes a little of Claude's attention on *every* task, whether it's relevant or not." The file should hold only test/typecheck/lint commands, "Places where the code is misleading", "Decisions that aren't in the repo", and "Anything you've had to correct twice already". — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices)
- "The more specific and concise your instructions, the more consistently Claude follows them." — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- IFScale (Jaroslawicz et al., Jul 2025): 20 frontier models, 10 to 500 keyword-inclusion instructions. The best models "achieve 68% accuracy at the max density of 500 instructions". Size and reasoning ability "correlate with 3 distinct performance degradation patterns", and the paper reports a "bias towards earlier instructions". — [arXiv:2507.11538](https://arxiv.org/abs/2507.11538). Caveat: the instructions are simple keyword inclusions, not behavioral rules, so absolute numbers do not carry over directly.
- HumanLayer (Nov 2025, practitioner): "Frontier thinking LLMs can follow ~ 150-200 instructions with reasonable consistency." They also say "Claude Code's system prompt contains ~50 individual instructions", which uses up budget before any user rules. Their own root file is "less than sixty lines". — [HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md). These are estimates, not measurements.
- Practitioner reports (unverified, anecdotal) say files past about 200 lines are "half-followed", and one author estimated about 15 of 200 rules were actually applied. — via search summary of [getunblocked: rules file rot](https://getunblocked.com/blog/rules-file-rot), [dev.to: Why adding more rules makes your agent dumber](https://dev.to/xinandeq/why-adding-more-rules-makes-your-agent-dumber-268-rules-14-always-loaded-and-a-tool-to-audit-4e8j). Not opened. Treat as anecdote.

**Emphasis / aggressive language**
- On "Add IMPORTANT or ALL CAPS to instructions Claude keeps missing", Anthropic says: "Older models sometimes needed the emphasis. Current ones follow a plainly worded line, and piling on emphasis mostly makes Claude over-apply the rule. If it's a rule that can't bend, turn it into a hook or a deny rule. If the line is getting lost in a long file, the file needs to be shorter." — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices)
- "If Claude keeps ignoring a line that *is* in `CLAUDE.md`, adding IMPORTANT probably won't fix it. Either the file has grown long enough that the line gets lost, or the line is a rule that can't have exceptions, in which case it belongs in a hook." — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices)
- "If you keep adding emphasis to a `CLAUDE.md` line and Claude still misses it, that's a sign the line belongs in a hook. The reverse holds too: if you have hooks for things that are only preferences, delete them and let Claude decide." — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices)
- "The fix is to soften any aggressive language. Where you might have said 'CRITICAL: You MUST use this tool when...,' you can use more normal prompting such as 'Use this tool when...' instead." — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- "no matter how strongly you word it, whether Claude follows that line on a given turn is still Claude's call." — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices)
- Lines such as "keep going, loop until done, don't be lazy" are "more likely to cause over-work than fix a stall". — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices)

**Positive phrasing, reasons, specificity**
- "Tell Claude what to do instead of what not to do. Instead of: 'Do not use markdown in your response'. Try: 'Your response should be composed of smoothly flowing prose paragraphs.'" — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- "Providing context or motivation behind your instructions, such as explaining to Claude why such behavior is important, can give Claude more information about your goals". Example: "NEVER use ellipses" is less effective than giving the text-to-speech reason. — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- "Positive examples of the communication style you want tend to be more effective than instructions about what not to do." — [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
- Specificity examples: "'Use 2-space indentation' instead of 'Format code properly'", "'Run `npm test` before committing' instead of 'Test your changes'". — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- "Almost every guideline has exceptions ... With the actual code in front of it, Claude is usually better placed to make that call than a rule you wrote in advance." — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices). This argues against absolutes such as "예외 없이".
- Context-engineering guidance (Sep 29, 2025): system prompts should sit at the "right altitude", between "brittle if-else hardcoded prompts" and vague ones. Aim for "the minimal set of information that fully outlines your expected behavior". Instead of a "laundry list of edge cases", curate diverse canonical examples. — [Anthropic: Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Negation research:
  - [older, 2022] Jang et al. found LMs perform worse on negated prompts, with scaling not fixing it. — [arXiv:2209.12711](https://arxiv.org/pdf/2209.12711)
  - 2026 work ("Semantic Gravity Wells", arXiv 2601.08070) reportedly attributes "do not use X" failures to priming the forbidden term and recommends positive reformulation. — via search summary of [emergentmind](https://www.emergentmind.com/papers/2601.08070). Not read in primary form.

**Over-verification / re-check instructions (relevant to qef tables and "다시 확인하라")**
- "If your prompt contains explicit verification instructions ... remove them: instructions like these cause over-verification on Claude Opus 5". Also: "Avoid instructing re-checks it already performs ('double-check your answer,' 're-verify before responding'); like verification instructions, these compound with the model's own behavior and add cost without improving results." — [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
- "Instructions such as 'If in doubt, use [tool]' cause overtriggering." — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

**Placement**
- Path-scoped rules "only load into context when Claude works with matching files". Skills "only load when you invoke them or when Claude determines they're relevant". — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- "In a long system prompt, pair the instruction with a short reminder near the end of the prompt". — [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
- Load order: "instructions closer to where you launched Claude are read last"; "a project rule appears later in Claude's context than a user rule". — [Claude Code: Memory](https://code.claude.com/docs/en/memory)

### Inferences
- The user's file had 43 bullets, 27 of them negative, with absolutes. It matches nearly every pattern Anthropic now lists as counterproductive: negative form, emphasis words, no reasons given, verification and re-do instructions. The IFScale primacy bias also suggests rules near the end of an 8KB file were the weakest.
- A rewrite should do three things:
  - Turn each surviving negative rule into a description of the wanted behavior, with one clause of reason.
  - Drop all emphasis words and bold.
  - Delete anything that is either (a) a default the model already has, (b) a re-check instruction, or (c) a zero-exception rule that should be a hook or permission.
- A sensible budget: the global file well under 200 lines (HumanLayer's under-60 is a practitioner benchmark), and format rules moved out entirely into the output style.

### Gaps
- No controlled study found that measures "negative vs positive phrasing" adherence on current Claude models specifically.
- No study found on adherence for behavioral rules (as opposed to keyword or format constraints) as a function of count.

## 3. Turning user corrections into rule changes without bloat

### Takeaway
The documented approach is not to add a rule per correction. Fix the work in the session, and if correcting twice fails, `/clear` and re-prompt. Add a CLAUDE.md line only for things "you've had to correct twice already" that the model cannot infer from the repo. Change rules in batches, treating real failures as regression test cases (20 to 50 tasks), and check changes by reading transcripts. Prune periodically with `/doctor` and `/doctor prompt-audit`. Rules that keep failing despite emphasis move to hooks; hooks that only encode preferences get deleted.

### Cited Findings
- "Watch the first minute, press `Esc` the moment Claude drifts, and after two failed corrections run `/clear` and write a better prompt instead of a third." Also: "If you've corrected the same thing twice and it's still wrong, a third correction mostly adds to a conversation that already contains two failed attempts for Claude to keep re-reading." — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices)
- Inclusion criterion: "Anything you've had to correct twice already". The test is "only holds what Claude couldn't work out from the code itself". — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices)
- "`/init` generates a starting version ... From there the work is mostly removing lines." "`/doctor` suggests cuts for anything Claude can already work out from the code." "`/doctor prompt-audit` flags instructions that were written for older models, point at files that no longer exist, or contradict each other." Also: "nothing in your files changes until you ask Claude to apply them." — [Best practices](https://code.claude.com/docs/en/best-practices); [Memory](https://code.claude.com/docs/en/memory)
- On old advice: "Every one of these was good advice when it was written. Most were workarounds for something the model couldn't reliably do yet, and the models have since caught up." — [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices). Rules should be re-validated on model upgrades.
- Auto memory: "notes Claude writes itself based on your corrections and preferences". Only "first 200 lines or 25KB" of MEMORY.md load. — [Claude Code: Memory](https://code.claude.com/docs/en/memory). This is a separate correction sink that can also bloat. (Inference: it should be included in the batched review.)
- Evals from failures (Jan 9, 2026): "20-50 simple tasks drawn from real failures is a great start." "Converting user-reported failures into test cases ensures your suite reflects actual usage". Regression evals ask "Does the agent still handle all the tasks it used to?" Also: "it's important to also run regression evals to make sure changes don't cause issues elsewhere." "You won't know if your graders are working well unless you read the transcripts". "choosing deterministic graders where possible, LLM graders where necessary". — [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- "Start by testing a minimal prompt on the best available model", then add instructions and examples for observed failure modes. — [Anthropic: Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Anthropic says to verify loading with `/context all`, and to use the `InstructionsLoaded` hook to log which instruction files load and why. — [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- Sycophancy background [older, 2023, rev. 2025]: five assistants "consistently exhibit sycophancy", and human preference data favors responses matching user views. — [Sharma et al., arXiv:2310.13548](https://arxiv.org/abs/2310.13548). (Inference: this is a plausible root of "cause E", the in-turn visible change after a correction. The abstract does not explicitly discuss rule-adding.)
- Practitioner consensus (unverified blogs):
  - Adding a rule after every mistake and never retiring any makes the file dead weight.
  - Delete anything discoverable from code.
  - Prune monthly.
  - Move enforceable rules to tooling.
  - "two conflicting rules are a coin flip".
  - — via search summaries of [getunblocked: audit and fix a bloated CLAUDE.md](https://getunblocked.com/blog/audit-fix-bloated-claude-md/index.md), [dev.to: Stop putting everything in AGENTS.md](https://dev.to/shinpr/stop-putting-everything-in-agentsmd-22bl), [mcp.directory](https://mcp.directory/blog/claude-md-agents-md-maintenance-2026). I tried to fetch the hyrax.dev "append vs delete" post (Aug 2026), but the page returned no content.
- "Never send an LLM to do a linter's job." — [HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

### Inferences
A process consistent with all sources, matching analysis.md "해결 E":
1. In the correction turn: fix the artifact only. Do not edit rules, hooks, or memory. After two failed corrections, `/clear` and re-prompt.
2. Log the correction (verbatim user text plus transcript pointer) to a corrections file.
3. On a cadence, or after N corrections: cluster entries by root cause, not by surface symptom.
4. For each cause, pick the layer.
   - Deterministic → hook or permission.
   - Format or voice → output style.
   - Task procedure → skill.
   - Repo fact the model can't infer → CLAUDE.md.
   - Model default already handled → no rule.
   - Prefer deleting or rewriting an existing line over adding one.
5. Turn the logged failures into a small regression set (prompt plus expected behavior). Replay it after each rule change and read transcripts.
6. Run `/doctor prompt-audit` and keep a line budget. Each addition should come with a removal, or a check that the file is still under budget.
7. Re-check on model upgrades.

### Gaps
- No vendor doc found that prescribes a cadence (weekly or monthly) or a numeric rule budget beyond "under 200 lines".
- No published tooling found for automatically replaying Claude Code transcripts as prompt regression tests. Anthropic's eval post is general-purpose.

## 4. Writing a custom output style that overrides default harness behavior (verbosity, asking questions, formatting)

### Takeaway
An output style lives in the system prompt and is sent on every request, so it is the right layer for response-format rules. Use `keep-coding-instructions: true` to keep engineering behavior. Write it in plain, positive, specific language that describes the target behavior: cadence, first sentence, length, and when to ask. Give reasons and positive examples. Write it in the same prose style you want back. Do not use emphasis words. Model it on Anthropic's own sample instructions (Opus 5 conciseness, narration, scope) and the built-in Concise and Proactive styles. It only governs the main conversation and forks, not subagents, and it cannot remove tool descriptions.

### Cited Findings
- Structure: "A custom output style is a Markdown file: frontmatter for metadata, then the instructions for Claude." It is saved in `~/.claude/output-styles` (user), `.claude/output-styles` (project), or managed. "Set `keep-coding-instructions: true` if you're changing how Claude communicates but still want it coding the same way." — [Claude Code: Output styles](https://code.claude.com/docs/en/output-styles)
- Caveat on short prompts: "The shorter system prompt doesn't include that section, so the field has no effect there. To rely on the field, set `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT` to `0`, which selects the full prompt on any model." — [Claude Code: Output styles](https://code.claude.com/docs/en/output-styles)
- Scope: "Output styles apply to the main conversation and to a fork ... Other subagents run their own system prompt, so styles don't change how they respond." — [Claude Code: Output styles](https://code.claude.com/docs/en/output-styles)
- Not a guarantee: "An output style gives Claude instructions to follow. It doesn't guarantee that something always happens or never happens." — [Claude Code: Output styles](https://code.claude.com/docs/en/output-styles)
- Activation: set it with `outputStyle` in `~/.claude/settings.json` (the desktop app has no menu; edit the settings file). The value is case-sensitive: "A value that doesn't match a style name exactly ... gives you the Default style." Project settings take precedence. Also: "Claude Code reads style files when it starts, so if you create or edit one during a running session, restart Claude Code". "A misspelled field is ignored without an error." — [Claude Code: Output styles](https://code.claude.com/docs/en/output-styles)
- Built-in reference behaviors to borrow from:
  - Concise: "the first sentence of a response states what happened or what the answer is. Claude leaves out the lead-in, the step-by-step narration, and the closing recap, and answers a simple question in one to three sentences." It keeps full length for anything requested and for "error reports, failing test output, security warnings, and confirmations for destructive actions".
  - Proactive: "makes reasonable assumptions about routine decisions rather than stopping to ask", while checking "before an action that deletes data or changes a shared or production system".
  - — [Claude Code: Output styles](https://code.claude.com/docs/en/output-styles)
- Anthropic sample instructions usable verbatim:
  - Conciseness: "Keep responses focused, brief, and concise. Keep disclaimers and caveats short, and spend most of the response on the main answer. When asked to explain something, give a high-level summary unless an in-depth explanation is specifically requested."
  - Narration: "Before your first tool call, say in one sentence what you're about to do. While working, give a brief update only when you find something important or change direction. When you finish, lead with the outcome: your first sentence should answer 'what happened' or 'what did you find,' with supporting detail after it for readers who want it."
  - Asking/scope: "Deliver what was asked, at the scope intended. Make routine judgment calls yourself, and check in only when different readings of the request would lead to materially different work. If the request seems mistaken or a better approach exists, say so in a sentence and continue with the task as asked rather than quietly narrowing, widening, or transforming it. Finish the whole task, and stop short of actions that are clearly beyond what was asked."
  - Corrections: "Only correct an earlier statement when the error would change the user's code, conclusions, or decisions. State corrections plainly and briefly, then continue the task."
  - Documents: "Match the length of written documents to what the task needs: cover the substance, but do not pad with filler sections, redundant summaries, or boilerplate."
  - — [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
- Raising effort does not shorten responses: "lowering effort can reduce thinking volume without reliably shortening the visible response. To control response length, prompt for it explicitly." — [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
- Formatting: "Match your prompt style to the output you want ... removing markdown from your prompt can reduce the volume of markdown in the output." The sample `<avoid_excessive_markdown_and_bullet_points>` block asks for prose paragraphs, lists only for "truly discrete items" or when requested, and no bold or italics. — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- Preamble: "Respond directly without preamble. Do not start with phrases like 'Here is...', 'Based on...', etc." — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- Action default: `<default_to_action>` vs `<do_not_act_before_instructions>` sample blocks for setting how readily Claude acts versus asks. — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- Official example style is short: a few sentences of instruction plus a small "conventions" section. — [Claude Code: Output styles](https://code.claude.com/docs/en/output-styles)
- Tooling: `/doctor prompt-audit` covers output styles too. — [Claude Code: Memory](https://code.claude.com/docs/en/memory)

### Inferences
- Recommended skeleton for the user's style file. It should be prose-heavy, because prompt style shapes output style.
  - Frontmatter: `name`, `description`, `keep-coding-instructions: true`.
  - "Language and tone" paragraph (Korean, plain register, with the reason).
  - "Shape of a reply" paragraph: outcome first, then detail; length scaled to the question; lists only for discrete items. Adapt the Opus 5 conciseness and narration samples.
  - "When to ask vs act" paragraph: adapt the Opus 5 scope sample plus the Proactive-style destructive-action carve-out.
  - "Corrections" paragraph: adapt the Opus 5 sample.
  - One or two short positive examples of a good reply.
  - A one-line reminder at the end.
- No "IMPORTANT", no "예외 없이", no negative lists, and no meta-rule about beating other sources.
- Verify that `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT` is not making `keep-coding-instructions` a no-op on the user's model and surface.
- Check that no enabled plugin ships a `force-for-plugin` style, which would override `outputStyle`.
- Remove response-format lines from CLAUDE.md once they live in the style, so the two layers do not conflict.
- Desktop-app tool instructions (`wrap_up` "EVERY turn", `start_session`) sit in tool descriptions. A style paragraph about asking less may still lose to them. Where the app allows, disable those features in settings rather than countering them in text.

### Gaps
- The full text of the built-in Concise and Proactive style prompts is not published in the docs. Only behavior descriptions are given.
- I found no Anthropic doc on how output-style text interacts with desktop-app-specific tool descriptions or system-reminders.
- I found no data on adherence for output styles vs CLAUDE.md for the same instruction. The system-prompt-placement advantage is inferred from "more responsive to the system prompt" and the documented delivery mechanisms, not measured.

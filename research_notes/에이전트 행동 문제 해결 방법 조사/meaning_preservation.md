# Meaning preservation: keeping the user's intended meaning through receive / restate / hand off

Scope: cause B in /Users/kms1212/agent-traits-2026-11-04/analysis.md (traits 1-1..1-4, 2-3, 2-6, 3-8, 5-1, 5-2, 6-1, 6-6). Research date 2026-11-04. Doc pages fetched today are current; dated blog posts and papers are marked with their dates.

## Q1. What do Anthropic and other vendors recommend for passing context to subagents and across sessions/compaction without loss?

### Takeaway
Anthropic's own docs say plainly that a non-fork subagent sees only a delegation message that Claude writes. So every handoff is a rewrite unless the user's words go in verbatim, or unless a fork is used, which inherits the full conversation. Across compaction, only content loaded from disk survives exactly: CLAUDE.md, unscoped rules, auto memory, the plan-mode plan, SessionStart(compact) hook output. Anything said only in conversation gets summarized. Anthropic and Cognition both recommend keeping state in files or external stores and passing references, not re-summarizing.

### Cited Findings
**Subagents (Claude Code docs, current)**
- "Each subagent starts with a fresh, isolated context window. It doesn't see your conversation history, the skills you've already invoked, or the files Claude has already read. Claude composes a delegation message that summarizes the task, and the subagent works from there. The exception is a fork, which inherits the parent conversation instead of starting fresh." — [Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents)
- An @-mention picks which subagent runs. It does not control the prompt: "Your full message still goes to Claude, which writes the subagent's task prompt based on what you asked. The @-mention controls which subagent Claude invokes, not what prompt it receives." — [Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents)
- Rules don't reach a subagent automatically: "If a rule must, such as 'ignore the `vendor/` directory,' restate it in the prompt you give Claude when delegating." Explore and Plan "start without your CLAUDE.md files". The output style and auto memory are not loaded in a non-fork subagent. — [Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents)
- Forks: "A fork is a subagent that inherits the entire conversation so far instead of starting fresh … so you can hand it a side task without re-explaining the situation." and "Use a fork when any other subagent would need too much background to be useful". Comparison table: a fork gets the "Full conversation history"; a non-fork gets a "Fresh context with the prompt you pass". A fork shares the parent's prompt cache, so it is cheaper for tasks that need the same context. — [Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents)
- A subagent's report returns unaltered: the scan "never removes or rewords anything". The report arrives under a header saying instructions inside it "carry no authority from you". — [Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents)

**Compaction (Claude Code docs, current)**
- What survives compaction, per the "What survives compaction" table:
  - Project-root CLAUDE.md and unscoped rules: "Re-injected from disk"
  - Auto memory: re-injected
  - The plan-mode plan: "Re-injected from disk"
  - Invoked skill bodies: re-injected, "capped at 5,000 tokens per skill and 25,000 tokens total; oldest dropped first"
  - "Context that hooks added earlier": "Summarized with the rest of the conversation"
  - SessionStart hooks matching `compact`: their output is added to the compacted context
  
  — [Claude Code: Context window](https://code.claude.com/docs/en/context-window)
- "Path-scoped rules and nested CLAUDE.md files load into message history … so compaction summarizes them away with everything else. If a rule must persist across compaction, drop the `paths:` frontmatter or move it to the project-root CLAUDE.md." — [Claude Code: Context window](https://code.claude.com/docs/en/context-window)
- "Compact with a focus: run `/compact` with instructions … The summary keeps what you choose instead of what the automatic pass guesses is important." — [Claude Code: Context window](https://code.claude.com/docs/en/context-window)

**Anthropic prompting guide (current)**
- "When a context window is cleared, consider starting with a brand new context window rather than using compaction. Claude's latest models are extremely effective at discovering state from the local filesystem." It recommends prescriptive restart steps, e.g. "Review progress.txt, tests.json, and the git logs." — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- "Use structured formats for state data", "Use git for state tracking". The guide also suggests telling the model to "save your current progress and state to memory before the context window refreshes". — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- "Think of Claude as a brilliant but new employee who lacks context on your norms and workflows." "Key test: Show your prompt to a colleague with minimal context on the task and ask them to follow it. If they'd be confused, Claude will be too." — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- "Providing context or motivation behind your instructions … can give Claude more information about your goals." Example: the bare "NEVER use ellipses" is less effective than the same rule plus its reason (text-to-speech). — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- "XML tags help Claude parse complex prompts unambiguously … Wrapping each type of content in its own tag (for example, `<instructions>`, `<context>`, `<input>`) reduces misinterpretation." — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- The "do_not_act_before_instructions" sample: "When the user's intent is ambiguous, default to providing information, doing research, and providing recommendations rather than taking action." — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

**Anthropic engineering blog (dated)**
- Multi-agent research system (2025-06-13):
  - "Each subagent needs an objective, an output format, guidance on the tools and sources to use, and clear task boundaries."
  - "Without detailed task descriptions, agents duplicate work, leave gaps, or fail to find necessary information." The example is short instructions like "research the semiconductor shortage", which led one subagent to explore the 2021 crisis while two others duplicated work.
  - The lead agent saves its plan to Memory because "it is important to retain the plan".
  - Against the "game of telephone": "Subagents call tools to store their work in external systems, then pass lightweight references back to the coordinator."
  
  — [Anthropic: How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- Effective context engineering (2025-09-29): "overly aggressive compaction can result in the loss of subtle but critical context". Structured note-taking means "the agent regularly writes notes persisted to memory outside of the context window". Subagents return "a condensed, distilled summary" of about 1,000–2,000 tokens. — [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

**Other vendor**
- Cognition, "Don't Build Multi-Agents" (2025-06-12):
  - Principle 1: "Share context, and share full agent traces, not just individual messages".
  - Principle 2: "Actions carry implicit decisions, and conflicting decisions carry bad results".
  - Flappy Bird example: a subagent asked for a Flappy Bird background built a Super Mario-style one instead.
  - Cognition proposes a dedicated model to "compress a history of actions & conversation into key details, events, and decisions", and calls this hard to get right.
  
  — [Cognition: Don't Build Multi-Agents](https://cognition.com/blog/dont-build-multi-agents)

### Inferences
- In Claude Code, the delegation prompt is the only channel to a non-fork subagent, and the model writes it. The docs never promise the user's words are kept. So an explicit convention is needed: user quote verbatim, interpretation labelled separately (matches solution B-2 in analysis.md). Where background is large, a fork removes the rewrite step entirely, at the cost of losing input isolation.
- For compaction: decisions stated only in chat are at risk; decisions written to project-root CLAUDE.md or a file re-read via a SessionStart `compact` hook are not. That gives a deterministic fix for 1-3/6-6: write user decisions verbatim to a file that is re-injected from disk.
- Cognition's "full traces, not messages" and Anthropic's "pass references, not copies" agree: hand off pointers to the original text rather than a paraphrase of it.

### Gaps
- No Anthropic doc found that explicitly says "quote the user verbatim in delegation prompts". The closest are "restate it in the prompt" for rules and the "objective / format / boundaries" checklist.
- The Agent SDK's compaction behavior was not fetched separately. I assume it matches Claude Code but did not verify this.

## Q2. What research measures instruction drift, paraphrase loss, or intent misinterpretation, and what mitigations work?

### Takeaway
Three lines of evidence:
- Repeated LLM rewriting drifts toward model-preferred "attractor" states, and more so under open-ended instructions (telephone-game study).
- Underspecified instructions spread over turns cause early assumptions that models don't recover from (Lost in Multi-Turn).
- In multi-agent systems, "disobey task specification", "fail to ask for clarification" and "task derailment" are common failure modes (MAST).

The best-evidenced mitigation is to put the full specification up front instead of piecemeal (Laban), plus targeted clarifying questions on genuinely underspecified tasks (Ambig-SWE: large gains). Agent-style recaps were reported as insufficient.

### Cited Findings
- **Telephone game.** Perez et al., "When LLMs Play the Telephone Game", arXiv 2407.04503, ICLR 2025 (v1 Jul 2024, v4 Jan 2026).
  - LLM agents "iteratively receive, produce, and transmit texts from the previous to the next agent". Small biases "negligible at the single output level, risk being amplified in iterated interactions, potentially leading the content to evolve towards attractor states".
  - "Open-ended instructions" produced stronger attraction effects than constrained tasks.
  
  — [arXiv 2407.04503](https://arxiv.org/abs/2407.04503)
- **Lost in Multi-Turn.** Laban, Hayashi, Zhou, Neville, "LLMs Get Lost In Multi-Turn Conversation", arXiv 2505.06120 (May 2025; listed for ICLR 2026).
  - Simulation over 200,000+ conversations: an average drop of about 39% across six generation tasks when the instruction is spread over turns, attributed mainly to unreliability.
  - Models make early assumptions and commit prematurely: "when LLMs take a wrong turn in a conversation, they get lost and do not recover."
  - Agent-style recap/snowball and lower temperature were reported as not sufficient. I have this point only from search summaries, not the full text.
  
  — [arXiv 2505.06120](https://arxiv.org/abs/2505.06120)
- **MAST.** Cemri et al., "Why Do Multi-Agent LLM Systems Fail?", arXiv 2503.13657 (2025). 14 failure modes from 1,642 traces; frequencies below are as reported in the paper.
  - FM-1.1 Disobey task specification, 11.8%: "Failure to adhere to the specified constraints or requirements of a given task"
  - FM-1.4 Loss of conversation history, 2.8%
  - FM-2.2 Fail to ask for clarification, 6.8%: "Inability to request additional information when faced with unclear or incomplete data"
  - FM-2.3 Task derailment, 7.4%
  - FM-2.4 Information withholding, 0.85%
  - FM-2.5 Ignored other agent's input, 1.9%
  - FM-2.6 Reasoning-action mismatch, 13.2%
  
  — [arXiv 2503.13657 (HTML)](https://arxiv.org/html/2503.13657)
- **Ambig-SWE.** Vijayvargiya et al., "Ambig-SWE: Interactive Agents to Overcome Underspecificity in Software Engineering", arXiv 2502.13069 (v3 Feb 2026, ICLR 2026).
  - "models struggle to distinguish between well-specified and underspecified instructions".
  - With interaction, models "effectively obtain vital information from the user leading to significant improvements in performance", up to 74% over non-interactive settings.
  
  — [arXiv 2502.13069](https://arxiv.org/abs/2502.13069)
- **Ask or Assume?** Edwards and Schuster, arXiv 2603.26233 (Mar 2026). They separate underspecification detection from execution in an uncertainty-aware scaffold that "conserv[es] queries on simple tasks while proactively seeking information on more complex issues". Reported: 69.40% resolve rate vs 61.20% single-agent, with OpenHands + Claude Sonnet 4.5. These figures come from secondary summaries and are unverified. — [alphaxiv 2603.26233](https://www.alphaxiv.org/abs/2603.26233v2)

### Inferences
- The telephone-game result is the closest empirical analogue to the user's "rewriting drifts toward defaults" diagnosis. Each rewrite pulls toward the model's prior, and the pull is stronger when the instruction is open-ended. This supports passing originals verbatim and keeping rewrite hops few, rather than adding "don't paraphrase" rules.
- The Laban result suggests that consolidating all user requirements into one place before acting beats acting on turn-by-turn fragments. That supports a "requirements first, verbatim, consolidated" step, and links to trait 2-23.
- Ambig-SWE plus MAST FM-2.2 support targeted clarification when a quote does not determine the line, rather than filling gaps (trait 2-3). Because models are bad at detecting underspecification, the reconcile step (Q3) is a structured way to surface gaps: a line with no quote behind it is by definition an unsupported addition.

### Gaps
- I found no paper that measures paraphrase loss specifically for agent-to-subagent delegation prompts, or that compares verbatim-quote handoff with summary handoff in coding agents.
- I found no study on term-translation drift (technical term → plain words) in LLM agents.

## Q3. How do requirements-engineering practices map onto quote→reconcile→delete? Is deleting quotes recommended?

### Takeaway
The user's process is a lightweight form of pre-requirements-specification (pre-RS) traceability: each derived line is linked back to its originating stakeholder statement, then the two are checked for consistency, which is validation. RE literature identifies pre-RS traceability as where most traceability problems come from. Standard requirement records keep a source/originator and a rationale field permanently. Deleting the quote from the working document is fine for readability, but deleting it everywhere throws away the very link RE says matters most. Keep it in a separate source log, or at least in git history, with a stable ID.

### Cited Findings
- Gotel and Finkelstein, "An Analysis of the Requirements Traceability Problem", ICRE 1994 (dated, but the foundational source). Based on studies with over 100 practitioners. It distinguishes pre-RS from post-RS traceability and concludes "the majority of the problems attributed to poor requirements traceability are due to inadequate pre-RS traceability". — [UCL Discovery eprint 749](https://discovery.ucl.ac.uk/749/)
- Bidirectional traceability (CMMI-based guidance) helps determine "whether all source requirements have been completely addressed and whether all lower level requirements can be traced to a valid source". A traceability matrix may list stakeholder requirements and derived requirements on its axes. — [wibas: REQM SP 1.4](https://www.wibas.com/cmmi/reqmsp-14-maintain-bidirectional-traceability-of-requirements-1)
- ISO/IEC/IEEE 24765 defines traceability as an "association among two or more logical entities that are discernible in either direction". — [NASA SWE Handbook](https://swehb.nasa.gov/x/TYCZD)
- ISO/IEC/IEEE 29148:2018 is paywalled. The public previews show only the table of contents, which includes a stakeholder needs and requirements definition process. — [IEC preview](https://webstore.iec.ch/p-preview/info_isoiecieee29148%7Bed1.0%7Den.pdf)
- Losing rationale has lasting cost: losing that understanding "may seriously impede the ability to evolve, maintain or reuse the system". Rationale is usually stored informally as notes. — [Requirements Engineering 2nd ed., ch. 7 Advanced Traceability (GlobalSpec excerpt)](https://www.globalspec.com/reference/39004/203279/chapter-7-advanced-traceability); [Imperial thesis on rationale capture](https://spiral.imperial.ac.uk/entities/publication/9f744aac-6237-43eb-ba63-661d8399e5cf)
- Volere describes its atomic requirement template (the "snow card") as "the template for an individual requirement". I could not read the card's field list (rationale, originator, fit criterion) directly. — [Volere atomic requirement](https://www.volere.org/atomic-requirement/)

### Inferences
**Mapping of the user's process to RE**

| Step in the user's process | RE equivalent |
|---|---|
| Attach the verbatim quote behind each line | Pre-RS trace link (source/originator field) |
| Compare each line to its quote | Validation against stakeholder intent, plus a bidirectional coverage check |
| Delete the quotes | Strip trace links from the published spec |

**Two checks the reconcile step needs, matching "bidirectional"**
1. Forward: every quote is covered by some line. This catches narrowing (1-4) and lost decisions (6-6).
2. Backward: every line traces to a quote, or is explicitly marked as an agent derivation or engineering default. This catches invention (2-3), scope creep and redefinition (2-6).

A one-directional "line vs its quote" check catches redefinition and translation, but misses quotes that never got a line.

**Risks of deleting**
- Later sessions and subagents, and compaction summaries, can no longer recover the original wording. This recreates the cause-B condition at the next edit.
- Future edits to the rule can drift silently, because nothing is left to re-check against.
- The pre-RS link that Gotel & Finkelstein identify as the main failure point is gone.

**Mitigation:** keep the quotes in a separate, append-only source file (e.g. `decisions.md` with date, session ID and verbatim text) and put a short ID in the rule line, or rely on git history of the quoted draft. This keeps the rule text clean while preserving traceability. It also fits Anthropic's "pass references, not copies" pattern: subagents can be given the ID and path instead of a paraphrase.

**Additional recommended checks during reconcile**
- Each technical term in a line must equal the term used in its quote, or the standard term (see Q4).
- Each line must keep the quote's modality: must/should/may, and scope words such as "all" or "only".
- Each line must have no unquoted qualifiers.
- Two lines must not contradict each other. Pairwise cross-check, which covers trait 3-8's "holes and contradictions".

### Gaps
- I could not access the exact clause wording in ISO/IEC/IEEE 29148 or the IREB glossary on "source" and "rationale" attributes, because of paywalls or fetch failures.
- I found no RE source that specifically discusses deleting source quotes after validation. The risk assessment above is inference from the traceability literature.

## Q4. How should technical terms be handled so agents use standard names?

### Takeaway
DDD's Ubiquitous Language says to use one rigorous shared vocabulary in talk, docs and code, and that changing a word changes the model. For agents, the practical form is a project glossary. Map each user term to its standard name and definition, put it in a file that is re-injected (project-root CLAUDE.md, or a skill whose top contains it), and treat any substitution as a model change that requires the user's approval.

### Cited Findings
- Fowler (2006, dated): Ubiquitous Language is "building up a common, rigorous language between developers and users". "This language should be based on the Domain Model used in the software". "the language (and model) should evolve as the team's understanding of the domain grows." — [Martin Fowler: UbiquitousLanguage](https://martinfowler.com/bliki/UbiquitousLanguage.html)
- Evans, DDD Reference (Creative Commons pattern summaries): "Recognize that a change in the language is a change to the model." The language is used "within a bounded context". This is reproduced from the reference via secondary pages; I did not fetch the original PDF. — [DDD pattern summaries (domainlanguage.com)](https://www.domainlanguage.com/wp-content/uploads/2016/05/PatternSummariesUnderCreativeCommons.doc); [SJSU copy](https://www.cs.sjsu.edu/faculty/pearce/modules/patterns/analysis2/PatternSummariesUnderCreativeCommons.htm)
- Skill bodies after compaction: "Truncation keeps the start of the file, so put the most important instructions near the top of `SKILL.md`." Project-root CLAUDE.md is re-injected from disk. — [Claude Code: Context window](https://code.claude.com/docs/en/context-window)

### Inferences
- Evans' rule gives the user's complaint about trait 6-1 (translating technical terms into plain words) a principled basis: such a rewrite is not a stylistic change but a model change. The reconcile step should flag any term mismatch between line and quote.
- Glossary format: `term | standard name (with external reference such as RFC, ISO or framework docs) | definition | user's own word if different | date`. Place it in project-root CLAUDE.md or a glossary file loaded at session start, so it survives compaction.
- Where the user's word differs from the standard name, both should be recorded and the standard name used. This needs one user confirmation per term; it is not an agent decision (cause G).

### Gaps
- I found no published evaluation of glossaries or term lists improving LLM agent terminology consistency in coding tasks.

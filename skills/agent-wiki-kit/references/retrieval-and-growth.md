# Retrieving, Growing, and Correcting Filesystem Memory

## Contents

- [Primary purpose](#primary-purpose)
- [Capabilities the Agent should gain](#capabilities-the-agent-should-gain)
- [Two layers of Agent prompting](#two-layers-of-agent-prompting)
- [When retrieval is worthwhile](#when-retrieval-is-worthwhile)
- [When durable memory is worthwhile](#when-durable-memory-is-worthwhile)
- [Correcting durable memory](#correcting-durable-memory)
- [Preventing candidates from becoming dogma](#preventing-candidates-from-becoming-dogma)
- [Preserving long plans and complete designs](#preserving-long-plans-and-complete-designs)
- [Tool boundaries](#tool-boundaries)

## Primary purpose

Agent Wiki addresses a mismatch: context is finite, but project understanding must survive across tasks. Storing memory in files is not an invitation to load every file in every session or to create a documentation process with mandatory gates. The filesystem is valuable because an Agent already knows how to retrieve information the way it reads code: try task-relevant terms and paths, narrow the field with filenames, directories, and search results, then read matched passages, nearby context, and authoritative evidence.

Measure Wiki quality by four outcomes rather than by how much it contains:

1. **Recall that something may exist.** Resident prompts and directory summaries expose enough concepts, risks, aliases, and known conclusions for an Agent to recognize that the project may already remember a relevant issue.
2. **Find it quickly.** Filenames, headings, summaries, directory responsibilities, terminology, and links support `rg -> match -> local read -> authority`, without requiring a master index before the Agent even knows which words to search.
3. **Judge whether it is trustworthy.** Pages make current conclusions, plans, sources, working state, history, and inference easy to distinguish, with applicability, maturity, provenance, and validation level visible.
4. **Correct obsolete understanding.** When project understanding changes, the current authority is updated explicitly; old conclusions are marked, moved, or archived; and entry points, links, and summaries change with them so search does not present conflicting claims without a way to resolve them.

These outcomes cannot depend on an Agent having read the index first. Filesystem search often lands directly in a deep section. Any historical page that conflicts with current understanding must expose its age and inheritance boundary before the body.

## Capabilities the Agent should gain

With this external brain, an Agent should be able to recover when needed:

- current goals, phase, open questions, and why the next step matters;
- the overall product direction, intended outcome, and highest-order decision rules;
- system and subsystem design, boundaries, dependencies, candidates, and validation state;
- the objectives, completed work, evidence, and still-unproven parts of each phase;
- past problems, failed approaches, creator corrections, and the lessons distilled from them;
- the rationale behind historical decisions, later corrections, and what the current task should inherit, question, or avoid repeating.

Do not inject all of this into every session. Resident context should only tell the Agent roughly what the project remembers and expose high-value retrieval cues. The Agent then queries and restores the minimum relevant material. The real acceptance test is that the Agent works with more history, judgment, and autonomy—not that it mechanically follows a Wiki procedure. After a context reset, it should behave like a long-term collaborator who knows to consult shared memory rather than a capable newcomer waiting for the creator to repeat every premise.

## Two layers of Agent prompting

### Reusable maintenance method

The Kit provides reusable, adaptable guidance:

- distinguish source evidence, current conclusions, working memory, and plan intent so no plane impersonates another authority;
- converge one durable question on one current authority instead of duplicating pages by conversation or task;
- link new understanding to related pages, sources, and implementation evidence so future search can continue the trail;
- distinguish facts, validation, observations, human judgment, and inference;
- when understanding changes, update the current authority and explain how the old claim became invalid or what replaced it.

These are judgment frameworks, not a creative workflow template. An Agent may use file listing, `rg`, direct reading, indexes, summary commands, or any better method for the current task.

### Project-owned growth contract

Each project maintains its own Wiki growth contract in the root prompt. It may define:

- which judgments must stay resident so later collaborators understand why the project works this way;
- which tasks, failures, corrections, acceptance results, or decisions deserve durable memory;
- how stable knowledge categories are divided and which terms and risks should become retrieval cues;
- when a local finding should be promoted to a shared system or repository-wide method;
- which material should remain only in a local plan, runtime evidence, or historical source;
- which repeated retrieval failures show that directories, summaries, naming, or prompts need to evolve.

This layer is not fixed once at installation time. Revise it as project practice, creator corrections, and Agent retrieval failures reveal better methods.

## When retrieval is worthwhile

Do not prescribe a fixed reading order. Resident context should offer soft retrieval triggers such as:

- the task depends on project-specific product judgment, historical decisions, technical boundaries, or creator intent;
- the user says “before,” “continue,” “still,” “like last time,” or otherwise relates the task to a prior session;
- the Agent is about to create a shared abstraction, change a directory's responsibility, or affect multiple applicability scopes;
- the answer contains uncertainty, conflicting evidence, a familiar failure pattern, or multiple candidate authorities;
- interrupted work must be resumed with current status, open questions, and recent evidence;
- the creator identifies a misunderstanding and the Agent needs to find where that obsolete belief entered the project.

These cues only help the Agent notice that retrieval may pay off. The Agent chooses whether to search, which terms to use, and how deep to read based on task risk and existing context.

## When durable memory is worthwhile

Signals that justify creating or updating durable memory include:

- a decision, boundary, or rationale will affect multiple future tasks;
- implementation and acceptance changed what is actually true;
- the same misunderstanding, correction, or retrieval difficulty has recurred;
- a local lesson has been shown to transfer to a higher applicability scope;
- new evidence disproves, narrows, or extends the current authority;
- a stable category of work has emerged and existing directories or summaries no longer help an Agent recall and find it;
- project experience shows that the Wiki growth contract itself needs revision.

Usually do not preserve temporary discussion, process with no expected future value, details cheaply recoverable from code, or rephrasings that merely duplicate an existing conclusion.

## Correcting durable memory

Because the Wiki is an external brain, an incorrect belief cannot be corrected merely by placing a rebuttal next to it. Prefer this sequence:

1. find and update the current authority that answers the same question, including its conclusion, applicability boundary, and sources;
2. when an old page remains historically useful, mark its historical, rejected, or superseded status before the body, link the current replacement, and state which background, reasoning, or local material remains inheritable; do not rely on a parent directory or index to disambiguate it;
3. repair related directory summaries, indexes, plans, current state, and cross-links so old entry points stop reinforcing the error;
4. preserve or explain the historical meaning of source evidence so future readers can understand why the correction happened;
5. feed the retrieval or organization flaw that preserved the error back into the project's growth contract instead of fixing only the prose.

Search should lead an Agent toward the current authority and make historical material visibly non-current. Until both are true, the Wiki has not completed the correction.

The current authority should also record which important old claims it supersedes. Then an Agent can follow the replacement relation whether search lands on the old or new page first. Preserving full history does not permit it to continue masquerading as current instruction.

For page-level replacement, use `supersedes` and `superseded_by` as bidirectional cues. A historical page with no replacement should state `superseded_by: none` to show that the absence is intentional. When one page retains evidence for both a legacy pipeline and a new target, a generic status field is insufficient. Qualify the summary and each legacy section heading with `Legacy`, `historical`, `rejected`, or the exact inheritable scope because `rg` may land in the middle of the body.

## Preventing candidates from becoming dogma

Record applicability, maturity, and implementation shape separately. A problem promoted from a local area to repository scope may still be only a repository-wide candidate. Residency in L0/L1 or repetition across plans does not approve it.

Treat two kinds of language especially carefully:

- Numbers such as `2-3 approaches`, `20% branching`, or a `120-line budget` may be current production heuristics rather than universal laws. When headers, summaries, or current state mention them, expose their validation status, applicability, and the evidence that will recalibrate them.
- Responsibilities named for reasoning—such as `Intent / Transaction / Event / Knowledge / Storylet / Projection`—do not require one-to-one classes, Systems, schemas, or directories. Challenge the responsibility against varied cases before deciding how implementation should merge or split it.

The Wiki should preserve why a candidate exists, which risk it addresses, and how it will be validated. Repetition must not manufacture authority.

## Preserving long plans and complete designs

Resident prompts, directory summaries, indexes, and current state should stay compact to reduce recurring context cost. Do not apply that budget mechanically to plans, product designs, execution strategies, or detailed reasoning. A long document that still guides work should preserve its causal chain, tradeoffs, process, and acceptance basis.

When auditing deep documents, ask whether the content is obsolete, conflicts with the current authority, duplicates ownership of the same conclusion, or lacks local retrieval entry points. If the body remains useful, improve its status header, replacement links, summary, headings, and section organization first. Archive, split, converge, or delete only when content is genuinely obsolete, duplicative, too unfocused for local reading, or fully owned by a more reliable authority. Length by itself is not a defect.

## Tool boundaries

Scripts build the stage and improve efficiency:

- `check` combines mechanically detectable format, link, relationship, budget, source-change, summary-drift, and generated-section diagnostics, then gives the Agent relevant context;
- `build-agent-context` compiles directory knowledge after an Agent has reviewed it;
- `list-topics`, `startup`, and `doctor` are optional views, not replacements for filesystem search;
- tools do not decide the one correct story, product, architecture, knowledge scope, reading path, or creative workflow.

Reserve hard validation for structural safety the tool can determine objectively, such as unparseable configuration, ambiguous generated boundaries, or paths that escape the repository. Keep project experience and creative methods in prompts, diagnostics, and revisable conventions so Agents can discover better approaches.

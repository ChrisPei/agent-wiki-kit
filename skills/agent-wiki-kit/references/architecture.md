# Durable Agent Wiki Architecture

## Purpose

A project wiki is a retrieval and recovery system for future agents and humans. It should answer:

- What is true now?
- Which source or decision makes it true?
- Where should a task begin?
- What remains unresolved?
- Which historical evidence is relevant without loading all history?

It is not a transcript, a second issue tracker, a database dump, or a collection of daily status pages.

The architecture is a stage for autonomous collaboration. It makes knowledge visible and supplies efficient tools, while leaving room for search, inference, creative divergence, and better project-specific practice to emerge. Only mechanically knowable structural safety belongs in hard validation. Current workflow experience belongs in prompts and evolving project conventions, not universal gates.

## Knowledge planes

### 1. Source evidence

Store imported requirements, user notes, external documents, research captures, schemas, and accepted raw evidence here.

- Preserve provenance and prior meaning; immutability is one lifecycle policy, not the definition of the source plane.
- Add captured evidence as a new artifact by default. Intentional correction, versioning, relocation, redaction, or removal is allowed when the old meaning remains recoverable or the reason it cannot remain is recorded.
- Preserve provenance, date, and acquisition context.
- Keep a maintained source register alongside the evidence plane and record each artifact's authority, origin, lifecycle policy, supersession, and intentional changes.
- When compiled knowledge conflicts with source evidence, source evidence wins until the wiki is corrected.

### 2. Compiled topic knowledge

Store current durable conclusions by future retrieval question.

Good topics:

- What is the product boundary?
- How does persistence recover after interruption?
- Which runtime invariants must every implementation preserve?
- How is browser acceptance performed?

Bad topics:

- What did Agent 3 say at 14:32?
- What changed in one isolated coding turn?
- A page for every user sentence.

When new evidence answers the same question, revise the topic's current conclusion and preserve a concise change note or evidence link. Create a new page only when the retrieval question, authority, visibility boundary, or subsystem is genuinely different.

### 3. Working and recovery memory

Use working memory for information that helps resume execution:

- `current-state.md`: current truth, recovery entry, active evidence, next decisions, and explicit limits.
- `log.md`: bounded recent chronology in a machine-parseable format.
- QA reports: command, artifact, browser, runtime, or human evidence.
- Handoffs and repair notes: scoped transient context that should not become permanent product law.

Routine files route. Archive files remember.

### 4. Plans and decisions

Plans describe intended execution, acceptance gates, and sequencing. They are not proof that work is implemented. They belong inside the project Wiki hierarchy as a distinct knowledge plane in new projects, so one directory tree exposes the whole memory system; adopted repositories may retain an established external plan root. Completed or superseded plans should be marked and archived so a future agent cannot mistake them for active authority.

## Retrieval surfaces

### Resident context layers

`AGENTS.md` is the repository's compiled resident context, not merely a link telling the Agent that a Wiki exists.

- **L0** is manually maintained project judgment: what the project is, why its constraints exist, how the creator/team evaluates work, and how this project's Wiki should grow. It must contain conclusions, not only links.
- **L1** is the real Wiki directory tree plus one semantic annotation per injected directory. It is compiled from `.wiki-meta.json` files into a naturally bounded Markdown section in `AGENTS.md`, normally kept at the end for readability.
- **Deeper routing** consists of the detailed index, topic pages, plans, work evidence, and raw/implementation evidence loaded only when needed.

L1 must not be a hand-written set of content categories that merely points into the Wiki. That would create a second taxonomy with no one-to-one maintenance relationship. The directory is the category; its metadata is the compressed meaning; the generated tree is the resident view. See `context-compilation.md`.

Each directory summary must provide enough actual knowledge to establish a rough mental model before opening details: what belongs there, what important conclusions or problems already exist, and why the current task may need it. A name, link, or “read this when X” trigger alone is insufficient.

### Root project instructions

Root instructions establish L0, the roles of the knowledge planes, Agent-directed retrieval, source provenance, quality gates, language, and repository-specific constraints. The generated L1 directory map is normally the final section for readability, but its natural two-sided boundaries allow later manual content to remain safe; path-scoped instructions may refine behavior for subtrees.

### Project compass and higher-order judgment

Some repositories need a durable decision surface above current execution state: for example a creator mental model, product compass, operating doctrine, or safety authority. It should explain why the project exists, which constraints shape production, who owns final judgment, what the highest risks are, and how substantial work is filtered.

This is project-specific rather than a mandatory filename or universal template. Its most important conclusions belong directly in L0 so every task receives them; the detailed argument may remain a topic page linked from the relevant directory. Do not force every important page into `recoveryCandidates` when its compressed conclusion can be resident.

### Agent guide

The guide explains the wiki's roles, page lifecycle, writing rules, and forbidden behavior. Keep repository product facts out of the generic protocol unless they affect knowledge maintenance.

The effective update prompt has two owners: the reusable guide defines normative maintenance rules, while root L0 defines the project's evolving growth contract—what events deserve memory, which scopes and categories fit the work, and when a repeated lesson should become resident context. The Kit validates structure and omissions after an Agent writes; it does not decide what the Agent should read or replace ordinary filesystem search.

See `retrieval-and-growth.md` for the first-principles retrieval, generation, iteration, and correction model.

### Index

The detailed index is an on-demand routing surface beneath compiled L1. Organize it by likely tasks and questions within the real directory structure. Prefer:

- Start here
- Current product and architecture
- Development and testing
- Operations and recovery
- Historical or archived knowledge

Do not copy full page summaries or recent history into the index.

## Applicability scope

Knowledge plane and applicability scope are independent. A topic, plan, raw source, or work report may contain repository-wide rules, shared-subsystem conclusions, domain-family knowledge, product-area/campaign content, feature/chapter details, scene/probe evidence, or instance state.

Split mixed inputs into atomic conclusions and store each at the highest stable scope where it remains accurate. Discovery in one active area is provenance, not ownership. Maturity is a separate axis: a global candidate may remain low-confidence without being buried in a local directory. Directory metadata should summarize the actual scope owned by that directory so L1 routes future work correctly.

Implementation structure is a third axis. Research may need distinct names for intent, transaction, event, knowledge, narrative, projection, or other responsibilities so people can reason clearly; those names do not prove a one-to-one class, System, schema, service, or module layout. Preserve them as a responsibility map until independent cases show which boundaries must exist in code.

### Current state

Current state is a recovery router, not an encyclopedia. Keep:

- Current focus and verified baseline
- Exact authority and active entry points
- Known blockers and deliberate limits
- Recovery commands or evidence
- Next decisions

Move durable rules into topic pages, long evidence into reports, chronology into the log, and old state into archives.

## Evidence and uncertainty

Label evidence strength instead of flattening all claims:

1. Source-backed or authoritative persisted state.
2. Reproducible automated verification.
3. Browser or runtime observation.
4. Human review.
5. Inference or hypothesis.

State what was not tested. A passing typecheck does not prove a visual design; a rendered route does not prove the full product loop; a plan does not prove implementation.

Projects may name or subdivide these levels, but must not silently promote one level into another. In particular, automated success, runtime visibility, usability or game-feel review, and final creator/operator acceptance are separate claims.

## Retrieval quality

Evaluate the wiki by tasks, not file count:

- Recovery time: can a fresh agent find current authority quickly?
- Read amplification: how many unrelated lines must be loaded?
- Search coverage: do task terms find the right topic?
- Contradiction rate: do index, current state, plans, and implementation disagree?
- Authority-collision rate: can a direct search hit find a rejected, superseded, or mixed-age claim without seeing its current replacement and inheritable boundary?
- Staleness: are high-value pages reviewed when the subsystem changes?
- Topic convergence: does repeated evidence improve one topic rather than create duplicates?
- Source traceability: can a durable claim be traced to evidence?

## Project wiki versus runtime memory

Do not confuse project-maintenance knowledge with an application's in-world or per-agent memory. Runtime memory may require owner isolation, branch semantics, journals, access control, and authoritative transactions. The project wiki documents those mechanisms and their verified conclusions; it is not itself the runtime state store.

## Anti-patterns

- Append every event to `current-state.md`.
- Keep thousands of recent log lines in the startup path.
- Let one large status page mix roadmap, current state, implementation history, and acceptance evidence.
- Create near-duplicate topic pages because wording changed.
- Repeat a candidate number, content budget, taxonomy, or architecture noun until later Agents mistake frequency for approval.
- Keep current and legacy claims under ambiguous headings such as “validated behavior” without naming which model was actually validated.
- Treat generated summaries as authoritative without source references.
- Load the entire wiki into every agent prompt.
- Hand-write an L1 content taxonomy that can drift away from the real Wiki directories.
- Give only the example named in a correction special treatment instead of extracting the rule that applies to peer categories.
- Edit the generated directory guide directly or remove either of its natural boundaries, preventing the compiler from locating the section safely.
- Move or rewrite raw evidence during a cleanup.
- Archive unparseable logs heuristically.
- Force every existing repository into one directory layout.
- Call a shallow route render or static check full acceptance.

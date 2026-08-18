---
name: agent-wiki-kit
description: Install or update Agent Wiki Kit, or use it to start work from, build, audit, repair, and maintain a durable project-level Agent Wiki. Use when a user asks to install this Skill from its repository, when entering or resuming a repository, when a repository needs a long-term Markdown memory layer, when an existing llm-wiki/docs/wiki/plans/wiki has become bloated or hard to retrieve from, or when source boundaries, current state, topic convergence, links, structured logs, and archival policies need validation.
---

# Agent Wiki Kit

Treat the repository files as the durable memory and the conversation as temporary working context. Build a small retrieval system, not a transcript dump.

Build a stage for capable collaborators, not a corridor of mandatory gates. The Kit should offer resident context, searchable knowledge, compact diagnostics, and convenient compilation so an Agent can exercise judgment and discover better ways of working. Keep hard enforcement for structural safety that tools can know mechanically; express project method, retrieval choices, promotion judgment, and creative practice as adaptable prompts and project-owned conventions. Current experience is evidence, not universal law.

The outcome is not workflow compliance. When a task needs it, an Agent should be able to recover current goals, project and subsystem design, desired future work, phase boundaries, completed evidence, past problems, failed directions, corrections, and distilled experience—then use that history to act more autonomously and with better judgment without loading everything.

## Install or update this Skill

When the user is asking to install Agent Wiki Kit rather than use it on a project, install the complete Skill folder through the open Agent Skills installer. Do not make the user choose a harness-specific filesystem path.

For the normal user-wide installation, run:

```bash
npx -y skills add ChrisPei/agent-wiki-kit --skill agent-wiki-kit --global --yes
```

Use project scope only when the user explicitly wants the Skill committed or isolated to the current repository; omit `--global`:

```bash
npx -y skills add ChrisPei/agent-wiki-kit --skill agent-wiki-kit --yes
```

For an existing installation, update through the same installer:

```bash
npx -y skills update agent-wiki-kit --global --yes
```

Use `--project --yes` instead when updating an explicitly project-scoped installation.

Prefer a harness-native Skill or plugin installer only when it can install this repository as one complete Skill and the user prefers that route. Fall back to manual clone or copy only when neither the open installer nor a native installer is available.

After installation, locate the installed `agent-wiki-kit/SKILL.md`, confirm that its sibling `scripts/wiki-kit.mjs` exists, and run:

```bash
node <installed-skill-path>/scripts/wiki-kit.mjs --help
```

Report the installed scope and path, the verification result, and whether the current harness needs a restart or new session before discovery. Stop after installation unless the user also asked to initialize or adopt a project Wiki; installing the Skill does not authorize repository mutation.

## Choose the operation

1. Inspect the repository, its dirty worktree, project instructions, documentation roots, current authority, and the applicability scope of the incoming knowledge before writing.
2. Choose one path:
   - Start or resume project work: use root L0/L1 and optionally run `startup` for a bounded recovery snapshot, then choose the evidence the task actually needs.
   - Bootstrap a new wiki: read `references/architecture.md` and `references/context-compilation.md`, run `init`, then shape the generated L0 and directory metadata to the project.
   - Audit an existing wiki: run `doctor` first; do not mutate it during discovery.
   - Adopt or repair an existing wiki: read `references/adoption-and-repair.md`, preview `adopt --check`, write only the configuration, then repair one boundary at a time.
   - Update durable memory after project work: verify the real implementation and evidence, update the owning topic/current state/plan as needed, append one structured log entry when chronology matters, run the comprehensive `check`, address its real diagnostics, then run `build-agent-context`.
   - Validate or archive: read `references/contracts.md`, run `check`, then run `archive-log` only after the log format is valid.
3. Report what is authoritative, historical, mocked, stale, missing, and still unresolved.

## Preserve the knowledge boundaries

- Keep source evidence and provenance in a source layer. Captured evidence is append-only by default, but correction, versioning, relocation, redaction, or removal can be intentional; preserve or explain prior meaning, repair the source register and links, and record why instead of silently rewriting history.
- Keep durable conclusions in topic pages organized by future retrieval questions.
- Keep recovery state, chronological work history, QA evidence, and handoffs in working memory.
- Keep executable designs and plans in their own knowledge plane, distinct from current conclusions and implementation proof. In a new scaffold this plane lives under the Wiki root; adopted repositories may retain an established external plans root.
- Update an existing topic when new evidence answers the same durable question. Do not create one page per conversation, task turn, or sentence.
- Keep `index.md` a task-oriented router and `current-state.md` a compact recovery router. Neither is a changelog.
- Keep the recent log bounded. Archive old structured entries without losing chronology.
- Mark source references, confidence, uncertainty, superseded conclusions, and validation evidence explicitly.
- Preserve the full reasoning of still-useful plans and design documents. Resident context, indexes, and current state should stay compact, but length alone is not a reason to shorten or discard deep guidance; improve its status, routing, headings, and local readability first.
- Keep applicability, maturity, and implementation shape separate. A repository-wide candidate is still a candidate; a useful numeric budget is still a heuristic; a named responsibility does not automatically deserve its own class, System, schema, or module.
- Make mixed-age pages safe for direct search. If one page retains legacy evidence beside a current target, identify both in the page summary and section headings; never leave an unqualified “validated” section whose validity applies only to a rejected model.

## Compile resident context from the real Wiki tree

Root `AGENTS.md` is the resident context surface:

- L0 is maintained project judgment: purpose, creator/team mental model, production constraints, highest-order decision rules, and the Wiki growth contract.
- L1 is not a separately authored content taxonomy. It is compiled from the real Wiki directory tree; every injected directory carries a one-line semantic summary in its own `.wiki-meta.json`.

The update guidance itself has two layers. This Kit supplies the reusable protocol for evidence, planes, convergence, links, validation, and compilation. Each project owns an evolving growth contract in L0 that says which events are worth preserving, how knowledge is scoped and organized for that project, and which repeated lessons should be promoted into resident context. Do not freeze project-specific judgment inside the generic Kit.

Do not hand-edit the generated directory guide. Update the real directory and its metadata, then run:

```powershell
node <skill-path>/scripts/wiki-kit.mjs build-agent-context --root D:\TargetProject
node <skill-path>/scripts/wiki-kit.mjs build-agent-context --root D:\TargetProject --check
```

The directory guide is bounded by one natural level-two Markdown heading and its closing Markdown separator (`---`). The compiler replaces only that bounded section and preserves project instructions on both sides byte-for-byte. Keeping the guide last is recommended but not required; legacy HTML comment markers are migrated automatically. Read `references/context-compilation.md` before designing or changing L0/L1.

Treat a user's concrete example as a reasoning probe, not an instruction to grant that example special status. Infer why it was chosen, generalize to peer directories or objects, test boundaries and counterexamples, then persist the general rule plus local application. Postmortems, for example, may be one project directory, but every compiled directory needs meaningful compressed knowledge.

## Route by applicability scope before choosing a file

Knowledge plane and applicability scope are independent decisions. `raw/topic/work/plan` answers what role a file serves; it does not answer whether a conclusion belongs to the whole product, a shared system, a domain family, a campaign, a chapter, a scene, or one instance.

Before non-trivial writes:

1. Split the incoming material into atomic conclusions. One user message may contain global rules, subsystem candidates, local content, and transient evidence.
2. For each conclusion, run the replacement test: if the current project area, country, customer, service, or scene name is replaced, does the conclusion remain true?
3. Choose the highest stable applicability scope where it remains accurate: repository-wide, shared subsystem, domain family, product area/campaign/service, feature/chapter/thread, scene/probe/incident, or runtime instance.
4. Record maturity separately. A repository-wide candidate is not the same as an approved implementation; lower confidence/status rather than hiding it in a local file.
5. Write the rule once at its canonical scope. Local pages link to it and keep only local parameters, applications, deviations, and evidence.
6. If a local page already owns broader knowledge, promote it while preserving source provenance and repairing routing.

When research introduces a vocabulary, first treat the terms as a responsibility map. Only independent implementation evidence should decide whether two responsibilities share a module or one responsibility splits across several modules. Do not let the Wiki turn convenient nouns into architecture by repetition.

Discovery location is evidence provenance, not knowledge ownership.

Read `references/architecture.md` for the full model and anti-patterns, and `references/retrieval-and-growth.md` when designing the resident Prompt, retrieval cues, memory growth, or correction behavior. Read `references/contracts.md` before creating or changing page formats.

## Start an agent session

Root `AGENTS.md` supplies resident project judgment and a compressed map of what the Wiki maintains. The Wiki is a project-level memory and retrieval system, not a mandatory reading checklist and not a substitute for implementation evidence.

Use `startup` when a bounded recovery snapshot is useful. Its configured entries are discoverable recovery candidates, not a compulsory read order. Decide what to open from current state, plans, the detailed index, the Wiki protocol, maintained topics, source evidence, and implementation artifacts according to the task, context already present, risk, uncertainty, and authority conflicts. Read the smallest set that supports a reliable decision, but go deeper whenever summaries are insufficient evidence.

`recoveryCandidates` keeps important recovery clues present and discoverable and renders them in a stable order; it does not require the Agent to read every file on every task. Important conclusions that affect most work belong in L0 or the relevant L1 directory summary; detailed authorities remain on demand. Version 1 configs using the former `requiredStartupFiles` name remain readable for compatibility.

Summarize the real file state before proposing substantial work. Prefer search, preview, and targeted reads over loading the entire wiki.

## Use the helper

Run the Node.js helper without installing dependencies:

```powershell
node <skill-path>/scripts/wiki-kit.mjs doctor --root D:\TargetProject
node <skill-path>/scripts/wiki-kit.mjs check --root D:\TargetProject
node <skill-path>/scripts/wiki-kit.mjs startup --root D:\TargetProject
node <skill-path>/scripts/wiki-kit.mjs init --root D:\NewProject
node <skill-path>/scripts/wiki-kit.mjs adopt --root D:\ExistingProject --check --json
node <skill-path>/scripts/wiki-kit.mjs adopt --root D:\ExistingProject
node <skill-path>/scripts/wiki-kit.mjs build-agent-context --root D:\TargetProject --check
node <skill-path>/scripts/wiki-kit.mjs build-agent-context --root D:\TargetProject
node <skill-path>/scripts/wiki-kit.mjs list-topics --root D:\TargetProject --path llm-wiki/wiki/product
node <skill-path>/scripts/wiki-kit.mjs review-directory --root D:\TargetProject --path llm-wiki/wiki/product
node <skill-path>/scripts/wiki-kit.mjs mark-standalone --root D:\TargetProject --path llm-wiki/wiki/example.md
node <skill-path>/scripts/wiki-kit.mjs archive-log --root D:\TargetProject --check
node <skill-path>/scripts/wiki-kit.mjs archive-log --root D:\TargetProject
```

- `doctor` auto-detects `llm-wiki`, `docs/wiki`, `plans/wiki`, or `wiki` and performs a read-only health report.
- `startup` reports configured recovery candidates in stable order, plus missing entry files and dirty-worktree counts without loading the whole Wiki; the Agent still chooses what to read.
- Auto-detection is provisional. `check` refuses to treat guessed contracts as a quality gate until `agent-wiki.config.json` exists.
- `adopt --check` previews the detected contract; `adopt` writes only `agent-wiki.config.json`. Review the file before any repair.
- `init` creates a complete default scaffold. If root `AGENTS.md` already exists, it preserves the existing instructions, appends a concise Wiki usage section, and then appends the generated directory guide.
- `build-agent-context` records that current directory changes have been semantically considered, compiles configured directory metadata into the naturally bounded directory-guide section of `AGENTS.md`, and refuses to proceed while unrelated strict-check errors remain; `--check` detects drift without writing or acknowledging review.
- `list-topics` reads fixed-header summaries without loading topic bodies.
- `review-directory` records content hashes only after the Agent has considered changed documents against the directory summary; the script never makes the semantic decision.
- `mark-standalone` records an explicit metadata exception for an intentionally isolated topic.
- `check` validates required files, configured metadata, structured log headings/order, active local links and source references, optional supersession links, hot-document budgets, and tracked source changes that require provenance review. Broken links in historical archives remain visible but do not block current work. Semantic conflicts still require Agent judgment.
- `archive-log --check` reports whether archival is required without writing. The write form archives oldest recent entries atomically and idempotently.
- Add `--json` to `doctor` or `check` for structured automation output.

Never use `init` to force an existing repository into the default layout. Run `doctor`, then `adopt`, then adjust the generated configuration to match actual authority.

After `init`, inspect the injected Wiki usage section and adapt its language or project-specific commands without removing the knowledge-plane explanation, Agent-directed retrieval, maintenance closure, source-provenance, and generated-guide rules.

Read `references/configuration.md` when auto-detection is incomplete or the repository needs different budgets, metadata fields, or source/topic roots.

## Repair incrementally

1. Freeze source boundaries and identify authoritative files.
2. Establish project-specific L0, shape the real semantic directory tree, and write one `.wiki-meta.json` per injected directory.
3. Compile L1, establish discoverable recovery candidates, then make the detailed index route by task, subsystem, and decision.
4. Reduce current state to current truth, recovery steps, active evidence, and next decisions.
5. Convert durable repeated findings into maintained topic pages.
6. Convert recent chronological history to the structured log format.
7. Archive old log entries only after headings validate.
8. Add checks to the project's normal quality gate.
9. Measure whether a fresh agent can recover the project without loading the whole wiki.

Do not perform a mass rewrite merely to satisfy the kit. Preserve useful existing names and map them in `agent-wiki.config.json`.

## Validate the result

Require:

- A fresh agent understands what each knowledge plane maintains and can choose the evidence needed for the current task without obeying a fixed reading checklist.
- The L1 tree is a compiled one-to-one mirror of annotated Wiki directories, not a second hand-maintained taxonomy.
- Every compiled directory summary states its real coverage and current high-value conclusions or problems, not only its name or read trigger.
- Rebuilding changes only the directory-guide section between its heading and closing Markdown separator.
- A fresh agent working outside the discovery area can find shared conclusions without reading the original local plan or incident.
- A topic has one maintained current conclusion and linked evidence, not many near-duplicate pages.
- A direct search hit cannot make historical, rejected, or superseded material look current: the page identifies its status, replacement, and still-inheritable scope before the body, while the current authority records what it replaced.
- Candidate counts, budgets, taxonomies, and architecture vocabulary remain visibly provisional until the project records the evidence or creator/operator decision that promoted them.
- Source evidence preserves provenance and prior meaning. Intentional correction, versioning, relocation, redaction, or removal follows the declared lifecycle and repairs the source register and affected links; routine cleanup does not silently wash the evidence.
- Local links resolve and topic pages are reachable from the index.
- Current state and recent log remain within configured budgets.
- Archival is repeatable and a second run makes no changes.
- The report distinguishes automated checks from human review.

Use `references/adoption-and-repair.md` for migration sequencing.

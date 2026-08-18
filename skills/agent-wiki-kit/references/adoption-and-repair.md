# Adopting and Repairing an Existing Wiki

## First pass: read only

1. Inspect dirty worktree state and preserve unrelated changes.
2. Locate root and path-scoped agent instructions.
3. Find likely wiki, plan, status, log, raw, QA, and archive roots.
4. Measure line and byte counts for startup files.
5. Identify the actual authority from implementation, persisted state, tests, and raw sources.
6. Run:

```powershell
node <skill-path>/scripts/wiki-kit.mjs doctor --root D:\Project
node <skill-path>/scripts/wiki-kit.mjs startup --root D:\Project
```

Do not reorganize content during discovery.

## Classify existing files

Map each file to one role:

- Source evidence
- Compiled topic knowledge
- Current recovery state
- Recent chronology
- Detailed evidence or QA
- Active plan
- Historical plan or archive
- Generated/runtime artifact

If one file has several roles, split it gradually. Do not rewrite it wholesale before establishing replacement links and authority.

## Adopt the layout

If auto-detection is correct:

```powershell
node <skill-path>/scripts/wiki-kit.mjs adopt --root D:\Project --check --json
node <skill-path>/scripts/wiki-kit.mjs adopt --root D:\Project
```

This writes only `agent-wiki.config.json`. Review:

- `index`
- `currentState`
- `log`
- `archiveDir`
- `topicRoots`
- `rawRoots`
- `plansRoot`
- budgets and metadata requirements

Treat detection as a proposal. In particular, verify that a product overview was not mistaken for current recovery state, that sibling source roots such as `docs/raw` are protected, and that `logOrder` matches the file's real chronology.

If detection is incomplete, edit the config rather than renaming the repository.

## Repair order

### 1. Protect authority

- Mark raw/source roots.
- Check tracked source modifications before cleanup.
- Record which implementation or persisted state is authoritative.
- Search the same high-impact concepts across current topics, plans, historical material, source evidence, and implementation. Build a conflict map before reorganizing anything; a clean link graph does not prove that mutually exclusive memories are distinguishable.

### 2. Establish startup routing

- Extract the project's higher-order compass, creator mental model, operating doctrine, or safety authority into a compact L0 in root instructions; keep detailed argument in the Wiki.
- Design the actual project-shaped semantic directory tree. Do not invent a hand-written L1 content list that only points to files.
- Add `.wiki-meta.json` to each injected directory. Each summary must state real coverage and current key conclusions/problems, not only a name or read trigger.
- Configure `contextCompiler`, compile the L1 directory tree into its naturally bounded section of `AGENTS.md`, and verify that content on both sides is unchanged.
- Ensure root instructions explain what each knowledge plane maintains and expose useful recovery candidates. Do not impose a fixed read order; let the Agent choose from current state, plans, detailed routing, sources, and implementation according to the task.
- Ensure the index points to current authority.
- Remove obsolete active-plan pointers before editing long topic content.
- Make historical, rejected, and superseded pages self-disambiguating before their body. Record the current replacement and the still-inheritable scope on the page itself, because direct filesystem search can bypass every parent router.
- When one page intentionally retains both legacy evidence and a new target, qualify the summary and each affected heading; a generic “validated” heading beneath a legacy-aware page header is still an unsafe direct-search landing.
- Keep candidate maturity visible when promoting knowledge to a broader scope. Do not let repeated numeric budgets or a responsibility vocabulary become resident policy or implementation structure without the evidence or explicit decision that promoted them.

### 3. Compact current state

Keep only current truth, recovery, blockers, evidence pointers, and next decisions. Move:

- stable rules to topic pages;
- detailed execution evidence to QA reports;
- chronology to the log;
- superseded snapshots to archive.

### 4. Converge topics

Search before creating a page. Merge pages that answer the same retrieval question, but preserve conflicting source evidence and explicit uncertainty. Do not merge merely because titles share generic words.

### 5. Structure the recent log

Convert only entries whose boundaries are clear. Use the heading contract. Leave ambiguous history untouched until a human can confirm it.

### 6. Archive

Run:

```powershell
node <skill-path>/scripts/wiki-kit.mjs archive-log --root D:\Project --check
```

Only run the write form after format validation passes. Review the diff, then run it a second time and confirm no changes.

### 7. Integrate validation

Add `check` to the repository's existing quality command. Keep read-only `doctor` available for recovery and periodic maintenance.

## Common repair decisions

### Huge status file

Keep a compact current-state router. Extract durable subsystem conclusions into topic pages, verification into reports, and completed phase history into archives.

### Huge unarchived log

Define parseable entry headings, preserve recent entries, archive by month, and link archive indexes. Never trim by raw line count without entry boundaries.

### Index mirrors the directory tree

Add task-oriented routes. A fresh agent should be able to choose what to read without knowing the repository layout.

### Missing wiki

Use `init` only if the repository truly has no established memory authority. If docs or plans already serve that role, adopt them instead.

### Many near-duplicate pages

Choose a canonical retrieval question, update its summary to the current conclusion, link evidence, and mark superseded pages. Delete only with explicit authority and after inbound links are repaired.

### Long plans and design documents

Do not shrink or delete them merely to meet resident-context budgets. Preserve complete reasoning while it remains useful; improve status, replacement links, headings, summaries, and local retrieval first. Archive, split, converge, or remove only for genuine staleness, conflicting authority, redundant ownership, or failed local readability.

## Completion test

Give a fresh agent three realistic tasks:

1. Recover current work and identify the next safe action.
2. Find a durable subsystem rule and its evidence.
3. Explain a historical decision without loading the full recent history.

Record files read, lines loaded, wrong turns, stale claims, and unresolved contradictions. Optimize those outcomes rather than maximizing documentation volume.

Also compare the actual directory tree, every `.wiki-meta.json`, and the generated directory guide. A category rename or move is incomplete if any of those three disagree. Run `build-agent-context --check`, then deliberately change one metadata summary and verify that the write build changes only the bounded directory-guide section while preserving content on both sides.

Also record the evidence level behind each successful answer: source/persisted state, automated verification, runtime observation, human review, or inference. A recovery test is incomplete if the agent reaches the right file but overstates what that evidence proves.

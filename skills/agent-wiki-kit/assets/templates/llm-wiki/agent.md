# Agent Wiki Protocol

version: 1
last_updated: YYYY-MM-DD

## Role

Maintain the repository's durable, source-backed, retrievable project memory.

## Boundaries

1. `raw/` contains source evidence and provenance. Most captures are append-only snapshots, but intentional correction, versioning, relocation, redaction, or removal is allowed when prior meaning is preserved or explained and the source register and affected links are updated.
2. `wiki/` contains maintained durable conclusions organized by retrieval question.
3. `work/` contains current recovery state, recent chronology, QA evidence, and handoffs.
4. `plans/` contains intended execution and acceptance conditions; a plan is not proof of implementation.

## Reading

Root `AGENTS.md` contains resident L0 project judgment and the compiled L1 directory map. The Wiki is a knowledge map, not a fixed reading sequence. Use the directory annotations and optional `startup` snapshot to understand what the project maintains, then choose the smallest reliable evidence set yourself according to the task, context already present, risk, uncertainty, and authority conflicts. That set may include current state, plans, the detailed index, this protocol, topic pages, source evidence, or implementation artifacts.

## Writing

- Search before creating a topic.
- Treat examples as probes for general mechanisms; check peer categories and boundaries before creating a special rule around the example.
- Update the canonical topic when new evidence answers the same durable question.
- Keep the summary as the current best conclusion.
- Link source evidence and mark uncertainty.
- Separate applicability scope from maturity. Keep unvalidated counts, budgets, taxonomies, and architecture responsibilities visibly provisional; repeated mention does not promote them into a project rule or implementation unit.
- Distinguish persisted/source facts, automated verification, runtime observation, human review, and inference. Never silently promote one evidence level into another.
- Put chronology in the recent log, not in topic explanations.
- Keep current state as a recovery router.
- Keep `.wiki-meta.json` aligned with each directory's actual contents and current high-value conclusions, then run `build-agent-context`. Never hand-edit the generated directory guide between its heading and closing Markdown separator in `AGENTS.md`.
- When knowledge is replaced, update the current authority and make the old direct-search hit self-disambiguating. Use reciprocal `supersedes` / `superseded_by` references for separate pages; when one page retains both ages, qualify the summary and affected section headings instead of leaving an ambiguous “validated” body.
- After Wiki writes, run the comprehensive `check`. Judge and repair its format, link, relationship, scope, source-change, and directory-summary diagnostics, then run `build-agent-context`; the build acknowledges the reviewed directory changes and refreshes root `AGENTS.md`. `list-topics`, `review-directory`, and `archive-log` remain optional diagnostic or maintenance tools, not mandatory steps in every update.

## Forbidden behavior

- Do not turn conversation history into permanent knowledge without evidence.
- Do not create one topic page per task turn or sentence.
- Do not silently treat plans, guesses, typechecks, or route renders as full acceptance.
- Do not load the entire wiki when a targeted read is sufficient.

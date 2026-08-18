# Page, Index, and Log Contracts

## Root AGENTS context contract

Root `AGENTS.md` has two resident layers:

- L0 is manually maintained project direction, judgment, collaboration model, and Wiki growth contract.
- L1 is generated from the configured real directory tree and directory metadata. Its natural start boundary is the configured level-two Markdown heading; its natural end boundary is the next standalone Markdown separator line (`---`).

The compiler may only append a missing directory-guide section or replace the unique existing section between those two boundaries. It must not format, move, normalize, or rewrite content before or after the section. Duplicate managed headings or a missing closing separator are errors. Legacy HTML comment markers are accepted only for one-time migration to the natural section.

## Directory metadata

Every directory included in L1 contains `.wiki-meta.json`:

```json
{
  "title": "Human-readable category",
  "summary": "One line describing real coverage and current high-value conclusions, risks, or unresolved boundaries.",
  "order": 10,
  "children": "all"
}
```

- `title` and `summary` are required non-empty strings; `summary` stays on one line.
- `order` is an integer and controls sibling ordering.
- `children` is `all`, `annotated`, or `none`. Use `all` for semantic trees so an unexplained new directory fails compilation; use the other modes only for explicit context pruning.
- The metadata summary is the authority for the compiled annotation. Do not hand-maintain a second summary in `AGENTS.md`.
- A summary must state more than a directory name or read trigger. It should let an Agent know approximately what is already understood before loading detail.

See `context-compilation.md` for build and validation behavior.

## Topic page

Use this shape unless the repository has a stronger compatible contract:

```markdown
# Topic Title

status: draft
owner: human | team | named agent
last_updated: YYYY-MM-DD
confidence: low | medium | high
scope: Optional free-text applicability boundary when omission could mislead.
summary: One-line retrieval summary with the current high-value conclusion.
source_refs:
  - path/to/source
related_pages:
  - path/to/topic
supersedes:
  - path/to/older-topic
superseded_by:
  - path/to/current-topic
standalone: false

## Summary

Three to eight lines containing the current best conclusion.

## Current Conclusion

The durable answer to the page's retrieval question.

## Rules

Actionable constraints, preferably using MUST, SHOULD, and MUST NOT where useful.

## Evidence and Uncertainty

What supports the conclusion, what was verified, what was not verified, and where evidence conflicts.

## Open Questions

Only unresolved questions with concrete decision impact.

## Change Log

- YYYY-MM-DD: Concise semantic change, not a task diary.
```

Required metadata is configurable. The default kit requires `status`, `owner`, `last_updated`, `confidence`, `summary`, `source_refs`, `related_pages`, and `standalone` for topic pages. Source/related lists may be empty but their keys remain explicit. `standalone: true` is an explicit reviewed exception for a topic that intentionally has no document-graph relationship; use `mark-standalone`, not a file-name suffix.

`status` is deliberately project-extensible; projects may use values such as `proposed-awaiting-review` when that is more truthful than a universal enum. Optional `scope` records applicability independently from maturity. Optional `supersedes` and `superseded_by` are repository-relative lists for mutually exclusive authorities and should normally be reciprocal; use `superseded_by: none` for a reviewed historical page with no replacement. Do not use supersession merely for related pages.

When current and legacy conclusions coexist in one page, metadata cannot disambiguate every direct search landing. Qualify the one-line summary and the relevant section headings so “validated” never silently means “validated only in the rejected model.”

## Index

The detailed, on-demand index must:

- Link to current state and active plans.
- Route by task or retrieval question.
- Distinguish current authority from historical material.
- Avoid embedding full history.
- Keep every maintained topic reachable directly or through another routed page.

## Current state

A current-state page should stay below the configured line budget and contain:

```markdown
# Current State

last_updated: YYYY-MM-DD

## Current Focus
## Verified Baseline
## Authority and Entry Points
## Known Gaps
## Recovery
## Next Decisions
```

Do not append completed work indefinitely. Move durable lessons to topics, verification detail to QA reports, and chronology to the log.

Projects may add compact hot fields such as highest product risk, active causal loop, current evidence level, or operator decision when those fields materially improve safe recovery. Do not make project-specific sections universal requirements, and do not let extensions turn current state into a second roadmap.

## Structured recent log

Every recent entry begins with:

```markdown
## [YYYY-MM-DD] kind | concise title
```

Recommended kinds include:

- `decision`
- `implementation`
- `repair`
- `validation`
- `research`
- `handoff`
- `docs`

Entry bodies should answer:

- What changed or was learned?
- Which paths or artifacts are authoritative?
- What evidence exists?
- What remains open?

When acceptance matters, name the evidence level explicitly: source or persisted state, automated verification, browser/runtime observation, human review, or inference. Do not use a passing lower-level check as shorthand for higher-level acceptance.

Use the configured order consistently. The default scaffold is append-oriented (`oldest-first`); adopted repositories may use `newest-first`. Never archive a mixed-order log until a human or explicit repair establishes which end is recent. Keep a bounded recent window and archive older entries by month.

## Source references

- Prefer repository-relative paths.
- Use a stable artifact or raw source rather than a conversation reference.
- Link claims near the conclusion they support.
- Mark inference explicitly.
- Never silently upgrade a hypothesis to a stable rule.

## Local links

- Use relative Markdown links for repository files.
- Avoid machine-specific absolute paths in maintained project pages.
- Keep anchors stable when possible.
- Run `check` after moving or splitting pages.

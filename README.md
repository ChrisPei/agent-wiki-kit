# Agent Wiki Kit

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](package.json)

**A durable, repository-native memory and retrieval system for coding agents.**

Agent Wiki Kit helps an agent recover project intent, current state, decisions, evidence, plans, and historical corrections without turning every session into a full-documentation reload. It combines an installable Skill, a small Markdown knowledge architecture, and a dependency-free Node.js validator/compiler.

[Simplified Chinese](README.zh-CN.md)

## Install

### Give the repository to your agent

Copy this instruction into any Agent that can read a GitHub repository:

```text
Install Agent Wiki Kit from https://github.com/ChrisPei/agent-wiki-kit.
Follow the installation instructions in skills/agent-wiki-kit/SKILL.md,
install it for my user account,
verify the helper, and tell me where it was installed. Do not initialize a Wiki yet.
```

The installable [`SKILL.md`](skills/agent-wiki-kit/SKILL.md) contains a dedicated installation mode. The Agent chooses the appropriate supported harness without asking the user to know its filesystem layout.

### One command

The same cross-Agent installation is available directly through the open [`skills`](https://github.com/vercel-labs/skills) CLI:

```bash
npx skills add ChrisPei/agent-wiki-kit --skill agent-wiki-kit --global
```

For a project-only installation, omit `--global`. To update an existing installation:

```bash
npx skills update agent-wiki-kit --global
```

The installer discovers supported Agents, installs the complete Skill folder, and manages platform-specific locations. Manual cloning is only a fallback for environments without a Skill installer.

## Why this exists

Chat context is temporary. Project understanding is not.

Long-running work needs more than a transcript archive: an agent must know what is current, where evidence came from, which plans are still active, and which old conclusions were rejected. Agent Wiki Kit stores that knowledge in the repository where people and tools can inspect, version, search, and repair it.

The Kit is designed around four outcomes:

- **Recall:** resident context tells an agent that relevant project memory may exist.
- **Retrieval:** filenames, summaries, metadata, and links support targeted search instead of full-tree loading.
- **Authority:** sources, maintained conclusions, work state, and plans stay visibly distinct.
- **Correction:** current knowledge replaces obsolete claims without erasing useful history or provenance.

## What you get

- An installable `agent-wiki-kit` Skill for bootstrapping, auditing, repairing, and maintaining repository memory.
- A default `llm-wiki/` scaffold with source, topic, work, plan, and archive boundaries.
- A project-owned `agent-wiki.config.json` contract rather than hard-coded folder assumptions.
- A compiler that builds a bounded directory guide in root `AGENTS.md` from real directory metadata.
- Read-only health checks, strict validation, topic summaries, document-graph diagnostics, source-change review, and repeatable log archival.
- No runtime dependencies beyond Node.js 20 or newer.

## Core model

```text
Repository evidence
  ├─ raw sources + provenance        what was observed
  ├─ maintained topic pages         what the project currently concludes
  ├─ work state + chronological log what is happening and what was verified
  └─ plans                          what is intended but not yet proven
           │
           ├─ targeted filesystem retrieval
           └─ compiled resident context in AGENTS.md
```

The knowledge plane and applicability scope are separate. A conclusion may belong to the repository, a shared subsystem, a product area, one feature, one incident, or one runtime instance regardless of whether it is stored as evidence, a maintained topic, work state, or a plan.

## Requirements

- Node.js 20 or newer
- Git for normal versioned use
- A coding agent that can read repository instructions and Markdown; Codex can also load this project directly as a Skill

## Invoke the installed Skill

Invoke it explicitly in Agents that support Skill mentions:

```text
$agent-wiki-kit audit this repository's durable memory before we continue implementation.
```

The Skill may also activate implicitly when a task matches the scope in [`skills/agent-wiki-kit/SKILL.md`](skills/agent-wiki-kit/SKILL.md). Some harnesses require a restart or new session before discovering a newly installed Skill.

## Quick start

Use the helper directly from the cloned Skill directory. No `npm install` step is required.

### Start a new Wiki

```bash
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs init --root /path/to/project
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs check --root /path/to/project
```

`init` creates the default Wiki scaffold, writes `agent-wiki.config.json`, and adds a bounded Wiki section to root `AGENTS.md`. Existing instructions in `AGENTS.md` are preserved.

### Adopt an existing Wiki

```bash
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs doctor --root /path/to/project
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs adopt --root /path/to/project --check --json
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs adopt --root /path/to/project
```

Review the detected contract before repairing content. `adopt --check` is read-only; `adopt` writes only `agent-wiki.config.json`.

### Resume project work

```bash
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs startup --root /path/to/project
```

`startup` returns a bounded recovery snapshot. Its entries are candidates, not a mandatory reading order. Select deeper evidence according to the current task, risk, uncertainty, and authority conflicts.

### Close a knowledge update

```bash
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs check --root /path/to/project
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs build-agent-context --root /path/to/project
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs build-agent-context --root /path/to/project --check
```

Update the file that owns the conclusion before rebuilding resident context. The compiler only replaces the bounded directory-guide section in `AGENTS.md`.

## Commands

| Command | Purpose | Writes by default |
| --- | --- | --- |
| `doctor` | Detect Wiki roots and report health without assuming a quality contract | No |
| `startup` | Show configured recovery candidates, missing entries, and worktree state | No |
| `init` | Create a new default scaffold and configuration | Yes |
| `adopt` | Detect an existing Wiki and create only its configuration | Yes; use `--check` to preview |
| `check` | Run comprehensive structural, link, metadata, source, budget, and graph diagnostics | No |
| `build-agent-context` | Compile reviewed directory metadata into root `AGENTS.md` | Yes; use `--check` to compare |
| `list-topics` | List fixed topic headers without loading full bodies | No |
| `review-directory` | Record that changed direct documents were semantically reviewed | Yes |
| `mark-standalone` | Mark an intentionally isolated topic in its fixed header | Yes |
| `archive-log` | Move the oldest valid recent-log entries into an archive | Yes; use `--check` to preview |

Add `--json` to `doctor` or `check` for machine-readable output. Run any command with `--help` for the current CLI contract.

## Default project layout

```text
project/
├── AGENTS.md
├── agent-wiki.config.json
└── llm-wiki/
    ├── .wiki-meta.json
    ├── agent.md
    ├── index.md
    ├── sources.md
    ├── raw/
    │   ├── .wiki-meta.json
    │   └── README.md
    ├── wiki/
    │   ├── .wiki-meta.json
    │   └── project-overview.md
    ├── plans/
    │   ├── .wiki-meta.json
    │   └── README.md
    └── work/
        ├── .wiki-meta.json
        ├── current-state.md
        ├── log.md
        └── log-archive/
            ├── .wiki-meta.json
            └── INDEX.md
```

This layout is a starting point, not a universal taxonomy. Existing repositories can retain established roots and map them in `agent-wiki.config.json`.

## Configuration

`agent-wiki.config.json` defines the actual repository contract: Wiki roots, source and topic locations, recovery candidates, directory metadata behavior, fixed topic headers, budgets, structured-log format, and archive policy.

Auto-detection is intentionally provisional. `doctor` may inspect a repository without configuration, but strict `check` requires an explicit contract so guessed conventions never become a silent quality gate.

See:

- [`configuration.md`](skills/agent-wiki-kit/references/configuration.md) for the full configuration model.
- [`contracts.md`](skills/agent-wiki-kit/references/contracts.md) for page, source, log, and validation contracts.
- [`context-compilation.md`](skills/agent-wiki-kit/references/context-compilation.md) for L0/L1 compilation and directory metadata.
- [`adoption-and-repair.md`](skills/agent-wiki-kit/references/adoption-and-repair.md) for incremental migration.
- [`retrieval-and-growth.md`](skills/agent-wiki-kit/references/retrieval-and-growth.md) for retrieval, correction, and memory-growth principles.

## Design principles

1. **Repository files are durable memory; conversations are temporary context.**
2. **Implementation and verification evidence outrank Wiki claims about what works.**
3. **One durable question should converge on one current authority.**
4. **Provenance and prior meaning survive intentional correction or relocation.**
5. **Resident context stays compact; deep plans and reasoning remain complete when still useful.**
6. **Tools enforce mechanical safety, not product or creative judgment.**
7. **A concrete example is a probe into a general mechanism, not an automatic special case.**

## Safety and non-goals

- `doctor`, `startup`, `check`, and all `--check` forms are read-only.
- Write commands validate paths and operate inside the selected project root.
- `init` does not overwrite an existing Wiki into the default layout.
- `adopt` does not mass-rewrite documentation.
- The Kit does not claim that Markdown is implementation proof, choose the one correct architecture, or prescribe a fixed reading sequence.

## Development

```bash
npm test
npm run self-check
```

The test suite uses Node's built-in test runner and creates disposable fixtures outside the repository. No production dependencies are required.

When changing Skill behavior:

1. keep `skills/agent-wiki-kit/SKILL.md` focused on essential procedure;
2. place detailed conditional guidance in `skills/agent-wiki-kit/references/`;
3. keep templates and copied output in `skills/agent-wiki-kit/assets/`;
4. keep Skill instructions, source comments, templates, and UI metadata in English;
5. run the full tests and validate a generated fixture before submitting a change.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and [SECURITY.md](SECURITY.md) for private vulnerability reporting guidance.

## Project status

Agent Wiki Kit is usable today and intentionally conservative about mutation. Its contracts will continue to evolve as more repositories reveal retrieval failures, authority conflicts, and better recovery patterns. Backward compatibility is preserved where practical, including reading version 1 configuration fields and migrating legacy generated-section markers.

## License

Released under the [MIT License](LICENSE).

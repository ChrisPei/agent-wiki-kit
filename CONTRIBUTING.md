# Contributing

Thank you for improving Agent Wiki Kit. Contributions should preserve the project's central promise: durable repository memory that improves agent judgment without replacing implementation evidence or imposing a rigid documentation workflow.

## Before opening a change

1. Search existing issues and repository history for related work.
2. Keep the change focused on one observable problem or capability.
3. For behavior changes, explain the authority or retrieval failure being addressed.
4. Do not include repository-specific secrets, production data, personal paths, or unrelated infrastructure.

## Development setup

Requirements:

- Node.js 20 or newer
- Git

No dependency installation is required.

```bash
npm test
npm run self-check
```

## Change guidelines

- Write Skill instructions, source comments, tests, templates, metadata, and reference material in English.
- Keep `skills/agent-wiki-kit/SKILL.md` focused on essential procedure. Put conditional detail in `skills/agent-wiki-kit/references/`.
- Preserve existing project instructions outside the generated `AGENTS.md` boundaries byte-for-byte.
- Prefer read-only diagnostics before mutation and provide `--check` previews for material writes.
- Add or update tests for observable behavior, failure modes, path safety, and idempotence.
- Treat numeric budgets and architecture vocabularies as candidates unless evidence or an explicit project decision promotes them.
- Avoid mass documentation rewrites during adoption or repair.

## Pull requests

Include:

- what changed and why;
- user or agent impact;
- compatibility or migration notes;
- validation commands and results;
- any behavior that still requires human review.

By contributing, you agree that your contribution is licensed under the project's MIT License.

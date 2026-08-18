# Security Policy

## Supported versions

Security fixes are applied to the latest version on the default branch. This project has no long-term-support release line yet.

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose data, escape a selected project root, overwrite unrelated files, or execute untrusted content unexpectedly.

Use GitHub's private vulnerability reporting feature on this repository when it is available. Otherwise, open a minimal issue asking the maintainer for a private reporting channel and do not include vulnerability details. Include in the private report:

- the affected command and version or commit;
- a minimal reproduction;
- expected and actual behavior;
- impact and affected platforms;
- any suggested mitigation.

You should receive an acknowledgement within seven days. Please allow time for validation and a coordinated fix before public disclosure.

## Scope

Security-sensitive areas include path containment, symbolic-link handling, file writes, archive movement, parsing of repository-controlled Markdown and JSON, and preservation of content outside generated boundaries.

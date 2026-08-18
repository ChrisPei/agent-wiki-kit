#!/usr/bin/env node

import {
  adoptProject,
  archiveLog,
  auditProject,
  compileAgentContext,
  initProject,
  listTopics,
  markTopicStandalone,
  previewAdoption,
  reviewDirectorySummaries,
  startupProject,
} from "./wiki-kit-lib.mjs";

const HELP = `
Agent Wiki Kit

Usage:
  node scripts/wiki-kit.mjs doctor --root <project> [--json]
  node scripts/wiki-kit.mjs check --root <project> [--json]
  node scripts/wiki-kit.mjs startup --root <project> [--json]
  node scripts/wiki-kit.mjs init --root <project>
  node scripts/wiki-kit.mjs adopt --root <project> [--check] [--json]
  node scripts/wiki-kit.mjs build-agent-context --root <project> [--check]
  node scripts/wiki-kit.mjs list-topics --root <project> [--path <directory>] [--json]
  node scripts/wiki-kit.mjs review-directory --root <project> (--path <directory> | --all)
  node scripts/wiki-kit.mjs mark-standalone --root <project> --path <topic.md>
  node scripts/wiki-kit.mjs archive-log --root <project> [--check]

Commands:
  doctor       Read-only health report. Budget pressure is a warning.
  check        Strict validation. Budget pressure fails the command.
  startup      Show bounded recovery candidates and a dirty-worktree summary; the Agent decides what to read.
  init         Create the default scaffold and safely append Wiki usage to an existing AGENTS.md.
  adopt        Auto-detect an existing wiki and write only its config file; --check previews it.
  build-agent-context  Acknowledge considered directory changes and compile the naturally bounded AGENTS.md guide.
  list-topics   List fixed-header topic summaries without loading full documents.
  review-directory  Record that changed direct documents were semantically reviewed against directory summaries.
  mark-standalone  Explicitly mark an intentionally isolated topic in its metadata.
  archive-log  Move oldest structured recent entries into monthly archives.

Options:
  --root <path>  Project root. Defaults to the current directory.
  --json         Emit a machine-readable doctor/check report.
  --check        Preview adopt/archive-log work or detect stale compiled Agent context without writing.
  --path <path>  Limit a topic list or select a directory/topic for a maintenance command.
  --all          Select every compiled directory for review-directory.
  -h, --help     Show this help.
`.trim();

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help || !options.command) {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }

  try {
    switch (options.command) {
      case "doctor":
      case "check": {
        const strict = options.command === "check";
        const report = auditProject(options.root, { strict });
        if (options.json) {
          process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
        } else {
          printAudit(report, strict);
        }
        return report.ok ? 0 : 1;
      }
      case "init": {
        const result = initProject(options.root);
        process.stdout.write(`Initialized Agent Wiki at ${result.root}\n`);
        for (const path of result.created) process.stdout.write(`  + ${path}\n`);
        for (const path of result.updated) process.stdout.write(`  ~ ${path} (Wiki usage injected)\n`);
        for (const path of result.skipped) {
          process.stdout.write(
            `  = ${path} already exists and required no change\n`,
          );
        }
        return 0;
      }
      case "startup": {
        const result = startupProject(options.root);
        if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        else printStartup(result);
        return result.ready ? 0 : 1;
      }
      case "adopt": {
        if (options.checkOnly) {
          const result = previewAdoption(options.root);
          if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
          else process.stdout.write(`${JSON.stringify(result.config, null, 2)}\n`);
          return 0;
        }
        const result = adoptProject(options.root);
        process.stdout.write(
          `Wrote ${result.configPath}\nDetected layout: ${result.config.layout}\n`,
        );
        return 0;
      }
      case "archive-log": {
        const result = archiveLog(options.root, {
          checkOnly: options.checkOnly,
        });
        if (!result.needed) {
          process.stdout.write("Recent log is within its configured budget.\n");
          return 0;
        }
        if (options.checkOnly) {
          process.stdout.write(
            `Archive required: ${result.archived} entries would move; ${result.entriesAfter} would remain.\n`,
          );
          return 1;
        }
        process.stdout.write(
          `Archived ${result.archived} entries; ${result.entriesAfter} recent entries remain.\n`,
        );
        return 0;
      }
      case "build-agent-context": {
        const audit = auditProject(options.root, { strict: true });
        const blocking = audit.issues.filter(({ severity, code }) =>
          severity === "error" && code !== "agent-context-stale");
        if (blocking.length > 0) {
          process.stderr.write("Refusing to build Agent context while unrelated strict-check errors remain:\n");
          for (const issue of blocking) {
            process.stderr.write(`  - [${issue.code}] ${issue.path || "."}: ${issue.message}\n`);
          }
          return 1;
        }
        let reviewed = [];
        if (!options.checkOnly) {
          const preview = compileAgentContext(options.root, { checkOnly: true });
          const reviewPaths = [...new Set((preview.reviewChanges ?? [])
            .map(({ path }) => path))];
          for (const path of reviewPaths) {
            const review = reviewDirectorySummaries(options.root, { path });
            reviewed.push(...review.reviewed);
          }
        }
        const result = compileAgentContext(options.root, {
          checkOnly: options.checkOnly,
        });
        if (!result.enabled) {
          process.stdout.write("Agent context compilation is disabled.\n");
          return 0;
        }
        if (!result.needed) {
          process.stdout.write(
            `Agent context is current: ${result.directories} directories in ${result.target}.\n`,
          );
          if (reviewed.length > 0) {
            process.stdout.write(`Recorded semantic review for ${reviewed.length} compiled directories.\n`);
          }
          return 0;
        }
        if (options.checkOnly) {
          process.stdout.write(
            `Agent context is stale: ${result.directories} directories would be compiled into ${result.target}.\n`,
          );
          return 1;
        }
        process.stdout.write(
          `Compiled ${result.directories} directories into ${result.target}; only the managed L1 region changed.\n`,
        );
        if (reviewed.length > 0) {
          process.stdout.write(`Recorded semantic review for ${reviewed.length} compiled directories.\n`);
        }
        return 0;
      }
      case "list-topics": {
        const topics = listTopics(options.root, { path: options.path });
        if (options.json) process.stdout.write(`${JSON.stringify(topics, null, 2)}\n`);
        else {
          for (const topic of topics) {
            process.stdout.write(
              `${topic.path} | status=${topic.status || "unknown"} | confidence=${topic.confidence || "unknown"} | scope=${topic.scope || "unspecified"} | ${topic.lastUpdated || "unknown"} | ${topic.standalone ? "standalone" : "connected"}\n  ${topic.summary || "(missing summary)"}\n`,
            );
            if (topic.supersedes.length > 0) {
              process.stdout.write(`  supersedes: ${topic.supersedes.join(", ")}\n`);
            }
            if (topic.supersededBy.length > 0) {
              process.stdout.write(`  superseded_by: ${topic.supersededBy.join(", ")}\n`);
            }
          }
        }
        return 0;
      }
      case "review-directory": {
        const result = reviewDirectorySummaries(options.root, {
          path: options.path,
          all: options.all,
        });
        process.stdout.write(`Reviewed ${result.reviewed.length} directory summaries.\n`);
        for (const path of result.reviewed) process.stdout.write(`  + ${path}\n`);
        return 0;
      }
      case "mark-standalone": {
        if (!options.path) throw new Error("mark-standalone requires --path.");
        const result = markTopicStandalone(options.root, options.path);
        process.stdout.write(
          `${result.changed ? "Marked" : "Already marked"} standalone: ${result.path}\n`,
        );
        return 0;
      }
      default:
        process.stderr.write(`Unknown command: ${options.command}\n\n${HELP}\n`);
        return 2;
    }
  } catch (error) {
    process.stderr.write(`Agent Wiki Kit error: ${error.message}\n`);
    return 1;
  }
}

function parseArguments(argv) {
  const options = {
    command: "",
    root: process.cwd(),
    json: false,
    checkOnly: false,
    path: "",
    all: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "-h" || token === "--help") {
      options.help = true;
    } else if (token === "--json") {
      options.json = true;
    } else if (token === "--check") {
      options.checkOnly = true;
    } else if (token === "--all") {
      options.all = true;
    } else if (token === "--path") {
      const value = argv[index + 1];
      if (!value) throw new Error("--path requires a value.");
      options.path = value;
      index += 1;
    } else if (token === "--root") {
      const value = argv[index + 1];
      if (!value) throw new Error("--root requires a path.");
      options.root = value;
      index += 1;
    } else if (token.startsWith("--")) {
      throw new Error(`Unknown option: ${token}`);
    } else if (!options.command) {
      options.command = token;
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  return options;
}

function printAudit(report, strict) {
  process.stdout.write(
    `${strict ? "Strict check" : "Wiki doctor"}: ${report.root}\n`,
  );
  process.stdout.write(`Configuration: ${report.configSource}\n`);
  for (const [name, stat] of Object.entries(report.stats)) {
    if (!stat || typeof stat !== "object" || !("path" in stat)) continue;
    const entryText =
      typeof stat.entries === "number" ? `, ${stat.entries} entries` : "";
    process.stdout.write(
      `  ${name}: ${stat.path} (${stat.lines} lines, ${stat.bytes} bytes${entryText})\n`,
    );
  }
  process.stdout.write(`  topic pages: ${report.stats.topicPages ?? 0}\n`);

  if (report.issues.length === 0) {
    process.stdout.write("No issues found.\n");
    return;
  }
  process.stdout.write(
    `Issues: ${report.counts.errors} errors, ${report.counts.warnings} warnings, ${report.counts.info} info\n`,
  );
  for (const issue of report.issues) {
    const location = issue.line
      ? `${issue.path}:${issue.line}`
      : issue.path || "(project)";
    process.stdout.write(
      `  [${issue.severity.toUpperCase()}] ${issue.code} ${location}\n`,
    );
    process.stdout.write(`    ${issue.message}\n`);
    if (issue.suggestion) process.stdout.write(`    -> ${issue.suggestion}\n`);
  }
}

function printStartup(result) {
  process.stdout.write(`Agent Wiki startup: ${result.root}\n`);
  process.stdout.write(`Configuration: ${result.configSource}\n`);
  if (!result.detected) {
    process.stdout.write(`${result.nextAction}\n`);
    return;
  }
  process.stdout.write("Recovery candidates (choose according to the task, context, risk, and uncertainty):\n");
  for (const entry of result.readOrder) {
    const detail = entry.present
      ? `${entry.lines} lines, ${entry.bytes} bytes${entry.lastUpdated ? `, updated ${entry.lastUpdated}` : ""}`
      : "missing";
    process.stdout.write(`  ${entry.present ? "+" : "!"} ${entry.path} — ${entry.role} (${detail})\n`);
  }
  const worktree = result.worktree;
  process.stdout.write(worktree.repository
    ? `Worktree: ${worktree.dirty ? `dirty (${worktree.tracked} tracked, ${worktree.untracked} untracked)` : "clean"}\n`
    : "Worktree: not a Git repository\n");
  if (result.routingMissing?.length > 0) {
    process.stdout.write(`Root AGENTS.md does not route: ${result.routingMissing.join(", ")}\n`);
  }
  process.stdout.write(`${result.nextAction}\n`);
}

const exitCode = await main();
process.exitCode = exitCode;

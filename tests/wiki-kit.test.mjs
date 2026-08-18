import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  adoptProject,
  archiveLog,
  auditProject,
  compileAgentContext,
  CONTEXT_START,
  initProject,
  listTopics,
  markTopicStandalone,
  parseLog,
  previewAdoption,
  reviewDirectorySummaries,
  startupProject,
} from "../skills/agent-wiki-kit/scripts/wiki-kit-lib.mjs";

const CLI_PATH = fileURLToPath(
  new URL("../skills/agent-wiki-kit/scripts/wiki-kit.mjs", import.meta.url),
);

function withTemporaryProject(run) {
  const root = mkdtempSync(join(tmpdir(), "agent-wiki-kit-"));
  try {
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function write(path, contents) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, contents, "utf8");
}

function buildEntries(count) {
  return Array.from({ length: count }, (_, index) => {
    const day = String(12 + Math.floor(index / 2)).padStart(2, "0");
    return [
      `## [2026-07-${day}] validation | entry ${index + 1}`,
      "",
      `Evidence for entry ${index + 1}.`,
    ].join("\n");
  }).join("\n\n");
}

test("init creates a valid scaffold and refuses to overwrite it", () =>
  withTemporaryProject((root) => {
    const result = initProject(root);
    assert.ok(result.created.includes("agent-wiki.config.json"));
    assert.ok(result.created.includes("llm-wiki/sources.md"));
    assert.ok(result.created.includes("llm-wiki/plans/README.md"));
    assert.ok(!result.created.includes("llm-wiki/raw/SOURCES.md"));
    assert.equal(auditProject(root, { strict: true }).ok, true);
    assert.equal(startupProject(root).ready, true);
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
    assert.match(agents, /## L0 — Project Mind and Wiki Growth Contract/);
    assert.match(agents, /## Agent Wiki Usage/);
    assert.match(agents, /run `check --root \.`/);
    assert.match(agents, /## Agent Wiki Directory Guide/);
    assert.ok(agents.indexOf("## Agent Wiki Directory Guide") > agents.indexOf("## Agent Wiki Usage"));
    assert.doesNotMatch(agents, /<!-- agent-wiki:l1:/);
    assert.match(agents, /`llm-wiki\/wiki\/` — \*\*Maintained Knowledge\*\*/);
    assert.throws(() => initProject(root), /already exists/);
  }));

test("directory metadata compiles only the naturally bounded AGENTS region", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const agentsPath = join(root, "AGENTS.md");
    const original = readFileSync(agentsPath, "utf8");
    const headingIndex = original.indexOf("## Agent Wiki Directory Guide");
    const protectedPrefix = `${original.slice(0, headingIndex)}Project-specific text must survive.\n\n`;
    const protectedSuffix = "\n## Later project rules\n\nThese rules must also survive.\n";
    writeFileSync(
      agentsPath,
      `${protectedPrefix}${original.slice(headingIndex)}${protectedSuffix}`,
      "utf8",
    );

    const metadataPath = join(root, "llm-wiki", "wiki", ".wiki-meta.json");
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    metadata.summary = "A changed directory summary that must be compiled.";
    writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

    const preview = compileAgentContext(root, { checkOnly: true });
    assert.equal(preview.needed, true);
    assert.equal(readFileSync(agentsPath, "utf8").startsWith(protectedPrefix), true);
    const built = compileAgentContext(root);
    assert.equal(built.changed, true);
    const next = readFileSync(agentsPath, "utf8");
    assert.equal(next.startsWith(protectedPrefix), true);
    assert.equal(next.endsWith(protectedSuffix), true);
    assert.match(next, /A changed directory summary that must be compiled/);
    assert.doesNotMatch(next, /<!-- agent-wiki:l1:/);
    assert.equal(compileAgentContext(root, { checkOnly: true }).needed, false);
  }));

test("compiler migrates the legacy comment markers to the natural bounded section", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const agentsPath = join(root, "AGENTS.md");
    const original = readFileSync(agentsPath, "utf8");
    const headingIndex = original.indexOf("## Agent Wiki Directory Guide");
    writeFileSync(
      agentsPath,
      `${original.slice(0, headingIndex)}${CONTEXT_START}\nlegacy generated content\n<!-- agent-wiki:l1:end -->\n\n## Rules after legacy block\n\nKeep me.\n`,
      "utf8",
    );

    const result = compileAgentContext(root);
    const migrated = readFileSync(agentsPath, "utf8");
    assert.equal(result.changed, true);
    assert.match(migrated, /## Agent Wiki Directory Guide/);
    assert.doesNotMatch(migrated, /<!-- agent-wiki:l1:/);
    assert.doesNotMatch(migrated, /legacy generated content/);
    assert.match(migrated, /## Rules after legacy block\n\nKeep me\./);
  }));

test("check reminds once when a directory document changed until semantic review is recorded", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const topicPath = join(root, "llm-wiki", "wiki", "project-overview.md");
    writeFileSync(topicPath, `${readFileSync(topicPath, "utf8")}\nNew durable conclusion.\n`, "utf8");
    const before = auditProject(root, { strict: true });
    const diagnostic = before.issues.find(({ code, path }) =>
      code === "directory-summary-review-required" && path === "llm-wiki/wiki");
    assert.ok(diagnostic);
    assert.match(diagnostic.message, /Current directory summary:/);
    assert.match(diagnostic.message, /project-overview\.md.*:/);
    assert.match(diagnostic.message, /status=draft, scope=repository, confidence=low/);

    reviewDirectorySummaries(root, { path: "llm-wiki/wiki" });
    const after = auditProject(root, { strict: true });
    assert.ok(!after.issues.some(({ code }) => code === "directory-summary-review-required"));
    assert.equal(listTopics(root)[0].summary.startsWith("Describes the project's"), true);
  }));

test("an isolated topic warns until explicitly marked standalone", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const isolatedPath = join(root, "llm-wiki", "wiki", "isolated.md");
    write(isolatedPath, [
      "# Isolated",
      "",
      "status: reviewed",
      "owner: team",
      "last_updated: 2026-08-15",
      "confidence: high",
      "summary: Intentionally isolated test topic.",
      "source_refs:",
      "related_pages:",
      "standalone: false",
      "",
      "## Summary",
      "",
      "No relations.",
    ].join("\n"));
    const before = auditProject(root, { strict: true });
    assert.ok(before.issues.some(({ code, path }) =>
      code === "topic-isolated" && path === "llm-wiki/wiki/isolated.md"));
    markTopicStandalone(root, "llm-wiki/wiki/isolated.md");
    const after = auditProject(root, { strict: true });
    assert.ok(!after.issues.some(({ code, path }) =>
      ["topic-isolated", "topic-not-routed"].includes(code)
      && path === "llm-wiki/wiki/isolated.md"));
  }));

test("doctor detects broken links and strict hot-document budget failures", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const indexPath = join(root, "llm-wiki", "index.md");
    writeFileSync(
      indexPath,
      `${readFileSync(indexPath, "utf8")}\n[Missing](wiki/not-there.md)\n`,
      "utf8",
    );
    const currentPath = join(root, "llm-wiki", "work", "current-state.md");
    writeFileSync(
      currentPath,
      `${readFileSync(currentPath, "utf8")}\n${"extra\n".repeat(140)}`,
      "utf8",
    );
    const report = auditProject(root, { strict: true });
    assert.equal(report.ok, false);
    assert.ok(report.issues.some(({ code }) => code === "broken-local-link"));
    assert.ok(report.issues.some(({ code }) => code === "current-state-too-large"));
  }));

test("log parser rejects date-like headings outside the contract", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const logPath = join(root, "llm-wiki", "work", "log.md");
    writeFileSync(
      logPath,
      "# Recent Agent Work Log\n\n## 2026-07-25 repair | invalid\n",
      "utf8",
    );
    const report = auditProject(root, { strict: true });
    assert.ok(report.issues.some(({ code }) => code === "malformed-log-heading"));
    assert.throws(
      () => archiveLog(root),
      /Refusing to archive a log with malformed/,
    );
  }));

test("archive-log moves complete oldest entries and is idempotent", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const logPath = join(root, "llm-wiki", "work", "log.md");
    writeFileSync(
      logPath,
      `# Recent Agent Work Log\n\n${buildEntries(14)}\n`,
      "utf8",
    );

    const preview = archiveLog(root, { checkOnly: true });
    assert.equal(preview.needed, true);
    assert.equal(preview.archived, 4);
    assert.equal(preview.entriesAfter, 10);

    const result = archiveLog(root);
    assert.equal(result.changed, true);
    assert.equal(parseLog(readFileSync(logPath, "utf8")).entries.length, 10);

    const archivePath = join(
      root,
      "llm-wiki",
      "work",
      "log-archive",
      "2026-07.md",
    );
    assert.equal(parseLog(readFileSync(archivePath, "utf8")).entries.length, 4);
    assert.match(readFileSync(logPath, "utf8"), /entry 14/);
    assert.doesNotMatch(readFileSync(logPath, "utf8"), /entry 1\b/);
    assert.match(readFileSync(archivePath, "utf8"), /entry 1\b/);
    const mainBefore = readFileSync(logPath, "utf8");
    const archiveBefore = readFileSync(archivePath, "utf8");

    const second = archiveLog(root);
    assert.equal(second.needed, false);
    assert.equal(readFileSync(logPath, "utf8"), mainBefore);
    assert.equal(readFileSync(archivePath, "utf8"), archiveBefore);
  }));

test("adopt writes only configuration for an existing docs/wiki layout", () =>
  withTemporaryProject((root) => {
    write(join(root, "AGENTS.md"), "# Existing instructions\n");
    write(join(root, "docs", "wiki", "AGENTS.md"), "# Wiki instructions\n");
    write(join(root, "docs", "wiki", "index.md"), "# Index\n");
    write(
      join(root, "docs", "wiki", "current-state.md"),
      "# Current State\n\nlast_updated: 2026-07-25\n",
    );
    write(join(root, "docs", "wiki", "log.md"), "# Recent Log\n");

    const before = readFileSync(join(root, "docs", "wiki", "index.md"), "utf8");
    const preview = previewAdoption(root);
    assert.equal(preview.config.currentState, "docs/wiki/current-state.md");
    assert.equal(preview.config.logOrder, "oldest-first");
    assert.equal(preview.config.rawRoots.length, 0);
    assert.equal(preview.config.contextCompiler.enabled, false);
    assert.deepEqual(preview.config.contextCompiler.roots, ["docs/wiki"]);
    assert.equal(readFileSync(join(root, "docs", "wiki", "index.md"), "utf8"), before);
    const result = adoptProject(root);
    assert.equal(result.config.layout, "docs-wiki");
    assert.deepEqual(result.config.contextCompiler.roots, ["docs/wiki"]);
    assert.equal(
      readFileSync(join(root, "docs", "wiki", "index.md"), "utf8"),
      before,
    );
    assert.match(
      readFileSync(join(root, "agent-wiki.config.json"), "utf8"),
      /"docs-wiki"/,
    );
  }));

test("auto-detection is provisional and never treats a product overview as current state", () =>
  withTemporaryProject((root) => {
    write(join(root, "AGENTS.md"), "# Existing instructions\n");
    write(join(root, "docs", "wiki", "AGENTS.md"), "# Wiki instructions\n");
    write(join(root, "docs", "wiki", "index.md"), "# Index\n");
    write(join(root, "docs", "wiki", "overview.md"), "# Product Overview\n");
    write(join(root, "docs", "raw", "source.md"), "immutable\n");
    const doctor = auditProject(root);
    assert.equal(doctor.config.currentState, "docs/wiki/current-state.md");
    assert.deepEqual(doctor.config.rawRoots, ["docs/raw"]);
    assert.ok(doctor.issues.some(({ code }) => code === "required-file-missing"));
    assert.ok(doctor.issues.some(({ code }) => code === "configuration-not-adopted"));
    assert.equal(auditProject(root, { strict: true }).ok, false);
  }));

test("doctor reports an undetected wiki without inventing default-file noise", () =>
  withTemporaryProject((root) => {
    write(join(root, "AGENTS.md"), "# Existing project\n");
    const report = auditProject(root);
    assert.equal(report.ok, false);
    assert.deepEqual(report.issues.map(({ code }) => code), ["wiki-not-detected"]);
  }));

test("archive refuses mixed chronology and an entry that cannot fit the budget", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const logPath = join(root, "llm-wiki", "work", "log.md");
    writeFileSync(logPath, [
      "# Recent Agent Work Log",
      "",
      "## [2026-07-20] validation | first",
      "",
      "one",
      "",
      "## [2026-07-19] validation | second",
      "",
      "two",
      "",
      "## [2026-07-21] validation | third",
      "",
      "three",
    ].join("\n"), "utf8");
    assert.ok(auditProject(root).issues.some(({ code }) => code === "log-order-invalid"));
    assert.throws(() => archiveLog(root), /not oldest-first/);

    const huge = `${"evidence\n".repeat(190)}`;
    writeFileSync(logPath, `# Recent Agent Work Log\n\n## [2026-07-20] validation | earlier\n\nok\n\n## [2026-07-21] validation | huge latest\n\n${huge}\n`, "utf8");
    assert.throws(() => archiveLog(root), /one complete recent entry/);
  }));

test("configuration paths cannot escape the project", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const configPath = join(root, "agent-wiki.config.json");
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    config.wikiRoot = "../outside";
    writeFileSync(configPath, JSON.stringify(config), "utf8");
    assert.throws(() => auditProject(root), /inside the project root/);
  }));

test("broken archive links are visible but do not block the current route", () =>
  withTemporaryProject((root) => {
    initProject(root);
    write(join(root, "llm-wiki", "archive", "old.md"), "[Gone](missing.md)\n[Gone again](missing.md)\n");
    const report = auditProject(root, { strict: true });
    const issue = report.issues.find(({ code }) => code === "broken-historical-link");
    assert.equal(issue?.severity, "warning");
    assert.match(issue?.message ?? "", /2 occurrences/);
    assert.equal(report.ok, true);
  }));

test("init preserves existing root instructions and injects a discoverable Wiki route", () =>
  withTemporaryProject((root) => {
    write(join(root, "AGENTS.md"), "# Existing instructions\n");
    const initialized = initProject(root);
    assert.deepEqual(initialized.updated, ["AGENTS.md"]);
    assert.deepEqual(initialized.skipped, []);
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
    assert.match(agents, /^# Existing instructions/m);
    assert.match(agents, /## Agent Wiki Usage/);
    assert.match(agents, /llm-wiki\/work\/current-state\.md/);
    assert.match(agents, /## Agent Wiki Directory Guide/);
    const startup = startupProject(root);
    assert.equal(startup.ready, true);
    assert.deepEqual(startup.routingMissing, []);
  }));

test("source references and reciprocal supersession stay inspectable without becoming hard gates", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const currentPath = join(root, "llm-wiki", "wiki", "current-model.md");
    const legacyPath = join(root, "llm-wiki", "wiki", "legacy-model.md");
    write(currentPath, [
      "# Current Model",
      "",
      "status: stable",
      "owner: team",
      "last_updated: 2026-08-15",
      "confidence: high",
      "scope: shared runtime",
      "summary: Current authority for the shared runtime model.",
      "source_refs:",
      "  - ../raw/missing-evidence.md",
      "related_pages:",
      "  - legacy-model.md",
      "supersedes:",
      "  - legacy-model.md",
      "standalone: false",
      "",
      "## Summary",
      "",
      "Current conclusion.",
    ].join("\n"));
    write(legacyPath, [
      "# Legacy Model",
      "",
      "status: superseded",
      "owner: team",
      "last_updated: 2026-08-15",
      "confidence: high",
      "scope: shared runtime",
      "summary: Historical model retained for its still-useful implementation evidence.",
      "source_refs:",
      "related_pages:",
      "  - current-model.md",
      "superseded_by:",
      "  - current-model.md",
      "standalone: false",
      "",
      "## Summary",
      "",
      "Historical conclusion.",
    ].join("\n"));

    const first = auditProject(root);
    assert.ok(first.issues.some(({ code, path }) =>
      code === "broken-source-reference" && path === "llm-wiki/wiki/current-model.md"));
    assert.ok(!first.issues.some(({ code }) =>
      [
        "historical-topic-replacement-unspecified",
        "supersession-backlink-missing",
        "supersession-forward-link-missing",
      ].includes(code)));
    const listed = listTopics(root).find(({ path }) =>
      path === "llm-wiki/wiki/current-model.md");
    assert.equal(listed.scope, "shared runtime");
    assert.deepEqual(listed.supersedes, ["legacy-model.md"]);

    writeFileSync(
      legacyPath,
      readFileSync(legacyPath, "utf8").replace(
        "superseded_by:\n  - current-model.md\n",
        "",
      ),
      "utf8",
    );
    const second = auditProject(root);
    assert.ok(second.issues.some(({ code, path }) =>
      code === "historical-topic-replacement-unspecified"
      && path === "llm-wiki/wiki/legacy-model.md"));
    assert.ok(second.issues.some(({ code, path }) =>
      code === "supersession-backlink-missing"
      && path === "llm-wiki/wiki/legacy-model.md"));
  }));

test("build-agent-context refuses unrelated strict errors before acknowledging directory review", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const topicPath = join(root, "llm-wiki", "wiki", "project-overview.md");
    writeFileSync(
      topicPath,
      `${readFileSync(topicPath, "utf8")}\n[Broken current link](missing.md)\n`,
      "utf8",
    );
    const agentsPath = join(root, "AGENTS.md");
    const before = readFileSync(agentsPath, "utf8");
    const result = spawnSync(
      process.execPath,
      [CLI_PATH, "build-agent-context", "--root", root],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /broken-local-link/);
    assert.equal(readFileSync(agentsPath, "utf8"), before);
    assert.ok(auditProject(root).issues.some(({ code }) =>
      code === "directory-summary-review-required"));
  }));

test("build-agent-context accepts its own stale generated region and refreshes it", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const metadataPath = join(root, "llm-wiki", "wiki", ".wiki-meta.json");
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    metadata.summary = "Updated maintained knowledge summary.";
    writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

    const result = spawnSync(
      process.execPath,
      [CLI_PATH, "build-agent-context", "--root", root],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Compiled 6 directories/);
    assert.match(readFileSync(join(root, "AGENTS.md"), "utf8"),
      /Updated maintained knowledge summary/);
    assert.ok(!auditProject(root, { strict: true }).issues.some(({ code }) =>
      code === "agent-context-stale"));
  }));

test("startup exposes configured recovery candidates in stable order", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const compassPath = "llm-wiki/wiki/product-compass.md";
    write(join(root, compassPath), "# Product Compass\n");

    const configPath = join(root, "agent-wiki.config.json");
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    config.recoveryCandidates = [
      "AGENTS.md",
      config.agentGuide,
      config.index,
      compassPath,
      config.currentState,
      `${config.plansRoot}/README.md`,
    ];
    writeFileSync(configPath, JSON.stringify(config), "utf8");

    const agentsPath = join(root, "AGENTS.md");
    writeFileSync(
      agentsPath,
      `${readFileSync(agentsPath, "utf8")}\nRead ${compassPath}.\n`,
      "utf8",
    );

    const startup = startupProject(root);
    assert.equal(startup.ready, true);
    assert.deepEqual(
      startup.readOrder.map(({ path }) => path),
      config.recoveryCandidates,
    );
    assert.equal(startup.readOrder[3].role, "configured recovery candidate");
  }));

test("startup accepts the former requiredStartupFiles field as a compatibility alias", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const configPath = join(root, "agent-wiki.config.json");
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    const legacyCandidates = ["AGENTS.md", config.currentState];
    delete config.recoveryCandidates;
    config.requiredStartupFiles = legacyCandidates;
    writeFileSync(configPath, JSON.stringify(config), "utf8");

    const startup = startupProject(root);
    assert.equal(startup.ready, true);
    assert.deepEqual(startup.readOrder.map(({ path }) => path), legacyCandidates);
  }));

test("archive supports an explicitly configured newest-first log", () =>
  withTemporaryProject((root) => {
    initProject(root);
    const configPath = join(root, "agent-wiki.config.json");
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    config.logOrder = "newest-first";
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    const entries = Array.from({ length: 14 }, (_, index) => [
      `## [2026-07-${String(25 - Math.floor(index / 2)).padStart(2, "0")}] validation | newest entry ${index + 1}`,
      "",
      `Evidence ${index + 1}.`,
    ].join("\n")).join("\n\n");
    const logPath = join(root, "llm-wiki", "work", "log.md");
    writeFileSync(logPath, `# Recent Agent Work Log\n\n${entries}\n`, "utf8");
    archiveLog(root);
    const remaining = readFileSync(logPath, "utf8");
    assert.match(remaining, /newest entry 1\b/);
    assert.doesNotMatch(remaining, /newest entry 14\b/);
  }));

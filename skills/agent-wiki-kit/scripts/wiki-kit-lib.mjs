import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(SCRIPT_DIR, "..");
const TEMPLATE_ROOT = join(SKILL_ROOT, "assets", "templates");
const AGENT_WIKI_USAGE_TEMPLATE = join(SKILL_ROOT, "assets", "agent-wiki-usage.md");
const CONFIG_FILE = "agent-wiki.config.json";

export const DEFAULT_CONFIG = Object.freeze({
  version: 1,
  layout: "llm-wiki",
  wikiRoot: "llm-wiki",
  agentGuide: "llm-wiki/agent.md",
  index: "llm-wiki/index.md",
  currentState: "llm-wiki/work/current-state.md",
  log: "llm-wiki/work/log.md",
  archiveDir: "llm-wiki/work/log-archive",
  plansRoot: "llm-wiki/plans",
  topicRoots: ["llm-wiki/wiki"],
  rawRoots: ["llm-wiki/raw"],
  recoveryCandidates: [
    "AGENTS.md",
    "llm-wiki/work/current-state.md",
    "llm-wiki/plans/README.md",
  ],
  contextCompiler: {
    enabled: true,
    target: "AGENTS.md",
    roots: ["llm-wiki"],
    metadataFile: ".wiki-meta.json",
    heading: "## Agent Wiki Directory Guide",
    notice: "> This section is compiled from directory metadata. Update `.wiki-meta.json` and rebuild it instead of editing the directory list here.",
  },
  budgets: {
    indexMaxLines: 160,
    currentStateMaxLines: 120,
    recentLogMaxLines: 180,
    recentLogTargetEntries: 10,
    recentLogMaxEntries: 12,
    topicPageMaxLines: 320,
  },
  metadata: {
    requiredTopicFields: [
      "status",
      "owner",
      "last_updated",
      "confidence",
      "summary",
      "source_refs",
      "related_pages",
      "standalone",
    ],
    staleAfterDays: 120,
    currentStateStaleAfterDays: 30,
  },
  logOrder: "oldest-first",
});

const ENTRY_PATTERN =
  /^## \[(\d{4}-\d{2}-\d{2})\]\s+([^|]+?)\s+\|\s+(.+?)\s*$/;
const MANAGED_START = "<!-- wiki-kit:months:start -->";
const MANAGED_END = "<!-- wiki-kit:months:end -->";
export const CONTEXT_START = "<!-- agent-wiki:l1:start -->";
export const CONTEXT_END = "<!-- agent-wiki:l1:end -->";

export function normalizeRelativePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

export function todayString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function countLines(text) {
  if (text.length === 0) return 0;
  const normalized = normalizeNewlines(text);
  const lines = normalized.split("\n");
  return normalized.endsWith("\n") ? lines.length - 1 : lines.length;
}

export function detectConfig(projectRoot) {
  const root = resolve(projectRoot);
  const candidates = [
    {
      layout: "llm-wiki",
      marker: "llm-wiki/index.md",
      wikiRoot: "llm-wiki",
      agentGuide: "llm-wiki/agent.md",
      index: "llm-wiki/index.md",
      currentState: "llm-wiki/work/current-state.md",
      log: "llm-wiki/work/log.md",
      archiveDir: "llm-wiki/work/log-archive",
      topicRoots: ["llm-wiki/wiki"],
      rawRoots: ["llm-wiki/raw"],
    },
    {
      layout: "docs-wiki",
      marker: "docs/wiki/index.md",
      wikiRoot: "docs/wiki",
      agentGuide: "docs/wiki/AGENTS.md",
      index: "docs/wiki/index.md",
      currentState: firstExistingOrDefault(root, [
        "docs/wiki/current-state.md",
        "docs/wiki/work/current-state.md",
        "docs/wiki/status.md",
      ]),
      log: firstExisting(root, ["docs/wiki/log.md", "docs/wiki/work/log.md"]),
      archiveDir: "docs/wiki/archive/log",
      topicRoots: existingDirectories(root, [
        "docs/wiki/concepts",
        "docs/wiki/specs",
      ]),
      rawRoots: existingDirectories(root, ["docs/raw", "docs/wiki/raw"]),
    },
    {
      layout: "plans-wiki",
      marker: "plans/wiki/index.md",
      wikiRoot: "plans/wiki",
      agentGuide: firstExisting(root, [
        "plans/wiki/context-maintenance.md",
        "AGENTS.md",
      ]),
      index: "plans/wiki/index.md",
      currentState: firstExistingOrDefault(root, [
        "plans/wiki/current-state.md",
        "plans/wiki/status.md",
      ]),
      log: "plans/wiki/log.md",
      archiveDir: "plans/wiki/archive",
      topicRoots: [],
      rawRoots: existingDirectories(root, ["plans/wiki/raw"]),
    },
    {
      layout: "wiki",
      marker: "wiki/index.md",
      wikiRoot: "wiki",
      agentGuide: firstExisting(root, ["wiki/AGENTS.md", "AGENTS.md"]),
      index: "wiki/index.md",
      currentState: firstExistingOrDefault(root, [
        "wiki/current-state.md",
        "wiki/status.md",
      ]),
      log: firstExisting(root, ["wiki/log.md", "wiki/work/log.md"]),
      archiveDir: "wiki/archive",
      topicRoots: existingDirectories(root, [
        "wiki/product",
        "wiki/architecture",
        "wiki/specs",
      ]),
      rawRoots: existingDirectories(root, ["wiki/raw"]),
    },
    {
      layout: "legacy-wiki",
      marker: "wiki/README.md",
      wikiRoot: "wiki",
      agentGuide: firstExisting(root, ["wiki/ops/AGENTS.md", "AGENTS.md"]),
      index: "wiki/README.md",
      currentState: firstExistingOrDefault(root, [
        "wiki/ops/status.md",
        "wiki/current-state.md",
        "wiki/status.md",
      ]),
      log: existingFileOrEmpty(root, ["wiki/ops/log.md", "wiki/log.md"]),
      archiveDir: "wiki/ops/archive",
      topicRoots: [],
      rawRoots: existingDirectories(root, ["wiki/raw"]),
    },
  ];

  const match = candidates.find(({ marker }) => exists(root, marker));
  if (!match) {
    return {
      found: false,
      config: cloneDefaultConfig(),
    };
  }

  const plansRoot = firstExisting(root, ["llm-wiki/plans", "plans"]);
  const required = unique(
    [
      exists(root, "AGENTS.md") ? "AGENTS.md" : "",
      match.agentGuide,
      match.index,
      match.currentState,
      plansRoot ? `${plansRoot}/README.md` : "",
    ].filter(Boolean),
  );

  const { marker: _marker, ...matchConfig } = match;
  const topicRoots = match.topicRoots;
  const logOrder = inferConfiguredLogOrder(root, match.log);
  const requiredTopicFields = inferRequiredTopicFields(root, topicRoots);
  return {
    found: true,
    config: mergeConfig({
      ...matchConfig,
      topicRoots,
      plansRoot,
      recoveryCandidates: required,
      contextCompiler: {
        enabled: false,
        roots: [match.wikiRoot],
      },
      metadata: { requiredTopicFields },
      logOrder,
    }),
  };
}

export function loadConfig(projectRoot) {
  const root = resolve(projectRoot);
  const configPath = join(root, CONFIG_FILE);
  if (!existsSync(configPath)) {
    return detectConfig(root);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot parse ${configPath}: ${error.message}`);
  }
  return {
    found: true,
    fromFile: true,
    config: mergeConfig(parsed),
  };
}

export function initProject(projectRoot) {
  const root = resolve(projectRoot);
  mkdirSync(root, { recursive: true });

  const configPath = join(root, CONFIG_FILE);
  if (existsSync(configPath)) {
    throw new Error(`${CONFIG_FILE} already exists; use doctor instead of init.`);
  }

  const templateFiles = walkFiles(TEMPLATE_ROOT);
  const conflicts = [];
  for (const source of templateFiles) {
    const relativePath = normalizeRelativePath(relative(TEMPLATE_ROOT, source));
    if (relativePath === "AGENTS.md") continue;
    const target = join(root, relativePath);
    if (existsSync(target)) conflicts.push(relativePath);
  }
  if (conflicts.length > 0) {
    throw new Error(
      `init refuses to overwrite existing files:\n- ${conflicts.join("\n- ")}`,
    );
  }

  const created = [];
  const updated = [];
  const skipped = [];
  const replacementDate = todayString();
  for (const source of templateFiles) {
    const relativePath = normalizeRelativePath(relative(TEMPLATE_ROOT, source));
    const target = join(root, relativePath);
    if (relativePath === "AGENTS.md" && existsSync(target)) {
      skipped.push(relativePath);
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    const contents = readFileSync(source, "utf8").replaceAll(
      "YYYY-MM-DD",
      replacementDate,
    );
    atomicWrite(target, contents);
    created.push(relativePath);
  }

  atomicWrite(configPath, `${JSON.stringify(cloneDefaultConfig(), null, 2)}\n`);
  created.push(CONFIG_FILE);
  const agentPath = join(root, DEFAULT_CONFIG.contextCompiler.target);
  const originalAgent = readFileSync(agentPath, "utf8");
  const usageGuide = readFileSync(AGENT_WIKI_USAGE_TEMPLATE, "utf8").trim();
  const agentWithUsage = injectAgentWikiUsage(
    originalAgent,
    usageGuide,
    DEFAULT_CONFIG.contextCompiler.heading,
  );
  if (agentWithUsage !== originalAgent) {
    atomicWrite(agentPath, agentWithUsage);
    if (!created.includes("AGENTS.md")) {
      updated.push("AGENTS.md");
      const skippedIndex = skipped.indexOf("AGENTS.md");
      if (skippedIndex !== -1) skipped.splice(skippedIndex, 1);
    }
  }
  reviewDirectorySummaries(root, { all: true });
  compileAgentContext(root);
  return { root, created, updated, skipped };
}

export function adoptProject(projectRoot) {
  const root = resolve(projectRoot);
  const configPath = join(root, CONFIG_FILE);
  if (existsSync(configPath)) {
    throw new Error(`${CONFIG_FILE} already exists.`);
  }
  const detected = detectConfig(root);
  if (!detected.found) {
    throw new Error(
      "No supported wiki layout was detected. Bootstrap with init or create the config manually.",
    );
  }
  atomicWrite(configPath, `${JSON.stringify(detected.config, null, 2)}\n`);
  return { root, configPath, config: detected.config };
}

export function previewAdoption(projectRoot) {
  const root = resolve(projectRoot);
  if (existsSync(join(root, CONFIG_FILE))) {
    throw new Error(`${CONFIG_FILE} already exists.`);
  }
  const detected = detectConfig(root);
  if (!detected.found) {
    throw new Error(
      "No supported wiki layout was detected. Bootstrap with init or create the config manually.",
    );
  }
  return { root, config: detected.config };
}

export function startupProject(projectRoot) {
  const root = resolve(projectRoot);
  const loaded = loadConfig(root);
  if (!loaded.found) {
    return {
      root,
      detected: false,
      configSource: "default-not-detected",
      contractPinned: false,
      ready: false,
      readOrder: [],
      worktree: gitWorktreeSummary(root),
      nextAction: "Identify the current documentation authority or bootstrap with init.",
    };
  }
  const config = loaded.config;
  const knownRoles = new Map([
    ["AGENTS.md", "project instructions"],
    [config.agentGuide, "wiki protocol"],
    [config.index, "wiki index"],
    [config.currentState, "current recovery state"],
    [config.plansRoot ? `${config.plansRoot}/README.md` : "", "plan knowledge"],
  ]);
  const configuredRoute = config.recoveryCandidates.length > 0
    ? config.recoveryCandidates
    : [...knownRoles.keys()];
  const rolePaths = configuredRoute.map((relativePath) => [
    knownRoles.get(relativePath) ?? "configured recovery candidate",
    relativePath,
  ]);
  const readOrder = [];
  for (const [role, relativePath] of rolePaths) {
    if (!relativePath || readOrder.some((entry) => entry.path === relativePath)) continue;
    const present = exists(root, relativePath);
    const text = present ? readText(root, relativePath) : "";
    readOrder.push({
      role,
      path: relativePath,
      present,
      ...(present
        ? {
            lines: countLines(text),
            bytes: Buffer.byteLength(text),
            lastUpdated: parseMetadata(text).get("last_updated") || undefined,
          }
        : {}),
    });
  }
  const missing = readOrder.filter(({ present }) => !present).map(({ path }) => path);
  const projectInstructions = exists(root, "AGENTS.md") ? readText(root, "AGENTS.md") : "";
  const routingMissing = readOrder
    .filter(({ path, role, present }) => present && role !== "project instructions" && !projectInstructions.includes(path))
    .map(({ path }) => path);
  return {
    root,
    detected: true,
    configSource: loaded.fromFile ? CONFIG_FILE : "auto-detected",
    contractPinned: Boolean(loaded.fromFile),
    ready: missing.length === 0 && routingMissing.length === 0,
    readOrder,
    missing,
    routingMissing,
    worktree: gitWorktreeSummary(root),
    nextAction: missing.length > 0
      ? "Repair or reconfigure the missing recovery candidates before relying on this memory map."
      : routingMissing.length > 0
        ? "Mention the missing recovery candidates in root AGENTS.md so a fresh agent can discover them."
        : loaded.fromFile
          ? "Use these recovery candidates and the directory guide to choose the evidence this task needs."
          : "Preview adopt --check and pin the repository-specific contract before adding check to CI.",
  };
}

export function compileAgentContext(projectRoot, { checkOnly = false } = {}) {
  const root = resolve(projectRoot);
  const { config } = loadConfig(root);
  const compiler = config.contextCompiler;
  if (!compiler.enabled) {
    return {
      enabled: false,
      needed: false,
      changed: false,
      ready: true,
      target: compiler.target,
      directories: 0,
    };
  }
  if (!exists(root, compiler.target)) {
    throw new Error(`Configured Agent context target does not exist: ${compiler.target}`);
  }

  const trees = compiler.roots.map((relativeRoot) =>
    readDirectoryMetadataTree(root, relativeRoot, compiler.metadataFile));
  const directories = trees.reduce((count, tree) => count + countMetadataNodes(tree), 0);
  const reviewChanges = trees.flatMap((tree) => collectDirectoryReviewChanges(tree, root));
  const block = renderAgentContextBlock(trees, compiler);
  const targetPath = join(root, compiler.target);
  const original = readFileSync(targetPath, "utf8");
  const next = replaceManagedContext(original, block, compiler);
  const needed = next !== original;

  if (needed && !checkOnly) atomicWrite(targetPath, next);
  return {
    enabled: true,
    needed,
    changed: needed && !checkOnly,
    ready: !needed,
    target: compiler.target,
    directories,
    roots: [...compiler.roots],
    reviewChanges,
  };
}

export function reviewDirectorySummaries(projectRoot, { path = "", all = false } = {}) {
  const root = resolve(projectRoot);
  const { config } = loadConfig(root);
  if (!config.contextCompiler.enabled) {
    throw new Error("Agent context compilation is disabled for this project.");
  }
  if (!all && !path) throw new Error("review-directory requires --path or --all.");
  const trees = config.contextCompiler.roots.map((relativeRoot) =>
    readDirectoryMetadataTree(root, relativeRoot, config.contextCompiler.metadataFile));
  const nodes = trees.flatMap(flattenMetadataTree);
  const normalizedPath = path ? normalizeConfigPath(path, "review-directory path") : "";
  const selected = all ? nodes : nodes.filter((node) => node.path === normalizedPath);
  if (selected.length === 0) {
    throw new Error(`Directory is not part of the compiled L1 tree: ${normalizedPath}`);
  }

  const reviewed = [];
  for (const node of selected) {
    const metadataPath = join(root, node.path, config.contextCompiler.metadataFile);
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    metadata.reviewedDocuments = currentReviewDocuments(root, node);
    metadata.lastReviewed = todayString();
    atomicWrite(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    reviewed.push(node.path);
  }
  return { root, reviewed };
}

export function listTopics(projectRoot, { path = "" } = {}) {
  const root = resolve(projectRoot);
  const { config } = loadConfig(root);
  const within = path ? normalizeConfigPath(path, "list-topics path") : "";
  const topicFiles = unique(config.topicRoots.flatMap((relativeRoot) =>
    walkMarkdownFiles(join(root, relativeRoot)).map((absolutePath) =>
      normalizeRelativePath(relative(root, absolutePath)))));
  return topicFiles
    .filter((relativePath) => !within
      || relativePath === within
      || relativePath.startsWith(`${within}/`))
    .sort()
    .map((relativePath) => {
      const text = readText(root, relativePath);
      const metadata = parseMetadata(text);
      return {
        path: relativePath,
        summary: metadata.get("summary") ?? "",
        status: metadata.get("status") ?? "",
        confidence: metadata.get("confidence") ?? "",
        scope: metadata.get("scope") ?? "",
        lastUpdated: metadata.get("last_updated") ?? "",
        supersedes: parseMetadataList(text, "supersedes"),
        supersededBy: parseMetadataList(text, "superseded_by"),
        standalone: metadata.get("standalone") === "true",
      };
    });
}

export function markTopicStandalone(projectRoot, relativePath) {
  const root = resolve(projectRoot);
  const { config } = loadConfig(root);
  const normalized = normalizeConfigPath(relativePath, "mark-standalone path");
  if (!normalized.toLowerCase().endsWith(".md") || !exists(root, normalized)) {
    throw new Error(`Topic does not exist: ${normalized}`);
  }
  if (!isUnderAny(normalized, config.topicRoots)) {
    throw new Error(`Topic is outside configured topic roots: ${normalized}`);
  }
  const original = readText(root, normalized);
  const next = setScalarMetadata(original, "standalone", "true");
  if (next !== original) atomicWrite(join(root, normalized), next);
  return { root, path: normalized, changed: next !== original };
}

export function auditProject(projectRoot, { strict = false } = {}) {
  const root = resolve(projectRoot);
  const loaded = loadConfig(root);
  const config = loaded.config;
  const issues = [];
  const stats = {};
  const budgetSeverity = strict ? "error" : "warning";

  if (!loaded.found) {
    addIssue(issues, {
      code: "wiki-not-detected",
      severity: "error",
      path: "",
      message: "No supported project Wiki layout was detected.",
      suggestion: "Identify an existing documentation authority or bootstrap a new Wiki with init.",
    });
    return buildAuditReport(root, loaded, config, stats, issues);
  }

  if (!loaded.fromFile) {
    addIssue(issues, {
      code: "configuration-not-adopted",
      severity: strict ? "error" : "info",
      path: CONFIG_FILE,
      message: "The detected layout is provisional; repository-specific contracts are not pinned.",
      suggestion: "Preview adopt --check, review the paths and contracts, then run adopt before using check as a quality gate.",
    });
  }

  for (const relativePath of config.recoveryCandidates) {
    if (!exists(root, relativePath)) {
      addIssue(issues, {
        code: "required-file-missing",
        severity: "error",
        path: relativePath,
        message: "Configured recovery candidate is missing.",
        suggestion: "Repair the memory entry or update the configuration.",
      });
    }
  }

  for (const [name, relativePath] of Object.entries({
    index: config.index,
    currentState: config.currentState,
    log: config.log,
  })) {
    if (!relativePath || !exists(root, relativePath)) continue;
    const text = readText(root, relativePath);
    stats[name] = {
      path: relativePath,
      lines: countLines(text),
      bytes: Buffer.byteLength(text),
    };
  }

  checkBudget(
    issues,
    stats.index,
    config.budgets.indexMaxLines,
    "index-too-large",
    budgetSeverity,
    "Keep the index as a routing surface and move details to topic pages.",
  );
  checkBudget(
    issues,
    stats.currentState,
    config.budgets.currentStateMaxLines,
    "current-state-too-large",
    budgetSeverity,
    "Move chronology, durable rules, and detailed evidence out of current state.",
  );

  let parsedLog;
  if (config.log && exists(root, config.log)) {
    parsedLog = parseLog(readText(root, config.log));
    for (const malformed of parsedLog.malformedHeadings) {
      addIssue(issues, {
        code: "malformed-log-heading",
        severity: "error",
        path: config.log,
        line: malformed.line,
        message: `Malformed structured log heading: ${malformed.text}`,
        suggestion: "Use ## [YYYY-MM-DD] kind | concise title.",
      });
    }
    stats.log.entries = parsedLog.entries.length;
    stats.log.order = detectLogOrder(parsedLog.entries);
    if (!isLogOrderValid(parsedLog.entries, config.logOrder)) {
      addIssue(issues, {
        code: "log-order-invalid",
        severity: "error",
        path: config.log,
        message: `Structured entries are not ${config.logOrder}; detected ${stats.log.order}.`,
        suggestion: "Repair entry ordering explicitly before archival; do not let the archiver guess which entries are recent.",
      });
    }
    const oversizedEntries = parsedLog.entries.filter(
      (entry) => countLines(entry.raw) > config.budgets.recentLogMaxLines,
    );
    for (const entry of oversizedEntries) {
      addIssue(issues, {
        code: "log-entry-too-large",
        severity: budgetSeverity,
        path: config.log,
        line: entry.line,
        message: `One log entry has ${countLines(entry.raw)} lines, exceeding the entire recent-log budget.`,
        suggestion: "Move detailed evidence to a report and keep the log entry as a concise pointer.",
      });
    }
    if (
      stats.log.lines > config.budgets.recentLogMaxLines ||
      parsedLog.entries.length > config.budgets.recentLogMaxEntries
    ) {
      addIssue(issues, {
        code: "recent-log-needs-archive",
        severity: budgetSeverity,
        path: config.log,
        message: `Recent log has ${stats.log.lines} lines and ${parsedLog.entries.length} entries.`,
        suggestion: "Validate headings, then run archive-log --check and archive-log.",
      });
    }
  }

  const topicFiles = unique(
    config.topicRoots.flatMap((relativeRoot) =>
      walkMarkdownFiles(join(root, relativeRoot)).map((path) =>
        normalizeRelativePath(relative(root, path)),
      ),
    ),
  );
  const topicMetadata = new Map();
  const topicTexts = new Map();
  stats.topicPages = topicFiles.length;
  for (const relativePath of topicFiles) {
    const text = readText(root, relativePath);
    topicTexts.set(relativePath, text);
    const lines = countLines(text);
    if (lines > config.budgets.topicPageMaxLines) {
      addIssue(issues, {
        code: "topic-page-too-large",
        severity: budgetSeverity,
        path: relativePath,
        message: `Topic page has ${lines} lines; budget is ${config.budgets.topicPageMaxLines}.`,
        suggestion: "Extract distinct retrieval questions without duplicating the conclusion.",
      });
    }
    const metadata = parseMetadata(text);
    topicMetadata.set(relativePath, metadata);
    const blankAllowed = new Set(["source_refs", "related_pages"]);
    const missingFields = config.metadata.requiredTopicFields.filter(
      (field) => !metadata.has(field)
        || (!blankAllowed.has(field) && metadata.get(field) === ""),
    );
    if (missingFields.length > 0) {
      addIssue(issues, {
        code: "topic-metadata-missing",
        severity: strict ? "error" : "warning",
        path: relativePath,
        message: `Required topic metadata is missing: ${missingFields.join(", ")}.`,
        suggestion: "Add source-backed metadata using the page contract.",
      });
    }
    if (metadata.has("standalone")
      && !["true", "false"].includes(metadata.get("standalone"))) {
      addIssue(issues, {
        code: "topic-standalone-invalid",
        severity: "error",
        path: relativePath,
        message: "standalone metadata must be true or false.",
        suggestion: "Use standalone: true only after explicitly deciding that the topic should remain outside the document graph.",
      });
    }
    checkStaleness(
      issues,
      relativePath,
      metadata.get("last_updated"),
      config.metadata.staleAfterDays,
    );
  }

  if (config.currentState && exists(root, config.currentState)) {
    const metadata = parseMetadata(readText(root, config.currentState));
    if (!metadata.get("last_updated")) {
      addIssue(issues, {
        code: "current-state-date-missing",
        severity: strict ? "error" : "warning",
        path: config.currentState,
        message: "Current state does not declare last_updated.",
        suggestion: "Add the date of the last evidence-backed review; do not use a generated timestamp blindly.",
      });
    }
    checkStaleness(
      issues,
      config.currentState,
      metadata.get("last_updated"),
      config.metadata.currentStateStaleAfterDays,
    );
  }

  if (config.contextCompiler.enabled) {
    try {
      const compiledContext = compileAgentContext(root, { checkOnly: true });
      stats.agentContext = {
        path: compiledContext.target,
        lines: exists(root, compiledContext.target)
          ? countLines(readText(root, compiledContext.target))
          : 0,
        bytes: exists(root, compiledContext.target)
          ? Buffer.byteLength(readText(root, compiledContext.target))
          : 0,
        directories: compiledContext.directories,
      };
      if (compiledContext.needed) {
        addIssue(issues, {
          code: "agent-context-stale",
          severity: strict ? "error" : "warning",
          path: compiledContext.target,
          message: "The generated L1 directory semantic index is missing or out of date.",
          suggestion: "Run build-agent-context after editing directory metadata or Wiki structure.",
        });
      }
      for (const change of compiledContext.reviewChanges) {
        const directoryMetadata = JSON.parse(readFileSync(
          join(root, change.path, config.contextCompiler.metadataFile),
          "utf8",
        ));
        const changedSummaries = change.changed.map((name) => {
          if (name.endsWith(" (removed)")) return `${name}: no longer present`;
          const documentPath = join(root, change.path, name);
          if (!existsSync(documentPath)) return `${name}: missing`;
          const text = readFileSync(documentPath, "utf8");
          const metadata = parseMetadata(text);
          const summary = metadata.get("summary")
            || normalizeNewlines(text).split("\n").find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, "")
            || "no fixed-header summary";
          const qualifiers = [
            metadata.get("status") ? `status=${metadata.get("status")}` : "",
            metadata.get("scope") ? `scope=${metadata.get("scope")}` : "",
            metadata.get("confidence") ? `confidence=${metadata.get("confidence")}` : "",
          ].filter(Boolean).join(", ");
          return `${name}${qualifiers ? ` [${qualifiers}]` : ""}: ${summary}`;
        });
        addIssue(issues, {
          code: "directory-summary-review-required",
          severity: "warning",
          path: change.path,
          message: `Directory content changed and may make its compiled summary inaccurate.\n    Current directory summary: ${directoryMetadata.summary}\n    Changed documents: ${changedSummaries.join(" | ")}`,
          suggestion: `Judge whether ${config.contextCompiler.metadataFile} still represents this directory and whether current, candidate, historical, or mixed-age claims now conflict; edit the summary or page authority cues if needed. A subsequent build records that this diagnostic was considered.`,
        });
      }
    } catch (error) {
      addIssue(issues, {
        code: "agent-context-invalid",
        severity: "error",
        path: config.contextCompiler.target,
        message: error.message,
        suggestion: `Repair ${config.contextCompiler.metadataFile} files or the final managed directory-guide section before compiling.`,
      });
    }
  }

  const markdownFiles = unique([
    ...walkMarkdownFiles(join(root, config.wikiRoot)),
    ...(config.plansRoot
      ? walkMarkdownFiles(join(root, config.plansRoot))
      : []),
    ...(exists(root, "AGENTS.md") ? [join(root, "AGENTS.md")] : []),
  ]).filter((path) => !isUnderAny(
    normalizeRelativePath(relative(root, path)),
    config.rawRoots,
  ));
  const linkGraph = new Map();
  const brokenLinks = new Map();
  for (const absolutePath of markdownFiles) {
    const relativePath = normalizeRelativePath(relative(root, absolutePath));
    const text = readFileSync(absolutePath, "utf8");
    const links = collectLocalLinks(
      absolutePath,
      text,
      join(root, config.wikiRoot),
    );
    linkGraph.set(relativePath, []);
    for (const link of links) {
      if (!link.resolved) continue;
      const targetRelative = normalizeRelativePath(relative(root, link.resolved));
      linkGraph.get(relativePath).push(targetRelative);
      if (!existsSync(link.resolved)) {
        const key = `${relativePath}\0${link.target}`;
        const existing = brokenLinks.get(key);
        if (existing) existing.occurrences += 1;
        else brokenLinks.set(key, {
          path: relativePath,
          target: link.target,
          line: link.line,
          occurrences: 1,
        });
      }
    }
    for (const { field, contributesToGraph } of [
      { field: "related_pages", contributesToGraph: true },
      { field: "source_refs", contributesToGraph: false },
      { field: "supersedes", contributesToGraph: true },
      { field: "superseded_by", contributesToGraph: true },
    ]) {
      for (const metadataPath of parseMetadataList(text, field)) {
        if (metadataPath.toLowerCase() === "none") continue;
        const resolved = resolveMetadataReference(root, absolutePath, metadataPath);
        if (!resolved) continue;
        const targetRelative = normalizeRelativePath(relative(root, resolved));
        if (contributesToGraph) linkGraph.get(relativePath).push(targetRelative);
        if (!existsSync(resolved)) {
          const key = `${relativePath}\0${field}\0${metadataPath}`;
          if (!brokenLinks.has(key)) brokenLinks.set(key, {
            path: relativePath,
            target: metadataPath,
            field,
            line: 1,
            occurrences: 1,
          });
        }
      }
    }
  }
  for (const link of brokenLinks.values()) {
    const historical = isHistoricalPath(link.path, config);
    const sourceReference = link.field === "source_refs";
    addIssue(issues, {
      code: sourceReference
        ? "broken-source-reference"
        : historical
          ? "broken-historical-link"
          : "broken-local-link",
      severity: sourceReference || historical ? "warning" : "error",
      path: link.path,
      line: link.line,
      message: `${sourceReference ? "Source reference" : "Local link"} does not resolve: ${link.target}${link.occurrences > 1 ? ` (${link.occurrences} occurrences)` : ""}`,
      suggestion: sourceReference
        ? "Repair the source path, register the intended artifact, or use an explicit external URI; do not leave provenance looking stronger than it is."
        : historical
        ? "Repair when curating this historical material; it does not block the current startup route."
        : "Repair the link or restore the referenced file.",
    });
  }

  const topicSet = new Set(topicFiles);
  const supersession = new Map(topicFiles.map((topicPath) => {
    const text = topicTexts.get(topicPath) ?? "";
    const absolutePath = join(root, topicPath);
    const resolveTopicReferences = (field) => parseMetadataList(text, field)
      .filter((value) => value.toLowerCase() !== "none")
      .map((value) => resolveMetadataReference(root, absolutePath, value))
      .filter(Boolean)
      .map((value) => normalizeRelativePath(relative(root, value)));
    return [topicPath, {
      supersedes: resolveTopicReferences("supersedes"),
      supersededBy: resolveTopicReferences("superseded_by"),
      replacementDeclared: parseMetadataList(text, "superseded_by").length > 0,
    }];
  }));
  for (const topicPath of topicFiles) {
    const status = (topicMetadata.get(topicPath)?.get("status") ?? "").toLowerCase();
    const relations = supersession.get(topicPath);
    if (/^(?:deprecated|superseded|rejected|historical)(?:$|[-_:])/.test(status)
      && !relations.replacementDeclared) {
      addIssue(issues, {
        code: "historical-topic-replacement-unspecified",
        severity: "warning",
        path: topicPath,
        message: `Topic status is ${status}, but the page does not declare superseded_by.`,
        suggestion: "Point to the current authority, or declare superseded_by: none after confirming that no replacement exists, so a direct search hit is self-disambiguating.",
      });
    }
    for (const replacedPath of relations.supersedes) {
      if (!topicSet.has(replacedPath)) continue;
      if (!supersession.get(replacedPath).supersededBy.includes(topicPath)) {
        addIssue(issues, {
          code: "supersession-backlink-missing",
          severity: "warning",
          path: replacedPath,
          message: `${topicPath} declares that it supersedes this topic, but this topic does not point back with superseded_by.`,
          suggestion: "Make both direct search paths identify the current authority, or remove the supersession claim if the pages are merely related.",
        });
      }
    }
    for (const replacementPath of relations.supersededBy) {
      if (!topicSet.has(replacementPath)) continue;
      if (!supersession.get(replacementPath).supersedes.includes(topicPath)) {
        addIssue(issues, {
          code: "supersession-forward-link-missing",
          severity: "warning",
          path: replacementPath,
          message: `${topicPath} points here as its replacement, but this topic does not name the displaced authority with supersedes.`,
          suggestion: "Record the displaced scope on the current authority, or remove the replacement claim if the relationship is not supersession.",
        });
      }
    }
  }

  if (config.index && exists(root, config.index)) {
    const reachable = reachableFrom(config.index, linkGraph);
    for (const topicPath of topicFiles) {
      const standalone = topicMetadata.get(topicPath)?.get("standalone") === "true";
      if (standalone) continue;
      if (!reachable.has(topicPath)) {
        addIssue(issues, {
          code: "topic-not-routed",
          severity: "warning",
          path: topicPath,
          message: "Topic page is not reachable from the wiki index.",
          suggestion: "Link it from a task-oriented index route or a reachable topic.",
        });
      }
    }
  }

  for (const topicPath of topicFiles) {
    if (topicMetadata.get(topicPath)?.get("standalone") === "true") continue;
    const outbound = (linkGraph.get(topicPath) ?? []).some((target) => topicSet.has(target));
    const inbound = [...linkGraph.entries()].some(([source, targets]) =>
      source !== topicPath && targets.includes(topicPath));
    if (!outbound && !inbound) {
      addIssue(issues, {
        code: "topic-isolated",
        severity: "warning",
        path: topicPath,
        message: "Topic has no incoming or outgoing relationship in the active document graph.",
        suggestion: "Link it from the relevant directory/index/topic, or run mark-standalone after confirming isolation is intentional.",
      });
    }
  }

  checkAgentRouting(root, config, issues);
  checkRawSourceMutations(root, config, issues);

  return buildAuditReport(root, loaded, config, stats, issues);
}

export function parseLog(text) {
  const normalized = normalizeNewlines(text);
  const lines = normalized.split("\n");
  const entries = [];
  const malformedHeadings = [];
  let inFence = false;
  let current = null;
  let preambleEnd = lines.length;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(ENTRY_PATTERN);
    if (match) {
      if (current) {
        current.end = index;
        current.raw = trimBlock(lines.slice(current.start, index).join("\n"));
        current.hash = hashText(current.raw);
        entries.push(current);
      } else {
        preambleEnd = index;
      }
      current = {
        date: match[1],
        kind: match[2].trim(),
        title: match[3].trim(),
        start: index,
        line: index + 1,
      };
      continue;
    }
    if (/^##\s+(?:\[?\d{4}-\d{2}-\d{2}\]?)/.test(line)) {
      malformedHeadings.push({ line: index + 1, text: line });
    }
  }

  if (current) {
    current.end = lines.length;
    current.raw = trimBlock(lines.slice(current.start).join("\n"));
    current.hash = hashText(current.raw);
    entries.push(current);
  }

  const preamble = trimTrailing(lines.slice(0, preambleEnd).join("\n"));
  return { preamble, entries, malformedHeadings };
}

function detectLogOrder(entries) {
  let ascending = false;
  let descending = false;
  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1].date;
    const current = entries[index].date;
    if (previous < current) ascending = true;
    if (previous > current) descending = true;
  }
  if (ascending && descending) return "mixed";
  if (ascending) return "oldest-first";
  if (descending) return "newest-first";
  return entries.length === 0 ? "empty" : "single-date";
}

function isLogOrderValid(entries, configuredOrder) {
  return entries.every((entry, index) => {
    if (index === 0) return true;
    const previous = entries[index - 1].date;
    return configuredOrder === "oldest-first"
      ? previous <= entry.date
      : previous >= entry.date;
  });
}

export function archiveLog(projectRoot, { checkOnly = false } = {}) {
  const root = resolve(projectRoot);
  const { config } = loadConfig(root);
  if (!config.log || !exists(root, config.log)) {
    throw new Error(`Configured log does not exist: ${config.log || "(empty)"}`);
  }

  const logText = readText(root, config.log);
  const parsed = parseLog(logText);
  if (parsed.malformedHeadings.length > 0) {
    throw new Error(
      "Refusing to archive a log with malformed structured headings.",
    );
  }
  if (!isLogOrderValid(parsed.entries, config.logOrder)) {
    throw new Error(
      `Refusing to archive a log that is not ${config.logOrder}; repair its ordering explicitly.`,
    );
  }

  const lineLimit = config.budgets.recentLogMaxLines;
  const entryLimit = config.budgets.recentLogMaxEntries;
  const targetEntries = config.budgets.recentLogTargetEntries;
  const needed =
    countLines(logText) > lineLimit || parsed.entries.length > entryLimit;

  if (!needed) {
    return {
      needed: false,
      changed: false,
      entriesBefore: parsed.entries.length,
      entriesAfter: parsed.entries.length,
      archived: 0,
    };
  }
  if (parsed.entries.length < 2) {
    throw new Error(
      "The recent log exceeds its line budget but has fewer than two parseable entries.",
    );
  }

  let keepCount = Math.min(targetEntries, parsed.entries.length - 1);
  const splitEntries = () => config.logOrder === "oldest-first"
    ? {
        kept: parsed.entries.slice(parsed.entries.length - keepCount),
        moved: parsed.entries.slice(0, parsed.entries.length - keepCount),
      }
    : {
        kept: parsed.entries.slice(0, keepCount),
        moved: parsed.entries.slice(keepCount),
      };
  let split = splitEntries();
  let nextMain = buildLog(parsed.preamble, split.kept);
  while (countLines(nextMain) > lineLimit && keepCount > 1) {
    keepCount -= 1;
    split = splitEntries();
    nextMain = buildLog(parsed.preamble, split.kept);
  }
  if (countLines(nextMain) > lineLimit) {
    throw new Error(
      "Refusing to archive because the preamble plus one complete recent entry still exceeds the line budget.",
    );
  }
  const moved = split.moved;

  if (checkOnly) {
    return {
      needed: true,
      changed: false,
      entriesBefore: parsed.entries.length,
      entriesAfter: keepCount,
      archived: moved.length,
    };
  }

  const grouped = groupBy(moved, ({ date }) => date.slice(0, 7));
  mkdirSync(join(root, config.archiveDir), { recursive: true });
  for (const [month, entries] of grouped) {
    const archivePath = join(root, config.archiveDir, `${month}.md`);
    const existingText = existsSync(archivePath)
      ? readFileSync(archivePath, "utf8")
      : "";
    const existing = existingText ? parseLog(existingText).entries : [];
    const combined = uniqueEntries([...entries, ...existing]).sort(compareEntries(config.logOrder));
    const archiveText = buildArchive(month, combined, config.logOrder);
    if (archiveText !== existingText) atomicWrite(archivePath, archiveText);
  }

  atomicWrite(join(root, config.log), nextMain);
  refreshArchiveIndex(root, config);
  return {
    needed: true,
    changed: true,
    entriesBefore: parsed.entries.length,
    entriesAfter: keepCount,
    archived: moved.length,
  };
}

function readDirectoryMetadataTree(root, relativeRoot, metadataFile) {
  const absoluteRoot = join(root, relativeRoot);
  if (!existsSync(absoluteRoot) || !statSync(absoluteRoot).isDirectory()) {
    throw new Error(`Configured context root is not a directory: ${relativeRoot}`);
  }
  return readDirectoryMetadataNode(root, relativeRoot, metadataFile);
}

function readDirectoryMetadataNode(root, relativeDirectory, metadataFile) {
  const absoluteDirectory = join(root, relativeDirectory);
  const metadataPath = join(absoluteDirectory, metadataFile);
  if (!existsSync(metadataPath)) {
    throw new Error(`Directory is missing ${metadataFile}: ${relativeDirectory}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(metadataPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot parse ${relativeDirectory}/${metadataFile}: ${error.message}`);
  }
  const metadata = validateDirectoryMetadata(
    parsed,
    `${relativeDirectory}/${metadataFile}`,
  );
  const childDirectories = readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => normalizeRelativePath(join(relativeDirectory, entry.name)));
  const includedChildren = metadata.children === "none"
    ? []
    : metadata.children === "annotated"
      ? childDirectories.filter((child) => existsSync(join(root, child, metadataFile)))
      : childDirectories;
  const childNodes = includedChildren.map((child) =>
    readDirectoryMetadataNode(root, child, metadataFile));
  childNodes.sort((left, right) => left.order - right.order || left.path.localeCompare(right.path));
  return {
    path: relativeDirectory,
    ...metadata,
    children: childNodes,
  };
}

function validateDirectoryMetadata(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must contain a JSON object.`);
  }
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  const order = value.order ?? 100;
  const children = value.children ?? "all";
  const reviewFiles = value.reviewFiles ?? ["*.md"];
  const reviewedDocuments = value.reviewedDocuments ?? {};
  if (!title) throw new Error(`${path} requires a non-empty title.`);
  if (!summary) throw new Error(`${path} requires a non-empty summary.`);
  if (/\r|\n/.test(value.summary)) {
    throw new Error(`${path} summary must stay on one line.`);
  }
  if (!Number.isInteger(order)) throw new Error(`${path} order must be an integer.`);
  if (!["all", "annotated", "none"].includes(children)) {
    throw new Error(`${path} children must be all, annotated, or none.`);
  }
  if (!Array.isArray(reviewFiles)
    || reviewFiles.some((item) => typeof item !== "string" || !item)) {
    throw new Error(`${path} reviewFiles must be an array of non-empty file names or *.md.`);
  }
  if (reviewFiles.some((item) => item !== "*.md" && (item.includes("/") || item.includes("\\")))) {
    throw new Error(`${path} reviewFiles entries must be direct file names or *.md.`);
  }
  if (!reviewedDocuments || typeof reviewedDocuments !== "object"
    || Array.isArray(reviewedDocuments)
    || Object.values(reviewedDocuments).some((hash) => typeof hash !== "string")) {
    throw new Error(`${path} reviewedDocuments must be a file-to-hash object.`);
  }
  return { title, summary, order, children, reviewFiles, reviewedDocuments };
}

function countMetadataNodes(node) {
  return 1 + node.children.reduce((count, child) => count + countMetadataNodes(child), 0);
}

function flattenMetadataTree(node) {
  return [node, ...node.children.flatMap(flattenMetadataTree)];
}

function currentReviewDocuments(root, node) {
  if (node.reviewFiles.length === 0) return {};
  const directory = join(root, node.path);
  const names = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name)
    .filter((name) => node.reviewFiles.includes("*.md") || node.reviewFiles.includes(name))
    .sort();
  return Object.fromEntries(names.map((name) => [
    name,
    hashText(readFileSync(join(directory, name), "utf8")),
  ]));
}

function collectDirectoryReviewChanges(node, rootOverride) {
  const root = rootOverride ?? node.projectRoot;
  if (!root) return [];
  const current = currentReviewDocuments(root, node);
  const reviewed = node.reviewedDocuments;
  const changed = unique([
    ...Object.keys(current).filter((name) => current[name] !== reviewed[name]),
    ...Object.keys(reviewed).filter((name) => !(name in current)).map((name) => `${name} (removed)`),
  ]).sort();
  return [
    ...(changed.length > 0 ? [{ path: node.path, changed }] : []),
    ...node.children.flatMap((child) => collectDirectoryReviewChanges(child, root)),
  ];
}

function renderAgentContextBlock(trees, compiler) {
  const lines = [
    compiler.heading,
    "",
    compiler.notice,
    "",
  ];
  for (const tree of trees) renderMetadataNode(tree, 0, lines);
  lines.push("", "---");
  return lines.join("\n");
}

function renderMetadataNode(node, depth, lines) {
  const indent = "  ".repeat(depth);
  lines.push(`${indent}- \`${node.path}/\` — **${node.title}**：${node.summary}`);
  for (const child of node.children) renderMetadataNode(child, depth + 1, lines);
}

function replaceManagedContext(original, block, compiler) {
  const startMatches = [...original.matchAll(new RegExp(escapeRegExp(CONTEXT_START), "g"))];
  const endMatches = [...original.matchAll(new RegExp(escapeRegExp(CONTEXT_END), "g"))];
  if (startMatches.length > 0 || endMatches.length > 0) {
    if (startMatches.length !== 1 || endMatches.length !== 1) {
      throw new Error("Legacy AGENTS L1 region must contain exactly one start marker and one end marker.");
    }
    const start = startMatches[0].index;
    const end = endMatches[0].index;
    if (start >= end) throw new Error("Legacy AGENTS L1 markers are out of order.");
    const suffixStart = end + CONTEXT_END.length;
    const suffix = original.slice(suffixStart);
    return `${original.slice(0, start)}${block}${suffix}`;
  }

  const headingPattern = new RegExp(`^${escapeRegExp(compiler.heading)}\\r?$`, "gm");
  const headingMatches = [...original.matchAll(headingPattern)];
  if (headingMatches.length === 0) {
    const separator = original.length === 0
      ? ""
      : original.endsWith("\n\n")
        ? ""
        : original.endsWith("\n")
          ? "\n"
          : "\n\n";
    return `${original}${separator}${block}\n`;
  }
  if (headingMatches.length !== 1) {
    throw new Error(`AGENTS managed directory guide must contain exactly one heading: ${compiler.heading}`);
  }
  const start = headingMatches[0].index;
  const endPattern = /^---\r?$/gm;
  endPattern.lastIndex = start + headingMatches[0][0].length;
  const endMatch = endPattern.exec(original);
  if (!endMatch) {
    throw new Error("AGENTS managed directory guide is missing its closing Markdown separator (`---`).");
  }
  const end = endMatch.index + endMatch[0].length;
  return `${original.slice(0, start)}${block}${original.slice(end)}`;
}

function injectAgentWikiUsage(original, guide, compilerHeading) {
  const guideHeading = guide.split(/\r?\n/, 1)[0];
  const guidePattern = new RegExp(`^${escapeRegExp(guideHeading)}\\r?$`, "m");
  if (guidePattern.test(original)) return original;

  const naturalHeadingPattern = new RegExp(`^${escapeRegExp(compilerHeading)}\\r?$`, "m");
  const naturalMatch = naturalHeadingPattern.exec(original);
  const legacyIndex = original.indexOf(CONTEXT_START);
  const insertionCandidates = [naturalMatch?.index ?? -1, legacyIndex]
    .filter((index) => index >= 0);
  const insertionIndex = insertionCandidates.length > 0
    ? Math.min(...insertionCandidates)
    : original.length;
  const prefix = original.slice(0, insertionIndex);
  const suffix = original.slice(insertionIndex);
  const before = prefix.length === 0
    ? ""
    : prefix.endsWith("\n\n")
      ? ""
      : prefix.endsWith("\n")
        ? "\n"
        : "\n\n";
  const after = suffix.length === 0
    ? "\n"
    : suffix.startsWith("\n\n")
      ? ""
      : suffix.startsWith("\n")
        ? "\n"
        : "\n\n";
  return `${prefix}${before}${guide}${after}${suffix}`;
}

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function mergeConfig(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${CONFIG_FILE} must contain a JSON object.`);
  }
  if (input.version !== undefined && input.version !== 1) {
    throw new Error(`Unsupported Agent Wiki config version: ${input.version}`);
  }
  const base = cloneDefaultConfig();
  const contextCompilerInput = Object.prototype.hasOwnProperty.call(input, "contextCompiler")
    ? input.contextCompiler
    : { ...base.contextCompiler, enabled: false };
  const recoveryCandidatesInput = Object.prototype.hasOwnProperty.call(input, "recoveryCandidates")
    ? input.recoveryCandidates
    : input.requiredStartupFiles;
  const merged = {
    ...base,
    ...input,
    version: 1,
    budgets: { ...base.budgets, ...(input.budgets ?? {}) },
    metadata: { ...base.metadata, ...(input.metadata ?? {}) },
    contextCompiler: { ...base.contextCompiler, ...(contextCompilerInput ?? {}) },
  };
  delete merged.requiredStartupFiles;
  if (recoveryCandidatesInput !== undefined) {
    merged.recoveryCandidates = recoveryCandidatesInput;
  }
  for (const field of [
    "wikiRoot",
    "agentGuide",
    "index",
    "currentState",
    "log",
    "archiveDir",
    "plansRoot",
  ]) {
    merged[field] = normalizeConfigPath(merged[field], field, {
      allowEmpty: ["log", "plansRoot"].includes(field),
    });
  }
  for (const field of ["topicRoots", "rawRoots", "recoveryCandidates"]) {
    if (!Array.isArray(merged[field])) throw new Error(`${field} must be an array.`);
    merged[field] = merged[field].map((value) => normalizeConfigPath(value, field));
  }
  if (typeof merged.contextCompiler.enabled !== "boolean") {
    throw new Error("contextCompiler.enabled must be boolean.");
  }
  merged.contextCompiler.target = normalizeConfigPath(
    merged.contextCompiler.target,
    "contextCompiler.target",
  );
  if (!Array.isArray(merged.contextCompiler.roots)
    || merged.contextCompiler.roots.length === 0) {
    throw new Error("contextCompiler.roots must be a non-empty array.");
  }
  merged.contextCompiler.roots = merged.contextCompiler.roots.map((value) =>
    normalizeConfigPath(value, "contextCompiler.roots"));
  if (typeof merged.contextCompiler.metadataFile !== "string"
    || !merged.contextCompiler.metadataFile
    || merged.contextCompiler.metadataFile.includes("/")
    || merged.contextCompiler.metadataFile.includes("\\")) {
    throw new Error("contextCompiler.metadataFile must be a file name, not a path.");
  }
  if (typeof merged.contextCompiler.heading !== "string"
    || !merged.contextCompiler.heading.startsWith("## ")
    || merged.contextCompiler.heading.includes("\n")) {
    throw new Error("contextCompiler.heading must be a level-two Markdown heading.");
  }
  if (typeof merged.contextCompiler.notice !== "string"
    || !merged.contextCompiler.notice
    || merged.contextCompiler.notice.includes("\n")) {
    throw new Error("contextCompiler.notice must be a non-empty single line.");
  }
  if (!Array.isArray(merged.metadata.requiredTopicFields)
    || merged.metadata.requiredTopicFields.some((field) => typeof field !== "string" || !field)) {
    throw new Error("metadata.requiredTopicFields must be an array of non-empty strings.");
  }
  for (const [name, value] of Object.entries(merged.budgets)) {
    if (!Number.isInteger(value) || value < 1) throw new Error(`budgets.${name} must be a positive integer.`);
  }
  if (merged.budgets.recentLogTargetEntries > merged.budgets.recentLogMaxEntries) {
    throw new Error("recentLogTargetEntries cannot exceed recentLogMaxEntries.");
  }
  for (const field of ["staleAfterDays", "currentStateStaleAfterDays"]) {
    const value = merged.metadata[field];
    if (!Number.isInteger(value) || value < 0) throw new Error(`metadata.${field} must be a non-negative integer.`);
  }
  if (!["oldest-first", "newest-first"].includes(merged.logOrder)) {
    throw new Error("logOrder must be oldest-first or newest-first.");
  }
  return merged;
}

function normalizeConfigPath(value, field, { allowEmpty = false } = {}) {
  if (typeof value !== "string") throw new Error(`${field} must be a string path.`);
  if (!value && allowEmpty) return "";
  if (!value) throw new Error(`${field} must not be empty.`);
  if (isAbsolute(value)) throw new Error(`${field} must be project-relative.`);
  const normalized = normalizeRelativePath(value);
  if (normalized === ".." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`${field} must stay inside the project root.`);
  }
  return normalized;
}

function buildAuditReport(root, loaded, config, stats, issues) {
  const counts = {
    errors: issues.filter(({ severity }) => severity === "error").length,
    warnings: issues.filter(({ severity }) => severity === "warning").length,
    info: issues.filter(({ severity }) => severity === "info").length,
  };
  return {
    root,
    configSource: loaded.fromFile
      ? CONFIG_FILE
      : loaded.found
        ? "auto-detected"
        : "default-not-detected",
    config,
    stats,
    counts,
    ok: counts.errors === 0,
    issues,
  };
}

function exists(root, relativePath) {
  return Boolean(relativePath) && existsSync(join(root, relativePath));
}

function firstExisting(root, paths) {
  return paths.find((path) => exists(root, path)) ?? paths[0] ?? "";
}

function firstExistingOrDefault(root, paths) {
  return paths.find((path) => exists(root, path)) ?? paths[0] ?? "";
}

function existingFileOrEmpty(root, paths) {
  return paths.find((path) => exists(root, path)) ?? "";
}

function existingDirectories(root, paths) {
  return paths.filter((path) => {
    const absolutePath = join(root, path);
    return existsSync(absolutePath) && statSync(absolutePath).isDirectory();
  });
}

function inferConfiguredLogOrder(root, relativePath) {
  if (!relativePath || !exists(root, relativePath)) return DEFAULT_CONFIG.logOrder;
  try {
    const order = detectLogOrder(parseLog(readText(root, relativePath)).entries);
    return order === "oldest-first" || order === "newest-first"
      ? order
      : DEFAULT_CONFIG.logOrder;
  } catch {
    return DEFAULT_CONFIG.logOrder;
  }
}

function inferRequiredTopicFields(root, topicRoots) {
  const pages = unique(topicRoots.flatMap((relativeRoot) =>
    walkMarkdownFiles(join(root, relativeRoot))));
  if (pages.length === 0) return [];
  return DEFAULT_CONFIG.metadata.requiredTopicFields.filter((field) => {
    const withField = pages.filter((page) => parseMetadata(
      readFileSync(page, "utf8"),
    ).has(field)).length;
    return withField / pages.length >= 0.8;
  });
}

function isUnderAny(path, roots) {
  return roots.some((root) => path === root || path.startsWith(`${root}/`));
}

function isHistoricalPath(path, config) {
  if (isUnderAny(path, [config.archiveDir].filter(Boolean))) return true;
  return normalizeRelativePath(path).split("/").some((segment) =>
    ["archive", "archives", "log-archive", "history", "historical"].includes(segment.toLowerCase()));
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function walkMarkdownFiles(root) {
  if (!existsSync(root) || !statSync(root).isDirectory()) return [];
  return walkFiles(root).filter((path) => extname(path).toLowerCase() === ".md");
}

function readText(root, relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function atomicWrite(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
  try {
    writeFileSync(temporary, contents, "utf8");
    renameSync(temporary, path);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

function addIssue(issues, issue) {
  issues.push(issue);
}

function checkBudget(
  issues,
  stat,
  maximum,
  code,
  severity,
  suggestion,
) {
  if (!stat || stat.lines <= maximum) return;
  addIssue(issues, {
    code,
    severity,
    path: stat.path,
    message: `File has ${stat.lines} lines; budget is ${maximum}.`,
    suggestion,
  });
}

function parseMetadata(text) {
  const metadata = new Map();
  const lines = normalizeNewlines(text).split("\n").slice(0, 80);
  for (const line of lines) {
    if (/^##\s+/.test(line)) break;
    const match = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (match) metadata.set(match[1], match[2].trim());
  }
  return metadata;
}

function parseMetadataList(text, key) {
  const lines = normalizeNewlines(text).split("\n");
  const values = [];
  let active = false;
  for (const line of lines) {
    if (/^##\s+/.test(line)) break;
    if (line.startsWith(`${key}:`)) {
      active = true;
      const inline = line.slice(key.length + 1).trim();
      if (inline) values.push(inline);
      continue;
    }
    if (active) {
      const match = line.match(/^\s+-\s+(.+?)\s*$/);
      if (match) values.push(match[1]);
      else if (line.trim() !== "") active = false;
    }
  }
  return values;
}

function setScalarMetadata(text, key, value) {
  const normalized = normalizeNewlines(text);
  const lines = normalized.split("\n");
  const headingIndex = lines.findIndex((line) => /^##\s+/.test(line));
  const limit = headingIndex === -1 ? lines.length : headingIndex;
  const existingIndex = lines.slice(0, limit)
    .findIndex((line) => line.startsWith(`${key}:`));
  if (existingIndex !== -1) {
    lines[existingIndex] = `${key}: ${value}`;
  } else {
    const insertAt = Math.max(1, limit);
    lines.splice(insertAt, 0, `${key}: ${value}`);
  }
  return lines.join("\n");
}

function resolveMetadataReference(root, sourcePath, value) {
  if (!value || value.startsWith("#") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    return null;
  }
  const target = value.split("#")[0].split("?")[0];
  if (!target) return null;
  if (["llm-wiki/", "plans/", "docs/", "wiki/"].some((prefix) => target.startsWith(prefix))) {
    return resolve(root, target);
  }
  return resolve(dirname(sourcePath), target);
}

function checkStaleness(issues, path, value, maximumDays) {
  if (!value || value === "YYYY-MM-DD") return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    addIssue(issues, {
      code: "invalid-last-updated",
      severity: "warning",
      path,
      message: `last_updated is not a valid date: ${value}`,
      suggestion: "Use YYYY-MM-DD.",
    });
    return;
  }
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) {
    addIssue(issues, {
      code: "invalid-last-updated",
      severity: "warning",
      path,
      message: `last_updated is not a valid date: ${value}`,
      suggestion: "Use YYYY-MM-DD.",
    });
    return;
  }
  const ageDays = Math.floor((Date.now() - timestamp) / 86_400_000);
  if (ageDays > maximumDays) {
    addIssue(issues, {
      code: "page-stale",
      severity: "warning",
      path,
      message: `Page has not been reviewed for ${ageDays} days.`,
      suggestion: "Review the current conclusion and evidence; do not update the date blindly.",
    });
  }
}

function collectLocalLinks(sourcePath, text, wikiRoot) {
  const sanitized = stripFencedCode(text);
  const lines = sanitized.split("\n");
  const links = [];
  const markdownPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
  const wikiPattern = /\[\[([^\]]+)\]\]/g;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const match of line.matchAll(markdownPattern)) {
      const rawTarget = match[1].trim().replace(/^<|>$/g, "");
      links.push(resolveLocalLink(sourcePath, rawTarget, index + 1, false, wikiRoot));
    }
    for (const match of line.matchAll(wikiPattern)) {
      const rawTarget = match[1].split("|")[0].trim();
      links.push(resolveLocalLink(sourcePath, rawTarget, index + 1, true, wikiRoot));
    }
  }
  return links;
}

function resolveLocalLink(
  sourcePath,
  rawTarget,
  line,
  wikiStyle = false,
  wikiRoot = dirname(sourcePath),
) {
  if (
    !rawTarget ||
    rawTarget.startsWith("#") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawTarget)
  ) {
    return { target: rawTarget, line, resolved: null };
  }
  let target = rawTarget.split("#")[0].split("?")[0];
  try {
    target = decodeURIComponent(target);
  } catch {
    // Keep the original target so the audit reports its unresolved path.
  }
  let resolved;
  if (wikiStyle) {
    const sourceDirectory = dirname(sourcePath);
    const explicitlyRelative =
      target.startsWith("./") || target.startsWith("../");
    const hasDirectory = target.includes("/") || target.includes("\\");
    const bases = explicitlyRelative
      ? [sourceDirectory]
      : hasDirectory
        ? [wikiRoot, sourceDirectory]
        : [sourceDirectory, wikiRoot];
    const candidates = bases.flatMap((base) => {
      const path = resolve(base, target);
      return target.toLowerCase().endsWith(".md") ? [path] : [path, `${path}.md`];
    });
    resolved = candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
  } else {
    resolved = resolve(dirname(sourcePath), target);
    if (!existsSync(resolved) && extname(resolved) === "") {
      const markdownCandidate = `${resolved}.md`;
      if (existsSync(markdownCandidate)) resolved = markdownCandidate;
    }
  }
  return { target: rawTarget, line, resolved };
}

function stripFencedCode(text) {
  const lines = normalizeNewlines(text).split("\n");
  let inFence = false;
  return lines
    .map((line) => {
      if (/^\s*(?:```|~~~)/.test(line)) {
        inFence = !inFence;
        return "";
      }
      return inFence ? "" : line;
    })
    .join("\n");
}

function reachableFrom(start, graph) {
  const seen = new Set();
  const queue = [normalizeRelativePath(start)];
  while (queue.length > 0) {
    const current = queue.shift();
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of graph.get(current) ?? []) {
      if (!seen.has(next)) queue.push(next);
    }
  }
  return seen;
}

function checkAgentRouting(root, config, issues) {
  if (!exists(root, "AGENTS.md")) return;
  const text = readText(root, "AGENTS.md");
  for (const routedPath of unique(config.recoveryCandidates
    .filter((path) => path && path !== "AGENTS.md"))) {
    if (!exists(root, routedPath)) continue;
    if (!text.includes(routedPath)) {
      addIssue(issues, {
        code: "agent-recovery-candidate-missing",
        severity: "warning",
        path: "AGENTS.md",
        message: `Root instructions do not mention ${routedPath}.`,
        suggestion: "Expose the memory entry without replacing existing instructions or prescribing a read order.",
      });
    }
  }
}

function gitWorktreeSummary(root) {
  const status = spawnSync(
    "git",
    ["-C", root, "status", "--porcelain=v1", "--untracked-files=normal"],
    { encoding: "utf8", windowsHide: true },
  );
  if (status.status !== 0) return { repository: false, dirty: false, tracked: 0, untracked: 0 };
  const lines = normalizeNewlines(status.stdout).split("\n").filter(Boolean);
  return {
    repository: true,
    dirty: lines.length > 0,
    tracked: lines.filter((line) => !line.startsWith("??")).length,
    untracked: lines.filter((line) => line.startsWith("??")).length,
  };
}

function checkRawSourceMutations(root, config, issues) {
  const probe = spawnSync("git", ["-C", root, "rev-parse", "--is-inside-work-tree"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (probe.status !== 0) return;

  for (const rawRoot of config.rawRoots) {
    const status = spawnSync(
      "git",
      ["-C", root, "status", "--porcelain=v1", "--", rawRoot],
      { encoding: "utf8", windowsHide: true },
    );
    if (status.status !== 0) continue;
    for (const line of normalizeNewlines(status.stdout).split("\n")) {
      if (!line.trim()) continue;
      const code = line.slice(0, 2);
      if (code === "??" || code.includes("A")) continue;
      const changedPath = normalizeRelativePath(line.slice(3).trim().replace(/^"|"$/g, ""));
      if (changedPath.endsWith(`/${config.contextCompiler.metadataFile}`)) continue;
      if (/[MDRCTU]/.test(code)) {
        addIssue(issues, {
          code: "tracked-source-change-review-required",
          severity: "warning",
          path: rawRoot,
          message: `Tracked source evidence has a non-additive worktree change: ${line}`,
          suggestion: "If intentional, preserve or document the previous meaning, update the source register and affected links/conclusions, and record why; otherwise restore the source.",
        });
      }
    }
  }
}

function buildLog(preamble, entries) {
  const blocks = [trimTrailing(preamble), ...entries.map(({ raw }) => raw)].filter(
    Boolean,
  );
  return `${blocks.join("\n\n")}\n`;
}

function buildArchive(month, entries, logOrder) {
  const preamble = [
    `# Agent Work Log Archive — ${month}`,
    "",
    `Entries are maintained by Agent Wiki Kit. ${logOrder === "oldest-first" ? "Oldest" : "Newest"} entries appear first.`,
  ].join("\n");
  return buildLog(preamble, entries);
}

function uniqueEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = entry.hash || hashText(entry.raw);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compareEntries(logOrder) {
  return (left, right) => {
    if (left.date !== right.date) {
      return logOrder === "oldest-first"
        ? left.date.localeCompare(right.date)
        : right.date.localeCompare(left.date);
    }
    return left.line - right.line;
  };
}

function refreshArchiveIndex(root, config) {
  const archiveRoot = join(root, config.archiveDir);
  const months = readdirSync(archiveRoot)
    .filter((name) => /^\d{4}-\d{2}\.md$/.test(name))
    .sort((left, right) => right.localeCompare(left));
  const rows = months.map((name) => {
    const count = parseLog(readFileSync(join(archiveRoot, name), "utf8")).entries
      .length;
    return `- [${name.slice(0, -3)}](${name}) — ${count} entries`;
  });
  const indexPath = join(archiveRoot, "INDEX.md");
  const existing = existsSync(indexPath)
    ? readFileSync(indexPath, "utf8")
    : "# Work Log Archive\n";
  const managed = [MANAGED_START, ...rows, MANAGED_END].join("\n");
  let next;
  if (existing.includes(MANAGED_START) && existing.includes(MANAGED_END)) {
    const start = existing.indexOf(MANAGED_START);
    const end = existing.indexOf(MANAGED_END) + MANAGED_END.length;
    next = `${existing.slice(0, start)}${managed}${existing.slice(end)}`;
  } else {
    next = `${trimTrailing(existing)}\n\n${managed}\n`;
  }
  if (!next.endsWith("\n")) next += "\n";
  if (next !== existing) atomicWrite(indexPath, next);
}

function groupBy(values, keyFunction) {
  const groups = new Map();
  for (const value of values) {
    const key = keyFunction(value);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(value);
  }
  return groups;
}

function unique(values) {
  return [...new Set(values)];
}

function hashText(text) {
  return createHash("sha256").update(text).digest("hex");
}

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function trimTrailing(text) {
  return normalizeNewlines(text).replace(/\s+$/u, "");
}

function trimBlock(text) {
  return trimTrailing(text).replace(/^\s+/u, "");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

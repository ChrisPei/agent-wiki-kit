# Agent Wiki Kit

**一个面向 Coding Agent、以仓库为载体的长期记忆与检索系统。**

[English](README.md)

Agent Wiki Kit 解决的是一个很具体的问题：对话上下文会消失，但项目的方向、决定、证据、当前状态、计划和历史修正必须跨任务持续存在。

它不是把聊天记录堆进文档，也不是要求 Agent 每轮读取整个 Wiki。它提供一个可安装的 Skill、一套小而明确的 Markdown 知识边界，以及一个无运行时依赖的 Node.js 校验与编译工具，让 Agent 能够：

- 想起项目里可能已经有相关认识；
- 用目录、摘要、关键词和链接快速找到需要的局部信息；
- 区分来源证据、当前结论、工作状态、计划意图和历史材料；
- 在认识变化时更新当前权威，同时保留来源和历史语义；
- 把真实 Wiki 目录的摘要编译进根 `AGENTS.md`，形成紧凑的常驻上下文。

## 安装

### 直接把仓库交给 Agent

把下面这句话交给能够读取 GitHub 仓库的 Agent：

```text
安装 https://github.com/ChrisPei/agent-wiki-kit 中的 Agent Wiki Kit。
读取 skills/agent-wiki-kit/SKILL.md 里的安装说明，为当前用户安装，
验证 helper，然后告诉我安装位置。
先不要初始化任何 Wiki。
```

这个 Skill 自己包含安装模式。Agent 会调用通用安装器并选择当前环境支持的 Agent，不需要用户理解各个平台的 Skill 目录。

### 一条命令安装

```bash
npx skills add ChrisPei/agent-wiki-kit --skill agent-wiki-kit --global
```

如果只想安装到当前项目，去掉 `--global`。更新已有安装：

```bash
npx skills update agent-wiki-kit --global
```

## 快速开始

要求 Node.js 20 或更高版本，不需要执行 `npm install`。

新项目初始化：

```bash
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs init --root /path/to/project
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs check --root /path/to/project
```

接管已有 Wiki：

```bash
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs doctor --root /path/to/project
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs adopt --root /path/to/project --check --json
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs adopt --root /path/to/project
```

恢复工作上下文：

```bash
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs startup --root /path/to/project
```

完成一次长期知识更新后：

```bash
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs check --root /path/to/project
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs build-agent-context --root /path/to/project
node /path/to/agent-wiki-kit/scripts/wiki-kit.mjs build-agent-context --root /path/to/project --check
```

## 调用已安装的 Skill

支持 Skill mention 的 Agent 可以显式调用：

```text
$agent-wiki-kit audit this repository's durable memory before we continue implementation.
```

## 核心边界

- `raw` 与来源登记保存证据和出处；
- `wiki` 保存可维护的当前结论；
- `work` 保存恢复状态、时间线和验证记录；
- `plans` 保存尚待实现和验收的意图；
- 代码、运行状态、测试和人工验收仍然是“实际是否成立”的更高权威。

默认目录只是新项目的起点。已有项目可以通过 `agent-wiki.config.json` 保留自己的目录和约定。

## 进一步阅读

完整的安装方式、命令表、配置、目录结构、设计原则、开发与贡献说明请阅读默认英文文档：[README.md](README.md)。

本项目采用 [MIT License](LICENSE)。

# rush-plugin

Rush 平台 Claude Code 插件集合。

## Install

```
/plugin marketplace add kanyun-inc/rush-plugin
/plugin install rush-skills@rush-plugin
/plugin install rush-skills-cowork@rush-plugin
/plugin install rush-ai@rush-plugin
```

Or from a local checkout during development:

```
/plugin marketplace add /path/to/rush-plugin
/plugin install rush-skills@rush-plugin
/plugin install rush-skills-cowork@rush-plugin
/plugin install rush-ai@rush-plugin
```

## Plugins

### `rush-skills`

Wraps the [reskill](https://github.com/nicepkg/reskill) CLI with Rush-specific defaults (registry URL, Claude Code / Cursor / Codex multi-agent install).

| Skill | Trigger |
|-------|---------|
| `rush-find-skills` | User asks "how do I do X", "find a skill for X", "is there a skill that can…" — searches Rush registry and proposes installs. |
| `rush-reskill-usage` | User wants to install / uninstall / update / publish skills, or configure `skills.json`. Full reskill CLI reference. |

Both skills default to the Rush registry `https://rush.zhenguanyu.com` and install targets `claude-code cursor codex` unless overridden.

### `rush-skills-cowork`

Claude Cowork 3P focused variant of `rush-skills`. It keeps Rush registry discovery/publishing behavior, but defaults to `claude-cowork-3p` and app-managed skill roots.

| Skill | Trigger |
|-------|---------|
| `rush-cowork-find-skills` | Claude Cowork 3P user asks "how do I do X", "find a skill for X", "is there a skill that can…" — searches Rush registry and proposes Cowork installs. |
| `rush-cowork-reskill-usage` | Claude Cowork 3P user wants to install / uninstall / update / publish skills, or needs `CLAUDE_3P_SKILLS_ROOT` guidance for multi-account environments. |

Cowork installs use:

```
npx reskill@latest install <skill> -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

When this runs inside a Cowork sandbox/VM, it may not be able to write to the Mac app-managed Cowork skills directory. The Cowork plugin should give users a copyable handoff for Code or their Mac terminal:

```
帮我安装 Skill 到 Claude Cowork 3P:

npx reskill@latest install <skill> -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

Set `CLAUDE_3P_SKILLS_ROOT=".../Claude-3p/local-agent-mode-sessions/skills-plugin/<org>/<account>"` when multiple Cowork org/account roots exist or the target account cannot be inferred.

### `rush-ai`

覆盖 Rush 平台全流程交互。封装 [`rush-ai`](https://www.npmjs.com/package/rush-ai) CLI，通过描述触发而不是显式命令。

| Skill | Trigger |
|-------|---------|
| `rush-create` | "帮我做个 X"、"搭个 landing page"、"start a web app" — 创建新项目，完成后 `git clone` 到 `~/develop/<projectId>` 继续本地迭代 |
| `rush-task-manage` | "继续改那个项目"、"任务跑完没"、"列最近任务"、"下载产物"、"取消任务" — 已有 task id 的全生命周期管理（status/send/watch/messages/files/cancel/list/result） |
| `rush-agents-discover` | "Rush 有哪些 agent"、"用 HR 分析 agent"、"call observability agent" — 发现并调用专业 agent，内部走 `agent list/info` + `task create -a <name>` |
| `rush-mcp-discover` | "Rush 上有哪些 MCP"、"找个能访问 Jira 的 MCP" — 发现 MCP server 和它们的工具 |

**依赖**：Node.js（提供 `npx`）。所有 skill 内部都通过 `npx -y rush-ai@latest` 调用 CLI，不需要单独 `npm i -g rush-ai`；`npx` 会在第一次运行时下载并缓存。首次使用需运行 `npx -y rush-ai@latest auth login` 完成登录，skill 会自动检查 auth 状态并提示。

## Upstream

`rush-skills` plugin 里的两个 SKILL.md 复制自内部 `gitlab-ee.zhenguanyu.com:infra/rush-skills`。上游更新时，重新复制 `plugins/rush-skills/skills/*/SKILL.md`，bump `plugins/rush-skills/.claude-plugin/plugin.json` 版本。

`rush-ai` plugin 里的 SKILL.md 参考 `npx -y rush-ai@latest skill hand-off` / `npx -y rush-ai@latest skill agent-shelf` 的权威文档，聚焦在**触发**而非命令细节。所有 skill 命令都走 `npx -y rush-ai@latest`，不依赖本地 `npm i -g rush-ai`。rush-ai CLI 升级时通常不需要改 SKILL.md；仅在增加新子命令 / 改变核心参数时同步。

## Layout

```
rush-plugin/
├── .claude-plugin/
│   └── marketplace.json                 # marketplace 清单
├── plugins/
│   ├── rush-skills/                     # reskill 封装
│   │   ├── .claude-plugin/plugin.json
│   │   └── skills/
│   │       ├── rush-find-skills/SKILL.md
│   │       └── rush-reskill-usage/SKILL.md
│   ├── rush-skills-cowork/              # reskill for Claude Cowork 3P
│   │   ├── .claude-plugin/plugin.json
│   │   └── skills/
│   │       ├── rush-cowork-find-skills/SKILL.md
│   │       └── rush-cowork-reskill-usage/SKILL.md
│   └── rush-ai/                         # rush-ai 全流程封装
│       ├── .claude-plugin/plugin.json
│       └── skills/
│           ├── rush-create/SKILL.md
│           ├── rush-task-manage/SKILL.md
│           ├── rush-agents-discover/SKILL.md
│           └── rush-mcp-discover/SKILL.md
└── README.md
```

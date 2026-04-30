# rush-plugin

Rush 平台 Claude Code 插件集合。

## Install

```
/plugin marketplace add kanyun-inc/rush-plugin
/plugin install rush-skills@rush-plugin
/plugin install rush-create@rush-plugin
```

Or from a local checkout during development:

```
/plugin marketplace add /path/to/rush-plugin
/plugin install rush-skills@rush-plugin
/plugin install rush-create@rush-plugin
```

## Plugins

### `rush-skills`

Wraps the [reskill](https://github.com/nicepkg/reskill) CLI with Rush-specific defaults (registry URL, Claude Code / Cursor / Codex multi-agent install).

| Skill | Trigger |
|-------|---------|
| `rush-find-skills` | User asks "how do I do X", "find a skill for X", "is there a skill that can…" — searches Rush registry and proposes installs. |
| `rush-reskill-usage` | User wants to install / uninstall / update / publish skills, or configure `skills.json`. Contains the full reskill CLI reference. |

Both skills default to the Rush registry `https://rush.zhenguanyu.com` and install targets `claude-code cursor codex` unless overridden.

### `rush-create`

当用户提出"帮我做一个 X / 搭个 X / 做个 demo"等**创建新项目**需求时自动激活。走 [`rush-ai`](https://www.npmjs.com/package/rush-ai) 在 Rush 平台起任务，完成后把生成的 repo clone 到本地 (`~/develop/<projectId>`)，Claude Code / Cursor 接管本地迭代。

| Skill | Trigger |
|-------|---------|
| `rush-create` | "帮我做个 X"、"搭个 X"、"新建项目"、"build a landing page"、"spin up a demo" — 相关 net-new 项目创建需求 |

依赖：本地已安装 `rush-ai` CLI 并完成 `rush-ai auth login`。

## Upstream

`rush-skills` plugin 里的两个 SKILL.md 复制自内部 `gitlab-ee.zhenguanyu.com:infra/rush-skills`。上游更新时，重新复制 `plugins/rush-skills/skills/*/SKILL.md`，bump `plugins/rush-skills/.claude-plugin/plugin.json` 版本。

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
│   └── rush-create/                     # rush-ai 项目创建交接
│       ├── .claude-plugin/plugin.json
│       └── skills/
│           └── rush-create/SKILL.md
└── README.md
```

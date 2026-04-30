# rush-plugin

Rush 平台 Claude Code 插件集合。当前包含一个 plugin（`rush-skills`），规划中还会加入项目创建交接等 plugin。

## Install

```
/plugin marketplace add kanyun-inc/rush-plugin
/plugin install rush-skills@rush-plugin
```

Or from a local checkout during development:

```
/plugin marketplace add /path/to/rush-plugin
/plugin install rush-skills@rush-plugin
```

## Plugins

### `rush-skills`

Wraps the [reskill](https://github.com/nicepkg/reskill) CLI with Rush-specific defaults (registry URL, Claude Code / Cursor / Codex multi-agent install).

| Skill | Trigger |
|-------|---------|
| `rush-find-skills` | User asks "how do I do X", "find a skill for X", "is there a skill that can…" — searches Rush registry and proposes installs. |
| `rush-reskill-usage` | User wants to install / uninstall / update / publish skills, or configure `skills.json`. Contains the full reskill CLI reference. |

Both skills default to the Rush registry `https://rush.zhenguanyu.com` and install targets `claude-code cursor codex` unless overridden.

## Upstream

`rush-skills` plugin 里的两个 SKILL.md 复制自内部 `gitlab-ee.zhenguanyu.com:infra/rush-skills`。上游更新时，重新复制 `plugins/rush-skills/skills/*/SKILL.md`，bump `plugins/rush-skills/.claude-plugin/plugin.json` 版本。

## Layout

```
rush-plugin/
├── .claude-plugin/
│   └── marketplace.json                 # marketplace 清单
├── plugins/
│   └── rush-skills/                     # reskill 封装
│       ├── .claude-plugin/plugin.json
│       └── skills/
│           ├── rush-find-skills/SKILL.md
│           └── rush-reskill-usage/SKILL.md
└── README.md
```

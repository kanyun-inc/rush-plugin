# rush-skills-plugin

Claude Code plugin for discovering, installing, and publishing skills on the Rush skill registry.

This plugin wraps the [reskill](https://github.com/nicepkg/reskill) CLI with Rush-specific defaults (registry URL, Claude Code / Cursor / Codex multi-agent install). It is intended for engineers working inside the Kanyun Rush ecosystem.

## Install

```
/plugin marketplace add kanyun-inc/rush-skills-plugin
/plugin install rush-skills@rush-skills-plugin
```

Or from a local checkout during development:

```
/plugin marketplace add /path/to/rush-skills-plugin
/plugin install rush-skills@rush-skills-plugin
```

## What you get

| Skill | Trigger |
|-------|---------|
| `rush-find-skills` | User asks "how do I do X", "find a skill for X", "is there a skill that can…" — searches Rush registry and proposes installs. |
| `rush-reskill-usage` | User wants to install / uninstall / update / publish skills, or configure `skills.json`. Contains the full reskill CLI reference. |

Both skills default to the Rush registry `https://rush.zhenguanyu.com` and install targets `claude-code cursor codex` unless overridden.

## Upstream

The skills are copied from the internal Rush skill repo at `gitlab-ee.zhenguanyu.com:infra/rush-skills`. When upstream updates, re-copy the `SKILL.md` files under `plugins/rush-skills/skills/*/SKILL.md` and bump the plugin version in `plugins/rush-skills/.claude-plugin/plugin.json`.

## Layout

```
rush-skills-plugin/
├── .claude-plugin/
│   └── marketplace.json                 # marketplace manifest (self-referencing)
├── plugins/
│   └── rush-skills/
│       ├── .claude-plugin/plugin.json   # plugin metadata
│       └── skills/
│           ├── rush-find-skills/SKILL.md
│           └── rush-reskill-usage/SKILL.md
└── README.md
```

---
name: rush-cowork-reskill-usage
description: Use when a Claude Cowork 3P user wants to install, uninstall, update, publish, or manage Rush skills through reskill. Defaults to claude-cowork-3p and explains CLAUDE_3P_SKILLS_ROOT for multi-account environments.
version: 0.1.0
author: reskill
tags:
  - cli
  - package-manager
  - skills
  - reskill
  - claude-cowork-3p
---

# reskill Usage for Claude Cowork 3P

> **Default Registry:** `https://rush.zhenguanyu.com/`
> **Default Agent Target:** `claude-cowork-3p`

`reskill` is a Git-based package manager for AI agent skills. In this plugin, the primary workflow is helping Claude Cowork 3P users prepare installs that are executed from a Mac-local Code or terminal environment.

Claude Cowork 3P reads skills from the user's Mac app-managed directory under `~/Library/Application Support/Claude-3p/...`. If this skill is running inside a sandbox, VM, or remote agent environment, that directory may not be writable or visible. In that case, do not run install commands directly and claim the skill is installed. Instead, give the user a copyable command and a short handoff prompt for Code or their Mac terminal.

## Execution Rules

1. Always add `-y` to commands that may prompt.
2. Always include `--registry https://rush.zhenguanyu.com` for registry-based commands unless the user explicitly gives another registry.
3. For Claude Cowork 3P installs, always include `-a claude-cowork-3p`.
4. For Claude Cowork 3P app-managed installs, include `--skip-manifest` so project `skills.json` and `skills.lock` are not changed.
5. If running inside Cowork sandbox/VM/remote agent context, do not run the install command directly. Tell the user to click the top `Code` tab and provide a Code/Mac-terminal handoff instead.
6. Only run install commands directly when you can verify the current environment has access to the user's Mac `Claude-3p` app-managed skills root.
7. Keep the install target as `claude-cowork-3p` unless the user explicitly asks for another target. Code or a Mac terminal may be used only as the execution environment.

## Recommended Cowork Install Flow

When a Cowork user asks to install a skill from inside Cowork, prepare a handoff like this:

```text
请先点击顶部的 Code，切换到 Code 模式，然后把下面这段发给 Code 执行：

帮我安装 Skill 到 Claude Cowork 3P:

npx reskill@latest install <skill> -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

Tell the user that the `Code` tab is the preferred path because it runs on the Mac-local side that can write to the real Cowork skills directory. If Code is unavailable, tell the user to run the command in their Mac terminal instead.

If the user has multiple Cowork org/account roots, include the explicit root:

```text
请先点击顶部的 Code，切换到 Code 模式，然后把下面这段发给 Code 执行：

帮我安装 Skill 到 Claude Cowork 3P 的指定账号:

CLAUDE_3P_SKILLS_ROOT=".../Claude-3p/local-agent-mode-sessions/skills-plugin/<org>/<account>" \
  npx reskill@latest install <skill> -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

## Core Commands

```bash
# Search the Rush registry
npx reskill@latest find "<query>" --json --registry https://rush.zhenguanyu.com

# Install a registry skill into Claude Cowork 3P from a Mac-local Code or terminal environment
npx reskill@latest install <skill> -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest

# Install from a GitHub source into Claude Cowork 3P from a Mac-local Code or terminal environment
npx reskill@latest install github:org/repo/path/to/skill@latest -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest

# List installed skills
npx reskill@latest list --registry https://rush.zhenguanyu.com

# Show skill details
npx reskill@latest info <skill> --registry https://rush.zhenguanyu.com
```

If `reskill` is installed globally, `reskill <command>` can be used instead of `npx reskill@latest <command>`.

## Claude Cowork 3P Skills Root

Claude Cowork 3P stores app-managed skills under:

```text
Claude-3p/local-agent-mode-sessions/skills-plugin/<org>/<account>/skills
```

Most users do not need to set an environment variable. Set `CLAUDE_3P_SKILLS_ROOT` when:

- Multiple Claude Cowork 3P org/account roots exist
- The user wants to install into a specific org/account
- The active Cowork account cannot be inferred
- A command fails because the Cowork skills root is ambiguous or missing

The value should be the account root, not the final `skills` directory:

```bash
CLAUDE_3P_SKILLS_ROOT=".../Claude-3p/local-agent-mode-sessions/skills-plugin/<org>/<account>" \
  npx reskill@latest install <skill> -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

If Cowork is running the skill from a sandbox that cannot access this Mac path, `CLAUDE_3P_SKILLS_ROOT` cannot fix the install by itself. In that case, hand off the command to Code or the user's Mac terminal.

## Source Formats

```bash
# Registry package
npx reskill@latest install @scope/skill-name -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest

# GitHub shorthand
npx reskill@latest install github:user/skill@v1.0.0 -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest

# GitHub subpath in a monorepo
npx reskill@latest install github:org/repo/skills/planning@latest -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest

# Full Git URL
npx reskill@latest install https://github.com/user/skill.git -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest

# HTTP archive
npx reskill@latest install https://example.com/skill.tar.gz -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

## Updating and Removing

Use the same Cowork root rules when updating or reinstalling skills. If the user needs to target a specific Cowork account, prefix the command with `CLAUDE_3P_SKILLS_ROOT=...`.

```bash
# Update all known skills
npx reskill@latest update --registry https://rush.zhenguanyu.com

# Reinstall a Cowork skill
npx reskill@latest install <skill> -y -f -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest

# Uninstall a skill when supported by the installed reskill version
npx reskill@latest uninstall <skill> -y --registry https://rush.zhenguanyu.com
```

## Publishing

Publishing uses the Rush registry:

```bash
# Validate without publishing
npx reskill@latest publish --dry-run --registry https://rush.zhenguanyu.com

# Publish and skip confirmation
npx reskill@latest publish -y --registry https://rush.zhenguanyu.com
```

Authentication:

```bash
npx reskill@latest login --registry https://rush.zhenguanyu.com --token <token>
npx reskill@latest whoami --registry https://rush.zhenguanyu.com
```

Tokens are stored in `~/.reskillrc`. `RESKILL_TOKEN` can be used for CI or one-off authenticated commands.

## Troubleshooting

| Symptom | Likely Cause | Fix |
| ------- | ------------ | --- |
| Install succeeds but Cowork cannot see the skill | Command ran in a sandbox/VM and wrote to a temporary local path | Give the user a Code/Mac-terminal handoff command and have it run on the Mac |
| Cowork install target not found | `reskill` cannot locate Claude Cowork 3P | Verify the installed `reskill` version supports `claude-cowork-3p` |
| Wrong Cowork account receives the skill | Multiple org/account roots exist | Set `CLAUDE_3P_SKILLS_ROOT` to the desired account root |
| `skills.json` changes unexpectedly | Missing `--skip-manifest` | Re-run with `--skip-manifest` for app-managed Cowork installs |
| Registry skill not found | Wrong registry or package name | Search with `find` and `--registry https://rush.zhenguanyu.com` |
| Network or Git fetch failure | Git host connectivity issue | Retry after checking network or existing Git credentials |

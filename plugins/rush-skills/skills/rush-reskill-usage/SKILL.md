---
name: rush-reskill-usage
description: Use when the user wants to install, uninstall, update, publish, or manage AI agent skills (e.g., "install a skill", "安装一个skill", "add this skill", "发布skill", "remove a skill"). Provides reskill CLI commands, source formats (GitHub, GitLab, registry), skills.json configuration, and multi-agent support.
version: 0.2.5
author: reskill
tags:
  - cli
  - package-manager
  - skills
  - reskill
---

<!-- source: README.md -->
<!-- synced: 2026-04-13 -->

# reskill Usage Guide

> **Default Registry:** `https://rush.zhenguanyu.com/`
> If no registry is configured (no `--registry`, no `RESKILL_REGISTRY` env, no `defaults.publishRegistry` in skills.json), use `--registry https://rush.zhenguanyu.com` for registry-based commands (`find`, `install`, `publish`, `login`).

reskill is a Git-based package manager for AI agent skills. It provides declarative configuration (`skills.json` + `skills.lock`), flexible versioning, and multi-agent support for installing, managing, and sharing skills across projects and teams.

**Requirements:** Node.js >= 18.0.0

**CLI usage:** If `reskill` is installed globally, use it directly. Otherwise use `npx reskill@latest`:

```bash
npm install -g reskill        # Global install
npx reskill@latest <command>  # Or use npx directly (no install needed)
```

## When to Use This Skill

Use this skill when the user:

- Wants to install, update, or manage AI agent skills
- Mentions `skills.json`, `skills.lock`, or reskill-related concepts
- Wants to publish a skill to a registry
- Asks about supported install formats (GitHub, GitLab, HTTP, OSS, registry, etc.)
- Encounters reskill-related errors or needs troubleshooting
- Wants to set up a project for skill management
- Asks about multi-agent skill installation (Cursor, Claude Code, Codex, etc.)

## AI Agent Execution Rules

**Rule 1: Always add `-y`**. AI agents cannot respond to interactive prompts mid-command. Always add `-y` to commands that support confirmation prompts (`install`, `uninstall`, `publish`) to prevent the command from hanging.

**Rule 2: Always add `--registry`**. All reskill commands must include `--registry <url>`. Determine the URL in this order:
1. Use `defaults.publishRegistry` from the project's `skills.json` if it exists
2. Use the `RESKILL_REGISTRY` environment variable if set
3. Otherwise default to `--registry https://rush.zhenguanyu.com`

**Rule 3: Use proxy for Git sources**. When installing from Git sources (GitHub, GitLab, etc.), if the command fails due to network issues (timeout, connection refused, etc.), set git proxy before retrying, and **always unset it afterwards** to avoid polluting the user's git config:

```bash
git config --global http.proxy http://proxy-aws-us.zhenguanyu.com:8118 && \
git config --global https.proxy http://proxy-aws-us.zhenguanyu.com:8118 && \
reskill install github:user/skill -y --registry https://rush.zhenguanyu.com; \
git config --global --unset http.proxy; \
git config --global --unset https.proxy
```

```bash
# Correct — will not hang, has registry, and uses proxy if needed
reskill install github:user/skill -y --registry https://rush.zhenguanyu.com
# If above fails with network error, retry with proxy (set → install → unset):
git config --global http.proxy http://proxy-aws-us.zhenguanyu.com:8118 && \
git config --global https.proxy http://proxy-aws-us.zhenguanyu.com:8118 && \
reskill install github:user/skill -y --registry https://rush.zhenguanyu.com; \
git config --global --unset http.proxy; \
git config --global --unset https.proxy

reskill uninstall skill-name -y --registry https://rush.zhenguanyu.com
reskill publish -y --registry https://rush.zhenguanyu.com

# Wrong — will hang, missing registry
reskill install github:user/skill
reskill uninstall skill-name
```

## Quick Start

```bash
# Initialize a new project
npx reskill@latest init

# Install a skill
npx reskill@latest install github:anthropics/skills/skills/frontend-design@latest

# List installed skills
npx reskill@latest list
```

## Commands

| Command               | Alias                | Description                               |
| --------------------- | -------------------- | ----------------------------------------- |
| `init`                | -                    | Initialize `skills.json`                  |
| `find <query>`        | `search`             | Search for skills in the registry         |
| `install [skills...]` | `i`                  | Install one or more skills                |
| `list`                | `ls`                 | List installed skills                     |
| `info <skill>`        | -                    | Show skill details                        |
| `update [skill]`      | `up`                 | Update skills                             |
| `outdated`            | -                    | Check for outdated skills                 |
| `uninstall <skill>`   | `un`, `rm`, `remove` | Remove a skill                            |
| `group`               | -                    | Manage skill groups ¹                     |
| `publish [path]`      | `pub`                | Publish a skill to the registry ¹         |
| `login`               | -                    | Authenticate with the registry ¹          |
| `logout`              | -                    | Remove stored authentication ¹            |
| `whoami`              | -                    | Display current logged in user ¹          |
| `doctor`              | -                    | Diagnose environment and check for issues |
| `completion [action]` | -                    | Setup or remove shell tab completion      |

> ¹ Registry commands (`group`, `publish`, `login`, `logout`, `whoami`) use the Rush registry (`https://rush.zhenguanyu.com`).

Run `reskill <command> --help` for complete options and detailed usage.

### Common Options

| Option                    | Commands                                                      | Description                                                   |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `--no-save`               | `install`                                                     | Install without saving to `skills.json` (for personal skills) |
| `-g, --global`            | `install`, `uninstall`, `list`                                | Install/manage skills globally (user directory)               |
| `-a, --agent <agents...>` | `install`                                                     | Specify target agents (e.g., `cursor`, `claude-code`)         |
| `--mode <mode>`           | `install`                                                     | Installation mode: `symlink` (default) or `copy`              |
| `--all`                   | `install`                                                     | Install to all agents                                         |
| `-y, --yes`               | `install`, `uninstall`, `publish`                             | Skip confirmation prompts                                     |
| `-f, --force`             | `install`                                                     | Force reinstall even if already installed                     |
| `-s, --skill <names...>`  | `install`                                                     | Select specific skill(s) by name from a multi-skill repo      |
| `--list`                  | `install`                                                     | List available skills in the repository without installing    |
| `--skip-manifest`         | `install`                                                     | Skip all `skills.json` and `skills.lock` writes (for platform integration) |
| `-t, --token <token>`     | `install`, `find`, `group`, `publish`, `login`                | Auth token for registry API requests (for CI/CD)              |
| `-r, --registry <url>`    | `install`, `find`, `group`, `publish`, `login`, `logout`, `whoami` | Registry URL override for registry-enabled commands      |
| `--tag <tag>`             | `publish`                                                     | Git tag to publish                                            |
| `--access <level>`        | `publish`                                                     | Access level: `public` (default) or `restricted`              |
| `-n, --dry-run`           | `publish`                                                     | Validate without publishing                                   |
| `-g, --group <path>`      | `publish`                                                     | Publish skill into a group (e.g., `kanyun/frontend`)          |
| `-j, --json`              | `list`, `info`, `outdated`, `doctor`, `group`, `find`         | Output as JSON                                                |
| `-l, --limit <n>`         | `find`                                                        | Maximum number of search results                              |
| `--skip-network`          | `doctor`                                                      | Skip network connectivity checks                             |

## Source Formats

reskill supports installing skills from multiple sources:

```bash
# GitHub shorthand
npx reskill@latest install github:user/skill@v1.0.0

# GitLab shorthand
npx reskill@latest install gitlab:group/skill@latest

# Full Git URL (HTTPS)
npx reskill@latest install https://github.com/user/skill.git

# Full Git URL (SSH)
npx reskill@latest install git@github.com:user/skill.git

# GitHub/GitLab web URL (with branch and subpath)
npx reskill@latest install https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines

# Custom registry (self-hosted GitLab, etc.)
npx reskill@latest install gitlab.company.com:team/skill@v1.0.0

# HTTP/OSS archives
npx reskill@latest install https://example.com/skills/my-skill-v1.0.0.tar.gz
npx reskill@latest install oss://bucket/path/skill.tar.gz
npx reskill@latest install s3://bucket/path/skill.zip

# Registry-based
npx reskill@latest install @scope/skill-name@1.0.0 --registry https://rush.zhenguanyu.com
npx reskill@latest install skill-name --registry https://rush.zhenguanyu.com

# Install multiple skills at once
npx reskill@latest install github:user/skill1 github:user/skill2@v1.0.0
```

### Monorepo Support

For repositories containing multiple skills, you can install a specific skill by path or install all skills from a parent directory:

```bash
# Shorthand format with subpath
npx reskill@latest install github:org/monorepo/skills/planning@v1.0.0
npx reskill@latest install gitlab:company/skills/frontend/components@latest

# URL format with subpath
npx reskill@latest install https://github.com/org/monorepo.git/skills/planning@v1.0.0
npx reskill@latest install git@gitlab.company.com:team/skills.git/backend/apis@v2.0.0

# GitHub web URL automatically extracts subpath
npx reskill@latest install https://github.com/org/monorepo/tree/main/skills/planning

# Point to a parent directory — auto-detects and installs all child skills
npx reskill@latest install https://github.com/org/monorepo/tree/main/skills
```

When the target directory has no root `SKILL.md` but contains subdirectories with `SKILL.md` files, reskill automatically discovers and installs all child skills. Each skill is saved separately in `skills.json`.

### HTTP/OSS URL Support

Skills can be installed directly from HTTP/HTTPS URLs pointing to archive files:

| Format       | Example                                                    | Description              |
| ------------ | ---------------------------------------------------------- | ------------------------ |
| HTTPS URL    | `https://example.com/skill.tar.gz`                         | Direct download URL      |
| Aliyun OSS   | `https://bucket.oss-cn-hangzhou.aliyuncs.com/skill.tar.gz` | Aliyun OSS URL           |
| AWS S3       | `https://bucket.s3.amazonaws.com/skill.tar.gz`             | AWS S3 URL               |
| OSS Protocol | `oss://bucket/path/skill.tar.gz`                           | Shorthand for Aliyun OSS |
| S3 Protocol  | `s3://bucket/path/skill.tar.gz`                            | Shorthand for AWS S3     |

**Supported archive formats:** `.tar.gz`, `.tgz`, `.zip`, `.tar`

### Version Formats

| Format | Example           | Description                        |
| ------ | ----------------- | ---------------------------------- |
| Exact  | `@v1.0.0`         | Lock to specific tag               |
| Latest | `@latest`         | Get the latest tag                 |
| Range  | `@^2.0.0`         | Semver compatible (>=2.0.0 <3.0.0) |
| Branch | `@branch:develop` | Specific branch                    |
| Commit | `@commit:abc1234` | Specific commit hash               |
| (none) | -                 | Default branch (main)              |

## Configuration

### skills.json

The project configuration file, created by `reskill init`:

```json
{
  "skills": {
    "planning": "github:user/planning-skill@v1.0.0",
    "internal-tool": "internal:team/tool@latest"
  },
  "registries": {
    "internal": "https://gitlab.company.com"
  },
  "defaults": {
    "installDir": ".skills",
    "targetAgents": ["cursor", "claude-code"],
    "installMode": "symlink"
  }
}
```

- `skills` — Installed skill references (name → source ref)
- `registries` — Custom Git registry aliases
- `defaults.installDir` — Where skills are stored (default: `.skills`)
- `defaults.targetAgents` — Default agents to install to
- `defaults.installMode` — `symlink` (default, recommended) or `copy`

### Environment Variables

| Variable            | Description                                     | Default                       |
| ------------------- | ----------------------------------------------- | ----------------------------- |
| `RESKILL_CACHE_DIR` | Global cache directory                          | `~/.reskill-cache`            |
| `RESKILL_TOKEN`     | Auth token (takes precedence over ~/.reskillrc) | -                             |
| `RESKILL_REGISTRY`  | Default registry URL                            | `https://rush.zhenguanyu.com` |
| `RESKILL_NO_MANIFEST` | Skip `skills.json` and `skills.lock` writes (set to `1` to enable) | -              |
| `DEBUG`             | Enable debug logging                            | -                             |
| `VERBOSE`           | Enable debug logging (same effect as `DEBUG`)   | -                             |
| `NO_COLOR`          | Disable colored output                          | -                             |

## Multi-Agent Support

Skills are installed to `.skills/` by default and can be integrated with any agent:

| Agent          | Path               |
| -------------- | ------------------ |
| Amp            | `.agents/skills`   |
| Antigravity    | `.agent/skills`    |
| Claude Code    | `.claude/skills`   |
| Clawdbot       | `skills`           |
| Codex          | `.codex/skills`    |
| Cursor         | `.cursor/skills`   |
| Droid          | `.factory/skills`  |
| Gemini CLI     | `.gemini/skills`   |
| GitHub Copilot | `.github/skills`   |
| Goose          | `.goose/skills`    |
| Kilo Code      | `.kilocode/skills` |
| Kiro CLI       | `.kiro/skills`     |
| Neovate        | `.neovate/skills`  |
| OpenCode       | `.opencode/skills` |
| Roo Code       | `.roo/skills`      |
| Trae           | `.trae/skills`     |
| Windsurf       | `.windsurf/skills` |

Use `--agent` to target specific agents, or `--all` to install to all detected agents:

```bash
# Install to specific agents
reskill install github:user/skill -a cursor claude-code

# Install to all detected agents
reskill install github:user/skill --all
```

## Publishing

> **Note:** Publishing uses the Rush registry (`https://rush.zhenguanyu.com`).

### Authentication

**获取 Token：**

1. 打开 https://rush.zhenguanyu.com/next/skills/tokens
2. 点击「创建」按钮，生成一个新的 Token
3. 复制生成的 Token

```bash
# 使用获取的 Token 登录
reskill login --registry https://rush.zhenguanyu.com --token <token>

# Check current login status
reskill whoami

# Logout
reskill logout
```

Tokens are stored in `~/.reskillrc`. You can also use the `RESKILL_TOKEN` environment variable (takes precedence, useful for CI/CD).

Registry URL resolution priority:
1. `--registry` CLI option
2. `RESKILL_REGISTRY` environment variable
3. `defaults.publishRegistry` in `skills.json`

### Publishing a Skill

```bash
# Validate without publishing (recommended first step)
reskill publish --dry-run --registry https://rush.zhenguanyu.com

# Publish the skill
reskill publish --registry https://rush.zhenguanyu.com

# Publish from a specific directory
reskill publish ./path/to/skill --registry https://rush.zhenguanyu.com

# Skip confirmation
reskill publish -y --registry https://rush.zhenguanyu.com
```

The skill directory must contain a valid `SKILL.md` with `name`, `version`, and `description` in its frontmatter.

## Common Workflows

### First-Time Project Setup

```bash
# 1. Initialize the project
reskill init -y

# 2. Install skills your project needs
reskill install github:user/skill1@v1.0.0 github:user/skill2@latest -y

# 3. Verify installation
reskill list

# 4. Commit skills.json and skills.lock to version control
# (These files ensure team members get the same skill versions)
```

### Team Collaboration

When a teammate clones the project, they run:

```bash
# Reinstall all skills from skills.json (like npm install)
reskill install
```

This reads `skills.json` + `skills.lock` and installs the exact same versions.

### Checking and Updating Skills

```bash
# Check which skills have newer versions
reskill outdated

# Update all skills
reskill update

# Update a specific skill
reskill update skill-name
```

### Global vs Project-Level Installation

| Scope   | Flag | Directory               | Use Case                                   |
| ------- | ---- | ----------------------- | ------------------------------------------ |
| Project | -    | `.skills/` (in project) | Team-shared skills, committed to git       |
| Global  | `-g` | `~/.agents/skills/`     | Personal skills, available in all projects |

```bash
# Project-level (default)
reskill install github:user/skill

# Global (personal, all projects)
reskill install github:user/skill -g

# Personal project-level (not saved to skills.json)
reskill install github:user/skill --no-save
```

### Diagnosing Issues

```bash
# Run environment diagnostics
reskill doctor

# JSON output for programmatic use
reskill doctor --json
```

The `doctor` command checks: reskill version, Node.js version, Git availability, cache directory, `skills.json` validity, `skills.lock` sync, installed skills integrity, and network connectivity.

## Troubleshooting

| Error Message                        | Cause                                 | Solution                                                 |
| ------------------------------------ | ------------------------------------- | -------------------------------------------------------- |
| `skills.json not found`              | Project not initialized               | Run `reskill init`                                       |
| `Unknown scope @xyz`                 | No registry configured for this scope | Check `registries` in `skills.json` or use full Git URL  |
| `Skill not found`                    | Skill name doesn't exist in registry  | Verify skill name; check `reskill find <query>`          |
| `Version not found`                  | Requested version doesn't exist       | Run `reskill info <skill>` to see available versions     |
| `Permission denied`                  | Auth issue when publishing            | Run `reskill login`; check token scope                   |
| `Token is invalid or expired`        | Stale authentication                  | Re-authenticate with `reskill login --token <new-token>` |
| `Network error`                      | Cannot reach Git host or registry     | Check network; run `reskill doctor` for diagnostics      |
| `Conflict: directory already exists` | Skill already installed               | Use `--force` to reinstall                               |

### Private Repositories

reskill uses your existing git credentials (SSH keys or credential helper). For CI/CD environments:

```bash
# GitLab CI
git config --global url."https://gitlab-ci-token:${CI_JOB_TOKEN}@gitlab.company.com/".insteadOf "https://gitlab.company.com/"
```

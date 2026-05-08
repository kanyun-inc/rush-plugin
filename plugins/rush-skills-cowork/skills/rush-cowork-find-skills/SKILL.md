---
name: rush-cowork-find-skills
description: Helps Claude Cowork 3P users discover and install Rush skills when they ask questions like "how do I do X", "find a skill for X", or "is there a skill that can...". Uses reskill with the claude-cowork-3p target.
version: 0.1.0
author: reskill
tags:
  - discovery
  - search
  - skills
  - package-manager
  - claude-cowork-3p
---

# Find Skills for Claude Cowork 3P

> **Default Registry:** `https://rush.zhenguanyu.com/`
> **Default Agent Target:** `claude-cowork-3p`

This skill helps Claude Cowork 3P users discover and install skills from the Rush registry through `reskill`.

## Key Principles

1. **Search -> Present -> Ask -> Install**. Show relevant results first and ask before installing.
2. **Use the Rush registry**. Include `--registry https://rush.zhenguanyu.com` unless the user explicitly gives another registry.
3. **Target Claude Cowork 3P by default**. Install with `-a claude-cowork-3p`.
4. **Skip project manifests for Cowork installs**. Include `--skip-manifest` so app-managed installs do not modify `skills.json` or `skills.lock`.
5. **Stay Cowork-focused**. Do not recommend Cursor, Claude Code, Codex, or other agent install targets unless the user explicitly asks for them.

## When to Use This Skill

Use this skill when the user:

- Asks "how do I do X" where X might have an existing skill
- Says "find a skill for X" or "is there a skill for X"
- Wants to search the Rush skill registry
- Wants to install a discovered skill into Claude Cowork 3P
- Mentions Claude Cowork 3P skills, Cowork skill discovery, or `claude-cowork-3p`

## CLI Basics

If `reskill` is installed globally, use it directly. Otherwise use `npx reskill@latest`:

```bash
npx reskill@latest find "<query>" --json --registry https://rush.zhenguanyu.com
npx reskill@latest install <skill> -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

## Search Workflow

### Step 1: Understand the Need

Identify the user's:

- Domain, such as React, testing, deployment, data, documentation, or design
- Concrete task
- Constraints, such as "for Cowork", "internal", "private registry", or "specific account"

### Step 2: Search Progressively

Use JSON output for structured filtering:

```bash
npx reskill@latest find "<query>" --json --registry https://rush.zhenguanyu.com
```

Try searches in this order:

1. Natural query: `"frontend design"`
2. Hyphenated query: `"frontend-design"`
3. Most specific keyword: `"frontend"`
4. Synonyms only if needed: `"ui"`, `"react"`, `"deployment"`, `"review"`

Stop as soon as you find relevant results. Read each result's `description` and only present results that match the user's actual task.

### Step 3: Present Results

For each relevant result, show:

- Skill name
- Description
- Version and publisher, if available
- Registry used
- Cowork install command

Example:

```text
Found a likely match from the Rush registry:

@scope/react-best-practices (v1.2.0)
React and performance optimization guidelines.

Install into Claude Cowork 3P:
npx reskill@latest install @scope/react-best-practices -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

Ask before installing. If the user confirms, run the Cowork install command.

## Multi-Account Claude Cowork 3P Installs

Claude Cowork 3P installs into an app-managed skills root:

```text
Claude-3p/local-agent-mode-sessions/skills-plugin/<org>/<account>/skills
```

Most installs should work with only `-a claude-cowork-3p`. Use `CLAUDE_3P_SKILLS_ROOT` when:

- The user has multiple Cowork org/account sessions and wants a specific one
- `reskill` cannot infer the active Cowork account
- The user provides a specific app-managed skills root
- You need to install into a non-current Cowork account

Example:

```bash
CLAUDE_3P_SKILLS_ROOT=".../Claude-3p/local-agent-mode-sessions/skills-plugin/<org>/<account>" \
  npx reskill@latest install <skill> -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

Do not append `/skills` to `CLAUDE_3P_SKILLS_ROOT`; it should point at the account root that contains or will contain the `skills` directory.

## No Results

If no relevant skill is found after the progressive search:

1. Say what you searched for.
2. Offer to help directly with the task.
3. Mention that the user can create or publish a new skill with `rush-cowork-reskill-usage`.

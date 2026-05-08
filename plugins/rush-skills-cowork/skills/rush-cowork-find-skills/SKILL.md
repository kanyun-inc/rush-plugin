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
5. **Use a Code/Mac-terminal handoff when running inside Cowork**. Cowork sandbox installs may not reach the user's Mac app-managed skills directory. Tell the user to click the top `Code` tab before pasting the handoff.
6. **Stay Cowork-focused**. The install target should remain `claude-cowork-3p` unless the user explicitly asks for another target. Code or a Mac terminal may be used only as the execution environment.

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
- Cowork install command and a Code/Mac-terminal handoff prompt

Example:

```text
Found a likely match from the Rush registry:

@scope/react-best-practices (v1.2.0)
React and performance optimization guidelines.

Install into Claude Cowork 3P from Code or a Mac terminal:
npx reskill@latest install @scope/react-best-practices -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

Ask before installing. If this skill is running inside Cowork or another sandbox/VM, do not run the Cowork install command directly. Give the user a copyable handoff instead:

```text
请先点击顶部的 Code，切换到 Code 模式，然后把下面这段发给 Code 执行：

帮我安装 Skill 到 Claude Cowork 3P:

npx reskill@latest install @scope/react-best-practices -y -a claude-cowork-3p --registry https://rush.zhenguanyu.com --skip-manifest
```

Only run the install command yourself when you can verify the current environment has access to the user's Mac `Claude-3p` app-managed skills root.

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

If the current Cowork environment cannot access the Mac app-managed path, setting this variable in the sandbox will not install the skill where Cowork can read it. Hand off the command to Code or the user's Mac terminal instead.

## No Results

If no relevant skill is found after the progressive search:

1. Say what you searched for.
2. Offer to help directly with the task.
3. Mention that the user can create or publish a new skill with `rush-cowork-reskill-usage`.

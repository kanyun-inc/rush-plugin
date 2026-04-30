---
name: rush-mcp-discover
description: Activate when the user wants to discover which MCP servers are available on the Rush platform, or inspect the tools an MCP server exposes. Triggers include "rush 上有哪些 MCP"、"找个能访问 X 的 MCP"、"这个 MCP server 有什么工具"、"list MCP servers"、"rush mcp tools". Uses `npx -y rush-ai@latest mcp list / list-tools`. Do NOT use for local MCP config (that's IDE-level settings.json) or for running the Rush MCP bridge (`npx -y rush-ai@latest mcp serve`, which is a one-time install step).
---

# Skill: Discover MCP servers on the Rush platform

Rush hosts a library of MCP servers that Rush agents can tap into (Jira, Octopus, internal data sources, etc.). Use this skill when the user wants to know what's available, or to attach a specific MCP to a task they're creating.

## When to activate

- User asks "Rush 上有哪些 MCP 能用".
- User asks "有没有能访问 X 的 MCP"（Jira / Octopus / internal DB / etc.）.
- User wants to see what tools a particular MCP server exposes.
- You're building a `task create` prompt and need to pick which MCP(s) to pass to `--mcp`.

Do NOT activate for:

- **Local Claude Code / Cursor MCP configuration** — that's `settings.json` / IDE-level, not Rush. Use the IDE's own docs.
- **Running the Rush MCP bridge** (`npx -y rush-ai@latest mcp serve`) — one-time setup, put the command in README / install docs, not in a triggered skill.
- Generic "what is MCP" questions — those are docs questions.

## Prereq

All commands below run via `npx -y rush-ai@latest` — no separate install needed. `npx` resolves and caches the package on first run. If `npx` itself is missing, ask the user to install Node.js first.

```bash
npx -y rush-ai@latest auth status --json
```

Not authenticated → stop, ask user to run `npx -y rush-ai@latest auth login`.

## Playbook

### 1. List MCP servers

```bash
npx -y rush-ai@latest mcp list --json
```

Each entry typically includes `id`, `name`, `description` — scan for the domain the user cares about.

### 2. Inspect a server's tools

```bash
npx -y rush-ai@latest mcp list-tools <server-id> --json
```

Lists the individual tools that MCP exposes. Useful when the user asks "这个 MCP 能做什么具体操作".

### 3. Attach to a task (if creating one)

If the MCP is meant to be used by a Rush agent on a task, pass it when creating or sending:

```bash
npx -y rush-ai@latest task create -a <agent> -p "<prompt>" --mcp <server-id> --json
# or add it mid-task
npx -y rush-ai@latest task send <id> -p "<prompt>" --mcp <server-id> --json
```

Comma-separate multiple server ids: `--mcp id1,id2`.

## Example: "rush 上有没有能查 Jira 的 MCP"

```bash
# 1. List and search by keyword
npx -y rush-ai@latest mcp list --json | jq '.[] | select(.description | test("Jira|jira"))'

# 2. Pick the right one, inspect its tools
npx -y rush-ai@latest mcp list-tools jira-server-id --json

# 3. Report back with a short list of tools. If user then wants to act on Jira
#    via a Rush agent, hand the server-id off to `rush-create` / `rush-task-manage`
#    via --mcp.
```

## Anti-patterns

- ❌ Activating for local IDE MCP config — that's not what this skill does.
- ❌ Dumping the full MCP list when the user asked for one specific domain — filter with `jq` or a targeted query.
- ❌ Running `npx -y rush-ai@latest mcp serve` as part of a conversation — it's a long-running daemon install step.
- ❌ Guessing which MCP to `--mcp` without listing — invalid ids fail tasks.

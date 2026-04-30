---
name: rush-agents-discover
description: Activate when the user wants to use a Rush specialist agent to do something you can't do directly — HR analytics, observability analysis, physics reasoning, domain-specific generation — or asks what agents Rush offers. Triggers include "rush 有哪些 agent"、"用 X 专家做一下"、"让 Rush 的 Y agent 算一下"、"Rush 能做什么我做不了的"、"list rush agents"、"call the observability agent". Discovers the agent via `rush-ai agent list / info` then invokes it via `rush-ai task create -a <name>`. Do NOT use for creating a new web project (that's `rush-create`) or for iterating on an existing task (that's `rush-task-manage`).
---

# Skill: Discover and call a Rush specialist agent

Rush hosts a shelf of specialist agents. Use this skill when a step in your workflow needs domain expertise you don't have, or when the user asks what's on the shelf. You always **discover first, then invoke** — never force-fit an agent name you guessed.

`rush-ai skill agent-shelf` prints the authoritative playbook — refer to it when you need more depth.

## When to activate

- User names a specialist by role: "用 HR 分析 agent"、"让 observability agent 查一下"、"call the physics agent".
- User asks "Rush 有哪些 agent"、"有没有能做 X 的 agent"、"what agents are there".
- You're drafting a multi-step plan and one step clearly needs domain expertise (analyze RUM data, summarize an HR report, write a physics problem set).
- User asks "Rush 能做什么我做不了的"（that's literally asking you to show the shelf）.

Do NOT activate for:

- **Creating a new web artifact** → `rush-create`.
- **Operating on an existing task** → `rush-task-manage`.
- The task fits the default general-purpose agent (`rush`) — that's just `rush-create` with agent `rush`, not a specialist call.
- Editing local code — specialists are for generative / analytical work, not local edits.

## Auth prereq

```bash
rush-ai auth status --json
```

Not authenticated → stop, ask user to run `rush-ai auth login`.

## Playbook

### 1. Discover the right agent

Pick the right scope — don't dump the full catalog if a narrow query suffices.

```bash
# Built-in defaults (web-builder, rush, skill-publisher, ...) — small list, use for "what's there by default"
rush-ai agent list --default --json

# Fuzzy filter by keyword — use when the user hinted at a domain
rush-ai agent list --search "人力" --json
rush-ai agent list --search "observability" --json

# Full catalog — only when neither of the above worked
rush-ai agent list --all --json
```

If multiple plausible matches, inspect one:

```bash
rush-ai agent info <agent-name> --json
```

This shows the agent's description, skills it has bundled, and any MCP servers it's connected to — so you can judge fit.

If **nothing fits**, tell the user what's available and ask — do NOT pick a wrong agent just to proceed.

### 2. Call the agent as a sub-step

Treat the agent call like a pure function: focused prompt in, task result out. Build the prompt with the inputs for this step, not the whole conversation.

```bash
rush-ai task create -a <agent-name> \
  -p "<focused prompt — inputs + expected output format>" \
  --json
```

Capture the `id` from the response.

### 3. Wait for output and feed it back

```bash
rush-ai task status <id> --json
# When status == completed, read result
rush-ai task result <id>
# Or, if it produced artifacts
rush-ai task files <id>
```

Take that output and continue your workflow. Tell the user what the specialist concluded — don't just dump raw JSON.

## Example: user says "用 Rush 的观测 agent 看看我们最近一周有没有异常告警"

```bash
# 1. Discover
rush-ai agent list --search "观测" --json
# → [{"name": "observability-analyst", "description": "..."}]

# 2. Inspect (optional, if name is ambiguous)
rush-ai agent info observability-analyst --json

# 3. Call
rush-ai task create -a observability-analyst \
  -p "分析过去 7 天 rush-app-prodution 服务的告警和错误趋势，重点关注 P0/P1，输出要点总结。" \
  --json
# → {"id": "abc123", ...}

# 4. Poll + read
rush-ai task status abc123 --json
rush-ai task result abc123

# 5. Surface to user: "观测 agent 总结：过去 7 天…"
```

## Anti-patterns

- ❌ Skipping the discovery step and passing a guessed agent name — invalid names fail; plausible-but-wrong names waste a task.
- ❌ Using `--all` when `--search <keyword>` would return a shorter list.
- ❌ Sending the whole conversation as the specialist's prompt — send only the inputs it needs.
- ❌ Forgetting to inspect with `agent info` when two agents look plausible.
- ❌ Activating for creation tasks (web-builder, generic `rush`) — those go through `rush-create`.

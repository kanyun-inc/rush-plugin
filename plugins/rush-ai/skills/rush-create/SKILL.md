---
name: rush-create
description: Activate when the user wants to create, ship, or host a **self-contained deliverable** — any project-style artifact a Rush agent can produce and share: landing page / 页面 / 网站 / web app / h5 / 工具 / 助手 / 应用 / agent, dashboard / 看板 / 数据分析页, PPT / slide / 演示文稿, report / 报告 / 周报 / 项目书 / 讲义 / 试卷 / AB 卷 / 题目 / 大纲, generated images / 示意图 / 占位图, internal tool UI, prototype / demo / MVP. Triggers include "帮我做个 X"、"做一个 X"、"搭个 X"、"设计一个 X"、"生成一个 X"、"写一个 X（制品类，不是回答）"、"创建项目"、"build X"、"start X"、"spin up X"、"你可以做 X 吗". Also triggers on **"ship local thing online"** scenarios: "部署到线上"、"让别人也能访问"、"发布一个网页版"、"把我本地的 X 做成网站"、"我在 Cursor/本地做了 X，想部署"、"deploy this online"、"host this"。Activate even if the medium isn't strictly a website, as long as the user wants a produced, shareable, or publicly-accessible artifact. Do NOT activate for: (1) local edits to an already-open repo ("改一下按钮颜色"); (2) iterating on an existing Rush task ("在那个网页基础上加个 X" / 使用 `rush-task-manage`); (3) pure Q&A, data queries, analysis tasks without a deliverable ("分析一下 X 数据并告诉我结论"、"X 怎么解决"、"帮我看看有没有错误"); (4) chit-chat or meta questions about Rush/Claude itself; (5) pure clarification follow-ups during an in-flight create conversation ("我需要给你提供什么信息"、"还要什么") — those continue the existing `rush-create` flow, no re-activation needed.
---

# Skill: Create a project via Rush, then pull it local

When a conversation points at **creating something new**, the Rush platform can scaffold the project for you — you relay the user's context to a Rush agent, it produces a running preview and a git repo, and you pull that repo down so subsequent edits happen on the user's machine.

`rush-ai` (already installed globally) is the CLI you use. Its own `rush-ai skill hand-off` prints an authoritative playbook — **read it first** if you haven't:

```bash
rush-ai skill hand-off
```

This skill layers on top of hand-off with one extra step: **cloning the generated repo to local after the task completes**, so Claude Code / Cursor can take over locally.

## When to activate

Triggers (judgement over keyword matching):

- User wants a net-new web artifact the team will share via URL — landing page, marketing site, product demo, internal tool UI.
- User describes a product / idea and asks you to "搭一下"、"先做个 demo"、"弄一个原型".
- User says "用 rush 做" / "扔给 rush".

Do NOT activate for:

- Local edits to the current repo ("改一下按钮颜色" in an open project) — just edit.
- Questions about Rush itself ("rush-ai 怎么用"、"rush 是什么") — answer from docs / `rush-ai --help`.
- When the user is clearly iterating on a project already cloned locally — use `rush-ai task send <id>` against the existing task id instead of creating a new one.

## Playbook

### 1. Check auth (once per session)

```bash
rush-ai auth status --json
```

If the response says not authenticated, **stop and ask the user** to run `rush-ai auth login` themselves (it opens a browser). Do not try to log in on their behalf, do not fall through to `task create` — it will 401.

### 2. Pick an agent

| Situation | Agent |
|-----------|-------|
| Web artifact (landing page, site, web tool) | `web-builder` |
| User named a specialist ("use the X agent") | that name verbatim |
| Unsure what kind of project | ask the user; default to `web-builder` if they say "a website / page / site" |

Discover more with `rush-ai agent list --default --json` if needed.

### 3. Create the task

Synthesize the prompt from the conversation — do **not** ask the user to restate what they already told you. Include brand, tone, pages, constraints you already heard.

```bash
rush-ai task create -a web-builder -p "<prompt synthesized from context>" --json
```

Capture `id` from the JSON response. Tell the user in one line: task id + "running on Rush" + "I'll poll for you".

### 4. Poll until done

```bash
rush-ai task status <id> --json | jq -r '.status'
```

Poll every ~15–30s. Terminal states: `completed`, `failed`, `cancelled`.

### 5. Clone the repo to local

When `status == completed`, the response contains `gitRepoUrl` (e.g. `https://gitlab-ee.zhenguanyu.com/rush/online/<id>`) and `previewUrl`.

Default clone location: `~/develop/<projectId>`. Ask the user before overwriting if the directory exists.

```bash
# Get the repo URL and clone
REPO_URL=$(rush-ai task status <id> --json | jq -r '.gitRepoUrl')
git clone "$REPO_URL" ~/develop/<projectId>
cd ~/develop/<projectId>
```

If the project has a `package.json`, install dependencies:

```bash
cd ~/develop/<projectId>
(test -f pnpm-lock.yaml && pnpm install) || (test -f yarn.lock && yarn install) || npm install
```

### 6. Hand control back to the user, locally

Tell the user:

- The preview URL (what they wanted to share)
- The local path (`~/develop/<projectId>`)
- The task id (for future `rush-ai task send <id>` iterations, if they want more cloud-side changes)
- That further edits can happen locally — **you'll continue from this directory**

If you have access to `cd` into the new directory in the current session, do so and offer to start the next iteration. If not (e.g. the IDE has a fixed working dir), tell the user: "在 `~/develop/<projectId>` 打开一个新 Claude Code / Cursor 会话，我们继续改。"

### 7. Iteration strategy

- **Local tweaks** (edits the user could easily run in their own editor, small visual changes they want immediately): edit locally and `git commit`.
- **Heavy regeneration** ("redo the hero section completely", "regenerate the whole pricing page"): `rush-ai task send <id>` so the Rush agent rewrites it, then `git pull` locally. Only use `task send` against the original task id, not a new one.
- **Unrelated new project**: create a fresh task, clone to a different directory.

## Example end-to-end

User: "帮我做一个公司官网首页，风格大气专业，有导航、Hero、特性、客户评价、联系方式。"

```bash
# 1. auth (assume ok)
rush-ai auth status --json

# 2. create
rush-ai task create -a web-builder \
  -p "做一个公司官网首页，包含导航、Hero、核心特性、客户评价和底部联系信息，风格大气专业。" \
  --json
# → {"id": "lodig8oknq0r", "status": "pending", ...}

# 3. poll
rush-ai task status lodig8oknq0r --json
# ...wait...
# → {"status": "completed", "previewUrl": "https://lodig8oknq0r-preview.rush.zhenguanyu.com/", "gitRepoUrl": "https://gitlab-ee.zhenguanyu.com/rush/online/lodig8oknq0r"}

# 4. clone + install
git clone https://gitlab-ee.zhenguanyu.com/rush/online/lodig8oknq0r ~/develop/lodig8oknq0r
cd ~/develop/lodig8oknq0r
pnpm install  # or npm / yarn

# 5. report
# "搞定了：
#    预览: https://lodig8oknq0r-preview.rush.zhenguanyu.com/
#    代码: ~/develop/lodig8oknq0r（已拉到本地）
#    任务 id: lodig8oknq0r（以后想让 Rush 再改再说）
#  现在本地能改，你说改哪儿。"
```

## Anti-patterns

- ❌ Starting a new `task create` for every tweak — use `task send` or just edit locally.
- ❌ Cloning without checking the directory already exists — ask first.
- ❌ Installing deps in a directory that doesn't have a manifest.
- ❌ Hiding the task id — the user may want to reopen the Rush UI later.
- ❌ Activating for local-only edits — that's what regular Claude Code / Cursor already does.

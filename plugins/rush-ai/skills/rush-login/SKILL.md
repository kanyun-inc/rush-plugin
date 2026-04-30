---
name: rush-login
description: Use this skill when the user wants to log in / authenticate / sign in to Rush, or any rush-ai / reskill subcommand just failed with "Not authenticated" / 401 / "please run auth login". Triggers — 明确："登录 Rush"、"rush 登录"、"给 rush-ai 登录"、"log in to rush"、"authenticate rush"; 隐式：`npx rush-ai ...` 或 `npx reskill ...` 命令跑出认证失败. Skill detects runtime (Claude Code CLI with browser vs Cowork sandbox without browser) and drives user through either native browser OAuth or manual token paste. On success persists the token for both `rush-ai` and `reskill`.
---

# Skill: Log in to Rush (works for both rush-ai and reskill)

一个 Rush access token 同时用于 `rush-ai` (Rush 平台) 和 `reskill` (skill registry). 本 skill 一次登录、两处生效.

## When to activate

- 用户显式: "登录 rush" / "log in to rush" / "rush 登录"
- 你刚才跑 `npx -y rush-ai@latest <anything>` 或 `npx reskill@latest <anything>` 得到 "Not authenticated" / 401 / "please run auth login" / "Token is invalid or expired"
- 其他 rush-* skill (rush-agents-discover / rush-create / rush-task-manage / rush-mcp-discover) 的 prereq 检查失败

**不要激活**:
- 切换账号 → 先 `npx -y rush-ai@latest auth logout` 和 `npx reskill@latest logout 2>/dev/null`（如果 reskill 支持）, 然后重跑本 skill
- 非 Rush 服务的 token

## Prereq

- `npx` 可用 (Node.js 装好了)
- 网络能访问 `https://rush.zhenguanyu.com`

## 关键：先判断运行环境

运行环境影响登录路径，分**两种**:

### Claude Code CLI (terminal, 有浏览器)
判断信号:
- 宿主环境里跑 Claude Code，当前 session 是在用户本机 terminal 里
- `echo $CLAUDECODE` 为 1 或环境里有普通 macOS GUI 能力
- 用户能看到本机浏览器弹窗

→ **走浏览器 OAuth 路径**（步骤 A）

### Cowork 沙箱 (headless, 无浏览器)
判断信号:
- 当前环境是 Cowork 的 agent 沙箱，文件系统是隔离的
- 跑 GUI 命令没有意义，浏览器弹不出来
- `$HOME` 指向 `/Users/<user>/Library/Application Support/Claude-3p/...` 之类的沙箱 home

→ **走手动粘贴 token 路径**（步骤 B）

**不确定时**：先问用户 "你现在是在 terminal 里跑 Claude Code，还是在 Cowork 界面里跟我聊天？" 一句话搞定.

## 步骤 A：Claude Code CLI（浏览器 OAuth）

### A1. 已登录检查

```bash
npx -y rush-ai@latest auth status --json
```

- 已登录 → 告诉用户现状, 结束. 如果 **也**要给 reskill 登（用户之前 `reskill publish` 401 过），跳到 **共享 token** 段落.
- 未登录 → 继续.

### A2. 触发浏览器登录

```bash
npx -y rush-ai@latest auth login
```

会打开浏览器让用户走 CAS. 告诉用户:
> 浏览器应该会弹出 Rush 登录页. 用 CAS 账号登进去, 完成后回到这里我会核实.

等命令返回. 失败 (浏览器没弹、用户取消) → 退回步骤 B 的手动方案.

### A3. 核实

```bash
npx -y rush-ai@latest auth status --json
```

authenticated=true 且 account 字段有值 → 成功. 继续 **共享 token** 段落.

## 步骤 B：Cowork 沙箱（手动粘贴 token）

### B1. 已登录检查

```bash
npx -y rush-ai@latest auth status --json
```

已登录 → 结束 / 或继续共享段落.

未登录 → 继续.

### B2. 引导用户在浏览器取 token

**一次性**把下面的话发给用户（别分段）:

> 请按以下步骤操作（约 30 秒）:
>
> 1. 在浏览器打开 **https://rush.zhenguanyu.com/setting?tab=access-token**
> 2. 如果没登录，用 CAS 登录一下
> 3. 页面上**创建一个新的 access token**，复制 token 字符串
> 4. **把整段 token 粘回这里给我**就行（token 只用于执行登录命令）

**停下等用户回复**. 不猜、不继续.

### B3. 收到 token 后执行登录

token 通常是一长串字符. 从用户消息里提取（去掉前后空白、引号、引导语等），执行:

```bash
npx -y rush-ai@latest auth login --api-key "<USER_TOKEN>" --no-verify
```

- `--no-verify` 可以不用, 只在网络无法访问 rush.zhenguanyu.com 校验接口时兜底
- 成功 → 继续 B4
- 失败 (invalid / expired) → 告诉用户 token 无效请重新生成, **不自行重试**

### B4. 核实

```bash
npx -y rush-ai@latest auth status --json
```

## 共享 token：让 reskill 也登上

Rush access token 同时是 reskill 的 token. 登完 rush-ai 后主动帮用户把 reskill 也登上（否则后面 `reskill publish` 会 401）:

### 方法 1: 从 rush-ai 的存储里读出来，喂给 reskill

rush-ai 登录后 token 写在 `~/.rush/` 下. 但不要手动解析文件格式, 直接让用户再粘一次或者记忆刚才的 token 变量:

```bash
# 用户在本 session 里刚给过 token (步骤 B) → 直接复用
npx -y reskill@latest login --registry https://rush.zhenguanyu.com --token "<SAME_TOKEN>"

# 如果是步骤 A 走的浏览器 OAuth, session 里没有 token 明文 → 请用户去同一个页面再取一个 (或复用刚才那个) 给你, 然后跑上面的命令
```

### 方法 2 (推荐): 明确告诉用户会顺手做 reskill 登录

在 B2 引导用户取 token 时就说明:
> 这个 token 会同时用于 rush-ai 和 reskill, 一次粘贴两个都配好.

B3 之后再多跑一条:
```bash
npx -y reskill@latest login --registry https://rush.zhenguanyu.com --token "<USER_TOKEN>"
```

## 跨沙箱同步兜底

Cowork 沙箱每个 session 有独立 home. 这次登录成功后, 别的 session 仍会是未登录状态. 暂时补丁（不保证在所有 Cowork 部署下都能工作）:

```bash
# 如果宿主 home 有 ~/.rush 但当前 session 没有, 从宿主拉过来
if [ -d "/Users/$USER/.rush" ] && [ ! -d "$HOME/.rush" ]; then
  cp -R "/Users/$USER/.rush" "$HOME/.rush" 2>/dev/null || true
fi
```

这是临时方案, rush-ai 团队后续会提供原生 token 共享.

## 收尾

- 成功: "已登录为 <account>, rush-ai 和 reskill 都配置好了, 可以继续刚才的任务."
- 如果用户是因为某个 rush-* 命令失败才进来的, **主动把那条命令重跑一次**, 不要让用户自己想起来.

## 铁律

1. **token 是敏感信息**: 收到后用 `"$TOKEN"` 或类似变量形式传给 bash, 不在聊天里反复复读明文.
2. **命令里 token 一定要双引号**.
3. **失败不自行重试 login**, 一般是 token 本身问题, 让用户重新生成.
4. **环境不确定就问**, 不要先按 Claude Code CLI 试一次失败再退到 Cowork 模式 —— 第一次试浏览器失败会留下 "请打开浏览器" 的提示卡住用户.
5. **登完核实一次 auth status**, 不依赖 login 命令 exit code.

#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BATCH = 20;
const SAMPLES = resolve(__dirname, 'samples/samples.jsonl');
const OUT = resolve(__dirname, 'predictions/predictions.jsonl');

const JUDGE_INSTRUCTION = `你是 Claude Code 触发判断器。Claude Code 装有 rush-plugin，可用 skill：

- rush-create — 创建新的、自包含的可交付制品（不限于网站）：页面/网站/web app/h5、工具/助手/应用/agent、看板/数据分析页、PPT/演示文稿、报告/周报/项目书/讲义/试卷/AB卷/题目/大纲、示意图/占位图、原型/demo/MVP 等。触发词："帮我做个 X"、"做一个 X"、"搭个 X"、"设计一个 X"、"生成一个 X"、"你能做 X 吗"、"创建项目"、"build X"、"spin up X"。另外也要激活"**把本地东西搬到线上**"类请求："部署到线上"、"让别人也能访问"、"发布一个网页版"、"把我本地/Cursor 里的 X 做成网站"、"host this online"、"deploy this"。制品可以不是网页，但必须是"独立的、可分享/下载/可公开访问的成品"。
- rush-task-manage — 操作已有 Rush task（status/send/watch/messages/files/cancel/list/result）。仅当用户明确提到 task id 或"继续改那个项目/任务"时激活。
- rush-agents-discover — 两种场景都激活：(a) 用户**显式问** Rush 有哪些 agent / 想用某专家 agent；(b) 用户**隐式表达**一个"让 Rush 专家帮我干"的领域任务：数据分析、竞品研究、报告/方案/总结生成、HR/教学/观测/运营分析、文档审核、内容改写、任意需要领域知识的非创建类任务。凡是"让 AI 做一件事但不是创建制品"的都先走这里，假设有匹配的 specialist agent；**只有真的没有合适 agent 才降级到 none**。
- rush-mcp-discover — 发现 MCP server（"rush 有哪些 MCP"）。
- none — 闲聊、元问题（"你是什么模型"）、命令行/运维操作（"git reset --hard"、"部署一下"）、对已存在网页/项目的迭代改动（"基于这个页面加个 X"、"改一下 Y"）、无明确动作的模糊表达。

判断规则：
1. 想"生成/创建一个可交付制品" → rush-create
2. 想"让 AI 帮我完成一个领域任务（分析/研究/总结/报告/审核/改写等）" → rush-agents-discover
3. "在现有页面/项目基础上改/加" 且没提 task id → none（本地迭代）
4. 明确提 task id / "那个任务跑完没" → rush-task-manage
5. 问 rush 有哪些 MCP → rush-mcp-discover
6. 闲聊、元问题、运维命令、模糊表达 → none

对下面 N 条消息独立判断。只输出 JSON array，每条 {"line": <n>, "skill": <"rush-create"|"rush-task-manage"|"rush-agents-discover"|"rush-mcp-discover"|"none">}。不要解释。

消息：
`;

function runClaude(input) {
  return new Promise((resolveP, rejectP) => {
    const p = spawn('claude', ['-p', input, '--output-format', 'text', '--max-turns', '1'], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => {
      if (code !== 0) return rejectP(new Error(`claude exited ${code}: ${err}`));
      resolveP(out);
    });
    p.on('error', rejectP);
  });
}

function parseResponse(text, expectedLines) {
  // Find first [ ... ] block
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end < 0) throw new Error('no JSON array found');
  const json = text.slice(start, end + 1);
  const arr = JSON.parse(json);
  if (!Array.isArray(arr)) throw new Error('not array');
  const byLine = new Map();
  for (const item of arr) {
    if (typeof item?.line === 'number' && typeof item?.skill === 'string') {
      byLine.set(item.line, item.skill);
    }
  }
  return byLine;
}

async function processBatch(batch, batchIdx) {
  const body = batch.map((s, i) => `${i + 1}. ${s.prompt.replace(/\n/g, ' ')}`).join('\n');
  const prompt = JUDGE_INSTRUCTION + body;
  let lastErr = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const out = await runClaude(prompt);
      const byLine = parseResponse(out, batch.length);
      const results = batch.map((s, i) => ({
        id: s.id,
        prompt: s.prompt,
        skill: byLine.get(i + 1) || 'parse_error',
      }));
      return results;
    } catch (e) {
      lastErr = e;
      process.stderr.write(`  batch ${batchIdx} attempt ${attempt} failed: ${e.message}\n`);
    }
  }
  return batch.map((s) => ({ id: s.id, prompt: s.prompt, skill: 'error', error: String(lastErr?.message || lastErr) }));
}

async function main() {
  mkdirSync(dirname(OUT), { recursive: true });
  const samples = readFileSync(SAMPLES, 'utf8').trim().split('\n').map(JSON.parse);
  process.stderr.write(`Loaded ${samples.length} samples.\n`);

  // Resume: skip ids already processed
  const done = new Set();
  if (existsSync(OUT)) {
    for (const line of readFileSync(OUT, 'utf8').trim().split('\n').filter(Boolean)) {
      try { done.add(JSON.parse(line).id); } catch {}
    }
    process.stderr.write(`Resuming: ${done.size} already processed.\n`);
  }
  const pending = samples.filter((s) => !done.has(s.id));
  process.stderr.write(`Pending: ${pending.length}\n`);

  const concurrency = Number(process.env.EVAL_CONCURRENCY || 4);
  const batches = [];
  for (let i = 0; i < pending.length; i += BATCH) batches.push(pending.slice(i, i + BATCH));

  let done_count = 0;
  const total = batches.length;

  async function worker(getNext) {
    while (true) {
      const { idx, batch } = getNext() || {};
      if (!batch) return;
      const t0 = Date.now();
      const results = await processBatch(batch, idx);
      const chunk = results.map((r) => JSON.stringify(r)).join('\n') + '\n';
      appendFileSync(OUT, chunk);
      done_count++;
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      process.stderr.write(`[${done_count}/${total}] batch ${idx} done in ${elapsed}s (${results.length} items)\n`);
    }
  }

  let cursor = 0;
  const getNext = () => {
    if (cursor >= batches.length) return null;
    const idx = cursor++;
    return { idx, batch: batches[idx] };
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker(getNext)));
  process.stderr.write(`Done. Predictions written to ${OUT}\n`);
}

main().catch((e) => {
  process.stderr.write(String(e.stack || e) + '\n');
  process.exit(1);
});

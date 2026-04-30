#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN = resolve(__dirname, process.argv[2] || 'predictions/predictions.jsonl');
const REPORT_DATE = new Date().toISOString().slice(0, 10);
const SUFFIX = process.argv[3] ? `-${process.argv[3]}` : '';
const REPORT_OUT = resolve(__dirname, `results/${REPORT_DATE}-report${SUFFIX}.md`);

function main() {
  const preds = readFileSync(IN, 'utf8').trim().split('\n').map(JSON.parse);
  const total = preds.length;

  // Distribution
  const dist = {};
  for (const p of preds) dist[p.skill] = (dist[p.skill] || 0) + 1;

  // Ground truth assumption: first-user-messages from Rush web == "intent to create a project".
  // → rush-create is the expected activation; anything else is either a noise sample
  //   (not actually a creation prompt) or a miss.
  // Recall proxy: fraction predicted as rush-create out of all samples.
  // We don't have labeled ground truth, so we break down "non-rush-create" predictions
  // into plausible buckets for manual inspection.

  const expected = 'rush-create';
  const hits = dist[expected] || 0;
  const recallProxy = (hits / total * 100).toFixed(1);

  // Sample errors (non-rush-create predictions) for inspection
  const errorSamples = {};
  for (const p of preds) {
    if (p.skill === expected || p.skill === 'parse_error' || p.skill === 'error') continue;
    if (!errorSamples[p.skill]) errorSamples[p.skill] = [];
    if (errorSamples[p.skill].length < 30) errorSamples[p.skill].push(p);
  }

  // Parse errors
  const parseErrorSamples = preds.filter((p) => p.skill === 'parse_error' || p.skill === 'error').slice(0, 10);

  // Prompt length vs skill
  const lenByBucket = { short: [], med: [], long: [] };
  for (const p of preds) {
    const l = p.prompt.length;
    const b = l < 30 ? 'short' : l < 150 ? 'med' : 'long';
    lenByBucket[b].push(p);
  }
  const lenDist = {};
  for (const b of Object.keys(lenByBucket)) {
    const buckets = {};
    for (const p of lenByBucket[b]) buckets[p.skill] = (buckets[p.skill] || 0) + 1;
    lenDist[b] = { count: lenByBucket[b].length, skills: buckets };
  }

  // Build report
  const lines = [];
  lines.push(`# rush-plugin Eval — ${REPORT_DATE}`);
  lines.push('');
  lines.push('## 评测设置');
  lines.push('');
  lines.push(`- 样本数：**${total}** 条（来自 Rush 生产 DB 中每个 project 的首条 user 消息）`);
  lines.push('- 时间窗口：过去 90 天内、距今 >7 天的项目');
  lines.push('- 过滤：test/demo/sample/example 命名项目剔除');
  lines.push('- 脱敏：URL / EMAIL / FILE / PHONE / PATH / HASH / UUID / NUM / IP 等全部 redact，prompt 截断 500 字');
  lines.push('- Judge：`claude -p`（当前默认 Opus 4.7），20 条/批，concurrency=4');
  lines.push('- 真值假设：Rush web 首条消息 ≈ "创建新项目"意图 → 理想激活 `rush-create`');
  lines.push('');
  lines.push('## 核心指标');
  lines.push('');
  lines.push(`| 指标 | 值 |`);
  lines.push(`|------|-----|`);
  lines.push(`| 总样本 | ${total} |`);
  lines.push(`| rush-create 命中（召回率代理） | **${hits} (${recallProxy}%)** |`);
  lines.push(`| 判断为 none（漏触发） | ${dist.none || 0} |`);
  lines.push(`| 误触发到 task-manage | ${dist['rush-task-manage'] || 0} |`);
  lines.push(`| 误触发到 agents-discover | ${dist['rush-agents-discover'] || 0} |`);
  lines.push(`| 误触发到 mcp-discover | ${dist['rush-mcp-discover'] || 0} |`);
  lines.push(`| Parse/API 错误 | ${(dist.parse_error || 0) + (dist.error || 0)} |`);
  lines.push('');
  lines.push('## 完整分布');
  lines.push('');
  lines.push('| skill | 数量 | 占比 |');
  lines.push('|-------|------|------|');
  for (const [skill, n] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${skill} | ${n} | ${(n / total * 100).toFixed(1)}% |`);
  }
  lines.push('');
  lines.push('## 按 prompt 长度分桶');
  lines.push('');
  lines.push('| 长度 | 样本数 | rush-create | none | 其他 |');
  lines.push('|------|--------|-------------|------|------|');
  for (const [bucket, info] of Object.entries(lenDist)) {
    const rc = info.skills['rush-create'] || 0;
    const nn = info.skills.none || 0;
    const other = info.count - rc - nn;
    lines.push(`| ${bucket} (${bucket === 'short' ? '<30' : bucket === 'med' ? '30-150' : '≥150'}字) | ${info.count} | ${rc} | ${nn} | ${other} |`);
  }
  lines.push('');

  // Samples for qualitative review
  for (const [skill, samples] of Object.entries(errorSamples)) {
    if (!samples.length) continue;
    lines.push(`## 被判为 \`${skill}\` 的样本（前 ${samples.length} 条，用于归因）`);
    lines.push('');
    for (const s of samples) {
      const preview = s.prompt.replace(/\n/g, ' ').slice(0, 200);
      lines.push(`- \`${s.id}\`: ${preview}${s.prompt.length > 200 ? '…' : ''}`);
    }
    lines.push('');
  }

  if (parseErrorSamples.length) {
    lines.push('## Parse/API 错误样本');
    lines.push('');
    for (const s of parseErrorSamples) {
      lines.push(`- \`${s.id}\`: error=${s.error || 'parse_error'}`);
    }
    lines.push('');
  }

  // None 判断的前 30 条
  const nones = preds.filter((p) => p.skill === 'none').slice(0, 30);
  if (nones.length) {
    lines.push(`## 被判为 \`none\` 的样本（前 ${nones.length}/${dist.none || 0} 条，归因哪些属于应召回但漏了）`);
    lines.push('');
    for (const s of nones) {
      const preview = s.prompt.replace(/\n/g, ' ').slice(0, 200);
      lines.push(`- \`${s.id}\`: ${preview}${s.prompt.length > 200 ? '…' : ''}`);
    }
    lines.push('');
  }

  lines.push('## 下一步');
  lines.push('');
  lines.push('1. 人工审阅 `none` 样本：区分"真 none（本地修改/问答）" vs "漏触发 rush-create"');
  lines.push('2. 人工审阅误触发样本（`task-manage` / `agents-discover` / `mcp-discover`）：是 description 写得过宽，还是用户输入就应触发这个 skill');
  lines.push('3. 根据归因 patch `rush-create` description，重跑 eval 对比');

  mkdirSync(dirname(REPORT_OUT), { recursive: true });
  writeFileSync(REPORT_OUT, lines.join('\n') + '\n');
  process.stderr.write(`Report written to ${REPORT_OUT}\n`);
  console.log(lines.slice(0, 30).join('\n'));
}

main();

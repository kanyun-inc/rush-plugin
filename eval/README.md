# rush-plugin eval

评测 `rush-ai` plugin 下 4 个 skill 的触发精度，使用 1000 条脱敏样本。

## Samples

`samples/samples.jsonl` — 1000 条用户真实首次输入的脱敏版本，每条 `{id, prompt}`。
脱敏过程中移除：URL / 邮箱 / 电话 / 哈希 / 路径 / UUID / 身份证 / 姓名 / 公司名 / 产品名 / 内部项目名 / 团队名 / 城市名 / 业务缩写等。

仅提交脱敏后的最终样本，不公开数据来源与采集逻辑。

## 跑评测

```bash
# 1. Judge 批量判断，写入 predictions/predictions.jsonl（gitignored）
#    并行 4，20 条/批，约 7 分钟
EVAL_CONCURRENCY=4 node run-eval.mjs

# 2. 生成报告到 results/<date>-report.md
node compute-metrics.mjs
```

断点续跑：`run-eval.mjs` 会跳过已在 predictions.jsonl 里的 id。

## 文件布局

```
eval/
├── run-eval.mjs            # Judge 批量判断
├── compute-metrics.mjs     # 分布统计 + 报告生成
├── samples/samples.jsonl   # 脱敏样本（可提交）
├── predictions/            # gitignore：Judge 输出
└── results/                # 报告
```

## 当前结果

| skill | 数量 | 占比 |
|-------|------|------|
| rush-create | 562 | 56.2% |
| rush-agents-discover | 181 | 18.1% |
| rush-task-manage | 2 | 0.2% |
| rush-mcp-discover | 0 | 0 |
| none | 255 | 25.5% |

应激活某 rush skill 的召回率：**74.5%**。

详见 `results/<date>-report.md` 的 none / task-manage 样本段落，可以人工归因判断哪些是真 none、哪些是漏触发。

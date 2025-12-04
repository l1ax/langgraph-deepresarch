# Research Brief 生成评测

本目录包含用于评测 research brief 生成效果的脚本和工具。

## 概述

评测系统基于 LangSmith 平台，使用 LLM-as-judge 方法评估生成的 research brief 质量。评测包括两个主要维度：

1. **成功标准捕获率** (`success_criteria_score`): 评估 research brief 是否捕获了用户对话中的所有关键标准
2. **无假设评估** (`no_assumptions_score`): 评估 research brief 是否避免了用户未明确说明的假设

## 文件结构

- `dataset.ts`: 定义评测数据集，包含测试用例和期望的成功标准
- `evaluators.ts`: 实现评测器函数，使用 LLM 评估 research brief 质量
- `prompts.ts`: 评测相关的 prompt 模板（用于 LLM-as-judge 评估）
- `run.ts`: 主评测脚本，集成 LangSmith 实验运行
- `README.md`: 本文件

## 使用方法

### 前置要求

1. 确保已安装所有依赖：
```bash
pnpm install
```

2. 设置环境变量：
```bash
export LANGSMITH_API_KEY=your_langsmith_api_key
export DEEPSEEK_API_KEY=your_deepseek_api_key
export DEEPSEEK_BASE_URL=your_deepseek_base_url
```

### 运行评测

```bash
pnpm run evaluate
```

或者直接运行：

```bash
tsx evaluation/run.ts
```

### 查看结果

评测完成后，脚本会输出 LangSmith 实验的 URL，你可以在浏览器中打开查看详细的评测结果和追踪信息。

## 评测数据集

当前数据集包含两个测试用例：

1. **投资建议场景**: 用户询问如何为退休投资 $50,000
2. **公寓搜索场景**: 用户在纽约寻找公寓

每个测试用例都包含：
- 输入：用户对话历史（messages）
- 输出：期望在 research brief 中捕获的成功标准列表

## 评测指标

### success_criteria_score

范围：0.0 到 1.0

计算方式：成功捕获的标准数量 / 总标准数量

每个标准都会被单独评估，评估结果包括：
- 是否被捕获（boolean）
- 详细的推理过程

### no_assumptions_score

范围：0.0 或 1.0（布尔值）

评估 research brief 是否包含用户未明确说明的假设或偏好。

## 自定义评测

### 添加新的测试用例

编辑 `dataset.ts`，在 `evaluationDataset` 数组中添加新的测试用例：

```typescript
{
  inputs: {
    messages: [/* 你的对话消息 */],
  },
  outputs: {
    criteria: [/* 期望捕获的标准列表 */],
  },
}
```

### 修改评测器

评测器函数在 `evaluators.ts` 中定义。你可以：
- 修改 prompt 模板（在 `prompts.ts` 中）
- 调整评分逻辑
- 添加新的评测维度

## 注意事项

- 评测过程可能需要几分钟时间，因为需要对每个测试用例运行完整的 workflow 并进行 LLM 评估
- 确保 LangSmith API key 已正确设置，否则评测无法运行
- 评测结果会自动上传到 LangSmith，你可以在平台上查看详细的追踪和性能指标


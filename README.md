# LangGraph Deep Research Agent

基于 LangGraph 的深度研究代理系统，通过多阶段 AI 工作流自动进行深度研究。

## ✨ 核心特性

- 🤖 **多代理协作**：Supervisor 模式协调多个子代理并行研究
- 🔍 **智能搜索**：集成 Tavily 搜索，自动去重和网页摘要
- 💭 **反思机制**：每次搜索后强制反思，防止目标偏移
- 📡 **流式输出**：支持流式 LLM 调用，实时展示研究过程
- 🎨 **现代化前端**：Next.js 16 + React 19 + MobX

## 🛠️ 技术栈

**后端**：TypeScript + LangGraph + LangChain + Tavily  
**前端**：Next.js 16 + React 19 + MobX + Tailwind CSS

## 🚀 快速开始

### 安装依赖

```bash
# 后端
cd backend && pnpm install

# 前端
cd frontend && pnpm install
```

### 环境配置

创建 `backend/.env`：

```bash
DEEPSEEK_API_KEY="your_deepseek_api_key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
TAVILY_API_KEY="your_tavily_api_key"

# 可选
ANTHROPIC_API_KEY="your_anthropic_api_key"
OPENAI_API_KEY="your_openai_api_key"
```

### 启动服务
You will need the LangGraph CLI installed. You can install it via ```npm install -g @langchain/langgraph-cli```
```bash
# 终端 1: 后端
cd backend && langgraphjs dev

# 终端 2: 前端
cd frontend && pnpm dev
```

前端：`http://localhost:3000` | 后端：`http://localhost:2024`

## 📖 工作流

系统提供多个 LangGraph 工作流（配置在 `langgraph.json`）：

1. **scopeAgent** - 需求澄清和简报生成
2. **researchAgent** - 基础研究循环
3. **supervisorAgent** - 多代理协调研究
4. **fullResearchAgent** - 完整端到端流程

### 完整研究流程

```
用户输入 → 需求澄清 → 生成简报 → 研究执行 → 生成报告
```

- **简单查询**：单个 researchAgent（2-3 次工具调用）
- **复杂查询**：supervisorAgent 协调多个 researchAgent 并行研究

## 📝 开发命令

### 后端

```bash
cd backend
langgraphjs dev       # 开发服务器
pnpm build            # 编译
pnpm type-check       # 类型检查
pnpm evaluate:scope   # 评估 scope 代理
pnpm evaluate:supervisor   # 评估 supervisor 代理
pnpm evaluate:researchAgent # 评估 research 代理
```

### 前端

```bash
cd frontend
pnpm dev    # 开发服务器
pnpm build  # 生产构建
pnpm lint   # 代码检查
```

## 🏗️ 架构要点

- **状态管理**：使用 LangGraph `Annotation` 系统
- **事件驱动**：后端通过输出适配器发送结构化事件，前端流式接收
- **工具限制**：简单查询 2-3 次，复杂查询最多 5 次
- **上下文工程**：网页摘要 + 研究压缩，防止上下文膨胀

## 📚 相关文档

- [LangGraph 文档](https://langchain-ai.github.io/langgraph/)
- [LangChain 文档](https://js.langchain.com/)
- [Tavily API](https://docs.tavily.com/)

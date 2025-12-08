# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a LangGraph-based deep research agent system with a TypeScript backend and Next.js frontend. The system performs multi-stage AI research by clarifying user requirements, generating research briefs, conducting research through supervisor-coordinated sub-agents, and generating final reports.

## Repository Structure

```
langgraph-deepresearch/
├── backend/          # TypeScript backend with LangGraph agents
└── frontend/         # Next.js 16 frontend with React 19
```

## Backend Architecture

### Core Workflow Graphs (LangGraph)

The backend uses LangGraph to orchestrate multi-agent workflows. All graphs are defined in `backend/langgraph.json`:

- **scopeAgent** (`src/graph/scopeGraph.ts`): User clarification → Research brief generation
- **researchAgent** (`src/graph/researchAgentGraph.ts`): Basic research loop with Tavily search
- **researchAgentMcp** (`src/graph/researchAgentMcpGraph.ts`): Research agent using MCP adapters
- **supervisorAgent** (`src/graph/supervisorGraph.ts`): Multi-agent coordination for complex research
- **fullResearchAgent** (`src/graph/fullAgentGraph.ts`): Complete end-to-end workflow

### State Management Pattern

All state is managed through LangGraph Annotations in `src/state/index.ts`:

- `StateAnnotation`: Main workflow state with messages, research brief, notes, supervisor context
- `ResearcherStateAnnotation`: Individual researcher state with tool call tracking
- `ResearcherOutputStateAnnotation`: Research output format

**Key Pattern**: State uses `messagesStateReducer` from LangGraph for message arrays and custom reducers for other fields. The reducer pattern ensures proper state merging between nodes.

### Node Structure

Nodes are organized by graph in `src/nodes/`:
- `scope/`: User clarification and brief generation nodes
- `researchAgent/`: LLM call, tool execution, research compression
- `supervisor/`: Supervisor coordination logic
- `fullAgent/`: Final report generation

**Important**: The `toolNode.ts` files handle state transformation between custom state schemas and ToolNode's expected `{ messages: BaseMessage[] }` format.

### Tools (`src/tools/`)

- `tavilySearch.ts`: Web search with automatic deduplication and LLM-based webpage summarization
- `thinkTool.ts`: Reflection mechanism forcing agent to analyze findings after each search
- `supervisorTools.ts`: Research delegation to sub-agents, reflection, and completion tools
- `mcpClient.ts`: Model Context Protocol client integration

### Output Adapters (`src/outputAdapters/`)

Event-driven architecture for frontend communication. All events extend `BaseEvent`:
- `ClarifyEvent`: User clarification questions
- `BriefEvent`: Research brief generation
- `ChatEvent`: Agent messages
- `ToolCallEvent`: Tool execution events
- `GroupEvent`: Grouped supervisor events for sub-agent coordination

Events have three states: `pending`, `in_progress`, `completed`.

### Prompts (`src/prompts/index.ts`)

All system prompts are centralized here:
- `clarifyWithUserInstructions`: User clarification prompt
- `transformMessagesIntoResearchTopicPrompt`: Brief generation prompt
- `researchAgentPrompt`: Research agent instructions with tool usage limits (2-3 simple queries, max 5 complex)
- `compressResearchSystemPrompt`: Research compression instructions
- `supervisorSystemPrompt`: Supervisor orchestration prompt

## Frontend Architecture

### Technology Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **State Management**: MobX 6 with mobx-react-lite
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **LLM Integration**: @langchain/langgraph-sdk for backend communication

### State Stores (`frontend/stores/`)

MobX stores manage application state:
- `DeepResearchPageStore.ts`: Main page state and UI coordination
- `Executor.ts`: LangGraph execution and streaming
- `Conversation.ts`: Message history management
- `ExecutionResponse.ts`: Single execution response wrapper
- `events/`: Event models mirroring backend output adapters

### Event Rendering (`frontend/services/`)

`EventRendererRegistry.tsx` maps event types to React components using a registry pattern. Each event type has a dedicated renderer with role-specific views.

### Components (`frontend/components/`)

UI components organized by feature. Uses shadcn/ui for base components with Radix UI primitives.

## Development Commands

### Backend

```bash
cd backend

# Development
pnpm dev              # Start dev server with tsx watch
pnpm build            # Compile TypeScript to dist/
pnpm type-check       # Run TypeScript type checking
pnpm clean            # Remove dist/ directory

# Evaluation
pnpm evaluate:scope           # Run scope agent evaluation
pnpm evaluate:supervisor      # Run supervisor agent evaluation
pnpm evaluate:researchAgent   # Run research agent evaluation
```

### Frontend

```bash
cd frontend

# Development
pnpm dev              # Start Next.js dev server (localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

## Environment Variables

### Backend (`backend/.env`)

```bash
DEEPSEEK_API_KEY=""           # DeepSeek LLM API key
DEEPSEEK_BASE_URL="https://api.deepseek.com"
TAVILY_API_KEY=""             # Tavily search API key
LANGSMITH_API_KEY=""          # LangSmith tracing (optional)
LANGSMITH_TRACING=true        # Enable tracing
```

Additional LLM providers used in code:
- Anthropic: Set `ANTHROPIC_API_KEY` for Claude models
- OpenAI: Set `OPENAI_API_KEY` for GPT models

## Key Implementation Patterns

### Tool Call Limits

Research agents have hard limits in prompts to prevent over-searching:
- Simple queries: 2-3 iterations
- Complex queries: Max 5 iterations
- Enforced through `tool_call_iterations` state tracking

### Think Tool Pattern

After each search, agents must use `thinkTool` to reflect on findings and decide next steps. This prevents goal drift and information overload.

### State Transformation for ToolNode

When using LangChain's ToolNode with custom state schemas, wrap it in a transform function:

```typescript
// ToolNode expects { messages: BaseMessage[] }
// Our state uses custom_messages field
function toolNodeWrapper(state) {
    const toolNodeState = { messages: state.custom_messages };
    const result = await toolNode.invoke(toolNodeState);
    return { custom_messages: result.messages };
}
```

See `src/nodes/researchAgent/toolNode.ts` for reference.

### Supervisor Multi-Agent Pattern

For complex queries with multiple sub-topics, use `supervisorAgent`:
1. Supervisor analyzes if task is parallelizable (e.g., comparison queries)
2. Generates sub-topics and delegates to research sub-agents
3. Each sub-agent has isolated context window
4. Supervisor aggregates results and decides when research is complete

### Event-Driven Frontend Updates

Backend emits structured events through output adapters. Frontend consumes via streaming:
1. `Executor.ts` streams events from LangGraph
2. Events parsed into store models
3. `EventRendererRegistry` renders components based on event type and role
4. MobX reactivity updates UI automatically

## Evaluation Framework

Located in `backend/evaluation/` with subdirectories per agent:

- **scope/**: Tests clarification accuracy and brief quality (no information loss, no assumptions)
- **researchAgent/**: Tests tool loop reliability and stopping conditions
- **supervisor/**: Tests parallelization decisions for multi-topic queries

Run evaluations with `pnpm evaluate:<agent>` commands.

## Important Notes

### Context Engineering

Two-layer content engineering prevents context bloat:
1. **Webpage summarization**: Tavily results are LLM-summarized to extract key information
2. **Research compression**: Final research compressed before handoff to supervisor/report generation

### LangGraph Routing

Conditional edges use return values to determine next node:
- Return node name string → route to that node
- Return `END` → terminate graph
- See routing functions in graph files for patterns

### TypeScript Configuration

Backend uses `"module": "Node16"` with `"moduleResolution": "node16"` for proper ESM/CJS interop with LangGraph dependencies.

## Known Issues

- Supervisor may inject outdated model information when generating sub-agent topics (e.g., referencing "gemini-1.5-pro" for current Google AI research)

## Testing

No automated test framework configured. Manual testing via evaluation scripts in `backend/evaluation/`.

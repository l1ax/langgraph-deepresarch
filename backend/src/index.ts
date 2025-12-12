import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { fullAgentGraph, researchAgentGraph, researchAgentMcpGraph, scopeAgentGraph, supervisorGraph } from './graph';
import { initCheckpointer } from './utils';

dotenv.config();

interface IRunRequestBody {
    graphId: string;
    threadId: string;
    input: any;
    config: any;
}

interface ICreateThreadBody {
    metadata?: Record<string, any>;
}


console.log('Backend server starting...');

const graphsMap = {
    "fullResearchAgent": fullAgentGraph,
    "scopeAgent": scopeAgentGraph,
    "researchAgent": researchAgentGraph,
    "researchAgentMcp": researchAgentMcpGraph,
    "supervisorAgent": supervisorGraph,
}

const app = express();
app.use(cors());
app.use(express.json());

// @ts-expect-error
app.get("/health", (req, res) => {
    res.send("LangGraph Backend is running!");
});

const apiRouter = express.Router();

apiRouter.post('/threads', (req: express.Request<{}, {}, ICreateThreadBody>, res: express.Response) => {
    try {
        const { metadata } = req.body;
        const threadId = randomUUID();

        res.json({
            thread_id: threadId,
            created_at: new Date().toISOString(),
            metadata: metadata || {},
        });
    } catch (error) {
        console.error("Error creating thread:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @ts-expect-error
apiRouter.post('/run', async (req: express.Request<{}, {}, IRunRequestBody>, res: express.Response) => {
    try {
        console.log(req.body);
        const {graphId, threadId, input, config = {}} = req.body;

        if (!threadId) {
            return res.status(400).json({ error: "Thread ID is required" });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const graph = graphsMap[graphId as keyof typeof graphsMap];
        if (!graph) {
            return res.status(400).json({ error: "Invalid graph ID" });
        }

        const writer = async (data: unknown) => {
            try {
                const chunk = {
                    event: 'custom',
                    id: randomUUID(),
                    data: data
                };
                const chunkData = JSON.stringify(chunk);
                res.write(`data: ${chunkData}\n\n`);
            } catch (err) {
                console.error('Error writing chunk:', err);
            }
        };

        const finalConfig = {
            ...config,
            configurable: {
                ...config.configurable,
                thread_id: threadId
            },
            writer: writer,
        };

        await graph.invoke(input, finalConfig);

        res.end();
    } catch (error) {
        console.error("Error running graph:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error: " + error });
        } else {
            const errorChunk = {
                event: 'error',
                id: randomUUID(),
                data: { error: String(error) }
            };
            res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
            res.end();
        }
    }
});

apiRouter.get('/threads/:threadId/state', async (req: express.Request<{threadId: string}>, res: express.Response) => {
    try {
        const {threadId} = req.params;
        const threadState = await fullAgentGraph.getState({
            configurable: {
                thread_id: threadId
            }
        });
        res.json(threadState);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" + error });
    }
});

app.use('/api/langgraph', apiRouter);

async function startServer() {
    try {
        console.log('Initializing checkpointer...');
        await initCheckpointer();
        console.log('Checkpointer initialized successfully');

        app.listen(2024, () => {
            console.log('Backend server is running on port 2024');
        });
    } catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1);
    }
}

startServer();
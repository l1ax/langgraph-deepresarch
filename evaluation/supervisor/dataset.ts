/**
 * 监督器并行化的评测数据集
 *
 * 本文件定义了测试用例，评估监督器是否能准确决定何时并行化研究。
 */

import { HumanMessage, AIMessage, ToolMessage, BaseMessage } from '@langchain/core/messages';

export interface SupervisorDatasetExample {
    inputs: {
        supervisor_messages: BaseMessage[];
    };
    outputs: {
        num_expected_threads: number;
    };
}

/**
 * 应该并行化的示例：比较任务
 */
const shouldParallelize: BaseMessage[] = [
    new HumanMessage({
        content: 'Compare OpenAI vs. Anthropic vs. DeepMind approaches to AI safety',
    }),
    new AIMessage({
        content: 'I need to analyze this request to determine if can should be parallelized.',
        tool_calls: [
            {
                name: 'think_tool',
                args: {
                    reflection:
                        'This is a comparison task involving two distinct AI products: OpenAI v Gemini Deep Research.',
                },
                id: 'call_think_1',
            },
        ],
    }),
    new ToolMessage({
        content:
            'Analysis complete: This is a comparison task involving 3 distinct AI companies: OpenAI v Anthropic v DeepMind.',
        tool_call_id: 'call_think_1',
        name: 'think_tool',
    }),
];

/**
 * 不应该并行化的示例：排名/列表任务
 */
const shouldNotParallelize: BaseMessage[] = [
    new HumanMessage({
        content: 'What are the top three Chinese restaurants in Chelsea, Manhattan',
    }),
    new AIMessage({
        content: 'Let me think about whether this task requires parallelization.',
        tool_calls: [
            {
                name: 'think_tool',
                args: {
                    reflection:
                        'This is a ranking/listing task for restaurants in a specific geographic area (Chelsea, Manhattan).',
                },
                id: 'call_think_2',
            },
        ],
    }),
    new ToolMessage({
        content:
            'Analysis complete: This is a ranking/listing task for restaurants in a specific geographic area (Chelsea, Manhattan).',
        tool_call_id: 'call_think_2',
        name: 'think_tool',
    }),
];

/**
 * 评测数据集
 */
export const supervisorEvaluationDataset: SupervisorDatasetExample[] = [
    {
        inputs: {
            supervisor_messages: shouldParallelize,
        },
        outputs: {
            num_expected_threads: 3,
        },
    },
    {
        inputs: {
            supervisor_messages: shouldNotParallelize,
        },
        outputs: {
            num_expected_threads: 1,
        },
    },
];

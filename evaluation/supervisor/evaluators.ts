/**
 * 监督器并行化的评测函数
 *
 * 这些评测器验证监督器是否能正确决定何时并行化研究。
 */

/**
 * 并行化决策评测结果
 */
export interface ParallelismEvaluationResult {
    key: string;
    score: number; // 0.0 或 1.0（布尔值转换为数字）
    actual_threads: number;
    expected_threads: number;
}

/**
 * 评估监督器是否做出了正确的并行化决策。
 *
 * 此函数检查监督器是否生成了正确数量的 ConductResearch 工具调用。
 * - 比较任务应该为每个比较元素生成多个并行调用
 * - 列表/排名任务应该生成单个调用
 *
 * LangSmith evaluator 签名：支持 (outputs, reference_outputs) 和 (args) 两种格式
 */
export async function evaluateParallelism(
    outputsOrArgs:
        | { supervisor_messages: any[] }
        | { outputs: { supervisor_messages: any[] }; referenceOutputs?: { num_expected_threads: number } },
    reference_outputs?: { num_expected_threads: number }
): Promise<ParallelismEvaluationResult> {
    // 处理两种函数签名格式
    let supervisorMessages: any[];
    let expectedThreads: number;

    if ('outputs' in outputsOrArgs) {
        // 对象格式：{ outputs, referenceOutputs }
        supervisorMessages = outputsOrArgs.outputs.supervisor_messages;
        expectedThreads = outputsOrArgs.referenceOutputs?.num_expected_threads || 1;
    } else {
        // 双参数格式：(outputs, reference_outputs)
        supervisorMessages = outputsOrArgs.supervisor_messages;
        expectedThreads = reference_outputs?.num_expected_threads || 1;
    }

    // 统计所有消息中的 ConductResearch 调用
    // 因为supervisor可能先调用think_tool，然后再调用ConductResearch
    // 所以需要遍历所有消息，而不仅仅是最后一条
    let conductResearchCalls: any[] = [];
    
    for (const message of supervisorMessages) {
        if (message && 'tool_calls' in message && Array.isArray(message.tool_calls)) {
            const messageConductResearchCalls = message.tool_calls.filter(
                (toolCall: any) => toolCall.name === 'ConductResearch'
            );
            conductResearchCalls.push(...messageConductResearchCalls);
        }
    }
    
    const actualThreads = conductResearchCalls.length;

    return {
        key: 'correct_parallelization',
        score: actualThreads === expectedThreads ? 1.0 : 0.0,
        actual_threads: actualThreads,
        expected_threads: expectedThreads,
    };
}

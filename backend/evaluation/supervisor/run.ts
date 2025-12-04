/**
 * 监督器并行化的主评测脚本
 *
 * 此脚本：
 * 1. 创建或使用现有的 LangSmith 数据集
 * 2. 在测试用例上运行监督器节点
 * 3. 使用评测器评估并行化决策
 * 4. 将结果报告到 LangSmith 以供观察
 */

import { Client } from 'langsmith';
import { evaluate } from 'langsmith/evaluation';
import { supervisorEvaluationDataset } from './dataset';
import { evaluateParallelism } from './evaluators';
import { supervisor } from '../../src/nodes/supervisor/supervisor';
import dotenv from 'dotenv';
import type { KVMap } from 'langsmith/schemas';

dotenv.config();

/**
 * 运行监督器节点的目标函数
 */
async function targetFunc(inputs: KVMap, config?: { callbacks?: any }): Promise<KVMap> {
    const state = {
        supervisor_messages: inputs.supervisor_messages || [],
        research_iterations: 0,
    };

    const result = await supervisor(state as any, config);

    // 返回累积的消息列表（输入消息 + 新响应）
    return {
        supervisor_messages: [...state.supervisor_messages, ...(result.supervisor_messages || [])],
    };
}

/**
 * 主评测函数
 */
async function runEvaluation() {
    // 初始化 LangSmith 客户端
    const apiKey = process.env.LANGSMITH_API_KEY;
    if (!apiKey) {
        throw new Error(
            'LANGSMITH_API_KEY environment variable is not set. Please set it to run evaluations.'
        );
    }

    const langsmithClient = new Client({
        apiKey: apiKey,
    });

    // 数据集名称
    const datasetName = 'deep_research_supervisor_parallelism';

    // 检查数据集是否存在，不存在则创建
    let dataset;
    try {
        const hasDataset = await langsmithClient.hasDataset({
            datasetName: datasetName,
        });

        if (hasDataset) {
            dataset = await langsmithClient.readDataset({
                datasetName: datasetName,
            });
            console.log(`Using existing dataset: ${datasetName} (${dataset.id})`);

            // 检查数据集是否有示例，如果没有则添加
            const existingExamples = langsmithClient.listExamples({
                datasetId: dataset.id,
            });
            let exampleCount = 0;
            for await (const _ of existingExamples) {
                exampleCount++;
                break; // 仅检查是否存在任何示例
            }

            if (exampleCount === 0) {
                console.log('Dataset is empty, adding examples...');
                await langsmithClient.createExamples(
                    supervisorEvaluationDataset.map((example) => ({
                        dataset_id: dataset.id,
                        inputs: example.inputs,
                        outputs: example.outputs,
                    }))
                );
                console.log(`Added ${supervisorEvaluationDataset.length} examples to dataset`);
            }
        } else {
            // 创建数据集
            dataset = await langsmithClient.createDataset(datasetName, {
                description:
                    'A dataset that evaluates whether a supervisor can accurately decide when to parallelize research.',
            });

            // 向数据集添加示例
            await langsmithClient.createExamples(
                supervisorEvaluationDataset.map((example) => ({
                    dataset_id: dataset.id,
                    inputs: example.inputs,
                    outputs: example.outputs,
                }))
            );

            console.log(`Created new dataset: ${datasetName} (${dataset.id})`);
        }
    } catch (error) {
        console.error('Error managing dataset:', error);
        throw error;
    }

    // 运行评测
    console.log('\nStarting evaluation...');
    console.log('This may take a few minutes as we evaluate each test case...\n');

    try {
        await (evaluate as any)(targetFunc, {
            data: datasetName,
            evaluators: [evaluateParallelism],
            experimentPrefix: 'Supervisor Parallelism',
            client: langsmithClient,
        });

        console.log('\n✅ Evaluation completed!');
        console.log(`\nView the evaluation results in LangSmith dashboard`);
    } catch (error) {
        console.error('Error running evaluation:', error);
        throw error;
    }
}

// 如果直接执行则运行
if (require.main === module) {
    runEvaluation()
        .then(() => {
            console.log('\nEvaluation script completed successfully.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\nEvaluation script failed:', error);
            process.exit(1);
        });
}

export { runEvaluation };

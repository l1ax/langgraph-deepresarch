/**
 * 研究概要生成的主评测脚本
 * 
 * 此脚本：
 * 1. 创建或使用现有的 LangSmith 数据集
 * 2. 在测试用例上运行 research brief 生成工作流
 * 3. 使用 LLM-as-judge 评测器评估结果
 * 4. 将结果报告到 LangSmith 以供观察
 */

import { Client } from "langsmith";
import { evaluate } from "langsmith/evaluation";
import { scopeAgentGraph } from "../../src/graph";
import { evaluationDataset } from "./dataset";
import {
  evaluateSuccessCriteria,
  evaluateNoAssumptions,
} from "./evaluators";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import type { KVMap } from "langsmith/schemas";

dotenv.config();

/**
 * 运行 research brief 生成工作流的目标函数
 */
async function targetFunc(
  inputs: KVMap,
  config?: { callbacks?: any }
): Promise<KVMap> {
  const graphConfig = {
    configurable: {
      thread_id: uuidv4(),
    },
    ...config,
  };

  const result = await scopeAgentGraph.invoke(inputs, graphConfig);
  
  return {
    research_brief: (result.research_brief as string) || "",
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
      "LANGSMITH_API_KEY environment variable is not set. Please set it to run evaluations."
    );
  }

  const langsmithClient = new Client({
    apiKey: apiKey,
  });

  // 数据集名称
  const datasetName = "deep_research_scoping";

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
        console.log("Dataset is empty, adding examples...");
        await langsmithClient.createExamples(
          evaluationDataset.map((example) => ({
            dataset_id: dataset.id,
            inputs: example.inputs,
            outputs: example.outputs,
          }))
        );
        console.log(`Added ${evaluationDataset.length} examples to dataset`);
      }
    } else {
      // 创建数据集
      dataset = await langsmithClient.createDataset(datasetName, {
        description:
          "A dataset that measures the quality of research briefs generated from an input conversation",
      });

      // 向数据集添加示例
      await langsmithClient.createExamples(
        evaluationDataset.map((example) => ({
          dataset_id: dataset.id,
          inputs: example.inputs,
          outputs: example.outputs,
        }))
      );

      console.log(`Created new dataset: ${datasetName} (${dataset.id})`);
    }
  } catch (error) {
    console.error("Error managing dataset:", error);
    throw error;
  }

  // 运行评测
  console.log("\nStarting evaluation...");
  console.log("This may take a few minutes as we evaluate each test case...\n");

  try {
    // 直接使用数据集名称 - 让 LangSmith 处理获取示例
    // 这避免了示例对象结构的潜在问题
    // 需要类型断言，因为 TypeScript 无法推断正确的重载
    await (evaluate as any)(
      targetFunc,
      {
        data: datasetName, // 以字符串形式传递数据集名称 - LangSmith 将获取示例
        evaluators: [evaluateSuccessCriteria, evaluateNoAssumptions],
        experimentPrefix: "Deep Research Scoping",
        client: langsmithClient,
      }
    );

    console.log("\n✅ Evaluation completed!");
    console.log(
      `\nView the evaluation results in LangSmith dashboard`
    );
  } catch (error) {
    console.error("Error running evaluation:", error);
    throw error;
  }
}

// 如果直接执行则运行
if (require.main === module) {
  runEvaluation()
    .then(() => {
      console.log("\nEvaluation script completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nEvaluation script failed:", error);
      process.exit(1);
    });
}

export { runEvaluation };


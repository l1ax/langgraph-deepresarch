/**
 * 研究概要生成的评测函数
 * 
 * 这些评测器使用 LLM-as-judge 方法评估生成的 research brief 质量。
 */

import deepSeek from "../../src/llm";
import { briefCriteriaPrompt, briefHallucinationPrompt } from "./prompts";

/**
 * 单个标准的评测结果
 */
export interface CriteriaEvaluation {
  criteria_text: string;
  reasoning: string;
  is_captured: boolean;
}

/**
 * 成功标准评测结果
 */
export interface SuccessCriteriaResult {
  key: string;
  score: number; // 0.0 到 1.0
  individual_evaluations: Array<{
    criteria: string;
    captured: boolean;
    reasoning: string;
  }>;
}

/**
 * 无假设评测结果
 */
export interface NoAssumptionsResult {
  key: string;
  score: number; // 0.0 或 1.0（布尔值转换为数字）
  reasoning: string;
}

/**
 * 评估 research brief 是否捕获了所有必需的成功标准。
 * 
 * 此函数单独评估每个标准，为每个评测决策提供聚焦的评估和详细的推理。
 * 
 * LangSmith evaluator 签名：支持 (outputs, reference_outputs) 和 (args) 两种格式
 */
export async function evaluateSuccessCriteria(
  outputsOrArgs: { research_brief: string } | { outputs: { research_brief: string }; referenceOutputs?: { criteria: string[] } },
  reference_outputs?: { criteria: string[] }
): Promise<SuccessCriteriaResult> {
  // 处理两种函数签名格式
  let researchBrief: string;
  let successCriteria: string[];
  
  if ('outputs' in outputsOrArgs) {
    // 对象格式：{ outputs, referenceOutputs }
    researchBrief = outputsOrArgs.outputs.research_brief;
    successCriteria = outputsOrArgs.referenceOutputs?.criteria || [];
  } else {
    // 双参数格式：(outputs, reference_outputs)
    researchBrief = outputsOrArgs.research_brief;
    successCriteria = reference_outputs?.criteria || [];
  }

  // 单独评估每个标准
  const individualEvaluations: CriteriaEvaluation[] = [];

  for (const criterion of successCriteria) {
    const promptContent = briefCriteriaPrompt
      .replace("{criterion}", criterion)
      .replace("{research_brief}", researchBrief);

    try {
      const response = await deepSeek.invoke({
        messages: [
          {
            role: "user",
            content: promptContent,
          },
        ],
        response_format: { type: "json_object" },
      });

      const evaluation: CriteriaEvaluation = JSON.parse(response as string);
      
    // 确保 criteria_text 正确填充
    individualEvaluations.push({
      criteria_text: criterion,
      reasoning: evaluation.reasoning,
      is_captured: evaluation.is_captured,
    });
  } catch (error) {
    console.error(`Error evaluating criterion "${criterion}":`, error);
    // 出错时，默认为未捕获
    individualEvaluations.push({
      criteria_text: criterion,
      reasoning: `Error during evaluation: ${error}`,
      is_captured: false,
    });
  }
}

// 计算总体分数：捕获的标准数量占总数的百分比
const capturedCount = individualEvaluations.filter(
  (evaluation) => evaluation.is_captured
).length;
  const totalCount = individualEvaluations.length;

    return {
      key: "success_criteria_score",
      score: totalCount > 0 ? capturedCount / totalCount : 0.0,
      individual_evaluations: individualEvaluations.map((evaluation) => ({
        criteria: evaluation.criteria_text,
        captured: evaluation.is_captured,
        reasoning: evaluation.reasoning,
      })),
    };
}

/**
 * 评估 research brief 是否避免了做出未授权的假设。
 * 
 * 此评测器检查 research brief 是否仅包含用户明确提供的信息和要求，
 * 而不对未说明的偏好或要求做出假设。
 * 
 * LangSmith evaluator 签名：支持 (outputs, reference_outputs) 和 (args) 两种格式
 */
export async function evaluateNoAssumptions(
  outputsOrArgs: { research_brief: string } | { outputs: { research_brief: string }; referenceOutputs?: { criteria: string[] } },
  reference_outputs?: { criteria: string[] }
): Promise<NoAssumptionsResult> {
  // Handle both function signature formats
  let researchBrief: string;
  let successCriteria: string[];
  
  if ('outputs' in outputsOrArgs) {
    // Object format: { outputs, referenceOutputs }
    researchBrief = outputsOrArgs.outputs.research_brief;
    successCriteria = outputsOrArgs.referenceOutputs?.criteria || [];
  } else {
    // Two-parameter format: (outputs, reference_outputs)
    researchBrief = outputsOrArgs.research_brief;
    successCriteria = reference_outputs?.criteria || [];
  }

  const promptContent = briefHallucinationPrompt
    .replace("{research_brief}", researchBrief)
    .replace("{success_criteria}", JSON.stringify(successCriteria));

  try {
    const response = await deepSeek.invoke({
      messages: [
        {
          role: "user",
          content: promptContent,
        },
      ],
      response_format: { type: "json_object" },
    });

    const evaluation: { no_assumptions: boolean; reasoning: string } =
      JSON.parse(response as string);

    return {
      key: "no_assumptions_score",
      score: evaluation.no_assumptions ? 1.0 : 0.0,
      reasoning: evaluation.reasoning,
    };
  } catch (error) {
    console.error("Error evaluating no assumptions:", error);
    return {
      key: "no_assumptions_score",
      score: 0.0,
      reasoning: `Error during evaluation: ${error}`,
    };
  }
}


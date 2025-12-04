/**
 * 监督器工具
 *
 * 用于将研究任务委派给专业子代理并指示研究完成的工具。
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * 用于将研究任务委派给专业子代理的工具。
 */
export const conductResearchTool = new DynamicStructuredTool({
    name: 'ConductResearch',
    description: `Tool for delegating a research task to a specialized sub-agent.

Use this tool when you need to conduct research on a specific topic. The sub-agent will:
- Perform comprehensive research using available tools
- Gather and analyze relevant information
- Return compressed research findings

Args:
    research_topic: The topic to research. Should be a single topic, and should be described in high detail (at least a paragraph).

Returns:
    Compressed research findings from the sub-agent`,
    schema: z.object({
        research_topic: z
            .string()
            .describe(
                'The topic to research. Should be a single topic, and should be described in high detail (at least a paragraph).'
            ),
    }),
    func: async (input: { research_topic: string }): Promise<string> => {
        // This is a placeholder - actual execution happens in supervisor_tools node
        return `Research delegation acknowledged for topic: ${input.research_topic}`;
    },
});

/**
 * 用于指示研究过程已完成的工具。
 */
export const researchCompleteTool = new DynamicStructuredTool({
    name: 'ResearchComplete',
    description: `Tool for indicating that the research process is complete.

Use this tool when:
- You have gathered sufficient information to answer the research question
- All necessary research has been conducted
- You are ready to provide final research findings

This tool takes no arguments and signals the end of the research workflow.

Returns:
    Confirmation that research is marked as complete`,
    schema: z.object({}),
    func: async (): Promise<string> => {
        return 'Research marked as complete';
    },
});

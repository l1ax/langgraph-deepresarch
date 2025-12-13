/**
 * @file Tavily 搜索工具
 *
 * 此模块为研究代理提供搜索和内容处理工具，
 * 包括网络搜索功能和内容摘要工具。
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { ChatDeepSeek } from '@langchain/deepseek';
import { summarizeWebpagePrompt } from '../prompts';
import { getTodayStr } from '../utils';
import dotenv from 'dotenv';
dotenv.config();

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

const deepSeekChat = new ChatDeepSeek({
    model: 'deepseek-chat',
    temperature: 0,
    configuration: {
        baseURL: process.env.DEEPSEEK_BASE_URL,
        apiKey: process.env.DEEPSEEK_API_KEY
    },
});

interface Summary {
    summary: string;
    key_excerpts: string;
}

interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
    raw_content?: string;
}

interface TavilyResponse {
    results: TavilySearchResult[];
}

/**
 * 使用配置的摘要模型对网页内容进行摘要。
 */
async function summarizeWebpageContent(webpageContent: string): Promise<string> {
    try {
        const promptContent = summarizeWebpagePrompt
            .replace('{webpage_content}', webpageContent)
            .replace('{date}', getTodayStr());

        let fullResponse = '';
        const stream = await deepSeekChat.stream([
            {
                role: 'user',
                content: promptContent,
            },
        ], {
            response_format: { type: 'json_object' },
        });

        for await (const chunk of stream) {
            if (chunk.content) {
                fullResponse += chunk.content;
            }
        }

        const summary: Summary = JSON.parse(fullResponse);
        const formattedSummary = `<summary>\n${summary.summary}\n</summary>\n\n<key_excerpts>\n${summary.key_excerpts}\n</key_excerpts>`;

        return formattedSummary;
    } catch (error) {
        console.error(`Failed to summarize webpage: ${error}`);
        return webpageContent.length > 1000
            ? webpageContent.slice(0, 1000) + '...'
            : webpageContent;
    }
}

/**
 * 按 URL 去重搜索结果，避免处理重复内容。
 */
function deduplicateSearchResults(
    searchResults: TavilyResponse[]
): Record<string, TavilySearchResult> {
    const uniqueResults: Record<string, TavilySearchResult> = {};

    for (const response of searchResults) {
        for (const result of response.results) {
            if (!uniqueResults[result.url]) {
                uniqueResults[result.url] = result;
            }
        }
    }

    return uniqueResults;
}

/**
 * 通过摘要可用内容来处理搜索结果。
 */
async function processSearchResults(
    uniqueResults: Record<string, TavilySearchResult>
): Promise<Record<string, { title: string; content: string }>> {
    const summarizedResults: Record<string, { title: string; content: string }> = {};

    for (const [url, result] of Object.entries(uniqueResults)) {
        const content = result.raw_content
            ? await summarizeWebpageContent(result.raw_content)
            : result.content;

        summarizedResults[url] = {
            title: result.title,
            content: content,
        };
    }

    return summarizedResults;
}

/**
 * 处理搜索结果结构
 */
function formatSearchOutput(
    summarizedResults: Record<string, { title: string; content: string }>
): string {
    if (Object.keys(summarizedResults).length === 0) {
        return 'No valid search results found. Please try different search queries or use a different search API.';
    }

    let formattedOutput = 'Search results: \n\n';

    let index = 1;
    for (const [url, result] of Object.entries(summarizedResults)) {
        formattedOutput += `\n\n--- SOURCE ${index}: ${result.title} ---\n`;
        formattedOutput += `URL: ${url}\n\n`;
        formattedOutput += `SUMMARY:\n${result.content}\n\n`;
        formattedOutput += '-'.repeat(80) + '\n';
        index++;
    }

    return formattedOutput;
}

/**
 * 执行多个 Tavily 搜索。
 */
async function tavilySearchMultiple(
    searchQueries: string[],
    maxResults: number = 3,
    topic: 'general' | 'news' | 'finance' = 'general',
    includeRawContent: boolean = true
): Promise<TavilyResponse[]> {
    const searchDocs: TavilyResponse[] = [];

    for (const query of searchQueries) {
        const result = await tavilyClient.search(query, {
            maxResults,
            includeRawContent: includeRawContent as any,
            topic,
        });
        searchDocs.push(result as TavilyResponse);
    }

    return searchDocs;
}

/**
 * Tavily 搜索工具
 *
 * 从 Tavily 搜索 API 获取结果并进行内容摘要。
 */
export const tavilySearchTool = new DynamicStructuredTool({
    name: 'tavily_search',
    description: `Fetch results from Tavily search API with content summarization.

Args:
    query: A single search query to execute

Returns:
    Formatted string of search results with summaries`,
    schema: z.object({
        query: z.string().describe('A single search query to execute'),
    }),
    func: async (input: { query: string }): Promise<string> => {
        const { query } = input;
        const searchResults = await tavilySearchMultiple(
            [query],
            3,
            'general',
            true
        );

        const uniqueResults = deduplicateSearchResults(searchResults);
        const summarizedResults = await processSearchResults(uniqueResults);

        return formatSearchOutput(summarizedResults);
    },
});

/**
 * @file 用户澄清节点 - 确认是否需要用户进一步说明
 */

import { AIMessage, getBufferString } from "@langchain/core/messages";
import { Command, LangGraphRunnableConfig } from "@langchain/langgraph";
import { ChatDeepSeek } from '@langchain/deepseek';
import { clarifyWithUserInstructions } from '../../prompts';
import { getTodayStr } from '../../utils';
import { StateAnnotation } from '../../state';
import {ClarifyEvent} from '../../outputAdapters';
import {traceable} from 'langsmith/traceable';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

const deepSeekChat = new ChatDeepSeek({
    model: 'deepseek-chat',
    temperature: 0,
    configuration: {
        baseURL: process.env.DEEPSEEK_BASE_URL,
        apiKey: process.env.DEEPSEEK_API_KEY
    },
});

export interface ClarifyWithUser {
  need_clarification: boolean;
  question: string;
  verification: string;
}

export const clarifyWithUser = traceable(async (
  state: typeof StateAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<Command> => {
  const event = new ClarifyEvent();

  // 发送 pending 状态
  if (config.writer) {
    config.writer(event.setStatus('pending').toJSON());
  }

  const promptContent = clarifyWithUserInstructions
    .replace('{messages}', getBufferString(state.messages || []))
    .replace('{date}', getTodayStr());

  // 发送 running 状态
  if (config.writer) {
    config.writer(event.setStatus('running').toJSON());
  }

  try {
    // 使用stream方式调用LLM
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
      const content = chunk.content;
      if (content && typeof content === 'string' && content.length > 0) {
        
        fullResponse += content;

        // 发送流式更新（带aggregateRule: 'concat'）
        if (config.writer) {
          event.content.data = content;
          event.content.aggregateRule = 'concat';
          config.writer(event.setStatus('running').toJSON());
        }
      }
    }

    // 解析完整的JSON
    const clarification: ClarifyWithUser = JSON.parse(fullResponse);

    // 发送最终结果（使用完整的data）
    event.content.data = clarification;
    event.content.aggregateRule = undefined;
    // 发送 finished 状态
    if (config.writer) {
      config.writer(event.setStatus('finished').toJSON());
    }

    // Route based on clarification need
    if (clarification.need_clarification) {
      return new Command({
        goto: "__end__",
        update: {
          messages: [new AIMessage({ content: clarification.question })],
        },
      });
    } else {
      return new Command({
        goto: "write_research_brief",
        update: {
          messages: [new AIMessage({ content: clarification.verification })],
        },
      });
    }
  } catch (error) {
    // 发送 error 状态
    if (config.writer) {
      config.writer(event.setStatus('error').toJSON());
    }
    throw error;
  }
});

import OpenAI from "openai";
import { ChatCompletionCreateParamsNonStreaming, ChatCompletionCreateParamsStreaming } from "openai/resources/index";
import { wrapOpenAI } from "langsmith/wrappers";
import dotenv from "dotenv";
dotenv.config();

class DeepSeek {
    openai: OpenAI;

    constructor(params: Partial<ChatCompletionCreateParamsNonStreaming> = {}) {
        const client = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: process.env.DEEPSEEK_BASE_URL,
            ...params
        });

        this.openai = wrapOpenAI(client, {
            name: "DeepSeek Chat Completion",
            tags: ["deepseek", "llm"],
        });
    }

    async invoke(params: Partial<ChatCompletionCreateParamsNonStreaming> & {messages: ChatCompletionCreateParamsNonStreaming['messages']}) {
        const defaultParams: ChatCompletionCreateParamsNonStreaming = {
            model: "deepseek-chat",
            temperature: 0,
            ...params
        }
        const completion = await this.openai.chat.completions.create(defaultParams);
        return completion.choices[0].message.content;
    }

    async *stream(params: Partial<ChatCompletionCreateParamsStreaming> & {messages: ChatCompletionCreateParamsStreaming['messages']}) {
        const defaultParams: ChatCompletionCreateParamsStreaming = {
            model: "deepseek-chat",
            temperature: 0,
            stream: true,
            ...params
        }
        const stream = await this.openai.chat.completions.create(defaultParams);
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }
    }
}

const deepSeek = new DeepSeek();

export default deepSeek;

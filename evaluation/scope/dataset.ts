/**
 * 研究概要生成的评测数据集
 * 
 * 本文件定义了测试用例，包含输入对话和期望的成功标准，
 * 这些标准应该在生成的 research brief 中被捕获。
 */

import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

export interface DatasetExample {
  inputs: {
    messages: BaseMessage[];
  };
  outputs: {
    criteria: string[];
  };
}

/**
 * 示例对话 1：投资建议
 */
const conversation1: BaseMessage[] = [
  new HumanMessage({
    content: "What's the best way to invest $50,000 for retirement?",
  }),
  new AIMessage({
    content:
      "Could you please provide some additional information to tailor the investment advice for your $50,000 retirement goal? Specifically:\n Your current age or desired retirement age\n Your risk tolerance (low, medium, high)\n Any preferences for investment types (e.g., stocks, bonds, mutual funds, real estate)\n Whether you are investing through a tax-advantaged account (e.g., IRA, 401(k)) or a regular brokerage account\n This will help me provide more personalized and relevant suggestions.",
  }),
  new HumanMessage({
    content:
      "I'm 25 and I want to retire by 45. My risk tolerance is high right now but I think will decrease over time. I have heard that stocks and ETFs are a good choice, but I'm open to anything. And I already have a 401k, but this would just be through a regular brokerage account.",
  }),
];

const criteria1: string[] = [
  "Current age is 25",
  "Desired retirement age is 45",
  "Current risk tolerance is high",
  "Interested in investing in stocks and ETFs",
  "Open to forms of investment beyond stocks and ETFs",
  "Investment account is a regular brokerage account",
];

/**
 * 示例对话 2：公寓搜索
 */
const conversation2: BaseMessage[] = [
  new HumanMessage({
    content: "I am looking for an apartment in NYC, can you help me?",
  }),
  new AIMessage({
    content:
      "Could you please specify your apartment preferences? For example:\n Desired neighborhoods or boroughs\n Number of bedrooms/bathrooms\n Budget range (monthly rent)\n Any amenities or must-have features\n Preferred move-in date\n This information will help me provide the most relevant apartment options in NYC.",
  }),
  new HumanMessage({
    content:
      "I'd prefer to live in Chelsea, Flatiron, or West Village. I'm looking for a 2 bed 2 bath, and I am looking for monthly rent below 7k. I'd like this to be a doorman building and have an in unit washer and dryer, but it's okay if there's no washer dryer. It's a plus if the building has a gym. And I'd like to move in in September 2025.",
  }),
];

const criteria2: string[] = [
  "Looking for a 2 bed 2 bath apartment in Chelsea, Flatiron, or West Village",
  "Monthly rent below 7k",
  "Should be in a doorman building",
  "Ideally have an in unit washer and dryer but not strict",
  "Ideally have a gym but not strict",
  "Move in date is September 2025",
];

/**
 * 评测数据集
 */
export const evaluationDataset: DatasetExample[] = [
  {
    inputs: {
      messages: conversation1,
    },
    outputs: {
      criteria: criteria1,
    },
  },
  {
    inputs: {
      messages: conversation2,
    },
    outputs: {
      criteria: criteria2,
    },
  },
];


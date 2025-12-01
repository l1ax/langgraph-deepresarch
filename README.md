# scope
划定研究范围，生成研究简报

## 实现方法
### Clarify With User
用户需求澄清阶段，确保用户提供了足够多的信息来开展接下来的research

### Research Brief Generation
根据用户的信息，使用第一人称生成研究简报，确保简报的内容准确且无信息丢失

## 评测
两个方面：
1. research brief中没有丢失用户的信息
2. research brief中没有对 用户未提及的部分 做出假设。

### Example
```javascript
conversation_1 = [
    HumanMessage(content="What's the best way to invest $50,000 for retirement?"),
    AIMessage(content="Could you please provide some additional information to tailor the investment advice for your $50,000 retirement goal? Specifically:\n Your current age or desired retirement age\n Your risk tolerance (low, medium, high)\n Any preferences for investment types (e.g., stocks, bonds, mutual funds, real estate)\n Whether you are investing through a tax-advantaged account (e.g., IRA, 401(k)) or a regular brokerage account\n This will help me provide more personalized and relevant suggestions."),
    HumanMessage(content="I'm 25 and I want to retire by 45. My risk tolerance is high right now but I think will decrease over time. I have heard that stocks and ETFs are a good choice, but I'm open to anything. And I already have a 401k, but this would just be through a regular brokerage account."),
]
```
基于这个案例，我们期望llm能够提取出以下几个信息：
- "Current age is 25",
- "Desired retirement age is 45",
- "Current risk tolerance is high",
- "Interested in investing in stocks and ETFs",
- "Open to forms of investment beyond stocks and ETFs"
- "Investment account is a regular brokerage account"

且确保生成的brief中不包含任何假设信息
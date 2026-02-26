/**
 * Example: Using Ujeebu Extract with LangChain agents
 *
 * Install:
 *   npm install @ujeebu-org/langchain @langchain/core @langchain/openai @langchain/langgraph langchain dotenv ts-node
 *
 * Prerequisites:
 *   - Set UJEEBU_API_KEY and OPENAI_API_KEY in .env
 *
 * Run:
 *   npx ts-node -r dotenv/config examples/agent-example.ts
 */

import { UjeebuExtractTool } from '../src';
import { createAgent } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';

async function main() {
  // Initialize the model
  const model = new ChatOpenAI({
    temperature: 0,
    model: 'gpt-4',
  });

  // Create the Ujeebu Extract tool
  const ujeebuTool = new UjeebuExtractTool();

  // Create the agent
  const agent = createAgent({ model, tools: [ujeebuTool] });

  // Example 1: Extract article and summarize
  console.log('='.repeat(50));
  console.log('Example 1: Extract and summarize article');
  console.log('='.repeat(50));
  const response1 = await agent.invoke({
    messages: [
      {
        role: 'user',
        content:
          'Can you extract the article from https://ujeebu.com/blog/extracting-product-information-automatically-using-chatgpt and give me a brief summary?',
      },
    ],
  });
  console.log(response1.messages[response1.messages.length - 1].content);

  // Example 2: Extract multiple articles and compare
  console.log('\n' + '='.repeat(50));
  console.log('Example 2: Compare multiple articles');
  console.log('='.repeat(50));
  const response2 = await agent.invoke({
    messages: [
      {
        role: 'user',
        content: `Extract articles from these URLs and compare their main points:
    1. https://ujeebu.com/blog/extracting-product-information-automatically-using-chatgpt/
    2. https://ujeebu.com/blog/building-a-crawler-with-scrapy/`,
      },
    ],
  });
  console.log(response2.messages[response2.messages.length - 1].content);

  // Example 3: Extract with specific information
  console.log('\n' + '='.repeat(50));
  console.log('Example 3: Extract specific information');
  console.log('='.repeat(50));
  const response3 = await agent.invoke({
    messages: [
      {
        role: 'user',
        content:
          'Extract the article from https://ujeebu.com/blog/web-scraping-in-2025-state-of-the-art-and-trends/ and tell me who wrote it and when it was published.',
      },
    ],
  });
  console.log(response3.messages[response3.messages.length - 1].content);
}

main().catch(console.error);

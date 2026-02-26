/**
 * Example: Using Ujeebu document loader with vector stores
 *
 * Install:
 *   npm install @ujeebu-org/langchain @langchain/core @langchain/openai @langchain/community dotenv ts-node
 *   npm install faiss-node (for Example 3 only)
 *
 * Prerequisites:
 *   - Set UJEEBU_API_KEY and OPENAI_API_KEY in .env
 *
 * Run:
 *   npx ts-node -r dotenv/config examples/document-loader-example.ts
 */

import { UjeebuLoader } from '../src';

async function main() {
  // Example 1: Load single article
  console.log('='.repeat(50));
  console.log('Example 1: Load single article');
  console.log('='.repeat(50));

  const loader1 = new UjeebuLoader({
    urls: ['https://ujeebu.com/blog/extracting-product-information-automatically-using-chatgpt'],
  });
  const documents1 = await loader1.load();

  console.log(`Loaded ${documents1.length} document(s)`);
  if (documents1.length > 0) {
    console.log(`Title: ${documents1[0].metadata.title}`);
    console.log(`Author: ${documents1[0].metadata.author}`);
    console.log(`Content preview: ${documents1[0].pageContent?.substring(0, 200)}...`);
  }

  // Example 2: Load multiple articles
  console.log('\n' + '='.repeat(50));
  console.log('Example 2: Load multiple articles');
  console.log('='.repeat(50));

  const urls = [
    'https://ujeebu.com/blog/extracting-product-information-automatically-using-chatgpt/',
    'https://ujeebu.com/blog/building-a-crawler-with-scrapy/',
    'https://ujeebu.com/blog/web-scraping-in-2025-state-of-the-art-and-trends/',
  ];

  const loader2 = new UjeebuLoader({ urls });
  const documents2 = await loader2.load();

  console.log(`Loaded ${documents2.length} document(s)`);
  documents2.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.metadata.title} by ${doc.metadata.author}`);
  });

  // Example 3: Create vector store and query
  // NOTE: Requires faiss-node: npm install faiss-node
  console.log('\n' + '='.repeat(50));
  console.log('Example 3: Create vector store and perform semantic search');
  console.log('='.repeat(50));

  try {
    const { FaissStore } = await import('@langchain/community/vectorstores/faiss');
    const { OpenAIEmbeddings, ChatOpenAI } = await import('@langchain/openai');
    const { ChatPromptTemplate } = await import('@langchain/core/prompts');
    const { StringOutputParser } = await import('@langchain/core/output_parsers');

    // Reuse documents from Example 2
    const embeddings = new OpenAIEmbeddings();
    const vectorStore = await FaissStore.fromDocuments(documents2, embeddings);
    const retriever = vectorStore.asRetriever();

    const llm = new ChatOpenAI({
      temperature: 0,
      model: 'gpt-4',
    });

    const query = 'What are the main topics discussed in these articles?';

    // Retrieve relevant documents
    const relevantDocs = await retriever.invoke(query);

    // Build prompt with context
    const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'Answer the question based on the following context:\n\n{context}',
      ],
      ['human', '{question}'],
    ]);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const answer = await chain.invoke({ context, question: query });

    console.log(`Query: ${query}`);
    console.log(`Answer: ${answer}`);
    console.log('\nSources:');
    relevantDocs.forEach((doc) => {
      console.log(`- ${doc.metadata.title} (${doc.metadata.source})`);
    });
  } catch {
    console.log('Skipping vector store example (install faiss-node to enable)');
  }

  // Example 4: Load with HTML content for detailed analysis
  console.log('\n' + '='.repeat(50));
  console.log('Example 4: Load with HTML for structure analysis');
  console.log('='.repeat(50));

  const loader4 = new UjeebuLoader({
    urls: ['https://ujeebu.com/blog/extracting-product-information-automatically-using-chatgpt'],
    extractHtml: true,
    extractImages: true,
  });
  const documents4 = await loader4.load();

  if (documents4.length > 0) {
    const doc = documents4[0];
    console.log(`Title: ${doc.metadata.title}`);
    console.log(`Has HTML: ${doc.pageContent.includes('HTML:')}`);
    console.log(`Number of images: ${(doc.metadata.images as string[])?.length || 0}`);
  }

  // Example 5: Quick mode for faster loading
  console.log('\n' + '='.repeat(50));
  console.log('Example 5: Quick mode for faster extraction');
  console.log('='.repeat(50));

  const loader5 = new UjeebuLoader({
    urls: [
      'https://ujeebu.com/blog/extracting-product-information-automatically-using-chatgpt/',
      'https://ujeebu.com/blog/building-a-crawler-with-scrapy/',
    ],
    quickMode: true, // 30-60% faster
  });
  const documents5 = await loader5.load();

  console.log(`Loaded ${documents5.length} documents in quick mode`);
}

main().catch(console.error);

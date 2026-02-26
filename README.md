# LangChain Ujeebu Integration (Node.js/TypeScript)

[![npm version](https://badge.fury.io/js/@ujeebu-org/langchain.svg)](https://badge.fury.io/js/@ujeebu-org/langchain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 16](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://nodejs.org/)

Official LangChain integration for [Ujeebu Extract API](https://ujeebu.com/docs/extract) - Extract clean, structured content from news articles and blog posts for use with Large Language Models (LLMs) and AI applications.

## Features

- **Easy Integration**: Seamlessly integrate Ujeebu Extract API with LangChain agents and chains
- **Document Loaders**: Load articles as LangChain Documents for use with vector stores and retrievers
- **Agent Tools**: Use Ujeebu Extract as a tool in LangChain agents
- **Rich Metadata**: Extract article text, HTML, author, publication date, images, and more
- **Quick Mode**: Optional fast extraction mode (30-60% faster)
- **TypeScript Support**: Full TypeScript types and interfaces

## What is Ujeebu Extract?

Ujeebu Extract converts news and blog articles into clean, structured JSON data. It extracts:

- Clean article text and HTML
- Author and publication date
- Title and summary
- Images and media
- RSS feeds
- Site metadata

Perfect for RAG (Retrieval-Augmented Generation) applications, content analysis, and LLM training data.

## Installation

```bash
npm install @ujeebu-org/langchain
# or
yarn add @ujeebu-org/langchain
# or
pnpm add @ujeebu-org/langchain
```

### Requirements

- Node.js 16.0 or higher
- @langchain/core 0.3.0 or higher
- An Ujeebu API key ([Get one here](https://ujeebu.com/signup))

## Quick Start

### Set up your API key

```bash
export UJEEBU_API_KEY="your-api-key"
```

Or set it programmatically:

```typescript
process.env.UJEEBU_API_KEY = "your-api-key";
```

### Using as an Agent Tool

```bash
npm install @ujeebu-org/langchain @langchain/core @langchain/openai @langchain/langgraph langchain
```

```typescript
import { UjeebuExtractTool } from '@ujeebu-org/langchain';
import { createAgent } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';

// Initialize the tool
const ujeebuTool = new UjeebuExtractTool();

// Create an agent
const model = new ChatOpenAI({ temperature: 0 });
const agent = createAgent({ model, tools: [ujeebuTool] });

// Use the agent
const response = await agent.invoke({
  messages: [{ role: 'user', content: 'Extract the article from https://example.com/article and summarize it' }],
});
console.log(response.messages[response.messages.length - 1].content);
```

### Using the Document Loader

```bash
npm install @ujeebu-org/langchain @langchain/core @langchain/openai @langchain/community
```

```typescript
import { UjeebuLoader } from '@ujeebu-org/langchain';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';

// Load articles
const loader = new UjeebuLoader({
  urls: [
    'https://example.com/article1',
    'https://example.com/article2',
    'https://example.com/article3'
  ]
});
const documents = await loader.load();

// Create a vector store
const embeddings = new OpenAIEmbeddings();
const vectorStore = await FaissStore.fromDocuments(documents, embeddings);

// Query the documents
const results = await vectorStore.similaritySearch('What are the main topics?');
```

## Usage Examples

### Basic Article Extraction

```typescript
import { UjeebuExtractTool } from '@ujeebu-org/langchain';

const tool = new UjeebuExtractTool();
const result = await tool.invoke({
  url: 'https://example.com/article',
  text: true,
  author: true,
  pub_date: true
});
console.log(result);
```

### Extract with Images

```typescript
import { UjeebuExtractTool } from '@ujeebu-org/langchain';

const tool = new UjeebuExtractTool();
const result = await tool.invoke({
  url: 'https://example.com/article',
  images: true  // Extract article images
});
```

### Quick Mode for Faster Extraction

```typescript
import { UjeebuLoader } from '@ujeebu-org/langchain';

const loader = new UjeebuLoader({
  urls: ['https://example.com/article'],
  quickMode: true  // 30-60% faster, slightly less accurate
});
const documents = await loader.load();
```

### Load with HTML Content

```typescript
import { UjeebuLoader } from '@ujeebu-org/langchain';

const loader = new UjeebuLoader({
  urls: ['https://example.com/article'],
  extractHtml: true,   // Include HTML content
  extractImages: true  // Include images
});
const documents = await loader.load();

// Access metadata
const doc = documents[0];
console.log(`Title: ${doc.metadata.title}`);
console.log(`Author: ${doc.metadata.author}`);
console.log(`Images: ${doc.metadata.images}`);
```

### Build a QA System

```typescript
import { UjeebuLoader } from '@ujeebu-org/langchain';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

// Load articles
const loader = new UjeebuLoader({
  urls: [
    'https://example.com/article1',
    'https://example.com/article2'
  ]
});
const documents = await loader.load();

// Create vector store
const embeddings = new OpenAIEmbeddings();
const vectorStore = await FaissStore.fromDocuments(documents, embeddings);
const retriever = vectorStore.asRetriever();

// Retrieve and answer
const query = 'What are the main points?';
const relevantDocs = await retriever.invoke(query);
const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');

const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'Answer based on the following context:\n\n{context}'],
  ['human', '{question}'],
]);

const chain = prompt.pipe(new ChatOpenAI({ temperature: 0 })).pipe(new StringOutputParser());
const answer = await chain.invoke({ context, question: query });
console.log(answer);
```

## API Reference

### UjeebuExtractTool

A LangChain tool for extracting article content.

**Constructor Parameters:**
- `apiKey` (string, optional): Ujeebu API key. Defaults to `UJEEBU_API_KEY` environment variable.
- `baseUrl` (string, optional): Custom API endpoint URL.

**Tool Parameters (UjeebuExtractInput):**
- `url` (string, required): URL of the article to extract
- `text` (boolean, optional): Extract article text (default: true)
- `html` (boolean, optional): Extract article HTML (default: false)
- `author` (boolean, optional): Extract article author (default: true)
- `pub_date` (boolean, optional): Extract publication date (default: true)
- `images` (boolean, optional): Extract images (default: false)
- `quick_mode` (boolean, optional): Use quick mode for faster extraction (default: false)

### UjeebuLoader

A LangChain document loader for articles.

**Constructor Parameters (UjeebuLoaderParams):**
- `urls` (string[], required): List of article URLs to load
- `apiKey` (string, optional): Ujeebu API key
- `extractText` (boolean, optional): Extract article text (default: true)
- `extractHtml` (boolean, optional): Extract article HTML (default: false)
- `extractAuthor` (boolean, optional): Extract author (default: true)
- `extractPubDate` (boolean, optional): Extract publication date (default: true)
- `extractImages` (boolean, optional): Extract images (default: false)
- `quickMode` (boolean, optional): Use quick mode (default: false)
- `baseUrl` (string, optional): Custom API endpoint URL

**Methods:**
- `load()`: Promise<Document[]> - Load all documents

**Document Metadata:**
- `source`: Original URL
- `url`: Resolved URL
- `canonical_url`: Canonical URL
- `title`: Article title
- `author`: Article author
- `pub_date`: Publication date
- `language`: Article language
- `site_name`: Site name
- `summary`: Article summary
- `image`: Main image URL
- `images`: List of all image URLs (if extractImages=true)

## Advanced Usage

### Custom API Endpoint

```typescript
import { UjeebuLoader } from '@ujeebu-org/langchain';

const loader = new UjeebuLoader({
  urls: ['https://example.com/article'],
  baseUrl: 'https://custom-api.ujeebu.com/extract'
});
```

### Error Handling

```typescript
import { UjeebuLoader } from '@ujeebu-org/langchain';

const loader = new UjeebuLoader({
  urls: ['https://example.com/article']
});

try {
  const documents = await loader.load();
  console.log(`Loaded ${documents.length} documents`);
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  }
}
```

## Testing

Run the test suite:

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Format code
npm run format
```

## Examples

Check out the [examples](./examples) directory for more usage examples:

- [agent-example.ts](./examples/agent-example.ts) - Using Ujeebu with LangChain agents
- [document-loader-example.ts](./examples/document-loader-example.ts) - Using the document loader with vector stores

## Pricing

Ujeebu Extract API pricing is based on usage. Check the [pricing page](https://ujeebu.com/pricing) for details.

## Support

- **Documentation**: [https://ujeebu.com/docs/extract](https://ujeebu.com/docs/extract)
- **API Reference**: [https://ujeebu.com/docs](https://ujeebu.com/docs)
- **Support**: [support@ujeebu.com](mailto:support@ujeebu.com)
- **GitHub Issues**: [Report a bug](https://github.com/ujeebu/ujeebu-langchain-js/issues)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [LangChain](https://github.com/langchain-ai/langchainjs) - Build applications with LLMs through composability
- [Ujeebu API](https://ujeebu.com) - Web scraping and content extraction API

## Changelog

### 0.2.0

- Upgrade to LangChain 1.x compatibility
- Import `BaseDocumentLoader` from `@langchain/core` instead of `langchain`
- Only `@langchain/core` required as peer dependency (not `langchain`)
- Update examples to use `@langchain/langgraph` for agents

### 0.1.0

- Initial release
- UjeebuExtractTool for LangChain agents
- UjeebuLoader document loader
- Full TypeScript support
- Comprehensive test coverage
- Complete documentation

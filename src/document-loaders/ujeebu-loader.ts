/**
 * Ujeebu document loader for LangChain
 */

import { Document } from '@langchain/core/documents';
import { BaseDocumentLoader } from 'langchain/document_loaders/base';
import axios from 'axios';
import { ArticleData } from '../types';

/**
 * Configuration parameters for UjeebuLoader
 */
export interface UjeebuLoaderParams {
  /** List of article URLs to load */
  urls: string[];
  /** Ujeebu API key. If not provided, will use UJEEBU_API_KEY environment variable */
  apiKey?: string;
  /** Extract article text content */
  extractText?: boolean;
  /** Extract article HTML content */
  extractHtml?: boolean;
  /** Extract article author */
  extractAuthor?: boolean;
  /** Extract publication date */
  extractPubDate?: boolean;
  /** Extract images */
  extractImages?: boolean;
  /** Use quick mode (30-60% faster, slightly less accurate) */
  quickMode?: boolean;
  /** Base URL for the Ujeebu API */
  baseUrl?: string;
}

/**
 * Load articles using Ujeebu Extract API.
 *
 * This loader fetches article content and creates LangChain Document objects
 * that can be used with vector stores, retrievers, and other LangChain components.
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { UjeebuLoader } from '@ujeebu-org/langchain';
 *
 * const loader = new UjeebuLoader({
 *   urls: ['https://example.com/article'],
 *   apiKey: 'your-api-key'
 * });
 * const documents = await loader.load();
 * ```
 *
 * @example
 * Load multiple articles:
 * ```typescript
 * const urls = [
 *   'https://example.com/article1',
 *   'https://example.com/article2',
 *   'https://example.com/article3'
 * ];
 * const loader = new UjeebuLoader({ urls });
 * const documents = await loader.load();
 * ```
 *
 * @example
 * Use with vector store:
 * ```typescript
 * import { UjeebuLoader } from '@ujeebu-org/langchain';
 * import { FaissStore } from 'langchain/vectorstores/faiss';
 * import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
 *
 * const loader = new UjeebuLoader({
 *   urls: ['https://example.com/article']
 * });
 * const documents = await loader.load();
 *
 * const embeddings = new OpenAIEmbeddings();
 * const vectorStore = await FaissStore.fromDocuments(documents, embeddings);
 * ```
 */
export class UjeebuLoader extends BaseDocumentLoader {
  private urls: string[];
  private apiKey: string;
  private extractText: boolean;
  private extractHtml: boolean;
  private extractAuthor: boolean;
  private extractPubDate: boolean;
  private extractImages: boolean;
  private quickMode: boolean;
  private baseUrl: string;

  constructor(params: UjeebuLoaderParams) {
    super();
    this.urls = params.urls;
    this.apiKey = params.apiKey || process.env.UJEEBU_API_KEY || '';
    this.extractText = params.extractText ?? true;
    this.extractHtml = params.extractHtml ?? false;
    this.extractAuthor = params.extractAuthor ?? true;
    this.extractPubDate = params.extractPubDate ?? true;
    this.extractImages = params.extractImages ?? false;
    this.quickMode = params.quickMode ?? false;
    this.baseUrl = params.baseUrl || 'https://api.ujeebu.com/extract';

    if (!this.apiKey) {
      throw new Error(
        'Ujeebu API key must be provided either through apiKey parameter ' +
          'or UJEEBU_API_KEY environment variable. ' +
          'Get your API key at https://ujeebu.com/signup'
      );
    }
  }

  /**
   * Extract a single article from the given URL
   */
  private async extractArticle(url: string): Promise<ArticleData | null> {
    try {
      const response = await axios.get<{ article: ArticleData }>(this.baseUrl, {
        params: {
          url,
          text: this.extractText ? 1 : 0,
          html: this.extractHtml ? 1 : 0,
          author: this.extractAuthor ? 1 : 0,
          pub_date: this.extractPubDate ? 1 : 0,
          images: this.extractImages ? 1 : 0,
          quick_mode: this.quickMode ? 1 : 0,
        },
        headers: {
          ApiKey: this.apiKey,
        },
        timeout: 60000,
      });

      return response.data.article;
    } catch (error) {
      console.error(
        `Error extracting article from ${url}:`,
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Build a Document from extracted article data
   */
  private buildDocument(url: string, article: ArticleData): Document {
    // Prepare the content
    const contentParts: string[] = [];

    if (this.extractText && article.text) {
      contentParts.push(article.text);
    }

    if (this.extractHtml && article.html) {
      contentParts.push(`HTML: ${article.html}`);
    }

    const content = contentParts.join('\n\n');

    // Prepare metadata
    const metadata: Record<string, string | string[]> = {
      source: url,
      url: article.url || url,
      canonical_url: article.canonical_url || url,
    };

    if (article.title) {
      metadata.title = article.title;
    }

    if (this.extractAuthor && article.author) {
      metadata.author = article.author;
    }

    if (this.extractPubDate && article.pub_date) {
      metadata.pub_date = article.pub_date;
    }

    if (article.language) {
      metadata.language = article.language;
    }

    if (article.site_name) {
      metadata.site_name = article.site_name;
    }

    if (article.summary) {
      metadata.summary = article.summary;
    }

    if (article.image) {
      metadata.image = article.image;
    }

    if (this.extractImages && article.images) {
      metadata.images = article.images;
    }

    return new Document({ pageContent: content, metadata });
  }

  /**
   * Load articles from the provided URLs
   */
  async load(): Promise<Document[]> {
    const results = await Promise.allSettled(
      this.urls.map((url) => this.extractArticle(url).then((article) => ({ url, article })))
    );

    const documents: Document[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.article) {
        documents.push(this.buildDocument(result.value.url, result.value.article));
      }
    }

    return documents;
  }
}

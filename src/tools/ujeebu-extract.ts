/**
 * Ujeebu Extract tool for LangChain agents
 */

import { Tool } from '@langchain/core/tools';
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager';
import axios, { AxiosError } from 'axios';
import { ArticleData } from '../types';

/**
 * Input parameters for the Ujeebu Extract tool
 */
export interface UjeebuExtractInput {
  /** URL of the article to extract content from */
  url: string;
  /** Extract article text content */
  text?: boolean;
  /** Extract article HTML content */
  html?: boolean;
  /** Extract article author */
  author?: boolean;
  /** Extract article publication date */
  pub_date?: boolean;
  /** Extract article images */
  images?: boolean;
  /** Use quick mode for faster extraction (30-60% faster, slightly less accurate) */
  quick_mode?: boolean;
}

/**
 * Configuration parameters for UjeebuExtractTool
 */
export interface UjeebuExtractParams {
  /** Ujeebu API key. If not provided, will use UJEEBU_API_KEY environment variable */
  apiKey?: string;
  /** Base URL for the Ujeebu API */
  baseUrl?: string;
}

/**
 * Tool for extracting clean, structured content from articles using Ujeebu Extract API.
 *
 * This tool extracts article content including:
 * - Main text content
 * - HTML content
 * - Author information
 * - Publication date
 * - Title and summary
 * - Images and media
 *
 * To use this tool, you must set the UJEEBU_API_KEY environment variable or pass it in the constructor.
 * Get your API key at: https://ujeebu.com/signup
 *
 * @example
 * ```typescript
 * import { UjeebuExtractTool } from '@ujeebu-org/langchain';
 *
 * const tool = new UjeebuExtractTool({ apiKey: 'your-api-key' });
 * const result = await tool.invoke({
 *   url: 'https://example.com/article',
 *   text: true,
 *   author: true
 * });
 * ```
 */
export class UjeebuExtractTool extends Tool {
  name = 'ujeebu_extract';
  description = `Extract clean, structured content from news articles and blog posts.
Useful for retrieving article text, metadata, author, publication date,
and other structured information from web pages.
Input should be a valid article URL.`;

  private apiKey: string;
  private baseUrl: string;

  constructor(params?: UjeebuExtractParams) {
    super();
    this.apiKey = params?.apiKey || process.env.UJEEBU_API_KEY || '';
    this.baseUrl = params?.baseUrl || 'https://api.ujeebu.com/extract';

    if (!this.apiKey) {
      throw new Error(
        'Ujeebu API key must be provided either through apiKey parameter ' +
          'or UJEEBU_API_KEY environment variable. ' +
          'Get your API key at https://ujeebu.com/signup'
      );
    }
  }

  /**
   * Extract article content from the given URL
   */
  async _call(input: string | undefined, _runManager?: CallbackManagerForToolRun): Promise<string> {
    if (!input) {
      return 'Error: No URL provided. Please provide a valid article URL.';
    }

    // Handle both string URL and JSON object input
    let params: UjeebuExtractInput;
    try {
      params = JSON.parse(input) as UjeebuExtractInput;
    } catch {
      params = { url: input };
    }

    const {
      url,
      text = true,
      html = false,
      author = true,
      pub_date = true,
      images = false,
      quick_mode = false,
    } = params;

    try {
      const response = await axios.get<{ article: ArticleData }>(this.baseUrl, {
        params: {
          url,
          text: text ? 1 : 0,
          html: html ? 1 : 0,
          author: author ? 1 : 0,
          pub_date: pub_date ? 1 : 0,
          images: images ? 1 : 0,
          quick_mode: quick_mode ? 1 : 0,
        },
        headers: {
          ApiKey: this.apiKey,
        },
        timeout: 60000,
      });

      const article = response.data.article;

      // Format the response in a readable way
      const resultParts: string[] = [];

      if (article.title) {
        resultParts.push(`Title: ${article.title}`);
      }

      if (article.author) {
        resultParts.push(`Author: ${article.author}`);
      }

      if (article.pub_date) {
        resultParts.push(`Published: ${article.pub_date}`);
      }

      if (article.site_name) {
        resultParts.push(`Site: ${article.site_name}`);
      }

      if (article.summary) {
        resultParts.push(`\nSummary: ${article.summary}`);
      }

      if (text && article.text) {
        resultParts.push(`\nContent:\n${article.text}`);
      }

      if (html && article.html) {
        resultParts.push(`\nHTML:\n${article.html}`);
      }

      if (images && article.images) {
        resultParts.push(`\nImages: ${article.images.slice(0, 5).join(', ')}`);
      }

      return resultParts.join('\n');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          return 'Error: Invalid API key. Please check your UJEEBU_API_KEY.';
        } else if (axiosError.response?.status === 404) {
          return `Error: Article not found at URL: ${url}`;
        } else if (axiosError.response?.status === 408) {
          return 'Error: Request timeout. Try increasing the timeout or using a premium proxy.';
        }
      }
      return `Error extracting article: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

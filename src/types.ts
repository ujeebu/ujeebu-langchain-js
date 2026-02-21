/**
 * Shared types for the Ujeebu LangChain integration
 */

/**
 * Article data returned from Ujeebu Extract API
 */
export interface ArticleData {
  title?: string;
  text?: string;
  html?: string;
  author?: string;
  pub_date?: string;
  url?: string;
  canonical_url?: string;
  site_name?: string;
  summary?: string;
  language?: string;
  image?: string;
  images?: string[];
  modified_date?: string;
  favicon?: string;
}

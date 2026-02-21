/**
 * Tests for UjeebuExtractTool
 */

import { UjeebuExtractTool } from '../src/tools/ujeebu-extract';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UjeebuExtractTool', () => {
  const mockApiKey = 'test_api_key_12345';
  const mockArticleResponse = {
    data: {
      article: {
        title: 'Test Article Title',
        text: 'This is the article text content.',
        html: '<p>This is the article HTML content.</p>',
        author: 'John Doe',
        pub_date: '2024-01-01 12:00:00',
        url: 'https://example.com/article',
        canonical_url: 'https://example.com/article',
        site_name: 'Example Site',
        summary: 'Article summary',
        language: 'en',
        image: 'https://example.com/image.jpg',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.UJEEBU_API_KEY;
  });

  describe('initialization', () => {
    it('should initialize with API key parameter', () => {
      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      expect(tool.name).toBe('ujeebu_extract');
      expect(tool.description).toContain('Extract');
    });

    it('should initialize with environment variable', () => {
      process.env.UJEEBU_API_KEY = mockApiKey;
      const tool = new UjeebuExtractTool();
      expect(tool.name).toBe('ujeebu_extract');
    });

    it('should throw error without API key', () => {
      expect(() => new UjeebuExtractTool()).toThrow('API key must be provided');
    });
  });

  describe('_call method', () => {
    it('should extract article with string URL', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      const result = await tool._call('https://example.com/article');

      expect(result).toContain('Test Article Title');
      expect(result).toContain('John Doe');
      expect(result).toContain('2024-01-01');
      expect(result).toContain('This is the article text content');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should extract article with JSON object input', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      const result = await tool._call(
        JSON.stringify({
          url: 'https://example.com/article',
          text: true,
          author: true,
        })
      );

      expect(result).toContain('Test Article Title');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should extract article with HTML', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      const result = await tool._call(
        JSON.stringify({
          url: 'https://example.com/article',
          html: true,
        })
      );

      expect(result).toContain('<p>This is the article HTML content.</p>');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should extract article with images', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      const result = await tool._call(
        JSON.stringify({
          url: 'https://example.com/article',
          images: true,
        })
      );

      expect(result).toContain('image1.jpg');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should return error when input is undefined', async () => {
      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      const result = await tool._call(undefined);

      expect(result).toContain('No URL provided');
    });

    it('should handle 401 authentication error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 401 },
      });
      mockedAxios.isAxiosError.mockReturnValue(true);

      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      const result = await tool._call('https://example.com/article');

      expect(result).toContain('Invalid API key');
    });

    it('should handle 404 not found error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404 },
      });
      mockedAxios.isAxiosError.mockReturnValue(true);

      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      const result = await tool._call('https://example.com/article');

      expect(result).toContain('not found');
    });

    it('should handle 408 timeout error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 408 },
      });
      mockedAxios.isAxiosError.mockReturnValue(true);

      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      const result = await tool._call('https://example.com/article');

      expect(result).toContain('timeout');
    });

    it('should handle generic errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      const result = await tool._call('https://example.com/article');

      expect(result).toContain('Error');
    });

    it('should use quick mode when specified', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const tool = new UjeebuExtractTool({ apiKey: mockApiKey });
      await tool._call(
        JSON.stringify({
          url: 'https://example.com/article',
          quick_mode: true,
        })
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            quick_mode: 1,
          }),
        })
      );
    });

    it('should use custom base URL', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const customUrl = 'https://custom-api.ujeebu.com/extract';
      const tool = new UjeebuExtractTool({
        apiKey: mockApiKey,
        baseUrl: customUrl,
      });

      await tool._call('https://example.com/article');

      expect(mockedAxios.get).toHaveBeenCalledWith(customUrl, expect.any(Object));
    });
  });
});

/**
 * Tests for UjeebuLoader
 */

import { UjeebuLoader } from '../src/document-loaders/ujeebu-loader';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UjeebuLoader', () => {
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
      const loader = new UjeebuLoader({
        urls: ['https://example.com/article'],
        apiKey: mockApiKey,
      });
      expect(loader).toBeInstanceOf(UjeebuLoader);
    });

    it('should initialize with environment variable', () => {
      process.env.UJEEBU_API_KEY = mockApiKey;
      const loader = new UjeebuLoader({
        urls: ['https://example.com/article'],
      });
      expect(loader).toBeInstanceOf(UjeebuLoader);
    });

    it('should throw error without API key', () => {
      expect(() => {
        new UjeebuLoader({
          urls: ['https://example.com/article'],
        });
      }).toThrow('API key must be provided');
    });
  });

  describe('load method', () => {
    it('should load a single document', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const loader = new UjeebuLoader({
        urls: ['https://example.com/article'],
        apiKey: mockApiKey,
      });
      const documents = await loader.load();

      expect(documents).toHaveLength(1);
      expect(documents[0].pageContent).toContain('article text content');
      expect(documents[0].metadata.title).toBe('Test Article Title');
      expect(documents[0].metadata.author).toBe('John Doe');
      expect(documents[0].metadata.source).toBe('https://example.com/article');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should load multiple documents', async () => {
      mockedAxios.get.mockResolvedValue(mockArticleResponse);

      const urls = [
        'https://example.com/article1',
        'https://example.com/article2',
        'https://example.com/article3',
      ];

      const loader = new UjeebuLoader({ urls, apiKey: mockApiKey });
      const documents = await loader.load();

      expect(documents).toHaveLength(3);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should load with HTML content', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const loader = new UjeebuLoader({
        urls: ['https://example.com/article'],
        apiKey: mockApiKey,
        extractHtml: true,
      });
      const documents = await loader.load();

      expect(documents).toHaveLength(1);
      expect(documents[0].pageContent).toContain('HTML:');
      expect(documents[0].pageContent).toContain('<p>This is the article HTML content.</p>');
    });

    it('should load with images', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const loader = new UjeebuLoader({
        urls: ['https://example.com/article'],
        apiKey: mockApiKey,
        extractImages: true,
      });
      const documents = await loader.load();

      expect(documents).toHaveLength(1);
      expect(documents[0].metadata.images).toHaveLength(2);
      expect(documents[0].metadata.images).toContain('https://example.com/image1.jpg');
    });

    it('should use quick mode when specified', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const loader = new UjeebuLoader({
        urls: ['https://example.com/article'],
        apiKey: mockApiKey,
        quickMode: true,
      });
      await loader.load();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            quick_mode: 1,
          }),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      const loader = new UjeebuLoader({
        urls: ['https://example.com/article'],
        apiKey: mockApiKey,
      });
      const documents = await loader.load();

      expect(documents).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle partial success', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // First call succeeds, second fails
      mockedAxios.get
        .mockResolvedValueOnce(mockArticleResponse)
        .mockRejectedValueOnce(new Error('API Error'));

      const loader = new UjeebuLoader({
        urls: ['https://example.com/article1', 'https://example.com/article2'],
        apiKey: mockApiKey,
      });
      const documents = await loader.load();

      expect(documents).toHaveLength(1);
      expect(documents[0].metadata.title).toBe('Test Article Title');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should include all metadata fields', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const loader = new UjeebuLoader({
        urls: ['https://example.com/article'],
        apiKey: mockApiKey,
        extractImages: true,
      });
      const documents = await loader.load();

      const metadata = documents[0].metadata;
      expect(metadata.title).toBe('Test Article Title');
      expect(metadata.author).toBe('John Doe');
      expect(metadata.pub_date).toBe('2024-01-01 12:00:00');
      expect(metadata.site_name).toBe('Example Site');
      expect(metadata.language).toBe('en');
      expect(metadata.summary).toBe('Article summary');
      expect(metadata.image).toBe('https://example.com/image.jpg');
      expect(metadata.images).toBeDefined();
    });

    it('should use custom base URL', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockArticleResponse);

      const customUrl = 'https://custom-api.ujeebu.com/extract';
      const loader = new UjeebuLoader({
        urls: ['https://example.com/article'],
        apiKey: mockApiKey,
        baseUrl: customUrl,
      });

      await loader.load();

      expect(mockedAxios.get).toHaveBeenCalledWith(customUrl, expect.any(Object));
    });
  });
});

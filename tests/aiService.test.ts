import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isNaturalLanguageQuery, fetchAiSmartSearch } from '../src/lib/aiService';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('aiService - isNaturalLanguageQuery', () => {
  it('returns false for short, non-NL queries', () => {
    expect(isNaturalLanguageQuery('test')).toBe(false);
    expect(isNaturalLanguageQuery('calc')).toBe(false);
  });

  it('returns true for queries with indicators', () => {
    expect(isNaturalLanguageQuery('calculator under 500')).toBe(true);
    expect(isNaturalLanguageQuery('cheap engineering textbook')).toBe(true);
  });

  it('returns true for long queries', () => {
    expect(isNaturalLanguageQuery('i am looking for a scientific calculator')).toBe(true);
  });
});

describe('aiService - fetchAiSmartSearch', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('calls fetch with correct arguments', async () => {
    const mockResponse = { category: 'Electronics', maxPrice: 500, keywords: ['calc'] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await fetchAiSmartSearch('calculator under 500');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/gemini/smart-search',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ query: 'calculator under 500' }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('throws error on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'API Error' }),
    });

    await expect(fetchAiSmartSearch('query')).rejects.toThrow('API Error');
  });
});

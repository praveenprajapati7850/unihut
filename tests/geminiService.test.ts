import { describe, it, expect } from 'vitest';
import {
  parseSmartSearch,
  estimatePrice,
  generateOfferMessage,
  analyzeShouldIBuy,
  analyzeVoiceSearch,
  askAiMarketplaceChat,
} from '../server/services/geminiService';

describe('UniHut AI Smart Search & Heuristic Parser', () => {
  it('extracts electronics category and price cap from student queries', async () => {
    const result = await parseSmartSearch({
      query: 'need scientific calculator under 500',
    });
    expect(result.category).toBe('Electronics');
    expect(result.maxPrice).toBe(500);
    expect(result.keywords.some((k: string) => k.toLowerCase().includes('calculator'))).toBe(true);
  });

  it('extracts textbooks category from book queries', async () => {
    const result = await parseSmartSearch({
      query: 'engineering maths textbook 3rd sem',
    });
    expect(result.category).toBe('Textbooks');
    expect(result.keywords.length).toBeGreaterThan(0);
  });

  it('extracts cycle category from bicycle query', async () => {
    const result = await parseSmartSearch({
      query: 'second hand cycle under 2000',
    });
    expect(result.category).toBe('Cycles & Mobility');
    expect(result.maxPrice).toBe(2000);
  });
});

describe('UniHut AI Price Advisor & Deal Assistant', () => {
  it('calculates a reasonable campus resale range based on asking price', async () => {
    const result = await estimatePrice({
      title: 'Casio Scientific Calculator',
      condition: 'Gently Used',
      price: 450,
      originalPrice: 1000,
      category: 'Electronics',
    });

    expect(result.minPrice).toBeGreaterThan(0);
    expect(result.maxPrice).toBeGreaterThanOrEqual(result.minPrice);
    expect(['GREAT DEAL', 'GOOD DEAL', 'FAIR PRICE', 'ABOVE AVERAGE']).toContain(result.pricePosition);
  });

  it('generates courteous peer-to-peer negotiation message', async () => {
    const result = await generateOfferMessage({
      listingTitle: 'Electric Kettle',
      listingPrice: 800,
      proposedOffer: 650,
      condition: 'Like New',
      negotiable: true,
    });

    expect(result.message).toContain('650');
    expect(result.message.length).toBeGreaterThan(15);
    expect(result.politeTip).toBeDefined();
  });

  it('evaluates "Should I Buy This?" with pros, cautions, and disclaimer', async () => {
    const result = await analyzeShouldIBuy({
      title: 'Bicycle with Lock',
      price: 1800,
      originalPrice: 4000,
      condition: 'Gently Used',
      category: 'Cycles & Mobility',
      sellerRating: 4.8,
    });

    expect(['Good Deal', 'Fair Deal', 'Consider Negotiating']).toContain(result.rating);
    expect(['emerald', 'amber', 'rose']).toContain(result.badgeColor);
    expect(result.pros.length).toBeGreaterThan(0);
    expect(result.cautions.length).toBeGreaterThan(0);
    expect(result.disclaimer).toContain('UniHut AI estimate');
  });
});

describe('UniHut AI Voice Search Intent Extractor', () => {
  it('parses transcript into clean query and structured criteria', async () => {
    const result = await analyzeVoiceSearch({
      transcript: 'engineering drafter under 400 rupees',
    });

    expect(result.transcript).toBe('engineering drafter under 400 rupees');
    expect(result.maxPrice).toBe(400);
    expect(result.cleanQuery.length).toBeGreaterThan(0);
    expect(result.keywords.length).toBeGreaterThan(0);
  });
});

describe('Ask AI Chatbot Relevance & Guardrails', () => {
  it('provides campus guidelines when asked about safety and handover zones', async () => {
    const result = await askAiMarketplaceChat({
      messages: [{ role: 'user', content: 'What are safe campus handover zones?' }],
    });

    expect(result.reply.toLowerCase()).toMatch(/library|safety|center|zone|public|daylight/);
    expect(result.suggestedAction).toBe('view_handover_zones');
  });

  it('strictly declines completely off-topic questions outside campus marketplace', async () => {
    const result = await askAiMarketplaceChat({
      messages: [{ role: 'user', content: 'Write a python script to sort a list using quicksort' }],
    });

    expect(result.reply.toLowerCase()).toMatch(/unihut|campus|marketplace|assistant/);
  });

  it('provides bargaining advice when asked about making offers', async () => {
    const result = await askAiMarketplaceChat({
      messages: [{ role: 'user', content: 'How do I bargain with a senior for a cycle?' }],
    });

    expect(result.reply.toLowerCase()).toMatch(/offer|bargain|unihut|price|percent/);
    expect(result.suggestedAction).toBe('browse_marketplace');
  });
});

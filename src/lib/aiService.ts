import {
  AiListingSuggestion,
  AiPriceEstimate,
  AiSmartSearchFilter,
  AiOfferSuggestion,
  AiRecommendationResult,
  VisualSearchResult,
  AiVoiceSearchResult,
  ShouldIBuyAnalysis,
  Listing,
} from '../types';

/**
 * 1. AI Listing Assistant Client Call
 */
export async function fetchAiListingAssistant(data: {
  title: string;
  condition?: string;
  price?: number;
  originalPrice?: number;
  description?: string;
  category?: string;
}): Promise<AiListingSuggestion> {
  const response = await fetch('/api/gemini/listing-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'AI suggestions are temporarily unavailable.');
  }

  return response.json();
}

/**
 * 2. AI Price Advisor Client Call
 */
export async function fetchAiPriceEstimate(data: {
  title: string;
  condition: string;
  price: number;
  originalPrice?: number;
  category: string;
}): Promise<AiPriceEstimate> {
  const response = await fetch('/api/gemini/price-advisor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'AI suggestions are temporarily unavailable.');
  }

  return response.json();
}

/**
 * 3. AI Smart Search Client Call
 */
export async function fetchAiSmartSearch(query: string): Promise<AiSmartSearchFilter> {
  const response = await fetch('/api/gemini/smart-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'AI suggestions are temporarily unavailable.');
  }

  return response.json();
}

/**
 * 4. AI Offer Assistant Client Call
 */
export async function fetchAiOfferMessage(data: {
  listingTitle: string;
  listingPrice: number;
  originalPrice?: number;
  condition?: string;
  proposedOffer: number;
  negotiable?: boolean;
}): Promise<AiOfferSuggestion> {
  const response = await fetch('/api/gemini/offer-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'AI suggestions are temporarily unavailable.');
  }

  return response.json();
}

/**
 * 5. AI Recommendations Client Call
 */
export async function fetchAiRecommendations(
  recentInteractions: Array<{ type: string; query?: string; category?: string; listingId?: string }>,
  availableListings: Listing[]
): Promise<AiRecommendationResult> {
  const simplifiedListings = availableListings.slice(0, 20).map((l) => ({
    id: l.id,
    title: l.title,
    category: l.category,
    price: l.price,
    condition: l.condition,
  }));

  const response = await fetch('/api/gemini/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recentInteractions,
      availableListings: simplifiedListings,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'AI suggestions are temporarily unavailable.');
  }

  return response.json();
}

/**
 * Determines whether a search query warrants natural language Gemini parsing
 * (e.g. phrases like "under", "below", "cheap", "for hostel", "need", "budget", "looking for" or 3+ words)
 */
export function isNaturalLanguageQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < 4) return false;

  const nlIndicators = [
    'under',
    'below',
    'less than',
    'budget',
    'cheap',
    'affordable',
    'need',
    'want',
    'looking for',
    'for hostel',
    'for semester',
    'engineering',
    'urgent',
    'second hand',
    'in inr',
    '₹',
    'rs',
    'rupees',
  ];

  const hasIndicator = nlIndicators.some((word) => q.includes(word));
  const wordCount = q.split(/\s+/).length;

  return hasIndicator || wordCount >= 4;
}

/**
 * 6. AI Visual Search Client Call
 */
export async function fetchAiVisualSearch(data: {
  imageBase64: string;
  mimeType?: string;
}): Promise<VisualSearchResult> {
  const response = await fetch('/api/gemini/visual-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'AI visual analysis temporarily unavailable.');
  }

  return response.json();
}

/**
 * 7. AI "Should I Buy This?" Client Call
 */
export async function fetchAiShouldIBuy(data: {
  title: string;
  price: number;
  originalPrice?: number;
  condition: string;
  sellerRating?: number;
  completedSales?: number;
  isNegotiable?: boolean;
  description?: string;
  category: string;
}): Promise<ShouldIBuyAnalysis> {
  const response = await fetch('/api/gemini/should-i-buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'AI deal assistant temporarily unavailable.');
  }

  return response.json();
}

/**
 * 8. AI Voice Search Client Call
 */
export async function fetchAiVoiceSearch(data: {
  audioBase64?: string;
  mimeType?: string;
  transcript?: string;
}): Promise<AiVoiceSearchResult> {
  const response = await fetch('/api/gemini/voice-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'AI voice search temporarily unavailable.');
  }

  return response.json();
}

/**
 * 9. Ask AI: Campus Marketplace Chatbot Client Call
 */
export async function fetchAskAiChat(data: {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  inventoryContext?: Array<{ id: string; title: string; price: number; category: string; condition: string }>;
}): Promise<{
  reply: string;
  suggestedAction?: 'browse_marketplace' | 'post_listing' | 'post_wanted' | 'view_handover_zones' | null;
  suggestedQuery?: string | null;
}> {
  const response = await fetch('/api/gemini/ask-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Ask AI is temporarily unavailable.');
  }

  return response.json();
}



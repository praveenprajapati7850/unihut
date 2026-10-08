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
 * Helper to reduce boilerplate for AI API calls.
 */
async function postAiRequest<T>(endpoint: string, data: any, errorMessage: string): Promise<T> {
  const response = await fetch(`/api/gemini/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errorMessage);
  }

  return response.json();
}

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
  return postAiRequest('listing-assistant', data, 'AI suggestions are temporarily unavailable.');
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
  return postAiRequest('price-advisor', data, 'AI suggestions are temporarily unavailable.');
}

/**
 * 3. AI Smart Search Client Call
 */
export async function fetchAiSmartSearch(query: string): Promise<AiSmartSearchFilter> {
  return postAiRequest('smart-search', { query }, 'AI suggestions are temporarily unavailable.');
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
  return postAiRequest('offer-message', data, 'AI suggestions are temporarily unavailable.');
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

  return postAiRequest('recommendations', { recentInteractions, availableListings: simplifiedListings }, 'AI suggestions are temporarily unavailable.');
}

/**
 * Determines whether a search query warrants natural language Gemini parsing
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
  return postAiRequest('visual-search', data, 'AI visual analysis temporarily unavailable.');
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
  return postAiRequest('should-i-buy', data, 'AI deal assistant temporarily unavailable.');
}

/**
 * 8. AI Voice Search Client Call
 */
export async function fetchAiVoiceSearch(data: {
  audioBase64?: string;
  mimeType?: string;
  transcript?: string;
}): Promise<AiVoiceSearchResult> {
  return postAiRequest('voice-search', data, 'AI voice search temporarily unavailable.');
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
  return postAiRequest('ask-ai', data, 'Ask AI is temporarily unavailable.');
}



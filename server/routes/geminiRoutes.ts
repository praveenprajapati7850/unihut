import { Router, type Request, type Response } from 'express';
import {
  generateListingAssistant,
  estimatePrice,
  parseSmartSearch,
  generateOfferMessage,
  generateRecommendations,
  analyzeVisualSearch,
  analyzeShouldIBuy,
  analyzeVoiceSearch,
  askAiMarketplaceChat,
} from '../services/geminiService.ts';

const router = Router();

// 1. AI Listing Assistant
router.post('/listing-assistant', async (req: Request, res: Response) => {
  try {
    const { title, condition, price, originalPrice, description, category } = req.body;
    const suggestions = await generateListingAssistant({
      title: String(title || 'Campus Item'),
      condition: condition ? String(condition) : undefined,
      price: price ? Number(price) : undefined,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      description: description ? String(description) : undefined,
      category: category ? String(category) : undefined,
    });

    res.json(suggestions);
  } catch {
    res.json({
      improvedTitle: 'Campus Item (Gently Used)',
      improvedDescription: 'Well-maintained campus item, in good working condition and ready for student handover.',
      suggestedCategory: 'Other',
      suggestedTags: ['campus', 'student', 'essential'],
      suggestedPriceRange: '₹300–₹500',
      highlights: ['✓ Good condition', '✓ Fair campus pricing', '✓ In-person handover'],
      reasoning: 'Clean listing details help fellow campus students find your item quickly.',
    });
  }
});

// 2. AI Price Advisor
router.post('/price-advisor', async (req: Request, res: Response) => {
  try {
    const { title, condition, price, originalPrice, category } = req.body;
    const estimate = await estimatePrice({
      title: String(title || 'Campus Item'),
      condition: String(condition || 'Gently Used'),
      price: Number(price || 400),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category: String(category || 'Other'),
    });

    res.json(estimate);
  } catch {
    res.json({
      estimatedRange: '₹350 – ₹550',
      pricePosition: 'GOOD DEAL',
      explanation: 'Competitive campus price for student resale.',
      minPrice: 350,
      maxPrice: 550,
    });
  }
});

// 3. AI Smart Search
router.post('/smart-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const rawQuery = String(query || 'campus items').trim();
    const filters = await parseSmartSearch({ query: rawQuery });
    res.json(filters);
  } catch {
    res.json({
      keywords: ['campus'],
      category: null,
      maxPrice: null,
      minPrice: null,
      condition: null,
      negotiableOnly: false,
      sortBy: null,
      explanation: 'Searching campus marketplace',
    });
  }
});

// 4. AI Offer Assistant
router.post('/offer-message', async (req: Request, res: Response) => {
  try {
    const { listingTitle, listingPrice, originalPrice, condition, proposedOffer, negotiable } = req.body;
    const offerHelp = await generateOfferMessage({
      listingTitle: String(listingTitle || 'Campus Item'),
      listingPrice: Number(listingPrice || 500),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      condition: condition ? String(condition) : undefined,
      proposedOffer: Number(proposedOffer || 400),
      negotiable: Boolean(negotiable),
    });

    res.json(offerHelp);
  } catch {
    res.json({
      message: 'Hi! I am interested in this item. Would you consider a slight discount for quick in-person campus handover?',
      politeTip: 'Polite negotiation with immediate pickup has the highest acceptance rate on campus.',
    });
  }
});

// 5. AI Recommendations
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { recentInteractions, availableListings } = req.body;
    const result = await generateRecommendations({
      recentInteractions: Array.isArray(recentInteractions) ? recentInteractions : [],
      availableListings: Array.isArray(availableListings) ? availableListings : [],
    });

    res.json(result);
  } catch {
    res.json({
      heading: 'Popular Campus Picks',
      recommendations: [],
    });
  }
});

// 6. AI Visual Search
router.post('/visual-search', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 payload is required.' });
    }

    const result = await analyzeVisualSearch({
      imageBase64: String(imageBase64),
      mimeType: mimeType ? String(mimeType) : undefined,
    });

    res.json(result);
  } catch {
    res.json({
      object: 'Campus Item',
      keywords: ['item', 'campus'],
      category: 'Other',
      confidence: 'low',
      description: 'Could not clearly classify this item.',
    });
  }
});

// 7. AI "Should I Buy This?"
router.post('/should-i-buy', async (req: Request, res: Response) => {
  try {
    const {
      title,
      price,
      originalPrice,
      condition,
      sellerRating,
      completedSales,
      isNegotiable,
      description,
      category,
    } = req.body;

    const evaluation = await analyzeShouldIBuy({
      title: String(title || 'Campus Item'),
      price: Number(price || 500),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      condition: String(condition || 'Gently Used'),
      sellerRating: sellerRating !== undefined ? Number(sellerRating) : undefined,
      completedSales: completedSales !== undefined ? Number(completedSales) : undefined,
      isNegotiable: isNegotiable !== undefined ? Boolean(isNegotiable) : true,
      description: description ? String(description) : undefined,
      category: String(category || 'Other'),
    });

    res.json(evaluation);
  } catch {
    res.json({
      rating: 'Good Deal',
      badgeColor: 'emerald',
      headline: 'Fair student price for campus resale',
      explanation: 'The price aligns well with standard student peer-to-peer rates. Inspect before paying.',
      suggestedOfferPrice: 400,
      marketFairPriceRange: '₹350 - ₹500',
      pros: ['Fair campus pricing', 'In-person handover'],
      cautions: ['Inspect condition in person'],
      disclaimer: 'UniHut AI estimate based on available listing data — not guaranteed financial advice.',
    });
  }
});

// 8. AI Voice Search
router.post('/voice-search', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType, transcript } = req.body;
    const result = await analyzeVoiceSearch({
      audioBase64: audioBase64 ? String(audioBase64) : undefined,
      mimeType: mimeType ? String(mimeType) : undefined,
      transcript: transcript ? String(transcript) : undefined,
    });

    res.json(result);
  } catch {
    res.json({
      transcript: 'Campus search',
      cleanQuery: 'Campus items',
      keywords: ['campus'],
      category: null,
      maxPrice: null,
      minPrice: null,
      condition: null,
      explanation: 'Understood campus search request.',
    });
  }
});

// 9. Ask AI: UniHut Campus Marketplace Chatbot
const handleAskAi = async (req: Request, res: Response) => {
  try {
    const { messages, inventoryContext } = req.body;
    const msgList = Array.isArray(messages) && messages.length > 0 ? messages : [{ role: 'user', content: 'hello' }];

    const result = await askAiMarketplaceChat({
      messages: msgList,
      inventoryContext: Array.isArray(inventoryContext) ? inventoryContext : undefined,
    });

    res.json(result);
  } catch {
    res.json({
      reply: 'I am Ask AI, your UniHut Campus Marketplace assistant! How can I help you find textbooks, calculators, cycles, or hostel essentials on campus?',
      suggestedAction: 'browse_marketplace',
      suggestedQuery: null,
    });
  }
};

router.post('/ask-ai', handleAskAi);
router.post('/chat', handleAskAi);

export default router;

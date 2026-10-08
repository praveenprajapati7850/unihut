export type ListingCategory =
  | 'Textbooks'
  | 'Electronics'
  | 'Cycles & Mobility'
  | 'Hostel Essentials'
  | 'Accessories'
  | 'Clothing & Merch'
  | 'Services'
  | 'Other';

export type ItemCondition = 'Brand New' | 'Like New' | 'Gently Used' | 'Fair';

export type ListingStatus = 'available' | 'reserved' | 'sold' | 'inactive';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  college: string;
  verifiedCampus: boolean;
  rating?: number;
  totalSales: number;
  totalListings: number;
  createdAt: string;
  lastLoginAt: string;
  // UI helpers
  hostel?: string;
  hostelOrBlock?: string;
  phoneOrContact?: string;
  bio?: string;
  memberSince?: string;
  // Aliases for compatibility
  id?: string;
  name?: string;
  avatarUrl?: string;
  salesCount?: number;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhotoURL?: string;
  sellerRating?: number;
  title: string;
  description: string;
  category: ListingCategory;
  condition: ItemCondition;
  price: number;
  originalPrice?: number;
  negotiable: boolean;
  location: string;
  imageUrl: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt?: string;
  views: number;
  tags: string[];
  // UI compatibility aliases
  isNegotiable?: boolean;
  sellerAvatar?: string;
  sellerSalesCount?: number;
  viewsCount?: number;
}

export interface Message {
  id: string;
  listingId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  message: string;
  createdAt: string;
  read: boolean;
  // Optional negotiation offer metadata if message contains offer
  offerAmount?: number;
  offerStatus?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  offerId?: string;
  // UI aliases
  text?: string;
  conversationId?: string;
}

export interface Offer {
  id: string;
  listingId: string;
  listingTitle?: string;
  listingImage?: string;
  buyerId: string;
  buyerName?: string;
  buyerEmail?: string;
  sellerId: string;
  sellerName?: string;
  amount: number;
  offerAmount?: number;
  originalListingPrice?: number;
  listingPrice?: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn';
  counterAmount?: number;
  counterMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: string;
  updatedAt?: string;
  // UI helpers
  listingTitle?: string;
  listingPrice?: number;
  listingImage?: string;
  sellerId?: string;
  buyerId?: string;
}

export interface Review {
  id: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  listingId: string;
  reportedBy: string;
  reason: string;
  description?: string;
  createdAt: string;
  status: string;
  // UI helpers
  targetType?: 'listing' | 'user';
  targetId?: string;
  targetTitleOrName?: string;
  details?: string;
  reporterId?: string;
}

export type InteractionType = 'search' | 'view' | 'offer' | 'purchase';

export interface UserInteraction {
  id: string;
  userId: string;
  type: InteractionType;
  listingId?: string;
  query?: string;
  category?: string;
  createdAt: string;
}

export interface SavedListing {
  listingId: string;
  userId?: string;
  savedAt: string;
}

export interface AiListingSuggestion {
  improvedTitle: string;
  improvedDescription: string;
  suggestedCategory: ListingCategory;
  suggestedTags: string[];
  suggestedPriceRange: string;
  highlights: string[];
  reasoning?: string;
}

export interface AiPriceEstimate {
  estimatedRange: string;
  pricePosition: 'GREAT DEAL' | 'GOOD DEAL' | 'FAIR PRICE' | 'ABOVE AVERAGE' | 'OVERPRICED';
  explanation: string;
  minPrice: number;
  maxPrice: number;
}

export interface AiSmartSearchFilter {
  keywords: string[];
  category: ListingCategory | null;
  maxPrice: number | null;
  minPrice: number | null;
  condition: ItemCondition | null;
  negotiableOnly: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | null;
  explanation: string;
}

export interface AiOfferSuggestion {
  message: string;
  politeTip?: string;
}

export interface AiRecommendationItem {
  listingId: string;
  reason: string;
}

export interface AiRecommendationResult {
  heading: string;
  recommendations: AiRecommendationItem[];
}

// 1. AI Visual Search Result
export interface VisualSearchResult {
  object: string;
  keywords: string[];
  category: ListingCategory;
  confidence: 'high' | 'medium' | 'low';
  description: string;
}

// 2. AI Voice Search Result
export interface AiVoiceSearchResult {
  transcript: string;
  cleanQuery: string;
  keywords: string[];
  category: ListingCategory | null;
  maxPrice: number | null;
  minPrice: number | null;
  condition: ItemCondition | null;
  explanation: string;
}

// 3. AI "Should I Buy This?"
export type DealVerdict = 'Good Deal' | 'Fair Deal' | 'Consider Negotiating';

export interface ShouldIBuyAnalysis {
  rating: DealVerdict;
  badgeColor: 'emerald' | 'amber' | 'rose';
  headline: string;
  explanation: string;
  suggestedOfferPrice?: number;
  marketFairPriceRange?: string;
  pros: string[];
  cautions: string[];
  disclaimer: string;
}

// 4. Notifications
export type NotificationType =
  | 'new_message'
  | 'new_offer'
  | 'counter_offer'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'price_drop'
  | 'wanted_post_match'
  | 'handover_scheduled'
  | 'handover_reminder'
  | 'listing_status_update';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  listingId?: string;
  offerId?: string;
  wantedPostId?: string;
  handoverId?: string;
  read: boolean;
  createdAt: string;
}

// 6. Wanted Posts
export interface WantedPost {
  id: string;
  title: string;
  description: string;
  category: ListingCategory;
  budget: number;
  condition: string;
  neededBy?: string;
  preferredLocation: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  status: 'active' | 'fulfilled' | 'closed';
  createdAt: string;
}

// 8. Price Drop Alerts
export interface PriceAlert {
  id: string;
  userId: string;
  listingId: string;
  listingTitle?: string;
  targetPrice: number;
  currentPrice: number;
  active: boolean;
  createdAt: string;
}

// 9. Campus Handover
export type HandoverStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled';

export interface Handover {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  offerId?: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
  status: HandoverStatus;
  createdAt: string;
  updatedAt?: string;
}


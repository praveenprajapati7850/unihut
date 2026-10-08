import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  ArrowUpDown,
  RotateCcw,
  AlertCircle,
  Loader2,
  Sparkles,
  Bot,
  TrendingUp,
  Camera,
  Mic,
  Flame,
} from 'lucide-react';
import { Listing, ListingCategory, ItemCondition, ListingStatus, AiSmartSearchFilter } from '../types';
import { ListingCard } from '../components/ListingCard';
import { UniHutIcon } from '../components/UniHutLogo';
import { VisualSearchModal } from '../components/VisualSearchModal';
import { AiVoiceSearchModal } from '../components/AiVoiceSearchModal';
import { useAuth } from '../context/AuthContext';
import {
  fetchAiSmartSearch,
  fetchAiRecommendations,
  isNaturalLanguageQuery,
} from '../lib/aiService';
import {
  recordUserInteraction,
  getRecentUserInteractions,
} from '../lib/marketplaceService';

interface MarketplacePageProps {
  listings: Listing[];
  loading?: boolean;
  error?: string | null;
  onSelectListing: (listingId: string) => void;
  initialCategory?: ListingCategory | 'All';
  initialSearch?: string;
  onRetry?: () => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  listings,
  loading = false,
  error = null,
  onSelectListing,
  initialCategory = 'All',
  initialSearch = '',
  onRetry,
}) => {
  const { currentUser, userProfile } = useAuth();
  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id;

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'All'>(
    initialCategory
  );
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | 'All'>('All');
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ListingStatus | 'all'>('available');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [priceMax, setPriceMax] = useState<number | 'all'>('all');

  // AI Visual Search state
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);

  // AI Voice Search state
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);

  // Campus Deals filter toggle
  const [dealsOnly, setDealsOnly] = useState(false);

  // AI Smart Search states
  const [activeAiFilter, setActiveAiFilter] = useState<AiSmartSearchFilter | null>(null);
  const [aiSearching, setAiSearching] = useState(false);

  // AI Recommendations states
  const [recommendations, setRecommendations] = useState<Array<{ listing: Listing; reason: string }>>([]);
  const [recommendationsHeading, setRecommendationsHeading] = useState<string>('Popular Campus Picks');
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Load AI recommendations
  useEffect(() => {
    let isMounted = true;
    async function loadRecommendations() {
      if (!listings || listings.length === 0) return;
      setRecommendationsLoading(true);
      try {
        const recent = currentUserId ? await getRecentUserInteractions(currentUserId, 8) : [];
        const result = await fetchAiRecommendations(recent, listings);
        if (!isMounted) return;

        setRecommendationsHeading(result.heading || 'Recommended for You on Campus');
        const matched: Array<{ listing: Listing; reason: string }> = [];
        for (const rec of result.recommendations) {
          const item = listings.find((l) => l.id === rec.listingId);
          if (item && item.status === 'available') {
            matched.push({ listing: item, reason: rec.reason });
          }
        }

        // Backfill up to 3 available listings if needed
        if (matched.length < 3) {
          const existingIds = new Set(matched.map((m) => m.listing.id));
          for (const item of listings) {
            if (item.status === 'available' && !existingIds.has(item.id)) {
              matched.push({
                listing: item,
                reason: matched.length === 0 ? 'Popular campus pick' : 'Trending among students',
              });
              existingIds.add(item.id);
              if (matched.length >= 3) break;
            }
          }
        }

        setRecommendations(matched.slice(0, 3));
      } catch {
        const fallback = listings.filter((l) => l.status === 'available').slice(0, 3).map((l, i) => ({
          listing: l,
          reason: i === 0 ? 'High campus demand item' : 'Popular with students',
        }));
        if (isMounted) {
          setRecommendationsHeading('Popular Campus Picks');
          setRecommendations(fallback);
        }
      } finally {
        if (isMounted) setRecommendationsLoading(false);
      }
    }

    loadRecommendations();
    return () => {
      isMounted = false;
    };
  }, [listings, currentUserId]);

  // Reusable search execution
  const executeSearchWithTerm = async (queryText: string) => {
    const term = queryText.trim();
    setSearchTerm(term);
    if (!term) {
      setActiveAiFilter(null);
      return;
    }

    if (currentUserId) {
      recordUserInteraction({
        userId: currentUserId,
        type: 'search',
        query: term,
      });
    }

    if (isNaturalLanguageQuery(term)) {
      setAiSearching(true);
      try {
        const filter = await fetchAiSmartSearch(term);
        setActiveAiFilter(filter);
        if (filter.category) {
          setSelectedCategory(filter.category);
        }
        if (filter.sortBy) {
          setSortBy(filter.sortBy as any);
        }
        if (filter.maxPrice) {
          setPriceMax(filter.maxPrice);
        }
      } catch (err) {
        console.warn('Smart search fallback to standard keyword matching:', err);
        setActiveAiFilter(null);
      } finally {
        setAiSearching(false);
      }
    } else {
      setActiveAiFilter(null);
    }
  };

  // Handle Search Submission (triggers Gemini Smart Search for natural-language queries)
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeSearchWithTerm(searchTerm);
  };

  // Open AI Voice Search modal
  const handleVoiceSearch = () => {
    setIsVoiceSearchOpen(true);
  };

  // Exact categories specified:
  // Textbooks, Electronics, Cycles & Mobility, Hostel Essentials, Accessories, Clothing & Merch, Services, Other
  const categories: (ListingCategory | 'All')[] = [
    'All',
    'Textbooks',
    'Electronics',
    'Cycles & Mobility',
    'Hostel Essentials',
    'Accessories',
    'Clothing & Merch',
    'Services',
    'Other',
  ];

  const conditions: (ItemCondition | 'All')[] = [
    'All',
    'Brand New',
    'Like New',
    'Gently Used',
    'Fair',
  ];

  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // If activeAiFilter is active from Gemini Smart Search:
        if (activeAiFilter) {
          // Keywords match
          if (activeAiFilter.keywords && activeAiFilter.keywords.length > 0) {
            const matchesKeyword = activeAiFilter.keywords.some((kw) => {
              const k = kw.toLowerCase();
              return (
                item.title.toLowerCase().includes(k) ||
                item.category.toLowerCase().includes(k) ||
                item.description.toLowerCase().includes(k) ||
                (item.tags && item.tags.some((t) => t.toLowerCase().includes(k)))
              );
            });
            if (!matchesKeyword) return false;
          }

          // Max Price match
          if (activeAiFilter.maxPrice !== null && activeAiFilter.maxPrice !== undefined && item.price > activeAiFilter.maxPrice) {
            return false;
          }

          // Min Price match
          if (activeAiFilter.minPrice !== null && activeAiFilter.minPrice !== undefined && item.price < activeAiFilter.minPrice) {
            return false;
          }

          // Condition match
          if (activeAiFilter.condition && item.condition !== activeAiFilter.condition) {
            return false;
          }

          // Negotiable match
          if (activeAiFilter.negotiableOnly) {
            const isNeg = item.negotiable ?? item.isNegotiable ?? true;
            if (!isNeg) return false;
          }
        } else if (searchTerm.trim()) {
          // Normal keyword search (title, category, description, tags, location)
          const term = searchTerm.toLowerCase().trim();
          const searchableText = `${item.title} ${item.category} ${item.description} ${(item.tags || []).join(' ')} ${item.location}`.toLowerCase();
          const words = term.split(/\s+/).filter(Boolean);
          const matchesAllWords = words.every(
            (w) =>
              searchableText.includes(w) ||
              (w.endsWith('s') && searchableText.includes(w.slice(0, -1))) ||
              searchableText.includes(w + 's')
          );
          const matchesPhrase = searchableText.includes(term);

          if (!matchesPhrase && !matchesAllWords) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        // Condition filter
        if (selectedCondition !== 'All' && item.condition !== selectedCondition) {
          return false;
        }

        // Negotiable filter
        const isNeg = item.negotiable ?? item.isNegotiable ?? true;
        if (negotiableOnly && !isNeg) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }

        // Budget ceiling
        if (priceMax !== 'all' && item.price > priceMax) {
          return false;
        }

        // Campus Deals filter
        if (dealsOnly) {
          const isDeal = Boolean(item.originalPrice && item.originalPrice > item.price);
          if (!isDeal) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'price_asc') {
          return a.price - b.price;
        }
        if (sortBy === 'price_desc') {
          return b.price - a.price;
        }
        return 0;
      });
  }, [
    listings,
    searchTerm,
    activeAiFilter,
    selectedCategory,
    selectedCondition,
    negotiableOnly,
    statusFilter,
    sortBy,
    priceMax,
    dealsOnly,
  ]);

  const campusDealsCount = useMemo(() => {
    return listings.filter(
      (l) => l.status === 'available' && l.originalPrice && l.originalPrice > l.price
    ).length;
  }, [listings]);

  const hasActiveFilters =
    searchTerm !== '' ||
    activeAiFilter !== null ||
    selectedCategory !== 'All' ||
    selectedCondition !== 'All' ||
    negotiableOnly ||
    statusFilter !== 'available' ||
    priceMax !== 'all' ||
    dealsOnly;

  const resetFilters = () => {
    setSearchTerm('');
    setActiveAiFilter(null);
    setSelectedCategory('All');
    setSelectedCondition('All');
    setNegotiableOnly(false);
    setStatusFilter('available');
    setPriceMax('all');
    setDealsOnly(false);
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <UniHutIcon className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <span>Explore</span>
              <span className="bg-gradient-to-r from-[#FF6B1A] via-[#E45A8D] to-[#A855F7] bg-clip-text text-transparent">UniHut</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Find what you need from students around your campus • {filteredListings.length} items available
            </p>
          </div>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ArrowUpDown className="w-4 h-4 text-stone-400" />
          <span className="text-xs font-semibold text-stone-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-bold text-stone-800 bg-white border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500 cursor-pointer shadow-xs"
          >
            <option value="newest">Recently Listed (Newest)</option>
            <option value="price_asc">Price: Low to High (₹)</option>
            <option value="price_desc">Price: High to Low (₹)</option>
          </select>
        </div>
      </div>

      {/* Search & Top Category Bar */}
      <div className="space-y-3">
        
        {/* Search bar form */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search or ask: 'I need an engineering calculator under 500' or 'cheap maths books'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-20 py-3 text-sm bg-white border border-stone-200 focus:border-amber-500 rounded-2xl outline-none shadow-xs transition-all"
            />
            <div className="absolute right-3 top-2.5 flex items-center gap-1">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveAiFilter(null);
                  }}
                  className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Voice search button */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                title="AI Voice Search (speaks English, Hindi, or Hinglish)"
                className="p-1.5 rounded-xl transition-all cursor-pointer text-stone-400 hover:text-rose-600 hover:bg-rose-50"
              >
                <Mic className="w-4 h-4 text-rose-500" />
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Search</span>
          </button>

          {/* AI Voice Search button */}
          <button
            type="button"
            onClick={() => setIsVoiceSearchOpen(true)}
            className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs active:scale-95"
            title="AI Voice Search"
          >
            <Mic className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">AI Voice Search</span>
            <span className="sm:hidden">Voice</span>
          </button>

          {/* Search by Image button */}
          <button
            type="button"
            onClick={() => setIsVisualSearchOpen(true)}
            className="px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs active:scale-95"
            title="Search by Image"
          >
            <Camera className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Search by Image</span>
            <span className="sm:hidden">Photo</span>
          </button>
        </form>

        {/* AI Searching loading indicator */}
        {aiSearching && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2 animate-in fade-in">
            <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
            <span className="font-medium">🔎 Understanding your search with Gemini AI...</span>
          </div>
        )}

        {/* Active AI Filter Banner */}
        {activeAiFilter && !aiSearching && (
          <div className="p-3.5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="font-bold text-amber-950">✨ AI Smart Filter Applied: </span>
                <span className="text-stone-700">{activeAiFilter.explanation}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveAiFilter(null);
                setSearchTerm('');
                resetFilters();
              }}
              className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-2xs"
            >
              Clear AI filter
            </button>
          </div>
        )}

        {/* Categories Chips & Campus Deals */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          {/* Campus Deals Toggle Pill */}
          <button
            onClick={() => setDealsOnly(!dealsOnly)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
              dealsOnly
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${dealsOnly ? 'fill-white' : 'fill-rose-500'}`} />
            <span>Campus Deals ({campusDealsCount})</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (activeAiFilter) setActiveAiFilter(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat && !dealsOnly
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-stone-50/80 p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Condition */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Condition:</span>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value as any)}
              className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-700 outline-none"
            >
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price quick filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Budget:</span>
            <select
              value={String(priceMax)}
              onChange={(e) =>
                setPriceMax(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-700 outline-none"
            >
              <option value="all">Any Price</option>
              <option value="500">Under ₹500</option>
              <option value="1000">Under ₹1,000</option>
              <option value="1500">Under ₹1,500</option>
              <option value="3000">Under ₹3,000</option>
              <option value="5000">Under ₹5,000</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-700 outline-none"
            >
              <option value="available">Available Only</option>
              <option value="all">All Statuses</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          {/* Negotiable Toggle */}
          <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700 hover:text-stone-900 select-none">
            <input
              type="checkbox"
              checked={negotiableOnly}
              onChange={(e) => setNegotiableOnly(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
            />
            <span>Bargainable / Open to Offers</span>
          </label>
        </div>

        {/* Clear filter */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-rose-900">
            Unable to load campus listings. Please try again.
          </p>
          <p className="text-xs text-rose-700">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* LOADING STATE */}
      {loading && !error && (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-stone-500">
            Loading real-time campus listings from Firestore...
          </p>
        </div>
      )}

      {/* AI RECOMMENDATIONS SECTION */}
      {!loading && !error && !hasActiveFilters && recommendations.length > 0 && (
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 rounded-3xl border border-amber-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <span>✨ {recommendationsHeading}</span>
                </h2>
                <p className="text-[11px] text-stone-500">
                  Smart suggestions personalized to your campus activity and student trends
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
              ✨ AI Recommendations
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map(({ listing, reason }) => (
              <div
                key={`rec-${listing.id}`}
                onClick={() => onSelectListing(listing.id)}
                className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 p-3.5 flex gap-3.5 cursor-pointer transition-all hover:shadow-md group relative overflow-hidden"
              >
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-20 h-20 rounded-xl object-cover bg-stone-100 shrink-0 group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md truncate max-w-full">
                      ✨ {reason}
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 truncate mt-1 group-hover:text-amber-800 transition-colors">
                      {listing.title}
                    </h4>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-black text-stone-900">
                      ₹{listing.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      {listing.location || listing.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALL MARKETPLACE LISTINGS HEADER (when recommendations shown) */}
      {!loading && !error && !hasActiveFilters && recommendations.length > 0 && (
        <div className="pt-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            All Campus Listings ({filteredListings.length})
          </h3>
        </div>
      )}

      {/* Deals Active Banner */}
      {dealsOnly && (
        <div className="p-4 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 rounded-2xl border border-rose-200 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h4 className="font-bold text-rose-950">
                🔥 Showing Campus Deals with Real Price Drops
              </h4>
              <p className="text-stone-600 text-[11px]">
                Listings where sellers have lowered the asking price compared to original retail price.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDealsOnly(false)}
            className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
          >
            Show All Listings
          </button>
        </div>
      )}

      {/* LISTINGS GRID */}
      {!loading && !error && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredListings.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onClick={onSelectListing}
            />
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && filteredListings.length === 0 && (
        <div className="py-16 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-300 p-8 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            No listings found on campus yet.
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
            Try adjusting your search terms or clearing category filters to discover more items on campus.
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* AI Visual Search Modal */}
      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
        listings={listings}
        onSelectListing={onSelectListing}
        onApplySearchQuery={(q, cat) => {
          if (q) setSearchTerm(q);
          if (cat) setSelectedCategory(cat as any);
        }}
      />

      {/* AI Voice Search Modal */}
      <AiVoiceSearchModal
        isOpen={isVoiceSearchOpen}
        onClose={() => setIsVoiceSearchOpen(false)}
        listings={listings}
        onApplySearch={(q, cat, max) => {
          if (q) setSearchTerm(q);
          if (cat) setSelectedCategory(cat);
          if (max) setPriceMax(max);
          if (q) {
            executeSearchWithTerm(q);
          }
        }}
      />

    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Heart,
  HeartOff,
  ArrowRight,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { Listing, ListingCategory } from '../types';
import { ListingCard } from '../components/ListingCard';
import { useSaved } from '../context/SavedContext';

interface SavedItemsPageProps {
  listings: Listing[];
  onSelectListing: (listingId: string) => void;
  onExploreMarketplace: () => void;
}

export const SavedItemsPage: React.FC<SavedItemsPageProps> = ({
  listings,
  onSelectListing,
  onExploreMarketplace,
}) => {
  const { savedIds, savedCount } = useSaved();
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'All'>('All');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  // Filter listings that are in the user's savedIds
  const savedListings = useMemo(() => {
    return listings.filter((l) => l && l.id && savedIds.has(l.id));
  }, [listings, savedIds]);

  const effectiveCount = savedListings.length;

  // Apply secondary filters
  const filteredListings = useMemo(() => {
    let result = [...savedListings];

    if (selectedCategory !== 'All') {
      result = result.filter((l) => l.category === selectedCategory);
    }

    if (availableOnly) {
      result = result.filter((l) => l.status === 'available');
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // Newest
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [savedListings, selectedCategory, availableOnly, sortBy]);

  const categories: (ListingCategory | 'All')[] = [
    'All',
    'Textbooks',
    'Electronics',
    'Cycles & Mobility',
    'Hostel Essentials',
    'Accessories',
    'Clothing & Merch',
    'Services',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6B1A] via-[#E45A8D] to-[#A855F7] flex items-center justify-center text-white shadow-md shadow-pink-500/15">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                <span>Saved Items</span>
                <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-[#E45A8D]">
                  {effectiveCount}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Your bookmarked campus deals • Grab them before someone else does!
              </p>
            </div>
          </div>
        </div>

        {effectiveCount > 0 && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={onExploreMarketplace}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-stone-500" />
              <span>Browse More Deals</span>
            </button>
          </div>
        )}
      </div>

      {/* When user has no saved items at all */}
      {effectiveCount === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto space-y-6 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-radial from-pink-50 via-rose-50 to-amber-50 border border-pink-100 flex items-center justify-center mx-auto text-[#E45A8D] shadow-inner">
            <HeartOff className="w-9 h-9 stroke-[1.6]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              No saved items yet
            </h2>
            <p className="text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
              Found something interesting in the marketplace? Tap the heart icon on any listing card to save it here for quick access later.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onExploreMarketplace}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-unihut-gradient bg-unihut-gradient-hover text-white font-bold text-sm shadow-md shadow-pink-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>Explore UniHut</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Controls: Category Pills & Sort Dropdown */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Availability toggle and sort */}
            <div className="flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                />
                <span>Available only</span>
              </label>

              <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 shadow-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-semibold text-stone-700 bg-transparent outline-none cursor-pointer"
                >
                  <option value="newest">Recently Added</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listings Grid or Filter Empty State */}
          {filteredListings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-stone-600">
                No saved items match your selected filters.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setAvailableOnly(false);
                }}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
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
        </>
      )}

    </div>
  );
};

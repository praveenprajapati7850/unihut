import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { Listing, ListingCategory, ItemCondition, ListingStatus, AiPriceEstimate } from '../types';
import { updateListing, checkAndNotifyPriceDrops } from '../lib/marketplaceService';
import { ImageUploader } from '../components/ImageUploader';
import { fetchAiPriceEstimate } from '../lib/aiService';

const SAMPLE_CAMPUS_IMAGES = [
  {
    label: 'Engineering Textbook',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Casio Calculator',
    url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Campus Bicycle',
    url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Laptop Stand',
    url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Hostel Study Table',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Mechanical Keyboard',
    url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Headphones',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Lab Coat',
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  },
];

interface EditListingPageProps {
  listing: Listing;
  onBack: () => void;
  onListingUpdated: (updatedListing: Listing) => void;
}

export const EditListingPage: React.FC<EditListingPageProps> = ({
  listing,
  onBack,
  onListingUpdated,
}) => {
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [price, setPrice] = useState<number | ''>(listing.price);
  const [originalPrice, setOriginalPrice] = useState<number | ''>(
    listing.originalPrice || ''
  );
  const [category, setCategory] = useState<ListingCategory>(listing.category);
  const [condition, setCondition] = useState<ItemCondition>(listing.condition);
  const [status, setStatus] = useState<ListingStatus>(listing.status);
  const [location, setLocation] = useState(listing.location);
  const [imageUrl, setImageUrl] = useState(listing.imageUrl);
  const [isNegotiable, setIsNegotiable] = useState(listing.isNegotiable);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Price Advisor
  const [aiPriceLoading, setAiPriceLoading] = useState(false);
  const [aiPriceEstimate, setAiPriceEstimate] = useState<AiPriceEstimate | null>(null);

  const handleAiPriceCheck = async () => {
    if (!title.trim()) {
      setError('Please enter a listing title first.');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setError('Please enter a price to check campus resale range.');
      return;
    }
    setError(null);
    setAiPriceLoading(true);
    try {
      const estimate = await fetchAiPriceEstimate({
        title: title.trim(),
        condition,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        category,
      });
      setAiPriceEstimate(estimate);
    } catch (err) {
      console.error('Price advisor error in EditListingPage:', err);
      setError('AI price suggestions temporarily unavailable.');
    } finally {
      setAiPriceLoading(false);
    }
  };

  const categories: ListingCategory[] = [
    'Textbooks',
    'Electronics',
    'Cycles & Mobility',
    'Hostel Essentials',
    'Accessories',
    'Clothing & Merch',
  ];

  const conditions: ItemCondition[] = [
    'Brand New',
    'Like New',
    'Gently Used',
    'Fair',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    if (!price || Number(price) <= 0) {
      setError('Please provide a valid price in INR');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedOriginal = originalPrice ? Number(originalPrice) : undefined;
      const updates: Partial<Listing> = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        condition,
        status,
        location: location.trim(),
        imageUrl: imageUrl.trim(),
        isNegotiable,
        negotiable: isNegotiable,
      };

      if (parsedOriginal && !isNaN(parsedOriginal) && parsedOriginal > 0) {
        updates.originalPrice = parsedOriginal;
      }

      await updateListing(listing.id, updates);

      // Check if price dropped and notify active watchers
      if (Number(price) < listing.price) {
        checkAndNotifyPriceDrops(listing.id, Number(price), title.trim());
      }

      const merged: Listing = {
        ...listing,
        ...updates,
      };

      onListingUpdated(merged);
    } catch (err: any) {
      setError(
        err?.message && !err.message.startsWith('{')
          ? err.message
          : 'Unable to update listing right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Back</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 bg-stone-50 border-b border-stone-100">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Edit Marketplace Listing
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Update pricing, reservation status, or description for students.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Listing Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none"
            />
          </div>

          {/* Status & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Listing Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ListingStatus)}
                className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none font-bold text-stone-800"
              >
                <option value="available">Available</option>
                <option value="reserved">Deal Reserved</option>
                <option value="sold">Sold Out</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ListingCategory)}
                className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none font-medium text-stone-800"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none font-medium text-stone-800"
              >
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing with AI Price Advisor */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Selling Price (INR ₹) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAiPriceCheck}
                    disabled={aiPriceLoading}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    {aiPriceLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Estimating...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-3 h-3" />
                        <span>✨ Check Fair Price</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-3 text-sm font-bold text-stone-900 bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Original Price (INR ₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={originalPrice}
                  onChange={(e) =>
                    setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-4 py-3 text-sm text-stone-700 bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none"
                />
              </div>
            </div>

            {/* Price Advisor Result */}
            {aiPriceLoading && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                <span>💰 Estimating a fair campus range...</span>
              </div>
            )}

            {aiPriceEstimate && !aiPriceLoading && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span>Estimated campus resale range:</span>
                    <span className="text-amber-800 font-black">{aiPriceEstimate.estimatedRange}</span>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      aiPriceEstimate.pricePosition === 'GREAT DEAL' || aiPriceEstimate.pricePosition === 'GOOD DEAL'
                        ? 'bg-emerald-100 text-emerald-800'
                        : aiPriceEstimate.pricePosition === 'FAIR PRICE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Price position: {aiPriceEstimate.pricePosition}
                  </span>
                </div>

                <p className="text-xs text-stone-600">{aiPriceEstimate.explanation}</p>
                <p className="text-[10px] text-stone-400 font-medium pt-0.5">
                  ✨ AI campus estimate based on typical student depreciation
                </p>
              </div>
            )}
          </div>

          {/* Negotiable */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-800">Bargaining Open</p>
              <p className="text-[11px] text-stone-500">Allow buyers to submit counter-offers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Location & Image */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Campus Location
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none"
            />
          </div>

          {/* Image Upload, Presets & URL */}
          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            presets={SAMPLE_CAMPUS_IMAGES}
            label="Item Photo"
            required
          />

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Saving Changes...' : 'Save Updates'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

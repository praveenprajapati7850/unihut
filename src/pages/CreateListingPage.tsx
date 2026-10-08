import React, { useState } from 'react';
import {
  ArrowLeft,
  Tag,
  CheckCircle,
  AlertCircle,
  MapPin,
  Sparkles,
  Loader2,
  TrendingUp,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { ListingCategory, ItemCondition, AiListingSuggestion, AiPriceEstimate } from '../types';
import { useAuth } from '../context/AuthContext';
import { createListing, checkWantedMatchesForListing } from '../lib/marketplaceService';
import { ImageUploader } from '../components/ImageUploader';
import { fetchAiListingAssistant, fetchAiPriceEstimate } from '../lib/aiService';

interface CreateListingPageProps {
  onBack: () => void;
  onListingCreated: (listingId: string) => void;
  initialValues?: Partial<{
    title: string;
    category: ListingCategory;
    price: number;
    condition: ItemCondition;
    description: string;
    preferredLocation: string;
  }>;
}

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

export const CreateListingPage: React.FC<CreateListingPageProps> = ({
  onBack,
  onListingCreated,
  initialValues,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();

  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [price, setPrice] = useState<number | ''>(
    initialValues?.price !== undefined ? initialValues.price : ''
  );
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [category, setCategory] = useState<ListingCategory>(
    initialValues?.category || 'Textbooks'
  );
  const [condition, setCondition] = useState<ItemCondition>(
    initialValues?.condition || 'Gently Used'
  );
  const [location, setLocation] = useState(
    initialValues?.preferredLocation ||
      userProfile?.hostel ||
      userProfile?.hostelOrBlock ||
      'Aurobindo Hostel'
  );
  const [imageUrl, setImageUrl] = useState(SAMPLE_CAMPUS_IMAGES[0].url);
  const [negotiable, setNegotiable] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gemini AI states
  const [aiImproving, setAiImproving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiListingSuggestion | null>(null);
  const [aiSuggestionNotice, setAiSuggestionNotice] = useState<string | null>(null);
  const [aiPriceLoading, setAiPriceLoading] = useState(false);
  const [aiPriceEstimate, setAiPriceEstimate] = useState<AiPriceEstimate | null>(null);

  // AI Listing Assistant
  const handleAiImprove = async () => {
    if (!title.trim() && !description.trim()) {
      setError('Please enter at least an item name or draft description so AI can improve it.');
      return;
    }
    setError(null);
    setAiImproving(true);
    try {
      const suggestion = await fetchAiListingAssistant({
        title: title.trim(),
        condition,
        price: price ? Number(price) : undefined,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        description: description.trim(),
        category,
      });
      setAiSuggestion(suggestion);
    } catch (err) {
      console.error('AI Assist error:', err);
      setError(err instanceof Error ? err.message : 'AI suggestions are temporarily unavailable.');
    } finally {
      setAiImproving(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setTitle(aiSuggestion.improvedTitle);
    setDescription(aiSuggestion.improvedDescription);
    if (aiSuggestion.suggestedCategory) {
      setCategory(aiSuggestion.suggestedCategory);
    }
    if (aiSuggestion.suggestedTags && Array.isArray(aiSuggestion.suggestedTags)) {
      setTags(aiSuggestion.suggestedTags);
    }
    setAiSuggestionNotice('✨ AI suggestions applied to your listing!');
    setTimeout(() => setAiSuggestionNotice(null), 4000);
    setAiSuggestion(null);
  };

  // AI Price Advisor
  const handleAiPriceCheck = async () => {
    if (!title.trim()) {
      setError('Please enter an item title first to estimate price.');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setError('Please enter your asking price first to evaluate campus resale range.');
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
      console.error('Price Advisor error:', err);
      setError(err instanceof Error ? err.message : 'AI price suggestions are temporarily unavailable.');
    } finally {
      setAiPriceLoading(false);
    }
  };

  // Exact categories:
  // Textbooks, Electronics, Cycles & Mobility, Hostel Essentials, Accessories, Clothing & Merch, Services, Other
  const categories: ListingCategory[] = [
    'Textbooks',
    'Electronics',
    'Cycles & Mobility',
    'Hostel Essentials',
    'Accessories',
    'Clothing & Merch',
    'Services',
    'Other',
  ];

  const conditions: ItemCondition[] = [
    'Brand New',
    'Like New',
    'Gently Used',
    'Fair',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !userProfile) {
      openAuthModal('login');
      return;
    }

    // Required validations: title, category, condition, price, location, description
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!category) {
      setError('Category is required');
      return;
    }
    if (!condition) {
      setError('Condition is required');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('Price is required and must be greater than zero');
      return;
    }
    if (!location.trim()) {
      setError('Campus location is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    const sellerId = currentUser?.uid || userProfile?.uid || userProfile?.id || 'demo_seller';
    const sellerName = userProfile?.displayName || userProfile?.name || currentUser?.displayName || 'Campus Student';
    const sellerPhotoURL =
      userProfile?.photoURL ||
      userProfile?.avatarUrl ||
      currentUser?.photoURL ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${sellerId}`;

    setLoading(true);
    setError(null);

    try {
      const parsedOriginal = originalPrice ? Number(originalPrice) : undefined;
      const listingPayload: any = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        condition,
        location: location.trim(),
        imageUrl: imageUrl.trim() || SAMPLE_CAMPUS_IMAGES[0].url,
        negotiable,
        sellerId,
        sellerName,
        sellerPhotoURL,
        sellerRating: typeof userProfile?.rating === 'number' ? userProfile.rating : 0,
        status: 'available',
        tags:
          tags.length > 0
            ? tags
            : [
                category.toLowerCase(),
                condition.toLowerCase(),
                ...title.toLowerCase().split(' ').filter((w) => w.length > 2),
              ],
      };

      if (parsedOriginal && !isNaN(parsedOriginal) && parsedOriginal > 0) {
        listingPayload.originalPrice = parsedOriginal;
      }

      const newListingId = await createListing(listingPayload);

      // Check active wanted requests and notify students looking for this item
      checkWantedMatchesForListing({
        id: newListingId,
        ...listingPayload,
      }).catch((e) => console.warn('Could not check wanted matches:', e));

      setSuccessNotice(true);
      setTimeout(() => {
        onListingCreated(newListingId);
      }, 1200);
    } catch (err: any) {
      setError(
        err?.message && !err.message.startsWith('{')
          ? err.message
          : 'Unable to post listing right now. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Return</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        
        {/* Form Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-stone-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Campus Seller Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Sell an Item on Campus
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            List textbooks, electronics, cycles, hostel gear or academic notes for fellow students.
          </p>
        </div>

        {/* Success toast overlay */}
        {successNotice && (
          <div className="p-6 bg-emerald-50 border-b border-emerald-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Listing published successfully!</h3>
            <p className="text-xs text-stone-600">Redirecting to your new listing...</p>
          </div>
        )}

        {/* AI Suggestions Applied Notice */}
        {aiSuggestionNotice && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{aiSuggestionNotice}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title with AI Assistant Button */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Listing Title *
              </label>
              
              <button
                type="button"
                onClick={handleAiImprove}
                disabled={aiImproving}
                title="Use Gemini to generate a professional title, description, tags, and fair price range"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {aiImproving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>✨ Improving your listing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>✨ Improve with AI</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="e.g. Higher Engineering Mathematics textbook (B.S. Grewal)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none"
            />
          </div>

          {/* AI Suggestion Preview Panel */}
          {aiSuggestion && (
            <div className="p-5 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-stone-50 border border-amber-300 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Gemini AI Listing Suggestions
                    </h3>
                    <p className="text-[11px] text-stone-600">
                      Review suggestions before applying them to your form.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAiSuggestion(null)}
                  className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Improved Title */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Recommended Title
                </span>
                <p className="text-sm font-black text-stone-900 mt-0.5">
                  {aiSuggestion.improvedTitle}
                </p>
              </div>

              {/* Improved Description */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Recommended Description
                </span>
                <p className="text-xs text-stone-700 leading-relaxed mt-0.5 bg-white/70 p-3 rounded-xl border border-amber-200/50">
                  {aiSuggestion.improvedDescription}
                </p>
              </div>

              {/* Category, Price Range & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/70 rounded-xl border border-amber-200/50 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Category & Campus Resale Range
                  </span>
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span>{aiSuggestion.suggestedCategory}</span>
                    <span className="text-amber-800">{aiSuggestion.suggestedPriceRange}</span>
                  </div>
                </div>

                <div className="p-3 bg-white/70 rounded-xl border border-amber-200/50 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Search Tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {aiSuggestion.suggestedTags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Highlights */}
              {aiSuggestion.highlights && aiSuggestion.highlights.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Buyer-Friendly Highlights
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestion.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-bold px-2.5 py-1 bg-white rounded-lg border border-amber-200 text-stone-800 shadow-2xs"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAiSuggestion(null)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleApplyAiSuggestion}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Suggestions</span>
                </button>
              </div>
            </div>
          )}

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ListingCategory)}
                className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none font-medium text-stone-800 cursor-pointer"
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
                className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none font-medium text-stone-800 cursor-pointer"
              >
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Row with AI Price Advisor */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Price (INR ₹) *
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
                <div className="relative">
                  <span className="absolute left-4 top-3 text-stone-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="450"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-3 text-sm font-bold text-stone-900 bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Original Price / MRP (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-stone-400 font-bold">₹</span>
                  <input
                    type="number"
                    min={1}
                    placeholder="850"
                    value={originalPrice}
                    onChange={(e) =>
                      setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full pl-9 pr-4 py-3 text-sm text-stone-700 bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none"
                  />
                </div>
              </div>
            </div>

            {/* AI Price Advisor Feedback Card */}
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

                <p className="text-xs text-stone-600">
                  {aiPriceEstimate.explanation}
                </p>

                <p className="text-[10px] text-stone-400 font-medium pt-0.5">
                  ✨ AI campus estimate based on typical student depreciation
                </p>
              </div>
            )}
          </div>

          {/* Negotiable Checkbox */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-800">Negotiable Status</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Enable "Make an Offer" button for students on this listing.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Campus Location */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Campus Handover Location *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-4 top-3.5 text-stone-400" />
              <input
                type="text"
                required
                placeholder="e.g. Hostel 3 (Room 114) or Central Library"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none"
              />
            </div>
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
              Description *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe condition, working status, how long it was used, included accessories, and preferred campus meetup time."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 text-sm bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-2xl outline-none"
            />
          </div>

          {/* Submit */}
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
              disabled={loading || successNotice}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Publishing...' : 'Publish Listing'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

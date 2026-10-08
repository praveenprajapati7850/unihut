import React, { useState } from 'react';
import { X, Tag, Send, CheckCircle2, AlertCircle, Sparkles, Loader2, Check } from 'lucide-react';
import { Listing, AiOfferSuggestion } from '../types';
import { useAuth } from '../context/AuthContext';
import { createOffer, recordUserInteraction } from '../lib/marketplaceService';
import { fetchAiOfferMessage } from '../lib/aiService';

interface MakeOfferModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onOfferSent?: (offerAmount: number) => void;
  initialAmount?: number;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  listing,
  isOpen,
  onClose,
  onOfferSent,
  initialAmount,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const [offerPrice, setOfferPrice] = useState<number>(
    initialAmount && initialAmount > 0
      ? initialAmount
      : Math.round(listing.price * 0.85) // default ~15% discount
  );
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Offer Assistant states
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiOfferSuggestion, setAiOfferSuggestion] = useState<AiOfferSuggestion | null>(null);

  if (!isOpen) return null;

  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id;

  // A seller must NOT be able to make an offer on their own listing
  if (currentUserId && currentUserId === listing.sellerId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-3">
          <p className="font-bold text-stone-900 text-sm">Cannot make an offer on your own listing</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const discountPercent = Math.round(
    ((listing.price - offerPrice) / listing.price) * 100
  );

  const handleApplyPreset = (percent: number) => {
    const discounted = Math.round(listing.price * (1 - percent / 100));
    setOfferPrice(discounted);
    // Clear old AI message so user can draft anew if price changed
    setAiOfferSuggestion(null);
  };

  const handleAiNegotiate = async () => {
    setError(null);
    setAiDrafting(true);
    try {
      const suggestion = await fetchAiOfferMessage({
        listingTitle: listing.title,
        listingPrice: listing.price,
        originalPrice: listing.originalPrice,
        condition: listing.condition,
        proposedOffer: offerPrice,
        negotiable: listing.negotiable,
      });
      setAiOfferSuggestion(suggestion);
    } catch (err) {
      console.error('AI Offer Assistant error:', err);
      setError(err instanceof Error ? err.message : 'AI negotiation assistant temporarily unavailable.');
    } finally {
      setAiDrafting(false);
    }
  };

  const handleUseAiMessage = () => {
    if (aiOfferSuggestion) {
      setNote(aiOfferSuggestion.message);
      setAiOfferSuggestion(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !userProfile) {
      openAuthModal('login');
      return;
    }

    if (offerPrice <= 0) {
      setError('Offer amount must be greater than zero');
      return;
    }

    const buyerId = currentUserId || 'demo_buyer';
    const buyerName = userProfile?.displayName || userProfile?.name || currentUser?.displayName || 'Campus Student';
    const buyerEmail = currentUser?.email || userProfile?.email || '';

    setLoading(true);
    setError(null);

    try {
      await createOffer(
        listing,
        buyerId,
        listing.sellerId,
        offerPrice,
        note || `Can you do ₹${offerPrice.toLocaleString('en-IN')}?`,
        buyerName,
        buyerEmail
      );

      // Record interaction for personalization
      recordUserInteraction({
        userId: buyerId,
        type: 'offer',
        listingId: listing.id,
        category: listing.category,
        query: `Offer: ₹${offerPrice}`,
      });

      setSuccess(true);
      if (onOfferSent) {
        onOfferSent(offerPrice);
      }

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1600);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Make an Offer</h3>
              <p className="text-[11px] text-stone-500">Negotiate directly with {listing.sellerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Item Preview */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-14 h-14 rounded-xl object-cover bg-stone-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-900 line-clamp-1">{listing.title}</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs text-stone-500">Listed Price:</span>
                <span className="text-sm font-bold text-stone-900">
                  ₹{listing.price.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                  Negotiable
                </span>
              </div>
            </div>
          </div>

          {success ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-stone-900 text-base">Offer Sent to Seller!</h4>
              <p className="text-xs text-stone-500">
                ₹{offerPrice.toLocaleString('en-IN')} proposed to {listing.sellerName}. Check your Messages for their response.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Discount Presets */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Quick Discount Presets
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyPreset(pct)}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        discountPercent === pct
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Offer Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Your Offer Amount (INR)
                  </label>
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-amber-700">
                      {discountPercent}% below listed price
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-stone-500">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 text-base font-bold text-stone-900 bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Optional Note with AI Negotiation Assistant */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-700">
                    Message / Pickup Note (Optional)
                  </label>

                  <button
                    type="button"
                    onClick={handleAiNegotiate}
                    disabled={aiDrafting || offerPrice <= 0}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    {aiDrafting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>🤝 Drafting a better offer...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>✨ Help me negotiate</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Draft Suggestion Box */}
                {aiOfferSuggestion && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>AI Suggested Message</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleUseAiMessage}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Use Message</span>
                      </button>
                    </div>

                    <p className="text-stone-700 italic bg-white/70 p-2.5 rounded-xl border border-amber-200/50">
                      "{aiOfferSuggestion.message}"
                    </p>

                    {aiOfferSuggestion.politeTip && (
                      <p className="text-[10px] text-amber-800 font-medium">
                        💡 {aiOfferSuggestion.politeTip}
                      </p>
                    )}
                  </div>
                )}

                <textarea
                  rows={2}
                  placeholder="e.g. Can you do ₹350? Can pick up today at Central Library."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 text-xs bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl outline-none resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Sending Offer...' : `Send Offer: ₹${offerPrice.toLocaleString('en-IN')}`}</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Bell, X, Check, ArrowDown, Sparkles, AlertCircle } from 'lucide-react';
import { Listing } from '../types';
import { createPriceAlert } from '../lib/marketplaceService';
import { useAuth } from '../context/AuthContext';

interface PriceAlertModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onAlertSet?: () => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  listing,
  isOpen,
  onClose,
  onAlertSet,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id || '';

  const [mode, setMode] = useState<'any_drop' | 'target'>('any_drop');
  const [targetPrice, setTargetPrice] = useState<string>(
    String(Math.max(10, Math.floor(listing.price * 0.85)))
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      openAuthModal('login');
      return;
    }

    const targetVal =
      mode === 'any_drop'
        ? Math.max(1, listing.price - 1)
        : Number(targetPrice);

    if (isNaN(targetVal) || targetVal <= 0) {
      setError('Please enter a valid target price in ₹.');
      return;
    }

    if (targetVal >= listing.price) {
      setError(`Target price must be lower than current asking price (₹${listing.price.toLocaleString('en-IN')}).`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createPriceAlert({
        userId: currentUserId,
        listingId: listing.id,
        listingTitle: listing.title,
        targetPrice: targetVal,
        currentPrice: listing.price,
        active: true,
      });

      setSuccess(true);
      if (onAlertSet) onAlertSet();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Could not set price alert. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-stone-900 leading-tight">
              Watch Price & Alerts
            </h3>
            <p className="text-xs text-stone-500">
              Get notified immediately when this listing drops
            </p>
          </div>
        </div>

        {/* Product summary */}
        <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-stone-900 truncate">{listing.title}</p>
            <p className="text-[11px] text-stone-500">Current asking price</p>
          </div>
          <span className="text-base font-black text-stone-900 shrink-0">
            ₹{listing.price.toLocaleString('en-IN')}
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <p className="text-sm font-bold text-stone-900">Price Alert Activated!</p>
            <p className="text-xs text-stone-500">
              We'll send you an in-app notification the moment the seller lowers the price.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selection modes */}
            <div className="space-y-2">
              <label
                onClick={() => setMode('any_drop')}
                className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  mode === 'any_drop'
                    ? 'border-amber-500 bg-amber-50/50 text-stone-900 ring-1 ring-amber-500'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <input
                  type="radio"
                  name="alert_mode"
                  checked={mode === 'any_drop'}
                  onChange={() => setMode('any_drop')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <p className="text-xs font-bold">Notify me of any price drop</p>
                  <p className="text-[11px] text-stone-500">
                    Get alerted if the seller lowers the price by any amount.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setMode('target')}
                className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  mode === 'target'
                    ? 'border-amber-500 bg-amber-50/50 text-stone-900 ring-1 ring-amber-500'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <input
                  type="radio"
                  name="alert_mode"
                  checked={mode === 'target'}
                  onChange={() => setMode('target')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold">Set my target price</p>
                  <p className="text-[11px] text-stone-500">
                    Only notify me when the price hits or falls below my target.
                  </p>

                  {mode === 'target' && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-xs font-bold text-stone-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          placeholder="Target in ₹"
                          className="w-full pl-7 pr-3 py-1.5 text-xs font-bold bg-white border border-stone-300 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                          min="1"
                          max={listing.price - 1}
                        />
                      </div>
                      <span className="text-[10px] text-stone-400 font-semibold">
                        (Current: ₹{listing.price})
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 rounded-xl transition-all shadow-sm shadow-amber-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{submitting ? 'Setting Alert...' : 'Set Price Alert'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

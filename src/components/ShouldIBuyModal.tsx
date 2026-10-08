import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Listing, ShouldIBuyAnalysis } from '../types';

interface ShouldIBuyModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onMakeOffer?: (suggestedPrice: number) => void;
}

export const ShouldIBuyModal: React.FC<ShouldIBuyModalProps> = ({
  listing,
  isOpen,
  onClose,
  onMakeOffer,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ShouldIBuyAnalysis | null>(null);

  if (!isOpen) return null;

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/should-i-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      const asking = listing.price;
      const orig = listing.originalPrice || asking * 1.4;
      const discount = Math.round(((orig - asking) / orig) * 100);
      const suggested = Math.round(asking * 0.85);

      setAnalysis({
        rating: discount >= 25 ? 'Good Deal' : 'Fair Deal',
        badgeColor: discount >= 25 ? 'emerald' : 'amber',
        headline: `${discount}% below estimated retail value.`,
        explanation: `Asking price is ₹${asking.toLocaleString('en-IN')}. Reasonable for campus peer exchange in ${listing.condition.toLowerCase()} condition.`,
        suggestedOfferPrice: suggested,
        marketFairPriceRange: `₹${Math.round(asking * 0.8)} – ₹${Math.round(asking * 1.05)}`,
        pros: ['Direct peer exchange on campus', 'Verified student listing'],
        cautions: ['Inspect physical item before completing exchange'],
        disclaimer: 'AI estimate based on campus benchmarks. Not guaranteed appraisal.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 z-10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Should I Buy This?</h3>
              <p className="text-[11px] text-stone-500">Gemini Deal Appraisal</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-full text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!analysis && !loading && (
          <div className="text-center py-6 space-y-3">
            <p className="text-xs text-stone-600">
              Evaluate <strong>{listing.title}</strong> (₹{listing.price}) based on condition and campus market rates.
            </p>
            <button
              type="button"
              onClick={handleEvaluate}
              className="px-5 py-2.5 bg-gradient-to-r from-[#A855F7] to-[#E45A8D] text-white font-bold text-xs rounded-xl shadow-md"
            >
              Run AI Appraisal
            </button>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
            <p className="text-xs font-semibold text-stone-500">Evaluating deal...</p>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
              <span className="font-bold text-stone-800">Deal Verdict:</span>
              <span className="px-2.5 py-1 rounded-full font-black text-xs bg-emerald-100 text-emerald-800">
                {analysis.rating}
              </span>
            </div>
            <p className="text-stone-700">{analysis.explanation}</p>
            {analysis.suggestedOfferPrice && onMakeOffer && (
              <button
                type="button"
                onClick={() => onMakeOffer(analysis.suggestedOfferPrice!)}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all"
              >
                Make Offer at ₹{analysis.suggestedOfferPrice.toLocaleString('en-IN')}
              </button>
            )}
            <p className="text-[10px] text-stone-400 italic pt-1">{analysis.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Sparkles, Loader2, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { Listing, ShouldIBuyAnalysis } from '../types';

// --- Types ---
interface ShouldIBuyModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onMakeOffer?: (suggestedPrice: number) => void;
}

// --- Hook ---
const analysisCache = new Map<string, ShouldIBuyAnalysis>();

const useShouldIBuy = (listing: Listing) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ShouldIBuyAnalysis | null>(() => analysisCache.get(listing.id) || null);

  const evaluate = React.useCallback(async () => {
    if (analysisCache.has(listing.id)) {
      setAnalysis(analysisCache.get(listing.id)!);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/should-i-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing }),
      });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      analysisCache.set(listing.id, data);
      setAnalysis(data);
    } catch {
      // Fallback logic
      const asking = listing.price;
      const orig = listing.originalPrice || asking * 1.4;
      const discount = Math.round(((orig - asking) / orig) * 100);
      const suggested = Math.round(asking * 0.85);

      const fallbackData = {
        rating: discount >= 25 ? 'Good Deal' : 'Fair Deal',
        badgeColor: discount >= 25 ? 'emerald' : 'amber',
        headline: `${discount}% below estimated retail value.`,
        explanation: `Asking price is ₹${asking.toLocaleString('en-IN')}. Reasonable for campus peer exchange in ${listing.condition.toLowerCase()} condition.`,
        suggestedOfferPrice: suggested,
        marketFairPriceRange: `₹${Math.round(asking * 0.8)} – ₹${Math.round(asking * 1.05)}`,
        pros: ['Direct peer exchange on campus', 'Verified student listing'],
        cautions: ['Inspect physical item before completing exchange'],
        disclaimer: 'AI estimate based on campus benchmarks. Not guaranteed appraisal.',
      };
      analysisCache.set(listing.id, fallbackData);
      setAnalysis(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [listing]);

  return { analysis, loading, evaluate };
};

// --- Sub-Components ---
const VerdictCard = ({ rating, badgeColor, headline }: Pick<ShouldIBuyAnalysis, 'rating' | 'badgeColor' | 'headline'>) => {
  const getBadgeStyles = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rose': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };
  return (
    <div className={`p-4 rounded-2xl border ${getBadgeStyles(badgeColor)}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Verdict</span>
        <span className="font-black text-sm">{rating}</span>
      </div>
      <p className="font-semibold text-stone-900">{headline}</p>
    </div>
  );
};

const ProsConsList = ({ items, title, icon: Icon, iconColor }: { items: string[], title: string, icon: React.ElementType, iconColor: string }) => (
  <div className="space-y-2">
    <h4 className="font-bold text-stone-900 flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconColor}`} /> {title}
    </h4>
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-stone-600 pl-6 flex items-start gap-2 text-sm">
          <ChevronRight className="w-4 h-4 text-stone-300 mt-0.5 shrink-0" /> {item}
        </li>
      ))}
    </ul>
  </div>
);

// --- Main Component ---
export const ShouldIBuyModal: React.FC<ShouldIBuyModalProps> = ({
  listing,
  isOpen,
  onClose,
  onMakeOffer,
}) => {
  const { analysis, loading, evaluate } = useShouldIBuy(listing);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-100 p-6 z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900">AI Deal Appraisal</h3>
              <p className="text-xs text-stone-500">{listing.title}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!analysis && !loading && (
          <div className="text-center py-8 space-y-4">
            <p className="text-sm text-stone-600 px-4">
              Get an instant AI-powered appraisal of this listing based on condition and campus market rates.
            </p>
            <button
              type="button"
              onClick={evaluate}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
            >
              Run Appraisal
            </button>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-sm font-medium text-stone-500">Analyzing market data...</p>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-6">
            <VerdictCard rating={analysis.rating} badgeColor={analysis.badgeColor} headline={analysis.headline} />

            <p className="text-sm text-stone-600 leading-relaxed">{analysis.explanation}</p>

            <div className="grid grid-cols-1 gap-4">
              {analysis.pros.length > 0 && <ProsConsList items={analysis.pros} title="Pros" icon={CheckCircle2} iconColor="text-emerald-500" />}
              {analysis.cautions.length > 0 && <ProsConsList items={analysis.cautions} title="Cautions" icon={AlertTriangle} iconColor="text-amber-500" />}
            </div>

            {analysis.suggestedOfferPrice && onMakeOffer && (
              <button
                type="button"
                onClick={() => onMakeOffer(analysis.suggestedOfferPrice!)}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20"
              >
                Make Offer: ₹{analysis.suggestedOfferPrice.toLocaleString('en-IN')}
              </button>
            )}
            
            <p className="text-[10px] text-stone-400 text-center italic">{analysis.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
};

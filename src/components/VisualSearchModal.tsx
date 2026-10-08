import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Tag,
  CheckCircle2,
  ArrowRight,
  Search,
} from 'lucide-react';
import { Listing, VisualSearchResult } from '../types';
import { fetchAiVisualSearch } from '../lib/aiService';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[];
  onSelectListing: (listingId: string) => void;
  onApplySearchQuery: (query: string, category?: string) => void;
}

// Sample campus images for quick testing
const DEMO_SAMPLES = [
  {
    label: 'Scientific Calculator',
    url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'College Bicycle',
    url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Engineering Textbook',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  },
];

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({
  isOpen,
  onClose,
  listings,
  onSelectListing,
  onApplySearchQuery,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VisualSearchResult | null>(null);
  const [matchingListings, setMatchingListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      analyzeImage(base64, file.type);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = async (sampleUrl: string) => {
    setError(null);
    setSelectedImage(sampleUrl);
    setAnalyzing(true);
    setResult(null);
    setMatchingListings([]);

    try {
      // Fetch sample and convert to base64
      const resp = await fetch(sampleUrl);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        analyzeImage(base64, blob.type || 'image/jpeg');
      };
      reader.readAsDataURL(blob);
    } catch {
      setError("Couldn't identify the item. Try another image or use text search.");
      setAnalyzing(false);
    }
  };

  const analyzeImage = async (base64: string, mimeType: string) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setMatchingListings([]);

    try {
      const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
      const res = await fetchAiVisualSearch({
        imageBase64: cleanBase64,
        mimeType: mimeType || 'image/jpeg',
      });

      setResult(res);

      // Search REAL Firestore listings matching keywords or category
      const keywords = (res.keywords || []).map((k) => k.toLowerCase());
      const objectName = (res.object || '').toLowerCase();
      const targetCat = res.category;

      const matches = listings.filter((item) => {
        if (item.status !== 'available') return false;
        const itemText = `${item.title} ${item.description} ${item.category}`.toLowerCase();

        // 1. Exact or partial keyword match in listing
        const keywordMatch = keywords.some((kw) => itemText.includes(kw));
        const objectMatch = objectName && itemText.includes(objectName);
        const catMatch = item.category === targetCat;

        return keywordMatch || (objectMatch && catMatch);
      });

      // If no exact keyword match, fallback to items in the same category
      if (matches.length === 0 && targetCat) {
        const catFallback = listings.filter(
          (item) => item.status === 'available' && item.category === targetCat
        );
        setMatchingListings(catFallback.slice(0, 6));
      } else {
        setMatchingListings(matches.slice(0, 6));
      }
    } catch (err: any) {
      console.warn('Visual search error:', err);
      setError("Couldn't identify the item. Try another image or use text search.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyToMarketplace = () => {
    if (!result) return;
    const q = result.keywords?.[0] || result.object || '';
    onApplySearchQuery(q, result.category);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-100 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900 leading-tight">
                AI Visual Search
              </h3>
              <p className="text-xs text-stone-500">
                Snap or upload a photo to find matching campus listings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload area */}
        <div className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-200 hover:border-amber-500 hover:bg-amber-50/20 transition-all rounded-2xl p-6 text-center cursor-pointer space-y-2 group"
          >
            {selectedImage ? (
              <div className="space-y-2">
                <img
                  src={selectedImage}
                  alt="Selected preview"
                  className="max-h-36 mx-auto rounded-xl object-contain shadow-xs"
                />
                <p className="text-xs font-bold text-amber-700">
                  Click to select a different photo
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 group-hover:bg-amber-100 text-stone-500 group-hover:text-amber-600 flex items-center justify-center transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    Click to upload or drag an image
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Supports JPG, PNG, WebP from your camera or files
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Quick Demo Test Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
              Or try a quick campus demo photo:
            </span>
            <div className="flex flex-wrap gap-2">
              {DEMO_SAMPLES.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => handleSelectSample(sample.url)}
                  className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer"
                >
                  📷 {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analyzing loader */}
        {analyzing && (
          <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200 text-center space-y-2">
            <Loader2 className="w-6 h-6 mx-auto text-purple-600 animate-spin" />
            <p className="text-xs font-bold text-purple-900">
              Analyzing photo with Gemini Multimodal Vision...
            </p>
            <p className="text-[11px] text-purple-700">
              Detecting item, brand, specs, and matching against active Firestore listings
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Analysis Result */}
        {result && !analyzing && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Identified Item
                </span>
                <span className="text-[11px] font-bold bg-white text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                  {result.category}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-stone-900 capitalize">
                  {result.object}
                </h4>
                {result.description && (
                  <p className="text-xs text-stone-600 mt-0.5">{result.description}</p>
                )}
              </div>

              {result.keywords && result.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {result.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white/80 text-[10px] font-bold text-stone-700 rounded-md border border-stone-200"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Real Firestore Listings Found */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-stone-500 tracking-wider">
                  Visual Search Results ({matchingListings.length})
                </h4>
                {matchingListings.length > 0 && (
                  <button
                    onClick={handleApplyToMarketplace}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all in Marketplace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {matchingListings.length === 0 ? (
                <div className="p-6 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500">
                  No active listings match this specific image right now. You can post a <strong>Wanted Request</strong> or search by text.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {matchingListings.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectListing(item.id);
                        onClose();
                      }}
                      className="p-2.5 bg-stone-50 hover:bg-stone-100 rounded-2xl border border-stone-200/80 transition-all cursor-pointer flex items-center gap-3"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-stone-200"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs font-black text-amber-700">
                          ₹{item.price.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] text-stone-500">
                          {item.condition}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

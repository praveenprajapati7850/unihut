import React from 'react';
import { MapPin, Tag, Star, ShieldCheck, CheckCircle2, Heart } from 'lucide-react';
import { Listing } from '../types';
import { useSaved } from '../context/SavedContext';

interface ListingCardProps {
  listing: Listing;
  onClick: (listingId: string) => void;
  onQuickChat?: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onClick,
}) => {
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(listing.id);

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'Brand New':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Like New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Gently Used':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const isBargainable = listing.negotiable ?? listing.isNegotiable ?? true;
  const sellerPhoto = listing.sellerPhotoURL || listing.sellerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.sellerId}`;

  const discountPercent =
    listing.originalPrice && listing.originalPrice > listing.price
      ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
      : null;

  return (
    <div
      onClick={() => onClick(listing.id)}
      className="group bg-white rounded-2xl border border-stone-200 hover:border-amber-400/80 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Condition tag */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-xs backdrop-blur-md ${getConditionColor(
              listing.condition
            )}`}
          >
            {listing.condition}
          </span>
          {isBargainable && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-stone-700 border border-stone-200/60 shadow-xs backdrop-blur-md">
              Bargainable
            </span>
          )}
        </div>

        {/* Favorite / Save Heart Button */}
        <button
          type="button"
          onClick={(e) => toggleSave(listing.id, e)}
          title={saved ? 'Remove from saved' : 'Save for later'}
          aria-label={saved ? 'Remove from saved' : 'Save for later'}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 cursor-pointer shadow-md ${
            saved
              ? 'bg-white text-rose-500 scale-105 shadow-rose-500/20'
              : 'bg-white/85 backdrop-blur-md text-stone-600 hover:text-rose-500 hover:bg-white hover:scale-110'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              saved ? 'fill-rose-500 text-rose-500 scale-110' : ''
            }`}
          />
        </button>

        {/* Status overlay if reserved or sold */}
        {listing.status === 'reserved' && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-amber-500 text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
              Deal Reserved
            </span>
          </div>
        )}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-rose-600 text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
              Sold Out
            </span>
          </div>
        )}

        {/* Category tag */}
        <span className="absolute bottom-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-900/75 text-stone-200 backdrop-blur-md">
          {listing.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Price Row */}
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-stone-900 tracking-tight">
                ₹{listing.price.toLocaleString('en-IN')}
              </span>
              {listing.originalPrice && listing.originalPrice > listing.price && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{listing.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {discountPercent && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-stone-900 text-sm line-clamp-2 group-hover:text-amber-600 transition-colors leading-snug">
            {listing.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-2">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>
        </div>

        {/* Footer info: Seller & Rating / Verification */}
        <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={sellerPhoto}
              alt={listing.sellerName}
              className="w-5 h-5 rounded-full object-cover bg-amber-100 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.sellerId}`;
              }}
            />
            <span className="text-stone-700 font-medium truncate max-w-[90px] sm:max-w-[110px]">
              {listing.sellerName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-stone-500">
            {listing.sellerRating && listing.sellerRating > 0 ? (
              <>
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="font-bold text-stone-800 text-[11px]">
                  {listing.sellerRating.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                New Seller
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

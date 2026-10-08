import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Tag,
  Star,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Edit,
  Trash2,
  CheckCircle,
  Flag,
  Share2,
  Calendar,
  AlertCircle,
  Heart,
  Bell,
} from 'lucide-react';
import { Listing, ListingStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../context/SavedContext';
import { updateListing, deleteListing, recordUserInteraction } from '../lib/marketplaceService';
import { MakeOfferModal } from '../components/MakeOfferModal';
import { ReportModal } from '../components/ReportModal';
import { ShouldIBuyModal } from '../components/ShouldIBuyModal';
import { PriceAlertModal } from '../components/PriceAlertModal';
import { HandoverModal } from '../components/HandoverModal';
import { SafeDealBanner } from '../components/SafeDealBanner';
import { VERIFIED_CAMPUS_LABEL, UNVERIFIED_CAMPUS_LABEL } from '../constants/campus';

interface ListingDetailPageProps {
  listing: Listing;
  onBack: () => void;
  onStartChat: (listing: Listing) => void;
  onEditListing: (listing: Listing) => void;
  onListingDeleted: () => void;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  listing,
  onBack,
  onStartChat,
  onEditListing,
  onListingDeleted,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const { isSaved, toggleSave } = useSaved();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isReportListingOpen, setIsReportListingOpen] = useState(false);
  const [isShouldIBuyOpen, setIsShouldIBuyOpen] = useState(false);
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [suggestedOfferPrice, setSuggestedOfferPrice] = useState<number | undefined>(undefined);
  const [priceAlertSuccess, setPriceAlertSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id;
  const isOwner = Boolean(currentUserId && currentUserId === listing.sellerId);
  const saved = isSaved(listing.id);

  // Log view interaction for AI recommendations
  useEffect(() => {
    if (currentUserId && listing?.id) {
      recordUserInteraction({
        userId: currentUserId,
        type: 'view',
        listingId: listing.id,
        category: listing.category,
        query: listing.title,
      });
    }
  }, [listing?.id, currentUserId]);

  const discountPercent =
    listing.originalPrice && listing.originalPrice > listing.price
      ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
      : null;

  const isBargainable = listing.negotiable ?? listing.isNegotiable ?? true;
  const sellerPhoto =
    listing.sellerPhotoURL ||
    listing.sellerAvatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.sellerId}`;

  const handleStatusChange = async (newStatus: ListingStatus) => {
    setStatusUpdating(true);
    try {
      await updateListing(listing.id, { status: newStatus });
      listing.status = newStatus;
    } catch (err) {
      console.error('Failed to change status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteListing(listing.id);
      onListingDeleted();
    } catch (err) {
      console.error('Failed to delete listing:', err);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => toggleSave(listing.id, e)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs border ${
              saved
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform ${
                saved ? 'fill-rose-500 text-rose-500 scale-110' : ''
              }`}
            />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Media Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
              }}
            />
            {/* Condition overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/95 text-stone-800 shadow-md backdrop-blur-md border border-stone-200">
                {listing.condition}
              </span>
              {isBargainable && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-white shadow-md">
                  Negotiable Price
                </span>
              )}
            </div>

            {/* Floating Heart Save Button on image */}
            <button
              type="button"
              onClick={(e) => toggleSave(listing.id, e)}
              title={saved ? 'Remove from saved' : 'Save for later'}
              aria-label={saved ? 'Remove from saved' : 'Save for later'}
              className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 z-10 cursor-pointer shadow-lg ${
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

            {/* Status banners */}
            {listing.status === 'reserved' && (
              <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-amber-500 text-white font-extrabold text-sm uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                  Currently Reserved for Buyer
                </span>
              </div>
            )}
            {listing.status === 'sold' && (
              <div className="absolute inset-0 bg-stone-900/75 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-rose-600 text-white font-extrabold text-sm uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                  Item Sold
                </span>
              </div>
            )}
          </div>

          {/* Location details card */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-stone-500 font-medium">Campus Pickup Location: </span>
                <span className="font-bold text-stone-900">{listing.location}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
              Campus Handover
            </span>
          </div>

          {/* Description Section */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-3">
            <h3 className="font-bold text-stone-900 text-base">Item Description</h3>
            <div className="text-stone-700 text-sm whitespace-pre-line leading-relaxed font-normal">
              {listing.description}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, CTAs, Seller Trust Card */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Pricing & Action Card */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
            
            {/* Category & Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                {listing.category}
              </span>
              <span className="text-stone-400">
                Listed {new Date(listing.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
              {listing.title}
            </h1>

            {/* Price section */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-black text-stone-900 tracking-tight">
                    ₹{listing.price.toLocaleString('en-IN')}
                  </span>
                  {listing.originalPrice && listing.originalPrice > listing.price && (
                    <span className="text-sm text-stone-400 line-through">
                      ₹{listing.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {isBargainable
                    ? 'Seller welcomes reasonable bargaining offers'
                    : 'Fixed price listing'}
                </p>
              </div>

              {discountPercent && (
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    SAVE {discountPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Owner Actions vs Buyer Actions */}
            {isOwner ? (
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    You are the seller of this listing
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-700">Owner Controls</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onEditListing(listing)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Listing</span>
                  </button>

                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Status Toggle buttons */}
                <div className="pt-2 border-t border-amber-200/60">
                  <p className="text-[11px] font-semibold text-amber-800 mb-1.5">Change Listing Status:</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['available', 'reserved', 'sold'] as ListingStatus[]).map((st) => (
                      <button
                        key={st}
                        disabled={statusUpdating}
                        onClick={() => handleStatusChange(st)}
                        className={`py-1 text-[11px] font-bold rounded-lg border capitalize transition-all cursor-pointer ${
                          listing.status === st
                            ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                            : 'bg-white text-stone-700 border-amber-200/80 hover:bg-stone-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Buyer Actions */
              <div className="space-y-3">
                <button
                  onClick={() => onStartChat(listing)}
                  disabled={listing.status === 'sold'}
                  className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed active:scale-98 text-white font-black text-sm rounded-2xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message Seller</span>
                </button>

                {/* AI Should I Buy This Decision Assistant Button */}
                <button
                  type="button"
                  onClick={() => setIsShouldIBuyOpen(true)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 hover:from-purple-100 hover:to-amber-100 active:scale-98 text-purple-900 border border-purple-200/90 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>✨ Should I Buy This? (AI Evaluation)</span>
                </button>

                {isBargainable && listing.status !== 'sold' && (
                  <button
                    onClick={() => {
                      if (!currentUser && !userProfile) {
                        openAuthModal('login');
                      } else {
                        setIsOfferModalOpen(true);
                      }
                    }}
                    className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 active:scale-98 text-stone-800 font-bold text-sm rounded-2xl border border-stone-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span>Make an Offer</span>
                  </button>
                )}

                {/* Handover & Watch Price action row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser && !userProfile) {
                        openAuthModal('login');
                      } else {
                        setIsPriceAlertOpen(true);
                      }
                    }}
                    className="py-2.5 px-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>Watch Price</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser && !userProfile) {
                        openAuthModal('login');
                      } else {
                        setIsHandoverOpen(true);
                      }
                    }}
                    className="py-2.5 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>Handover</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={(e) => toggleSave(listing.id, e)}
                  className={`w-full py-2.5 px-4 text-xs font-bold rounded-2xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    saved
                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`}
                  />
                  <span>{saved ? 'Saved in Your Wishlist' : 'Save to Wishlist'}</span>
                </button>
              </div>
            )}

            {/* UniHut Safe Deal Protection Banner */}
            <SafeDealBanner />

          </div>

          {/* Seller Trust Profile Card */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm">About the Seller</h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {VERIFIED_CAMPUS_LABEL}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={sellerPhoto}
                alt={listing.sellerName}
                className="w-12 h-12 rounded-full object-cover bg-amber-100 ring-2 ring-amber-200"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-stone-900 text-sm truncate">
                  {listing.sellerName}
                </h4>
                <p className="text-xs text-stone-500">{listing.location.split(',')[0] || 'Main Campus'}</p>
              </div>
            </div>

            {/* Trust Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 text-center">
              <div className="p-2 bg-stone-50 rounded-xl">
                {listing.sellerRating && listing.sellerRating > 0 ? (
                  <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{listing.sellerRating.toFixed(1)}</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-stone-700">New Seller</span>
                )}
                <p className="text-[10px] text-stone-400 mt-0.5">Rating</p>
              </div>

              <div className="p-2 bg-stone-50 rounded-xl">
                <p className="font-bold text-stone-900 text-xs">
                  {listing.sellerSalesCount !== undefined ? listing.sellerSalesCount : 0}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">Campus Sales</p>
              </div>

              <div className="p-2 bg-stone-50 rounded-xl">
                <p className="font-bold text-stone-900 text-xs">Student</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Verified</p>
              </div>
            </div>

            {/* Report Options */}
            {!isOwner && (
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                <button
                  onClick={() => setIsReportListingOpen(true)}
                  className="hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Flag className="w-3 h-3" />
                  <span>Report Listing</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Make Offer Modal */}
      <MakeOfferModal
        listing={listing}
        isOpen={isOfferModalOpen}
        initialAmount={suggestedOfferPrice}
        onClose={() => {
          setIsOfferModalOpen(false);
          setSuggestedOfferPrice(undefined);
        }}
        onOfferSent={() => {
          onStartChat(listing);
        }}
      />

      {/* AI Should I Buy This Modal */}
      <ShouldIBuyModal
        listing={listing}
        isOpen={isShouldIBuyOpen}
        onClose={() => setIsShouldIBuyOpen(false)}
        onMakeOffer={(suggested) => {
          setIsShouldIBuyOpen(false);
          if (suggested) {
            setSuggestedOfferPrice(suggested);
          }
          setIsOfferModalOpen(true);
        }}
      />

      {/* Price Drop Alert Modal */}
      <PriceAlertModal
        listing={listing}
        isOpen={isPriceAlertOpen}
        onClose={() => setIsPriceAlertOpen(false)}
        onAlertSet={() => {
          setPriceAlertSuccess(true);
          setTimeout(() => setPriceAlertSuccess(false), 3000);
        }}
      />

      {/* Campus Handover Scheduler Modal */}
      <HandoverModal
        listing={listing}
        isOpen={isHandoverOpen}
        onClose={() => setIsHandoverOpen(false)}
      />

      {/* Report Listing Modal */}
      <ReportModal
        isOpen={isReportListingOpen}
        onClose={() => setIsReportListingOpen(false)}
        targetType="listing"
        targetId={listing.id}
        targetTitleOrName={listing.title}
      />

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Layers,
  PlusCircle,
  Edit,
  Trash2,
  ExternalLink,
  Tag,
  CheckCircle,
  Clock,
  Archive,
  IndianRupee,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { Listing, ListingStatus, Offer } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  updateListing,
  deleteListing,
  subscribeToOffersForSeller,
  subscribeToOffersForBuyer,
  updateOfferStatus,
  counterOffer,
} from '../lib/marketplaceService';

interface MyListingsPageProps {
  listings: Listing[];
  onOpenListing: (listingId: string) => void;
  onEditListing: (listing: Listing) => void;
  onCreateNew: () => void;
  onListingDeleted?: (listingId: string) => void;
}

export const MyListingsPage: React.FC<MyListingsPageProps> = ({
  listings,
  onOpenListing,
  onEditListing,
  onCreateNew,
  onListingDeleted,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const [mainView, setMainView] = useState<'listings' | 'received-offers' | 'my-offers'>('listings');
  const [activeListingTab, setActiveListingTab] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Offers state
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [myMadeOffers, setMyMadeOffers] = useState<Offer[]>([]);
  
  // Counter offer modal state
  const [counterModalOffer, setCounterModalOffer] = useState<Offer | null>(null);
  const [counterPriceInput, setCounterPriceInput] = useState<number | ''>('');
  const [counterNoteInput, setCounterNoteInput] = useState<string>('');
  const [submittingCounter, setSubmittingCounter] = useState(false);

  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id;
  const currentUserName = userProfile?.displayName || userProfile?.name || currentUser?.displayName || 'Campus Student';

  // Real-time Firestore subscriptions for offers
  useEffect(() => {
    if (!currentUserId) return;

    const unsubSeller = subscribeToOffersForSeller(currentUserId, (offers) => {
      setReceivedOffers(offers);
    });

    const unsubBuyer = subscribeToOffersForBuyer(currentUserId, (offers) => {
      setMyMadeOffers(offers);
    });

    return () => {
      unsubSeller();
      unsubBuyer();
    };
  }, [currentUserId]);

  if (!currentUserId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900">Sign in to View Seller Dashboard</h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Sign in or switch to a campus student account to manage your listings, bargaining offers, and sales.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  // Filter listings belonging to the logged-in user
  const myListings = listings.filter((l) => l.sellerId === currentUserId);

  const filteredListings = myListings.filter((l) => {
    if (activeListingTab === 'all') return true;
    return l.status === activeListingTab;
  });

  // Calculate required dynamic metrics:
  // TOTAL LISTED ITEMS
  // ACTIVE INVENTORY VALUE (sum of active/available listing prices)
  // COMPLETED CAMPUS SALES (sold items count)
  const totalListedItems = myListings.length;
  const activeInventoryValue = myListings
    .filter((l) => l.status === 'available')
    .reduce((sum, item) => sum + item.price, 0);
  const completedCampusSales = myListings.filter((l) => l.status === 'sold').length;

  const pendingReceivedCount = receivedOffers.filter((o) => o.status === 'pending').length;
  const pendingMadeCount = myMadeOffers.filter((o) => o.status === 'pending' || o.status === 'countered').length;

  const handleStatusChange = async (listingId: string, newStatus: ListingStatus) => {
    setUpdatingId(listingId);
    try {
      await updateListing(listingId, { status: newStatus });
      setFeedback(`Listing status updated to ${newStatus}`);
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      console.error('Failed to change status in Firestore:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (listing: Listing) => {
    try {
      await deleteListing(listing.id);
      if (onListingDeleted) {
        onListingDeleted(listing.id);
      }
      setFeedback('Listing deleted successfully');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      console.error('Failed to delete listing in Firestore:', err);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    try {
      await updateOfferStatus(offer.id, 'accepted', offer.listingId);
      setFeedback(`Offer of ₹${(offer.offerAmount || offer.amount).toLocaleString('en-IN')} accepted! Listing reserved.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to accept offer:', err);
    }
  };

  const handleRejectOffer = async (offer: Offer) => {
    try {
      await updateOfferStatus(offer.id, 'rejected');
      setFeedback(`Offer of ₹${(offer.offerAmount || offer.amount).toLocaleString('en-IN')} declined.`);
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      console.error('Failed to reject offer:', err);
    }
  };

  const handleOpenCounter = (offer: Offer) => {
    setCounterModalOffer(offer);
    const listedPrice = offer.originalListingPrice || offer.listingPrice || 100;
    const offered = offer.offerAmount || offer.amount || 50;
    // suggest middle ground
    setCounterPriceInput(Math.round((listedPrice + offered) / 2));
    setCounterNoteInput(`Would ₹${Math.round((listedPrice + offered) / 2).toLocaleString('en-IN')} work for you?`);
  };

  const handleSendCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterModalOffer || !counterPriceInput || Number(counterPriceInput) <= 0) return;

    setSubmittingCounter(true);
    try {
      await counterOffer(
        counterModalOffer.id,
        Number(counterPriceInput),
        counterNoteInput.trim(),
        counterModalOffer.listingId,
        counterModalOffer.sellerId,
        counterModalOffer.buyerId,
        currentUserName
      );
      setFeedback(`Counter offer of ₹${Number(counterPriceInput).toLocaleString('en-IN')} sent to buyer!`);
      setTimeout(() => setFeedback(null), 3000);
      setCounterModalOffer(null);
    } catch (err) {
      console.error('Failed to send counter offer:', err);
    } finally {
      setSubmittingCounter(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Seller Dashboard
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your campus listings, toggle availability, respond to bargains, and track sales
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Item</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Analytics Summary Cards (Real Firestore metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Total Listed Items
          </span>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {totalListedItems}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {myListings.filter((l) => l.status === 'available').length} currently active on campus
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Active Inventory Value
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            ₹{activeInventoryValue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Potential student resale earnings
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Completed Campus Sales
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {completedCampusSales} items
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Successfully handed over to students
          </span>
        </div>
      </div>

      {/* Main Section Navigation: My Listings vs Offers Received vs Offers Made */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setMainView('listings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mainView === 'listings'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Listings ({myListings.length})</span>
        </button>

        <button
          onClick={() => setMainView('received-offers')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mainView === 'received-offers'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Offers Received ({receivedOffers.length})</span>
          {pendingReceivedCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-500 text-white">
              {pendingReceivedCount} new
            </span>
          )}
        </button>

        <button
          onClick={() => setMainView('my-offers')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mainView === 'my-offers'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Offers ({myMadeOffers.length})</span>
          {pendingMadeCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-200 text-amber-900">
              {pendingMadeCount} active
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: MY LISTINGS */}
      {mainView === 'listings' && (
        <div className="space-y-4">
          {/* Subtabs for status */}
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: `All (${myListings.length})` },
              {
                key: 'available',
                label: `Available (${myListings.filter((l) => l.status === 'available').length})`,
              },
              {
                key: 'reserved',
                label: `Reserved (${myListings.filter((l) => l.status === 'reserved').length})`,
              },
              {
                key: 'sold',
                label: `Sold (${myListings.filter((l) => l.status === 'sold').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveListingTab(tab.key as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeListingTab === tab.key
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredListings.length > 0 ? (
            <div className="space-y-3">
              {filteredListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-xs transition-shadow"
                >
                  {/* Left Item Details */}
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-100"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-black text-stone-900">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            item.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'reserved'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.negotiable && (
                          <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            Bargainable
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-stone-900 text-xs sm:text-sm truncate">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {item.category} • {item.condition} • {item.location}
                      </p>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {/* Quick status action buttons */}
                    {item.status !== 'reserved' && (
                      <button
                        disabled={updatingId === item.id}
                        onClick={() => handleStatusChange(item.id, 'reserved')}
                        className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl cursor-pointer"
                      >
                        Mark Reserved
                      </button>
                    )}

                    {item.status !== 'sold' && (
                      <button
                        disabled={updatingId === item.id}
                        onClick={() => handleStatusChange(item.id, 'sold')}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer"
                      >
                        Mark Sold
                      </button>
                    )}

                    {item.status !== 'available' && (
                      <button
                        disabled={updatingId === item.id}
                        onClick={() => handleStatusChange(item.id, 'available')}
                        className="px-2.5 py-1 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer"
                      >
                        Mark Available
                      </button>
                    )}

                    <button
                      onClick={() => onOpenListing(item.id)}
                      className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                      title="View Public Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onEditListing(item)}
                      className="p-2 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Listing"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-300 p-8 max-w-lg mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-stone-900">No items found in this tab</h3>
              <p className="text-xs text-stone-500">
                Ready to declutter or sell something on campus? Post your first item in seconds.
              </p>
              <button
                onClick={onCreateNew}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post an Item</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: OFFERS RECEIVED (SELLER WORKFLOW) */}
      {mainView === 'received-offers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-500">
              Incoming price offers from campus buyers. Accept to lock the deal, reject, or propose a counter price.
            </p>
          </div>

          {receivedOffers.length > 0 ? (
            <div className="space-y-3">
              {receivedOffers.map((offer) => {
                const amount = offer.offerAmount || offer.amount;
                const origPrice = offer.originalListingPrice || offer.listingPrice || amount;
                const discount = origPrice > amount ? Math.round(((origPrice - amount) / origPrice) * 100) : 0;

                return (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Item + Buyer summary */}
                      <div className="flex items-center gap-3 min-w-0">
                        {offer.listingImage && (
                          <img
                            src={offer.listingImage}
                            alt={offer.listingTitle || 'Item'}
                            className="w-14 h-14 rounded-xl object-cover bg-stone-100 border border-stone-100 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-stone-900 text-sm">
                              {offer.buyerName || 'Campus Student'}
                            </span>
                            {offer.buyerEmail && (
                              <span className="text-[11px] text-stone-400">({offer.buyerEmail})</span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-amber-800 truncate">
                            For: {offer.listingTitle || 'Marketplace Item'}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Offered on {new Date(offer.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Offer Price & Status Badge */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-stone-900">
                            ₹{amount.toLocaleString('en-IN')}
                          </span>
                          {origPrice > amount && (
                            <span className="text-xs text-stone-400 line-through">
                              ₹{origPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              {discount}% OFF
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            offer.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : offer.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : offer.status === 'countered'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {offer.status === 'countered' ? 'Countered by You' : offer.status}
                        </span>
                      </div>
                    </div>

                    {/* Buyer Message */}
                    {offer.message && (
                      <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-700 border border-stone-100">
                        <span className="font-bold text-stone-500 mr-1.5">Buyer Note:</span>
                        "{offer.message}"
                      </div>
                    )}

                    {/* Counter details if already countered */}
                    {offer.status === 'countered' && offer.counterAmount && (
                      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                        <div>
                          <span className="font-bold">Your Counter Offer: </span>
                          <span>₹{offer.counterAmount.toLocaleString('en-IN')}</span>
                          {offer.counterMessage && (
                            <p className="text-[11px] text-blue-700 mt-0.5">"{offer.counterMessage}"</p>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                          Awaiting Buyer Response
                        </span>
                      </div>
                    )}

                    {/* Seller Action Buttons */}
                    {offer.status === 'pending' && (
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-stone-100">
                        <button
                          onClick={() => handleAcceptOffer(offer)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Accept Offer (₹{amount.toLocaleString('en-IN')})
                        </button>

                        <button
                          onClick={() => handleOpenCounter(offer)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Counter Offer
                        </button>

                        <button
                          onClick={() => handleRejectOffer(offer)}
                          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Decline
                        </button>

                        {offer.listingId && (
                          <button
                            onClick={() => onOpenListing(offer.listingId)}
                            className="px-3 py-2 text-stone-400 hover:text-stone-800 text-xs font-semibold"
                          >
                            View Item
                          </button>
                        )}
                      </div>
                    )}

                    {offer.status === 'accepted' && (
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-emerald-800 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Accepted! Item has been marked as Reserved.
                        </span>
                        {offer.listingId && (
                          <button
                            onClick={() => onOpenListing(offer.listingId)}
                            className="text-amber-700 hover:underline font-bold"
                          >
                            Open Listing
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-300 p-8 max-w-lg mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Tag className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-stone-900">No offers received yet</h3>
              <p className="text-xs text-stone-500">
                When campus students make offers on your negotiable listings, they will appear right here with one-click Accept, Counter, or Decline options.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: MY OFFERS (BUYER WORKFLOW) */}
      {mainView === 'my-offers' && (
        <div className="space-y-3">
          <p className="text-xs text-stone-500">
            Track bargaining offers you've submitted on other students' listings.
          </p>

          {myMadeOffers.length > 0 ? (
            <div className="space-y-3">
              {myMadeOffers.map((offer) => {
                const amount = offer.offerAmount || offer.amount;
                const origPrice = offer.originalListingPrice || offer.listingPrice || amount;

                return (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {offer.listingImage && (
                          <img
                            src={offer.listingImage}
                            alt={offer.listingTitle || 'Listing'}
                            className="w-14 h-14 rounded-xl object-cover bg-stone-100 border border-stone-100 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-stone-900 text-sm truncate">
                            {offer.listingTitle || 'Campus Listing'}
                          </h4>
                          <p className="text-xs text-stone-500">
                            Seller: {offer.sellerName || 'Student'} • Original: ₹{origPrice.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Submitted on {new Date(offer.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                        <div className="text-right">
                          <span className="text-xs text-stone-400 block sm:inline mr-1">Your offer:</span>
                          <span className="text-xl font-black text-amber-600">
                            ₹{amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            offer.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : offer.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : offer.status === 'countered'
                              ? 'bg-blue-100 text-blue-800 font-black animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {offer.status === 'countered' ? 'Seller Countered' : offer.status}
                        </span>
                      </div>
                    </div>

                    {/* Counter Alert Banner for Buyer */}
                    {offer.status === 'countered' && offer.counterAmount && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            Seller countered with a new price: ₹{offer.counterAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                            Decision Needed
                          </span>
                        </div>
                        {offer.counterMessage && (
                          <p className="text-xs text-blue-800 font-medium">"{offer.counterMessage}"</p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={async () => {
                              try {
                                await updateOfferStatus(offer.id, 'accepted', offer.listingId);
                                setFeedback(`Counter offer of ₹${offer.counterAmount?.toLocaleString('en-IN')} accepted!`);
                                setTimeout(() => setFeedback(null), 3000);
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                          >
                            Accept Counter (₹{offer.counterAmount.toLocaleString('en-IN')})
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await updateOfferStatus(offer.id, 'rejected');
                                setFeedback('Counter offer declined.');
                                setTimeout(() => setFeedback(null), 2500);
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs rounded-xl border border-stone-200 cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                      <span className="text-stone-500 italic truncate">
                        "{offer.message}"
                      </span>
                      {offer.listingId && (
                        <button
                          onClick={() => onOpenListing(offer.listingId)}
                          className="text-amber-700 hover:underline font-bold shrink-0 ml-2"
                        >
                          View Listing
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-300 p-8 max-w-lg mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-stone-900">You haven't made any offers yet</h3>
              <p className="text-xs text-stone-500">
                Browse campus listings and click "Make an Offer" to negotiate better prices with fellow students.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterModalOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setCounterModalOffer(null)} />
          <form
            onSubmit={handleSendCounter}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 z-10 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Propose Counter Offer</h3>
                  <p className="text-[11px] text-stone-500">
                    Buyer offered ₹{(counterModalOffer.offerAmount || counterModalOffer.amount).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCounterModalOffer(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Your Counter Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-stone-400 text-sm">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={counterPriceInput}
                    onChange={(e) => setCounterPriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl font-bold text-sm text-stone-900 outline-none"
                    placeholder="Enter counter price"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Friendly Message to Buyer
                </label>
                <textarea
                  rows={3}
                  value={counterNoteInput}
                  onChange={(e) => setCounterNoteInput(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl text-xs text-stone-800 outline-none"
                  placeholder="e.g. Can meet in the library today if this works!"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCounterModalOffer(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingCounter}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Counter Offer</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

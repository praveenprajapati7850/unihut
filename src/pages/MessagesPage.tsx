import React, { useEffect, useState } from 'react';
import { MessageSquare, ArrowRight, ShoppingBag } from 'lucide-react';
import { Conversation, Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserConversations } from '../lib/marketplaceService';

interface MessagesPageProps {
  listings: Listing[];
  onOpenChat: (listing: Listing, otherUserId: string, otherUserName: string) => void;
  onExploreMarketplace: () => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  listings,
  onOpenChat,
  onExploreMarketplace,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id;

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserConversations(currentUserId, (convos) => {
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  if (!currentUserId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900">Sign in to View Messages</h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Sign in or switch to a campus student account to chat with buyers and sellers.
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

  // Derive conversation items with their matching listing
  const conversationItems = conversations
    .map((conv) => {
      const listing = listings.find((l) => l.id === conv.listingId);
      const otherParticipantId = conv.participants?.find((p: string) => p !== currentUserId) || conv.sellerId || conv.buyerId;
      return {
        ...conv,
        listing,
        otherParticipantId,
      };
    })
    .filter((c) => Boolean(c.listing));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          Campus Messages & Inquiries
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Real-time conversations and bargaining offers with fellow students
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-stone-400 text-sm">
          Loading conversation threads...
        </div>
      ) : conversationItems.length > 0 ? (
        <div className="space-y-3">
          {conversationItems.map((conv) => {
            const isSeller = conv.listing.sellerId === currentUserId;
            const otherName = isSeller
              ? 'Student Buyer'
              : conv.listing.sellerName || 'Student Seller';

            return (
              <div
                key={conv.id || conv.listingId}
                onClick={() =>
                  onOpenChat(conv.listing, conv.otherParticipantId, otherName)
                }
                className="group bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all p-4 flex items-center gap-4 cursor-pointer"
              >
                {/* Item Thumbnail */}
                <img
                  src={conv.listing.imageUrl}
                  alt={conv.listing.title}
                  className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-100"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Conversation Body */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-stone-900 text-sm truncate">
                      {otherName}{' '}
                      <span className="text-[11px] font-normal text-stone-400">
                        ({isSeller ? 'Buyer' : 'Seller'})
                      </span>
                    </span>
                    <span className="text-[11px] text-stone-400 whitespace-nowrap">
                      {conv.lastMessageTimestamp
                        ? new Date(conv.lastMessageTimestamp).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-amber-700 truncate mb-1">
                    Item: {conv.listing.title} • ₹{conv.listing.price.toLocaleString('en-IN')}
                  </p>

                  <p className="text-xs text-stone-500 line-clamp-1">
                    {conv.lastMessage || 'Click to open chat conversation'}
                  </p>
                </div>

                {/* Open arrow */}
                <div className="text-stone-300 group-hover:text-amber-600 transition-colors shrink-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-300 p-8 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">No active messages yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Click "Message Seller" or "Make an Offer" on any campus listing to start a real-time negotiation.
          </p>
          <button
            onClick={onExploreMarketplace}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Marketplace Items</span>
          </button>
        </div>
      )}

    </div>
  );
};

import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Tag,
  Check,
  X,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Listing, Message, Offer } from '../types';
import { useAuth } from '../context/AuthContext';
import { HandoverModal } from '../components/HandoverModal';
import {
  subscribeToMessagesForListing,
  sendDirectMessage,
  createOffer,
  updateOfferStatus,
  subscribeToOffersForListing,
  counterOffer,
} from '../lib/marketplaceService';

interface ChatPageProps {
  listing: Listing;
  otherUserId: string;
  otherUserName: string;
  onBack: () => void;
  onViewListing: (listingId: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  listing,
  otherUserId,
  otherUserName,
  onBack,
  onViewListing,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [inputText, setInputText] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState<number | ''>(Math.round(listing.price * 0.8));
  const [offerNote, setOfferNote] = useState('');
  const [sending, setSending] = useState(false);
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [counterPrice, setCounterPrice] = useState<number | ''>('');
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id || '';
  const currentUserName = userProfile?.displayName || userProfile?.name || currentUser?.displayName || 'Campus Student';

  const isSeller = currentUserId === listing.sellerId;
  const buyerId = isSeller ? otherUserId : currentUserId;
  const sellerId = listing.sellerId;

  // Real-time listener for messages in Firestore
  useEffect(() => {
    const unsubscribe = subscribeToMessagesForListing(
      listing.id,
      buyerId,
      sellerId,
      (msgs) => {
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    );

    return () => unsubscribe();
  }, [listing.id, buyerId, sellerId]);

  // Real-time listener for offers in Firestore
  useEffect(() => {
    const unsubscribe = subscribeToOffersForListing(listing.id, (loadedOffers) => {
      setOffers(loadedOffers);
    });
    return () => unsubscribe();
  }, [listing.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      await sendDirectMessage(
        listing.id,
        currentUserId,
        otherUserId,
        currentUserName,
        inputText.trim()
      );
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerAmount || Number(offerAmount) <= 0 || isSeller) return;

    setSending(true);
    try {
      const numericAmount = Number(offerAmount);
      await createOffer(
        listing,
        currentUserId,
        sellerId,
        numericAmount,
        offerNote.trim() || `Can you do ₹${numericAmount.toLocaleString('en-IN')}?`
      );
      setShowOfferForm(false);
      setOfferNote('');
    } catch (err) {
      console.error('Failed to create offer:', err);
    } finally {
      setSending(false);
    }
  };

  const handleOfferDecision = async (offerId: string, decision: 'accepted' | 'rejected') => {
    try {
      await updateOfferStatus(offerId, decision, listing.id);
      // Send confirmation message
      const targetOffer = offers.find((o) => o.id === offerId);
      const amtStr = targetOffer ? `₹${(targetOffer.counterAmount || targetOffer.amount).toLocaleString('en-IN')}` : '';
      await sendDirectMessage(
        listing.id,
        currentUserId,
        otherUserId,
        currentUserName,
        decision === 'accepted'
          ? `Deal agreed for ${amtStr}! Let's coordinate campus handover location.`
          : `Offer of ${amtStr} was declined.`
      );
    } catch (err) {
      console.error('Failed to update offer decision:', err);
    }
  };

  const handleSendCounterOffer = async (e: React.FormEvent, offerId: string) => {
    e.preventDefault();
    if (!counterPrice || Number(counterPrice) <= 0) return;

    try {
      await counterOffer(
        offerId,
        Number(counterPrice),
        `Seller proposed a counter offer of ₹${Number(counterPrice).toLocaleString('en-IN')}`,
        listing.id,
        currentUserId,
        otherUserId,
        currentUserName
      );
      setShowCounterInput(false);
      setCounterPrice('');
    } catch (err) {
      console.error('Failed to send counter offer:', err);
    }
  };

  // Find latest active offer
  const latestOffer = offers[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-80px)] flex flex-col">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center justify-between gap-3 shrink-0 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-11 h-11 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
            }}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-stone-900 text-sm truncate">
                {otherUserName}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {isSeller ? 'Buyer' : 'Seller'}
              </span>
            </div>
            <p className="text-xs text-stone-500 truncate flex items-center gap-1.5">
              <span className="font-bold text-stone-800">₹{listing.price.toLocaleString('en-IN')}</span>
              <span>•</span>
              <span className="truncate">{listing.title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isSeller && (listing.negotiable ?? listing.isNegotiable ?? true) && (
            <button
              onClick={() => setShowOfferForm(!showOfferForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Make an Offer</span>
            </button>
          )}

          <button
            onClick={() => setIsHandoverModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 transition-colors cursor-pointer"
            title="Schedule campus handover"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Handover</span>
          </button>

          <button
            onClick={() => onViewListing(listing.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-200 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Listing</span>
          </button>
        </div>
      </div>

      {/* Offer Banner if active */}
      {latestOffer && (
        <div className="space-y-2 mb-3 shrink-0">
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              latestOffer.status === 'accepted'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : latestOffer.status === 'rejected'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : latestOffer.status === 'countered'
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-600" />
              <div>
                <span className="font-bold">
                  {latestOffer.status === 'accepted'
                    ? 'Offer accepted'
                    : latestOffer.status === 'countered'
                    ? `Counter Offer: ₹${(latestOffer.counterAmount || latestOffer.amount).toLocaleString('en-IN')}`
                    : `Offer: ₹${latestOffer.amount.toLocaleString('en-IN')}`}
                </span>
                <span className="text-stone-600 ml-1.5">
                  ({latestOffer.status === 'countered' && latestOffer.counterMessage ? latestOffer.counterMessage : latestOffer.message})
                </span>
              </div>
            </div>

            {/* Seller controls when pending */}
            {isSeller && latestOffer.status === 'pending' && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOfferDecision(latestOffer.id, 'accepted')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    setShowCounterInput(!showCounterInput);
                    setCounterPrice(Math.round((listing.price + latestOffer.amount) / 2));
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  Counter
                </button>
                <button
                  onClick={() => handleOfferDecision(latestOffer.id, 'rejected')}
                  className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-lg cursor-pointer"
                >
                  Reject
                </button>
              </div>
            )}

            {/* Buyer controls when seller countered */}
            {!isSeller && latestOffer.status === 'countered' && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOfferDecision(latestOffer.id, 'accepted')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Accept Counter
                </button>
                <button
                  onClick={() => handleOfferDecision(latestOffer.id, 'rejected')}
                  className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-lg cursor-pointer"
                >
                  Decline
                </button>
              </div>
            )}

            {latestOffer.status === 'accepted' && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                  Deal Agreed
                </span>
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(true)}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Arrange Handover</span>
                </button>
              </div>
            )}
          </div>

          {/* Inline Counter Offer Input Form for Seller */}
          {showCounterInput && isSeller && latestOffer.status === 'pending' && (
            <form
              onSubmit={(e) => handleSendCounterOffer(e, latestOffer.id)}
              className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2 animate-in fade-in"
            >
              <span className="text-xs font-bold text-stone-700 shrink-0">Your Counter (₹):</span>
              <input
                type="number"
                required
                min={1}
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-28 px-2.5 py-1 text-xs font-bold bg-white border border-amber-300 rounded-lg outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Send Counter
              </button>
              <button
                type="button"
                onClick={() => setShowCounterInput(false)}
                className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}

      {/* Make Offer Input Box */}
      {showOfferForm && !isSeller && (
        <form
          onSubmit={handleSendOffer}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3 space-y-3 shrink-0 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Propose Bargain Price (Listed: ₹{listing.price.toLocaleString('en-IN')})
            </span>
            <button
              type="button"
              onClick={() => setShowOfferForm(false)}
              className="text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-stone-500 text-xs">₹</span>
              <input
                type="number"
                required
                min={1}
                placeholder="Offer amount"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 text-xs font-bold text-stone-900 bg-white border border-amber-300 rounded-xl outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="e.g. Can you do ₹350?"
              value={offerNote}
              onChange={(e) => setOfferNote(e.target.value)}
              className="w-full px-3 py-2 text-xs text-stone-900 bg-white border border-amber-300 rounded-xl outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Send Offer to Seller
            </button>
          </div>
        </form>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 space-y-3.5">
        
        {/* Timestamp of conversation start */}
        <div className="text-center py-1">
          <span className="text-[11px] font-medium text-stone-400 bg-white px-3 py-1 rounded-full border border-stone-200">
            Real-time chat for "{listing.title}"
          </span>
        </div>

        {messages.map((msg) => {
          const isMyMessage = msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-stone-400 px-1 mb-0.5">
                {isMyMessage ? 'You' : msg.senderName}
              </span>

              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                  isMyMessage
                    ? 'bg-amber-600 text-white rounded-tr-xs'
                    : 'bg-white text-stone-900 border border-stone-200 rounded-tl-xs'
                }`}
              >
                {/* Offer amount card if this message is an offer */}
                {msg.offerAmount !== undefined && (
                  <div
                    className={`p-2.5 rounded-xl mb-1.5 border font-bold ${
                      isMyMessage
                        ? 'bg-amber-700/60 border-amber-500 text-white'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase">
                      <span>Price Offer</span>
                      {msg.offerStatus && <span>{msg.offerStatus}</span>}
                    </div>
                    <div className="text-sm font-black mt-0.5">
                      ₹{msg.offerAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}

                <p className="whitespace-pre-wrap">{msg.message || msg.text}</p>

                <div
                  className={`text-[9px] mt-1 text-right ${
                    isMyMessage ? 'text-amber-200' : 'text-stone-400'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Safety guideline bar */}
      <div className="py-2 flex items-center justify-between text-[11px] text-stone-500 px-1 shrink-0">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Campus handover only. No online payments. Inspect items first.</span>
        </span>
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-3 bg-white border border-stone-200 focus:border-amber-500 rounded-2xl outline-none text-xs text-stone-900 shadow-xs"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="px-5 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white font-bold text-xs rounded-2xl shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Campus Handover Scheduler Modal */}
      <HandoverModal
        listing={listing}
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        offerId={latestOffer?.id}
      />

    </div>
  );
};

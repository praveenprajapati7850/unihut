import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  X,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Send,
} from 'lucide-react';
import { Listing, Handover, HandoverStatus } from '../types';
import { proposeHandover, updateHandoverStatus, completeHandover } from '../lib/marketplaceService';
import { useAuth } from '../context/AuthContext';
import { SafeDealBanner } from './SafeDealBanner';

interface HandoverModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  existingHandover?: Handover | null;
  onHandoverUpdated?: () => void;
  offerId?: string;
}

const CAMPUS_LOCATIONS = [
  'Central Library — Main Entrance',
  'Student Center / Cafeteria',
  'University Main Gate',
  'Hostel Block Quadrangle',
  'Sports Complex / Grounds',
  'Engineering Department Foyer',
];

export const HandoverModal: React.FC<HandoverModalProps> = ({
  listing,
  isOpen,
  onClose,
  existingHandover,
  onHandoverUpdated,
  offerId,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id || '';
  const currentUserName = userProfile?.displayName || userProfile?.name || currentUser?.displayName || 'Campus Student';

  const isSeller = currentUserId === listing.sellerId;
  const otherPartyId = isSeller ? (existingHandover?.buyerId || '') : listing.sellerId;
  const otherPartyName = isSeller ? (existingHandover?.buyerName || 'Buyer') : listing.sellerName;

  // Form states for proposing a new handover
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(existingHandover?.date || today);
  const [time, setTime] = useState(existingHandover?.time || '16:00');
  const [location, setLocation] = useState(
    existingHandover?.location || CAMPUS_LOCATIONS[0]
  );
  const [customLocation, setCustomLocation] = useState('');
  const [notes, setNotes] = useState(existingHandover?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      openAuthModal('login');
      return;
    }

    const finalLocation = customLocation.trim() || location;
    if (!finalLocation) {
      setError('Please select or specify a campus handover location.');
      return;
    }
    if (!date || !time) {
      setError('Please select both a date and time.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await proposeHandover({
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.imageUrl,
        offerId,
        buyerId: isSeller ? (existingHandover?.buyerId || 'buyer_student') : currentUserId,
        buyerName: isSeller ? (existingHandover?.buyerName || 'Buyer') : currentUserName,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        date,
        time,
        location: finalLocation,
        notes: notes.trim(),
      });

      setSuccessMsg('Campus handover proposed! The other party has been notified.');
      if (onHandoverUpdated) onHandoverUpdated();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Could not schedule handover.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status: HandoverStatus) => {
    if (!existingHandover) return;
    setSubmitting(true);
    setError(null);

    try {
      if (status === 'completed') {
        await completeHandover(
          existingHandover.id,
          listing.id,
          existingHandover.offerId,
          existingHandover.buyerId,
          existingHandover.sellerId,
          listing.title
        );
        setSuccessMsg('Deal marked as completed! Thanks for trading safely on UniHut.');
      } else {
        await updateHandoverStatus(
          existingHandover.id,
          status,
          isSeller ? existingHandover.buyerId : existingHandover.sellerId,
          listing.title
        );
        setSuccessMsg(`Handover marked as ${status}!`);
      }

      if (onHandoverUpdated) onHandoverUpdated();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to update handover status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-100 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900 leading-tight">
                Campus Handover Scheduler
              </h3>
              <p className="text-xs text-stone-500">
                Safe, zero-shipping student peer exchange
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

        {/* Safe deal guarantee banner */}
        <SafeDealBanner compact />

        {/* Existing handover status banner */}
        {existingHandover && (
          <div className="p-4 rounded-2xl border bg-stone-50 border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">Current Schedule Status</span>
              <span
                className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                  existingHandover.status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : existingHandover.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : existingHandover.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {existingHandover.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-stone-700">
                <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{existingHandover.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-700">
                <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{existingHandover.time}</span>
              </div>
              <div className="col-span-2 flex items-start gap-1.5 text-stone-700">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span className="font-semibold">{existingHandover.location}</span>
              </div>
            </div>

            {/* Quick status transitions */}
            {existingHandover.status !== 'completed' && existingHandover.status !== 'cancelled' && (
              <div className="pt-2 border-t border-stone-200 flex flex-wrap gap-2">
                {existingHandover.status === 'proposed' && (
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    disabled={submitting}
                    className="flex-1 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Confirm Handover
                  </button>
                )}

                <button
                  onClick={() => handleStatusChange('completed')}
                  disabled={submitting}
                  className="flex-1 py-2 px-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Completed</span>
                </button>

                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={submitting}
                  className="py-2 px-3 text-xs font-bold text-stone-600 hover:text-rose-600 bg-white border border-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Schedule Proposal Form */}
        {(!existingHandover || existingHandover.status === 'cancelled') && (
          <form onSubmit={handlePropose} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Handover Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Handover Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Campus Meetup Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl focus:border-teal-500 outline-none mb-2"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
                <option value="custom">Custom campus spot...</option>
              </select>

              {location === 'custom' && (
                <input
                  type="text"
                  placeholder="Specify campus location (e.g., C-Block Cafe stairs)"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:border-teal-500 outline-none"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Notes for {otherPartyName} (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., I'll be in a blue hoodie carrying a grey backpack."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-teal-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-98 rounded-xl transition-all shadow-sm shadow-teal-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Proposing...' : 'Propose Handover'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

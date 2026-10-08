import React from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Tag,
  ArrowRight,
  TrendingDown,
  Calendar,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../types';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../lib/marketplaceService';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  notifications: NotificationItem[];
  onSelectListing?: (listingId: string) => void;
  onNavigateToWanted?: () => void;
  onOpenHandoverFromNotif?: (handoverId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  userId,
  notifications,
  onSelectListing,
  onNavigateToWanted,
  onOpenHandoverFromNotif,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    if (userId) {
      await markAllNotificationsAsRead(userId);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }

    if (notif.listingId && onSelectListing) {
      onSelectListing(notif.listingId);
      onClose();
    } else if (notif.wantedPostId && onNavigateToWanted) {
      onNavigateToWanted();
      onClose();
    } else if (notif.handoverId && onOpenHandoverFromNotif) {
      onOpenHandoverFromNotif(notif.handoverId);
      onClose();
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'price_drop':
        return <TrendingDown className="w-4 h-4 text-rose-600" />;
      case 'new_offer':
      case 'counter_offer':
        return <Tag className="w-4 h-4 text-amber-600" />;
      case 'offer_accepted':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'offer_rejected':
        return <Tag className="w-4 h-4 text-stone-500" />;
      case 'handover_scheduled':
      case 'handover_reminder':
        return <Calendar className="w-4 h-4 text-teal-600" />;
      case 'wanted_post_match':
        return <ShoppingBag className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-800">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Offers, price drop alerts & campus handover updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 flex items-center gap-1 transition"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2">
          {notifications.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-3xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-800 mb-1">No notifications yet</h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                When fellow students send offers, drop prices on your watched items, or match your
                wanted requests, you'll see them right here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-4 rounded-2xl cursor-pointer transition-colors flex items-start gap-3.5 ${
                  notif.read ? 'hover:bg-stone-50/80 opacity-80' : 'bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100/60'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h5
                      className={`text-xs truncate ${
                        notif.read ? 'font-semibold text-stone-700' : 'font-bold text-stone-900'
                      }`}
                    >
                      {notif.title}
                    </h5>
                    <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed mb-2 line-clamp-2">
                    {notif.message}
                  </p>

                  {(notif.listingId || notif.wantedPostId || notif.handoverId) && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>Real-time campus updates</span>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-stone-700 hover:text-stone-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

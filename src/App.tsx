import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SavedProvider, useSaved } from './context/SavedContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './pages/HomePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { EditListingPage } from './pages/EditListingPage';
import { MessagesPage } from './pages/MessagesPage';
import { ChatPage } from './pages/ChatPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SavedItemsPage } from './pages/SavedItemsPage';
import { WantedPage } from './pages/WantedPage';
import { NotificationsModal } from './components/NotificationsModal';
import { AskAiChatbot } from './components/AskAiChatbot';
import { Listing, ListingCategory, ItemCondition, NotificationItem } from './types';
import {
  subscribeToListings,
  seedListingsIfEmpty,
  forceReseedListings,
  subscribeToUserNotifications,
} from './lib/marketplaceService';

function AppContent() {
  const { currentUser, userProfile } = useAuth();
  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id || '';
  const { lastSavedNotice } = useSaved();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState<boolean>(true);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [chatListing, setChatListing] = useState<Listing | null>(null);
  const [chatOtherUserId, setChatOtherUserId] = useState<string>('');
  const [chatOtherUserName, setChatOtherUserName] = useState<string>('');
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [marketplaceCategory, setMarketplaceCategory] = useState<ListingCategory | 'All'>('All');
  const [marketplaceSearch, setMarketplaceSearch] = useState<string>('');
  const [seedingNotice, setSeedingNotice] = useState<string | null>(null);

  // Notifications states
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Prefill for CreateListingPage when seller clicks "I Have This" on a Wanted post
  const [wantedPrefill, setWantedPrefill] = useState<Partial<{
    title: string;
    category: ListingCategory;
    price: number;
    condition: ItemCondition;
    description: string;
    preferredLocation: string;
  }> | null>(null);

  // Subscribe to real-time notifications for the current student
  useEffect(() => {
    if (!currentUserId) {
      setNotifications([]);
      return;
    }
    const unsub = subscribeToUserNotifications(currentUserId, (items) => {
      setNotifications(items);
    });
    return () => unsub();
  }, [currentUserId]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Real-time Firestore subscription to active listings
  useEffect(() => {
    // Check if initial seeding is needed (only if 0 listings in Firestore)
    seedListingsIfEmpty().then((seeded) => {
      if (seeded) {
        setSeedingNotice('14 realistic campus listings loaded into Firestore!');
        setTimeout(() => setSeedingNotice(null), 3000);
      }
    });

    const unsubscribe = subscribeToListings(
      (items) => {
        setListings(items);
        setLoadingListings(false);
        setListingsError(null);
      },
      (error) => {
        setListingsError('Unable to load listings right now. Please try again.');
        setLoadingListings(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleNavigate = (tab: string, param?: string) => {
    setCurrentTab(tab);
    if (tab === 'marketplace' && param !== undefined) {
      setMarketplaceSearch(param);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectListing = (listingId: string) => {
    setSelectedListingId(listingId);
    setCurrentTab('listing-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (category: ListingCategory) => {
    setMarketplaceCategory(category);
    setMarketplaceSearch('');
    setCurrentTab('marketplace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartChat = (listing: Listing) => {
    setChatListing(listing);
    setChatOtherUserId(listing.sellerId);
    setChatOtherUserName(listing.sellerName);
    setCurrentTab('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChatFromMessages = (
    listing: Listing,
    otherUserId: string,
    otherUserName: string
  ) => {
    setChatListing(listing);
    setChatOtherUserId(otherUserId);
    setChatOtherUserName(otherUserName);
    setCurrentTab('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReseed = async () => {
    try {
      setSeedingNotice('Reloading campus demo listings into Firestore...');
      await forceReseedListings();
      setSeedingNotice('Demo listings refreshed in Firestore!');
      setTimeout(() => setSeedingNotice(null), 3500);
    } catch (e: any) {
      console.error(e);
      setSeedingNotice(`Seeding failed: ${e?.message || 'Error'}`);
      setTimeout(() => setSeedingNotice(null), 3500);
    }
  };

  const currentListing = listings.find((l) => l.id === selectedListingId);

  return (
    <div className="min-h-screen bg-stone-100/50 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Seeding & Status Notice Toast */}
      {seedingNotice && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-stone-800 animate-in fade-in duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{seedingNotice}</span>
        </div>
      )}

      {/* Wishlist / Saved Toast */}
      {lastSavedNotice && (
        <div className="fixed bottom-5 left-5 z-50 bg-stone-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-stone-800 animate-in fade-in duration-200">
          <span className="w-2 h-2 rounded-full bg-[#E45A8D] animate-ping" />
          <span>{lastSavedNotice}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onSearchSubmit={(q) => {
          setMarketplaceSearch(q);
          setMarketplaceCategory('All');
        }}
        onReseed={handleReseed}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main App Content Views */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            listings={listings}
            onNavigate={handleNavigate}
            onSelectListing={handleSelectListing}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {currentTab === 'marketplace' && (
          <MarketplacePage
            listings={listings}
            loading={loadingListings}
            error={listingsError}
            onSelectListing={handleSelectListing}
            initialCategory={marketplaceCategory}
            initialSearch={marketplaceSearch}
            onRetry={() => {
              setLoadingListings(true);
              setListingsError(null);
            }}
          />
        )}

        {currentTab === 'wanted' && (
          <WantedPage
            onIHaveThis={(wantedPost) => {
              setWantedPrefill({
                title: wantedPost.title,
                category: wantedPost.category,
                price: wantedPost.budget,
                condition: (wantedPost.condition as any) || 'Gently Used',
                description: `Offering in response to student wanted request: "${wantedPost.title}". ${wantedPost.description || ''}`.trim(),
                preferredLocation: wantedPost.preferredLocation,
              });
              setCurrentTab('create-listing');
            }}
            onExploreMarketplace={() => handleNavigate('marketplace')}
          />
        )}

        {currentTab === 'listing-detail' && currentListing && (
          <ListingDetailPage
            listing={currentListing}
            onBack={() => handleNavigate('marketplace')}
            onStartChat={handleStartChat}
            onEditListing={(item) => {
              setEditingListing(item);
              setCurrentTab('edit-listing');
            }}
            onListingDeleted={() => handleNavigate('marketplace')}
          />
        )}

        {currentTab === 'create-listing' && (
          <CreateListingPage
            onBack={() => {
              setWantedPrefill(null);
              handleNavigate('marketplace');
            }}
            onListingCreated={(newId) => {
              setWantedPrefill(null);
              handleSelectListing(newId);
            }}
            initialValues={wantedPrefill || undefined}
          />
        )}

        {currentTab === 'edit-listing' && editingListing && (
          <EditListingPage
            listing={editingListing}
            onBack={() => handleSelectListing(editingListing.id)}
            onListingUpdated={(updated) => {
              setSelectedListingId(updated.id);
              setCurrentTab('listing-detail');
            }}
          />
        )}

        {currentTab === 'messages' && (
          <MessagesPage
            listings={listings}
            onOpenChat={handleOpenChatFromMessages}
            onExploreMarketplace={() => handleNavigate('marketplace')}
          />
        )}

        {currentTab === 'chat' && chatListing && (
          <ChatPage
            listing={chatListing}
            otherUserId={chatOtherUserId}
            otherUserName={chatOtherUserName}
            onBack={() => handleNavigate('messages')}
            onViewListing={(listingId) => handleSelectListing(listingId)}
          />
        )}

        {currentTab === 'my-listings' && (
          <MyListingsPage
            listings={listings}
            onOpenListing={handleSelectListing}
            onEditListing={(item) => {
              setEditingListing(item);
              setCurrentTab('edit-listing');
            }}
            onCreateNew={() => handleNavigate('create-listing')}
            onListingDeleted={(deletedId) => {
              setListings((prev) => prev.filter((l) => l.id !== deletedId));
            }}
          />
        )}

        {currentTab === 'profile' && <ProfilePage />}

        {currentTab === 'saved' && (
          <SavedItemsPage
            listings={listings}
            onSelectListing={handleSelectListing}
            onExploreMarketplace={() => handleNavigate('marketplace')}
          />
        )}
      </main>

      {/* Footer (hidden on active chat screen for mobile keyboard space) */}
      {currentTab !== 'chat' && (
        <Footer
          onNavigateCategory={(cat) => handleSelectCategory(cat as ListingCategory)}
          onReseed={handleReseed}
        />
      )}

      {/* Global Authentication Modal */}
      <AuthModal />

      {/* Global Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        userId={currentUserId}
        notifications={notifications}
        onSelectListing={(listingId) => handleSelectListing(listingId)}
        onNavigateToWanted={() => handleNavigate('wanted')}
        onOpenHandoverFromNotif={() => handleNavigate('messages')}
      />

      {/* Floating Ask AI Campus Chatbot (Right Corner) */}
      {currentTab !== 'chat' && (
        <AskAiChatbot
          listings={listings}
          onNavigate={handleNavigate}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SavedProvider>
        <AppContent />
      </SavedProvider>
    </AuthProvider>
  );
}

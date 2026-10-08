import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  saveListingForUser,
  removeSavedListingForUser,
  subscribeToSavedListingIds,
} from '../lib/marketplaceService';

interface SavedContextType {
  savedIds: Set<string>;
  savedCount: number;
  isSaved: (listingId: string) => boolean;
  toggleSave: (listingId: string, event?: React.MouseEvent) => Promise<boolean>;
  lastSavedNotice: string | null;
}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

const LOCAL_STORAGE_SAVED_KEY = 'unihut_saved_listings';

export const SavedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id;

  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
    return new Set<string>();
  });

  const [lastSavedNotice, setLastSavedNotice] = useState<string | null>(null);

  // Subscribe to real-time Firestore saved listings when user is authenticated
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeToSavedListingIds(currentUserId, (ids) => {
      setSavedIds((prev) => {
        const merged = new Set([...prev, ...ids]);
        try {
          localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(Array.from(merged)));
        } catch (e) {
          // ignore
        }
        return merged;
      });
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const showNotice = (msg: string) => {
    setLastSavedNotice(msg);
    setTimeout(() => {
      setLastSavedNotice(null);
    }, 2800);
  };

  const isSaved = useCallback(
    (listingId: string) => {
      return savedIds.has(listingId);
    },
    [savedIds]
  );

  const toggleSave = useCallback(
    async (listingId: string, event?: React.MouseEvent): Promise<boolean> => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }

      // If user is not authenticated, prompt sign in
      if (!currentUserId) {
        openAuthModal('login');
        showNotice('Please sign in to save items to your wishlist');
        return false;
      }

      const currentlySaved = savedIds.has(listingId);
      const newSaved = !currentlySaved;

      // Optimistic state update
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (newSaved) {
          next.add(listingId);
        } else {
          next.delete(listingId);
        }
        try {
          localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(Array.from(next)));
        } catch (e) {
          // ignore
        }
        return next;
      });

      if (newSaved) {
        showNotice('Item saved to your wishlist!');
      } else {
        showNotice('Item removed from saved');
      }

      // Persist to real Firestore
      try {
        if (newSaved) {
          await saveListingForUser(currentUserId, listingId);
        } else {
          await removeSavedListingForUser(currentUserId, listingId);
        }
      } catch (error) {
        console.warn('Error syncing saved listing to Firestore:', error);
        // Non-blocking: local cache remains intact
      }

      return newSaved;
    },
    [currentUserId, savedIds, openAuthModal]
  );

  return (
    <SavedContext.Provider
      value={{
        savedIds,
        savedCount: savedIds.size,
        isSaved,
        toggleSave,
        lastSavedNotice,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = (): SavedContextType => {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error('useSaved must be used within a SavedProvider');
  }
  return context;
};

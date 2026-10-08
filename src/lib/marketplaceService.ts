import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from './firebase';
import {
  Listing,
  Message,
  Offer,
  Review,
  Report,
  Conversation,
  UserInteraction,
  NotificationItem,
  NotificationType,
  WantedPost,
  PriceAlert,
  Handover,
  HandoverStatus,
} from '../types';
import { INITIAL_SEED_LISTINGS, DEMO_USERS, INITIAL_WANTED_POSTS, INITIAL_NOTIFICATIONS } from './seedData';

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  LISTINGS: 'listings',
  MESSAGES: 'messages',
  OFFERS: 'offers',
  REVIEWS: 'reviews',
  REPORTS: 'reports',
  CONVERSATIONS: 'conversations',
  USER_INTERACTIONS: 'userInteractions',
  NOTIFICATIONS: 'notifications',
  WANTED_POSTS: 'wantedPosts',
  PRICE_ALERTS: 'priceAlerts',
  HANDOVERS: 'handovers',
} as const;

// --- IDEMPOTENT SEED SYSTEM ---
export async function seedListingsIfEmpty(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.LISTINGS));
    if (snap.size === 0) {
      console.log('No listings found in Firestore. Seeding 14 realistic demo listings...');
      await forceReseedListings();
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Could not auto-seed listings:', error);
    return false;
  }
}

export async function forceReseedListings(): Promise<void> {
  try {
    const batch = writeBatch(db);

    // 1. Seed demo users
    for (const user of DEMO_USERS) {
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      batch.set(userRef, sanitizeForFirestore(user), { merge: true });
    }

    // 2. Seed 14 realistic campus listings idempotently using deterministic IDs
    for (const item of INITIAL_SEED_LISTINGS) {
      const listingRef = doc(db, COLLECTIONS.LISTINGS, item.id);
      batch.set(listingRef, sanitizeForFirestore({
        ...item,
        status: 'available', // restore to available
        updatedAt: new Date().toISOString(),
      }), { merge: true });
    }

    // 3. Seed initial wanted posts
    for (const post of INITIAL_WANTED_POSTS) {
      const postRef = doc(db, COLLECTIONS.WANTED_POSTS, post.id);
      batch.set(postRef, sanitizeForFirestore(post), { merge: true });
    }

    // 4. Seed initial notifications
    for (const notif of INITIAL_NOTIFICATIONS) {
      const notifRef = doc(db, COLLECTIONS.NOTIFICATIONS, notif.id);
      batch.set(notifRef, sanitizeForFirestore(notif), { merge: true });
    }

    await batch.commit();
    console.log('Idempotent seeding completed successfully!');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.LISTINGS);
    throw error;
  }
}

// --- MARKETPLACE LISTINGS (REAL FIRESTORE) ---
export function subscribeToListings(
  callback: (listings: Listing[]) => void,
  onError?: (error: Error) => void
) {
  try {
    // Read all listings from Firestore
    const colRef = collection(db, COLLECTIONS.LISTINGS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            ...data,
            id: docSnap.id,
            // Ensure compatibility fields are populated
            negotiable: data.negotiable !== undefined ? data.negotiable : (data.isNegotiable ?? true),
            isNegotiable: data.negotiable !== undefined ? data.negotiable : (data.isNegotiable ?? true),
            views: data.views ?? data.viewsCount ?? 0,
            tags: data.tags || [],
            sellerAvatar: data.sellerPhotoURL || data.sellerAvatar,
            sellerPhotoURL: data.sellerPhotoURL || data.sellerAvatar,
          } as Listing;
        });

        // Client-side sort by newest first (avoids needing composite index)
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        callback(items);
      },
      (err) => {
        console.error('Error fetching Firestore listings:', err);
        if (onError) onError(err);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.LISTINGS);
    return () => {};
  }
}

export async function getListingById(id: string): Promise<Listing | null> {
  try {
    const docRef = doc(db, COLLECTIONS.LISTINGS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      id: snap.id,
      negotiable: data.negotiable !== undefined ? data.negotiable : (data.isNegotiable ?? true),
      isNegotiable: data.negotiable !== undefined ? data.negotiable : (data.isNegotiable ?? true),
      views: (data.views ?? 0) + 1,
      tags: data.tags || [],
      sellerAvatar: data.sellerPhotoURL || data.sellerAvatar,
      sellerPhotoURL: data.sellerPhotoURL || data.sellerAvatar,
    } as Listing;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.LISTINGS}/${id}`);
    return null;
  }
}

export async function createListing(
  listingData: Omit<Listing, 'id' | 'createdAt' | 'views'>
): Promise<string> {
  try {
    const docRef = doc(collection(db, COLLECTIONS.LISTINGS));
    const now = new Date().toISOString();
    const newListing: Record<string, any> = {
      ...listingData,
      id: docRef.id,
      status: 'available',
      views: 0,
      negotiable: listingData.negotiable !== undefined ? listingData.negotiable : true,
      // Ensure all schema field requirements and aliases are saved
      sellingPrice: listingData.price,
      price: listingData.price,
      bargainAllowed: listingData.negotiable !== undefined ? listingData.negotiable : true,
      handoverLocation: listingData.location,
      location: listingData.location,
      image: listingData.imageUrl,
      imageUrl: listingData.imageUrl,
      sellerRating: typeof listingData.sellerRating === 'number' ? listingData.sellerRating : 0,
      tags: listingData.tags || [
        listingData.category.toLowerCase(),
        ...listingData.title.toLowerCase().split(' ').slice(0, 4),
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Sanitize to guarantee no undefined fields are passed to Firestore setDoc
    const cleanListing = sanitizeForFirestore(newListing);
    await setDoc(docRef, cleanListing);

    // Increment seller totalListings in user document
    try {
      const userRef = doc(db, COLLECTIONS.USERS, listingData.sellerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentCount = userSnap.data().totalListings || 0;
        await updateDoc(userRef, { totalListings: currentCount + 1 });
      }
    } catch (e) {
      // non-blocking
    }

    // Check if new listing satisfies any active student wanted posts
    checkWantedMatchesForListing(newListing as unknown as Listing).catch(() => {});

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.LISTINGS);
    throw error;
  }
}

export async function updateListing(id: string, updates: Partial<Listing>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.LISTINGS, id);
    const cleanUpdates = sanitizeForFirestore({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(docRef, cleanUpdates);

    // If price changed, check for watchers
    if (typeof updates.price === 'number') {
      checkAndNotifyPriceDrops(id, updates.price, updates.title || 'Watched listing').catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.LISTINGS}/${id}`);
    throw error;
  }
}

export async function deleteListing(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.LISTINGS, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.LISTINGS}/${id}`);
    throw error;
  }
}

// --- MESSAGES & CHAT (REAL FIRESTORE) ---
export function subscribeToMessagesForListing(
  listingId: string,
  buyerId: string,
  sellerId: string,
  callback: (messages: Message[]) => void
) {
  try {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('listingId', '==', listingId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const all = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id,
        })) as Message[];

        // Filter messages between these two users
        const thread = all.filter(
          (m) =>
            (m.senderId === buyerId && m.receiverId === sellerId) ||
            (m.senderId === sellerId && m.receiverId === buyerId) ||
            // Or if participants aren't strict yet
            m.listingId === listingId
        );

        // Sort ascending by time
        thread.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        callback(thread);
      },
      (error) => {
        console.warn('Error fetching messages:', error);
        callback([]);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.MESSAGES);
    return () => {};
  }
}

export async function sendDirectMessage(
  listingId: string,
  senderId: string,
  receiverId: string,
  senderName: string,
  messageText: string,
  offerAmount?: number,
  offerId?: string
): Promise<string> {
  try {
    const docRef = doc(collection(db, COLLECTIONS.MESSAGES));
    const newMsg: Message = {
      id: docRef.id,
      listingId,
      senderId,
      receiverId,
      senderName,
      message: messageText,
      createdAt: new Date().toISOString(),
      read: false,
      text: messageText, // helper alias
    };

    if (offerAmount !== undefined) {
      newMsg.offerAmount = offerAmount;
      newMsg.offerStatus = 'pending';
      if (offerId) newMsg.offerId = offerId;
    }

    await setDoc(docRef, sanitizeForFirestore(newMsg));

    // Also update or create in `conversations` collection for fast list view
    const convId = `${listingId}_${[senderId, receiverId].sort().join('_')}`;
    const convRef = doc(db, COLLECTIONS.CONVERSATIONS, convId);
    await setDoc(
      convRef,
      sanitizeForFirestore({
        id: convId,
        listingId,
        participants: [senderId, receiverId],
        lastMessage: offerAmount
          ? `Offered ₹${offerAmount.toLocaleString('en-IN')}: ${messageText}`
          : messageText,
        lastMessageTimestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.MESSAGES);
    throw error;
  }
}

// Conversation threads for Messages page
export function subscribeToUserConversations(
  userId: string,
  callback: (conversations: any[]) => void
) {
  try {
    const q = query(
      collection(db, COLLECTIONS.CONVERSATIONS),
      where('participants', 'array-contains', userId)
    );

    return onSnapshot(
      q,
      async (snapshot) => {
        const convos = snapshot.docs.map((d) => d.data());
        convos.sort(
          (a, b) =>
            new Date(b.lastMessageTimestamp || b.updatedAt).getTime() -
            new Date(a.lastMessageTimestamp || a.updatedAt).getTime()
        );
        callback(convos);
      },
      (error) => {
        console.warn('Error reading conversations:', error);
        callback([]);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CONVERSATIONS);
    return () => {};
  }
}

// --- OFFERS & BARGAINING (REAL FIRESTORE) ---
export async function createOffer(
  listing: Listing,
  buyerId: string,
  sellerId: string,
  amount: number,
  message?: string,
  buyerName?: string,
  buyerEmail?: string
): Promise<string> {
  try {
    const offerRef = doc(collection(db, COLLECTIONS.OFFERS));
    const now = new Date().toISOString();
    const newOffer: Offer = {
      id: offerRef.id,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.imageUrl || (listing as any).image || '',
      buyerId,
      buyerName: buyerName || 'Student Buyer',
      buyerEmail: buyerEmail || '',
      sellerId,
      sellerName: listing.sellerName,
      amount,
      offerAmount: amount,
      originalListingPrice: listing.originalPrice || listing.price,
      listingPrice: listing.price,
      message: message || `Offered ₹${amount.toLocaleString('en-IN')}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(offerRef, sanitizeForFirestore(newOffer));

    // Also push a message to chat thread
    await sendDirectMessage(
      listing.id,
      buyerId,
      sellerId,
      buyerName || 'Buyer',
      message || `Proposed a price offer of ₹${amount.toLocaleString('en-IN')}`,
      amount,
      offerRef.id
    );

    // Notify seller of new offer
    createNotification({
      userId: sellerId,
      type: 'new_offer',
      title: '🔔 New Offer Received',
      message: `${buyerName || 'A student'} offered ₹${amount.toLocaleString('en-IN')} for "${listing.title}".`,
      listingId: listing.id,
      offerId: offerRef.id,
    }).catch(() => {});

    return offerRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.OFFERS);
    throw error;
  }
}

export async function updateOfferStatus(
  offerId: string,
  status: 'accepted' | 'rejected' | 'countered' | 'withdrawn',
  listingId?: string,
  buyerId?: string,
  listingTitle?: string
): Promise<void> {
  try {
    const offerRef = doc(db, COLLECTIONS.OFFERS, offerId);
    await updateDoc(offerRef, {
      status,
      updatedAt: new Date().toISOString(),
    });

    // If accepted, reserve the listing
    if (status === 'accepted' && listingId) {
      const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
      await updateDoc(listingRef, {
        status: 'reserved',
        updatedAt: new Date().toISOString(),
      });
    }

    // Notify buyer
    if (buyerId && (status === 'accepted' || status === 'rejected')) {
      const title = status === 'accepted' ? '🎉 Offer Accepted!' : 'Offer Declined';
      const msg =
        status === 'accepted'
          ? `Your offer for "${listingTitle || 'the listing'}" was accepted! You can now arrange campus handover.`
          : `Your offer for "${listingTitle || 'the listing'}" was declined.`;
      createNotification({
        userId: buyerId,
        type: status === 'accepted' ? 'offer_accepted' : 'offer_rejected',
        title,
        message: msg,
        listingId,
        offerId,
      }).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.OFFERS}/${offerId}`);
    throw error;
  }
}

export async function counterOffer(
  offerId: string,
  counterAmount: number,
  counterMessage?: string,
  listingId?: string,
  sellerId?: string,
  buyerId?: string,
  sellerName?: string,
  listingTitle?: string
): Promise<void> {
  try {
    const offerRef = doc(db, COLLECTIONS.OFFERS, offerId);
    const now = new Date().toISOString();
    await updateDoc(offerRef, {
      status: 'countered',
      counterAmount,
      counterMessage: counterMessage || `Seller countered with ₹${counterAmount.toLocaleString('en-IN')}`,
      updatedAt: now,
    });

    if (listingId && sellerId && buyerId) {
      await sendDirectMessage(
        listingId,
        sellerId,
        buyerId,
        sellerName || 'Seller',
        counterMessage || `I propose a counter offer of ₹${counterAmount.toLocaleString('en-IN')}. Would that work for you?`,
        counterAmount,
        offerId
      );

      // Notify buyer of counter offer
      createNotification({
        userId: buyerId,
        type: 'counter_offer',
        title: '💬 Counter Offer Received',
        message: `${sellerName || 'Seller'} countered with ₹${counterAmount.toLocaleString('en-IN')} for "${listingTitle || 'listing'}".`,
        listingId,
        offerId,
      }).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.OFFERS}/${offerId}`);
    throw error;
  }
}

export function subscribeToOffersForSeller(
  sellerId: string,
  callback: (offers: Offer[]) => void
) {
  try {
    const q = query(
      collection(db, COLLECTIONS.OFFERS),
      where('sellerId', '==', sellerId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const offers = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as Offer[];
        offers.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(offers);
      },
      (error) => {
        console.warn('Error reading seller offers:', error);
        callback([]);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.OFFERS);
    return () => {};
  }
}

export function subscribeToOffersForBuyer(
  buyerId: string,
  callback: (offers: Offer[]) => void
) {
  try {
    const q = query(
      collection(db, COLLECTIONS.OFFERS),
      where('buyerId', '==', buyerId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const offers = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as Offer[];
        offers.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(offers);
      },
      (error) => {
        console.warn('Error reading buyer offers:', error);
        callback([]);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.OFFERS);
    return () => {};
  }
}

export function subscribeToOffersForListing(
  listingId: string,
  callback: (offers: Offer[]) => void
) {
  try {
    const q = query(
      collection(db, COLLECTIONS.OFFERS),
      where('listingId', '==', listingId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const offers = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as Offer[];
        offers.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(offers);
      },
      (error) => {
        console.warn('Error reading offers:', error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.OFFERS);
    return () => {};
  }
}

// --- REPORTS (REAL FIRESTORE) ---
export async function submitReport(
  listingId: string,
  reportedBy: string,
  reason: string,
  description?: string
): Promise<string> {
  try {
    const reportRef = doc(collection(db, COLLECTIONS.REPORTS));
    const newReport: Report = {
      id: reportRef.id,
      listingId,
      reportedBy,
      reason,
      description: description || '',
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    await setDoc(reportRef, sanitizeForFirestore(newReport));
    return reportRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.REPORTS);
    throw error;
  }
}

// --- REVIEWS (REAL FIRESTORE) ---
export async function submitReview(
  listingId: string,
  sellerId: string,
  buyerId: string,
  rating: number,
  comment?: string
): Promise<string> {
  try {
    const reviewRef = doc(collection(db, COLLECTIONS.REVIEWS));
    const newReview: Review = {
      id: reviewRef.id,
      listingId,
      sellerId,
      buyerId,
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };
    await setDoc(reviewRef, sanitizeForFirestore(newReview));

    // Update seller salesCount & recalculate rating
    try {
      const userRef = doc(db, COLLECTIONS.USERS, sellerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentSales = userSnap.data().totalSales || 0;
        await updateDoc(userRef, { totalSales: currentSales + 1 });
      }
    } catch (e) {
      // non-blocking
    }

    return reviewRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.REVIEWS);
    throw error;
  }
}

/**
 * 13. USER INTERACTIONS COLLECTION
 * Stores user events (search, view, offer, purchase) for personalization & AI recommendations
 */
export async function recordUserInteraction(
  data: Omit<UserInteraction, 'id' | 'createdAt'>
): Promise<string | null> {
  try {
    const docRef = doc(collection(db, COLLECTIONS.USER_INTERACTIONS));
    const now = new Date().toISOString();
    const interaction: UserInteraction = {
      id: docRef.id,
      userId: data.userId,
      type: data.type,
      listingId: data.listingId,
      query: data.query,
      category: data.category,
      createdAt: now,
    };
    await setDoc(docRef, sanitizeForFirestore(interaction));
    return docRef.id;
  } catch (error) {
    // Non-blocking for UI
    console.warn('Could not record user interaction to Firestore:', error);
    return null;
  }
}

export async function getRecentUserInteractions(
  userId: string,
  maxCount = 15
): Promise<UserInteraction[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_INTERACTIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.slice(0, maxCount).map((d) => d.data() as UserInteraction);
  } catch (error) {
    console.warn('Could not fetch user interactions:', error);
    return [];
  }
}

// --- SAVED / FAVOURITE LISTINGS (REAL FIRESTORE) ---
export async function saveListingForUser(
  userId: string,
  listingId: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId, 'savedListings', listingId);
    await setDoc(docRef, {
      listingId,
      userId,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Could not save listing to Firestore:', error);
    throw error;
  }
}

export async function removeSavedListingForUser(
  userId: string,
  listingId: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId, 'savedListings', listingId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Could not remove saved listing from Firestore:', error);
    throw error;
  }
}

export function subscribeToSavedListingIds(
  userId: string,
  callback: (savedIds: string[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.USERS, userId, 'savedListings');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const ids = snapshot.docs.map((d) => d.id || d.data().listingId).filter(Boolean);
        callback(ids);
      },
      (error) => {
        console.warn('Error reading saved listings snapshot:', error);
      }
    );
  } catch (error) {
    console.warn('Could not subscribe to saved listings:', error);
    return () => {};
  }
}

// ==========================================
// 4. NOTIFICATIONS CENTER (REAL FIRESTORE)
// ==========================================

export async function createNotification(
  data: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>
): Promise<string> {
  try {
    const notifRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
    const now = new Date().toISOString();
    const notification: NotificationItem = {
      ...data,
      id: notifRef.id,
      read: false,
      createdAt: now,
    };
    await setDoc(notifRef, sanitizeForFirestore(notification));
    return notifRef.id;
  } catch (error) {
    console.warn('Could not create notification:', error);
    return '';
  }
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: NotificationItem[]) => void
): () => void {
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as NotificationItem[];
        // Sort newest first
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(items);
      },
      (error) => {
        console.warn('Error reading notifications snapshot:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Could not subscribe to notifications:', error);
    return () => {};
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notifRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.warn('Could not mark notification as read:', error);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.warn('Could not mark all notifications as read:', error);
  }
}

// ==========================================
// 6. WANTED POSTS (STUDENT REQUESTS)
// ==========================================

export async function createWantedPost(
  data: Omit<WantedPost, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const postRef = doc(collection(db, COLLECTIONS.WANTED_POSTS));
    const now = new Date().toISOString();
    const wantedPost: WantedPost = {
      ...data,
      id: postRef.id,
      createdAt: now,
    };
    await setDoc(postRef, sanitizeForFirestore(wantedPost));
    return postRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.WANTED_POSTS);
    throw error;
  }
}

export function subscribeToWantedPosts(
  callback: (posts: WantedPost[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.WANTED_POSTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const posts = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as WantedPost[];
        // Sort newest first
        posts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(posts);
      },
      (error) => {
        console.warn('Error reading wanted posts snapshot:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Could not subscribe to wanted posts:', error);
    return () => {};
  }
}

export async function updateWantedPostStatus(
  postId: string,
  status: 'active' | 'fulfilled' | 'closed'
): Promise<void> {
  try {
    const postRef = doc(db, COLLECTIONS.WANTED_POSTS, postId);
    await updateDoc(postRef, { status });
  } catch (error) {
    console.warn('Could not update wanted post status:', error);
  }
}

export async function deleteWantedPost(postId: string): Promise<void> {
  try {
    const postRef = doc(db, COLLECTIONS.WANTED_POSTS, postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.warn('Could not delete wanted post:', error);
  }
}

/**
 * Checks active wanted posts against a newly created listing and notifies buyers
 */
export async function checkWantedMatchesForListing(listing: Listing): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTIONS.WANTED_POSTS),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const wanted = d.data() as WantedPost;
      // Don't match seller's own wanted request
      if (wanted.userId === listing.sellerId) continue;

      const sameCategory = wanted.category === listing.category;
      const withinBudget = listing.price <= wanted.budget * 1.15; // Within 15% of budget

      // Keyword overlap
      const listingWords = `${listing.title} ${listing.description}`.toLowerCase().split(/\s+/);
      const wantedWords = wanted.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const hasWordOverlap = wantedWords.some((w) => listingWords.includes(w));

      if (sameCategory && (withinBudget || hasWordOverlap)) {
        await createNotification({
          userId: wanted.userId,
          type: 'wanted_post_match',
          title: 'Wanted Request Match!',
          message: `A new listing "${listing.title}" for ₹${listing.price} may match your wanted request "${wanted.title}".`,
          listingId: listing.id,
          wantedPostId: d.id,
        });
      }
    }
  } catch (error) {
    console.warn('Could not check wanted matches:', error);
  }
}

// ==========================================
// 8. PRICE DROP ALERTS
// ==========================================

export async function createPriceAlert(
  data: Omit<PriceAlert, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const alertRef = doc(collection(db, COLLECTIONS.PRICE_ALERTS));
    const now = new Date().toISOString();
    const alert: PriceAlert = {
      ...data,
      id: alertRef.id,
      createdAt: now,
    };
    await setDoc(alertRef, sanitizeForFirestore(alert));
    return alertRef.id;
  } catch (error) {
    console.warn('Could not create price alert:', error);
    throw error;
  }
}

export function subscribeToUserPriceAlerts(
  userId: string,
  callback: (alerts: PriceAlert[]) => void
): () => void {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRICE_ALERTS),
      where('userId', '==', userId),
      where('active', '==', true)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const alerts = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PriceAlert[];
        callback(alerts);
      },
      (error) => {
        console.warn('Error reading price alerts snapshot:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Could not subscribe to price alerts:', error);
    return () => {};
  }
}

export async function removePriceAlert(alertId: string): Promise<void> {
  try {
    const alertRef = doc(db, COLLECTIONS.PRICE_ALERTS, alertId);
    await updateDoc(alertRef, { active: false });
  } catch (error) {
    console.warn('Could not remove price alert:', error);
  }
}

/**
 * Checks price alerts when a seller lowers listing price and notifies watchers
 */
export async function checkAndNotifyPriceDrops(
  listingId: string,
  newPrice: number,
  listingTitle: string
): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRICE_ALERTS),
      where('listingId', '==', listingId),
      where('active', '==', true)
    );
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const alert = d.data() as PriceAlert;
      // If new price dropped below watcher's target price or below old price
      if (newPrice <= alert.targetPrice || newPrice < alert.currentPrice) {
        await createNotification({
          userId: alert.userId,
          type: 'price_drop',
          title: '🔥 Price Drop Alert!',
          message: `"${listingTitle}" dropped to ₹${newPrice.toLocaleString('en-IN')}!`,
          listingId,
        });

        // Update alert's currentPrice to avoid repeated notifications
        await updateDoc(d.ref, { currentPrice: newPrice });
      }
    }
  } catch (error) {
    console.warn('Could not check price drop alerts:', error);
  }
}

// ==========================================
// 9. CAMPUS HANDOVER SCHEDULER
// ==========================================

export async function proposeHandover(
  data: Omit<Handover, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const handoverRef = doc(collection(db, COLLECTIONS.HANDOVERS));
    const now = new Date().toISOString();
    const handover: Handover = {
      ...data,
      id: handoverRef.id,
      status: 'proposed',
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(handoverRef, sanitizeForFirestore(handover));

    // Notify the other party
    const receiverId = data.buyerId === data.sellerId ? '' : data.buyerId;
    if (receiverId) {
      await createNotification({
        userId: receiverId,
        type: 'handover_scheduled',
        title: '📍 Campus Handover Proposed',
        message: `Handover proposed for "${data.listingTitle}" on ${data.date} at ${data.time} (${data.location}).`,
        listingId: data.listingId,
        handoverId: handoverRef.id,
      });
    }

    return handoverRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.HANDOVERS);
    throw error;
  }
}

export function subscribeToHandoversForListing(
  listingId: string,
  callback: (handovers: Handover[]) => void
): () => void {
  try {
    const q = query(
      collection(db, COLLECTIONS.HANDOVERS),
      where('listingId', '==', listingId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const handovers = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Handover[];
        handovers.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(handovers);
      },
      (error) => {
        console.warn('Error reading listing handovers:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Could not subscribe to listing handovers:', error);
    return () => {};
  }
}

export function subscribeToUserHandovers(
  userId: string,
  callback: (handovers: Handover[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.HANDOVERS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const handovers = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Handover))
          .filter((h) => h.buyerId === userId || h.sellerId === userId);
        handovers.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(handovers);
      },
      (error) => {
        console.warn('Error reading user handovers:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Could not subscribe to user handovers:', error);
    return () => {};
  }
}

export async function updateHandoverStatus(
  handoverId: string,
  status: HandoverStatus,
  otherUserId?: string,
  listingTitle?: string
): Promise<void> {
  try {
    const handoverRef = doc(db, COLLECTIONS.HANDOVERS, handoverId);
    await updateDoc(handoverRef, {
      status,
      updatedAt: new Date().toISOString(),
    });

    if (otherUserId && listingTitle) {
      const title =
        status === 'confirmed'
          ? '📍 Handover Confirmed!'
          : status === 'completed'
          ? '🎉 Deal Completed!'
          : 'Handover Cancelled';
      const msg =
        status === 'confirmed'
          ? `Campus handover confirmed for "${listingTitle}". Meet at the agreed campus location!`
          : status === 'completed'
          ? `Handover completed for "${listingTitle}". Leave a review for your fellow student.`
          : `Handover cancelled for "${listingTitle}".`;

      await createNotification({
        userId: otherUserId,
        type: 'handover_scheduled',
        title,
        message: msg,
        handoverId,
      });
    }
  } catch (error) {
    console.warn('Could not update handover status:', error);
  }
}

export async function completeHandover(
  handoverId: string,
  listingId: string,
  offerId?: string,
  buyerId?: string,
  sellerId?: string,
  listingTitle?: string
): Promise<void> {
  try {
    // 1. Mark handover as completed
    await updateHandoverStatus(handoverId, 'completed');

    // 2. Mark listing as sold
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    await updateDoc(listingRef, {
      status: 'sold',
      updatedAt: new Date().toISOString(),
    });

    // 3. Mark offer as completed if provided
    if (offerId) {
      const offerRef = doc(db, COLLECTIONS.OFFERS, offerId);
      await updateDoc(offerRef, {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });
    }

    // 4. Send review prompt notification to buyer
    if (buyerId && listingTitle) {
      await createNotification({
        userId: buyerId,
        type: 'listing_status_update',
        title: '⭐ Rate Your Campus Experience',
        message: `How was your handover for "${listingTitle}"? Leave a rating for the seller!`,
        listingId,
      });
    }
  } catch (error) {
    console.warn('Could not complete handover:', error);
  }
}




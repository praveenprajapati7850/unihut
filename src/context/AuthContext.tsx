import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, sanitizeForFirestore } from '../lib/firebase';
import { UserProfile } from '../types';
import { DEMO_USERS } from '../lib/seedData';
import { isCampusEmail, getCollegeNameFromEmail, CAMPUS_NAME } from '../constants/campus';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, hostel: string) => Promise<void>;
  loginAsDemoUser: (demoUserIndex: number) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'unihut_active_demo_user';
const LEGACY_DEMO_STORAGE_KEY = 'campus_hustle_active_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Sync or create user document in Firestore matching the exact specification:
  // users/{uid}
  // Fields: uid, displayName, email, photoURL, hostel, college, verifiedCampus, rating, totalSales, totalListings, createdAt, lastLoginAt
  // Do NOT store password in Firestore.
  const syncUserDocInFirestore = async (
    uid: string,
    email: string,
    displayName: string,
    photoURL?: string,
    hostel?: string
  ): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', uid);
    const verified = isCampusEmail(email);
    const college = getCollegeNameFromEmail(email);
    const now = new Date().toISOString();

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const existingData = snap.data() as Partial<UserProfile>;
        const updatedData: Partial<UserProfile> = {
          uid,
          displayName: displayName || existingData.displayName || 'Campus Student',
          email,
          photoURL: photoURL || existingData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
          hostel: hostel || existingData.hostel || existingData.hostelOrBlock || 'Main Hostel Block',
          college: existingData.college || college,
          verifiedCampus: existingData.verifiedCampus !== undefined ? existingData.verifiedCampus : verified,
          lastLoginAt: now,
          totalSales: existingData.totalSales ?? 0,
          totalListings: existingData.totalListings ?? 0,
          rating: typeof existingData.rating === 'number' ? existingData.rating : 0,
          // UI compatibility helpers
          hostelOrBlock: hostel || existingData.hostel || existingData.hostelOrBlock || 'Main Hostel Block',
          id: uid,
          name: displayName || existingData.displayName || 'Campus Student',
          avatarUrl: photoURL || existingData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        };

        await updateDoc(userDocRef, sanitizeForFirestore(updatedData));

        const fullProfile: UserProfile = {
          ...existingData,
          ...updatedData,
        } as UserProfile;

        setUserProfile(fullProfile);
        return fullProfile;
      } else {
        // Create new user profile document
        const newProfile: UserProfile = {
          uid,
          displayName: displayName || email.split('@')[0] || 'Campus Student',
          email,
          photoURL: photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
          hostel: hostel || 'Main Hostel Block',
          college,
          verifiedCampus: verified,
          rating: 0, // 0 indicates New Seller without reviews yet
          totalSales: 0,
          totalListings: 0,
          createdAt: now,
          lastLoginAt: now,
          // UI compatibility helpers
          hostelOrBlock: hostel || 'Main Hostel Block',
          memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          id: uid,
          name: displayName || email.split('@')[0] || 'Campus Student',
          avatarUrl: photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
          salesCount: 0,
        };

        await setDoc(userDocRef, sanitizeForFirestore(newProfile));
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (error) {
      console.warn('Could not sync user document to Firestore:', error);
      const fallback: UserProfile = {
        uid,
        displayName: displayName || 'Campus Student',
        email,
        photoURL: photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        hostel: hostel || 'Main Hostel Block',
        college,
        verifiedCampus: verified,
        totalSales: 0,
        totalListings: 0,
        createdAt: now,
        lastLoginAt: now,
        id: uid,
        name: displayName,
      };
      setUserProfile(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    // Check if demo persona is explicitly active in storage
    const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY) || localStorage.getItem(LEGACY_DEMO_STORAGE_KEY);
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo) as UserProfile;
        setUserProfile(parsed);
        setIsDemoMode(true);
        setCurrentUser({
          uid: parsed.uid || parsed.id || 'demo_user',
          displayName: parsed.displayName || parsed.name,
          email: parsed.email,
          photoURL: parsed.photoURL || parsed.avatarUrl,
        } as unknown as FirebaseUser);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY);
      }
    }

    // Firebase onAuthStateChanged listener:
    // Ensures page refresh does not log the user out and loads Firestore user profile
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsDemoMode(false);
        await syncUserDocInFirestore(
          user.uid,
          user.email || '',
          user.displayName || user.email?.split('@')[0] || 'Campus Student',
          user.photoURL || undefined
        );
      } else {
        // Genuine logged out state if no demo persona is chosen
        if (!localStorage.getItem(DEMO_STORAGE_KEY)) {
          setCurrentUser(null);
          setUserProfile(null);
          setIsDemoMode(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setIsDemoMode(false);
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      setCurrentUser(result.user);
      await syncUserDocInFirestore(
        result.user.uid,
        result.user.email || '',
        result.user.displayName || 'Campus Student',
        result.user.photoURL || undefined
      );
      closeAuthModal();
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setIsDemoMode(false);
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    setCurrentUser(cred.user);
    await syncUserDocInFirestore(
      cred.user.uid,
      cred.user.email || email,
      cred.user.displayName || email.split('@')[0]
    );
    closeAuthModal();
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    hostel: string
  ) => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setIsDemoMode(false);
    
    // 1. Create real Firebase Authentication user with Email/Password provider
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    setCurrentUser(cred.user);

    // 2. Update Firebase Auth displayName
    try {
      await updateProfile(cred.user, {
        displayName: name,
      });
    } catch (e) {
      // non-blocking
    }

    // 3. Create/update Firestore users/{uid} document (Password is NEVER stored in Firestore)
    await syncUserDocInFirestore(
      cred.user.uid,
      email,
      name,
      undefined,
      hostel
    );

    closeAuthModal();
  };

  const loginAsDemoUser = async (index: number) => {
    const demo = DEMO_USERS[index % DEMO_USERS.length];
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demo));
    setUserProfile(demo);
    setIsDemoMode(true);
    setCurrentUser({
      uid: demo.uid,
      displayName: demo.displayName,
      email: demo.email,
      photoURL: demo.photoURL,
    } as unknown as FirebaseUser);

    // Also sync demo profile document in Firestore
    try {
      await setDoc(doc(db, 'users', demo.uid), sanitizeForFirestore(demo), { merge: true });
    } catch (e) {
      // ignore
    }

    closeAuthModal();
  };

  const logout = async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY);
    setIsDemoMode(false);
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const uid = currentUser?.uid || userProfile?.uid || userProfile?.id;
    if (!uid) return;

    const merged = {
      ...(userProfile || {}),
      ...updates,
      uid,
      id: uid,
      displayName: updates.displayName || updates.name || userProfile?.displayName || userProfile?.name || 'Student',
      name: updates.displayName || updates.name || userProfile?.displayName || userProfile?.name || 'Student',
      hostel: updates.hostel || updates.hostelOrBlock || userProfile?.hostel || userProfile?.hostelOrBlock,
      hostelOrBlock: updates.hostel || updates.hostelOrBlock || userProfile?.hostel || userProfile?.hostelOrBlock,
      photoURL: updates.photoURL || updates.avatarUrl || userProfile?.photoURL || userProfile?.avatarUrl,
      avatarUrl: updates.photoURL || updates.avatarUrl || userProfile?.photoURL || userProfile?.avatarUrl,
      rating: typeof (updates.rating ?? userProfile?.rating) === 'number' ? (updates.rating ?? userProfile?.rating) : 0,
    } as UserProfile;

    setUserProfile(merged);

    if (localStorage.getItem(DEMO_STORAGE_KEY)) {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(merged));
    }

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, sanitizeForFirestore(merged), { merge: true });
    } catch (err) {
      console.warn('Could not update Firestore profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isDemoMode,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        loginAsDemoUser,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

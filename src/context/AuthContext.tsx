import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { City } from "../shared/schemas";
import { auth, googleProvider } from "../lib/firebase";
import {
  ensureUserProfileInFirestore,
  updateUserProfileInFirestore,
  subscribeToUserEvents,
  UserPublicProfileData,
  UserPrivateInfoData,
  SavedCloudEventSummary,
} from "../lib/firestoreStore";

interface AuthContextValue {
  user: User | null;
  isAuthReady: boolean;
  profile: UserPublicProfileData | null;
  privateInfo: UserPrivateInfoData | null;
  savedEvents: SavedCloudEventSummary[];
  signInWithGoogle: () => Promise<User>;
  signUpWithEmail: (params: {
    fullName: string;
    email: string;
    password: string;
    preferredCity: City;
  }) => Promise<{ user: User; verificationSent: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  saveUserProfile: (updates: {
    displayName: string;
    preferredCity: City;
    phone: string;
  }) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserPublicProfileData | null>(null);
  const [privateInfo, setPrivateInfo] = useState<UserPrivateInfoData | null>(null);
  const [savedEvents, setSavedEvents] = useState<SavedCloudEventSummary[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);

      if (currentUser && currentUser.emailVerified) {
        try {
          const synced = await ensureUserProfileInFirestore(currentUser);
          if (synced) {
            setProfile(synced.profile);
            setPrivateInfo(synced.privateInfo);
          }
        } catch (err) {
          console.error("Profile bootstrap error:", err);
        }
      } else {
        setProfile(null);
        setPrivateInfo(null);
        setSavedEvents([]);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user || !user.emailVerified) {
      setSavedEvents([]);
      return;
    }

    const unsubEvents = subscribeToUserEvents(user, (events) => {
      setSavedEvents(events);
    });

    return () => unsubEvents();
  }, [isAuthReady, user, user?.emailVerified]);

  const signInWithGoogle = async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user.emailVerified) {
      const synced = await ensureUserProfileInFirestore(result.user);
      if (synced) {
        setProfile(synced.profile);
        setPrivateInfo(synced.privateInfo);
      }
    }
    return result.user;
  };

  const signUpWithEmail = async (params: {
    fullName: string;
    email: string;
    password: string;
    preferredCity: City;
  }): Promise<{ user: User; verificationSent: boolean }> => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      params.email.trim(),
      params.password
    );
    const cleanName = params.fullName.trim().slice(0, 80);
    if (cleanName) {
      await updateProfile(cred.user, { displayName: cleanName });
    }
    let verificationSent = false;
    try {
      await sendEmailVerification(cred.user);
      verificationSent = true;
    } catch {
      verificationSent = false;
    }
    setUser({ ...cred.user, displayName: cleanName || cred.user.displayName } as User);
    return { user: cred.user, verificationSent };
  };

  const signInWithEmail = async (email: string, password: string): Promise<User> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user.emailVerified) {
      const synced = await ensureUserProfileInFirestore(cred.user);
      if (synced) {
        setProfile(synced.profile);
        setPrivateInfo(synced.privateInfo);
      }
    }
    return cred.user;
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const refreshed = auth.currentUser;
    setUser({ ...refreshed } as User);
    if (refreshed.emailVerified) {
      const synced = await ensureUserProfileInFirestore(refreshed);
      if (synced) {
        setProfile(synced.profile);
        setPrivateInfo(synced.privateInfo);
      }
      return true;
    }
    return false;
  };

  const saveUserProfile = async (updates: {
    displayName: string;
    preferredCity: City;
    phone: string;
  }): Promise<void> => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) return;
    await updateProfile(auth.currentUser, {
      displayName: updates.displayName.trim().slice(0, 80),
    });
    const updated = await updateUserProfileInFirestore(auth.currentUser, updates);
    setProfile(updated.profile);
    setPrivateInfo(updated.privateInfo);
  };

  const signOutUser = async (): Promise<void> => {
    await signOut(auth);
    setProfile(null);
    setPrivateInfo(null);
    setSavedEvents([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthReady,
        profile,
        privateInfo,
        savedEvents,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        resendVerificationEmail,
        refreshVerificationStatus,
        saveUserProfile,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

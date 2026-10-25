import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, MapPin } from "lucide-react";
import { City } from "../shared/schemas";
import { useAuth } from "../context/AuthContext";
import { BLUEPRINT_LIMITS } from "../lib/firestoreStore";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "signin" | "signup";
  onClose: () => void;
  onAuthSuccess: (message: string) => void;
}

const CITIES: City[] = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai"];

function formatAuthError(err: unknown): { message: string; needsEmailProviderSetup: boolean } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("auth/operation-not-allowed")) {
    return {
      message:
        "Email/Password sign-in is not yet enabled in your Firebase project (celebrate-ai-ab5f6).",
      needsEmailProviderSetup: true,
    };
  }
  if (raw.includes("auth/invalid-credential") || raw.includes("auth/wrong-password") || raw.includes("auth/user-not-found")) {
    return {
      message: "Incorrect email or password. Please check your credentials or create an account.",
      needsEmailProviderSetup: false,
    };
  }
  if (raw.includes("auth/email-already-in-use")) {
    return {
      message: "An account with this email already exists. Switch to Sign In above.",
      needsEmailProviderSetup: false,
    };
  }
  if (raw.includes("auth/weak-password")) {
    return {
      message: "Password should be at least 6 characters long.",
      needsEmailProviderSetup: false,
    };
  }
  if (raw.includes("auth/popup-closed-by-user")) {
    return {
      message: "Sign-in popup was closed before completing authentication.",
      needsEmailProviderSetup: false,
    };
  }
  if (raw.includes("auth/unauthorized-domain")) {
    return {
      message:
        "This preview domain needs to be listed under Authentication > Settings > Authorized domains in your Firebase Console.",
      needsEmailProviderSetup: false,
    };
  }
  return { message: raw, needsEmailProviderSetup: false };
}

export function AuthModal({
  isOpen,
  initialMode = "signin",
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferredCity, setPreferredCity] = useState<City>("Bengaluru");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorState, setErrorState] = useState<{
    message: string;
    needsEmailProviderSetup: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorState(null);
    setIsSubmitting(true);
    try {
      const signedInUser = await signInWithGoogle();
      onAuthSuccess(
        `Signed in as ${signedInUser.displayName || signedInUser.email}. Cloud sync is active.`
      );
      onClose();
    } catch (err) {
      setErrorState(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const { user, verificationSent } = await signUpWithEmail({
          fullName,
          email,
          password,
          preferredCity,
        });
        onAuthSuccess(
          verificationSent
            ? `Account created for ${user.email}! Please click the verification link sent to your inbox to activate cloud sync.`
            : `Account created for ${user.email}!`
        );
        onClose();
      } else {
        const signedInUser = await signInWithEmail(email, password);
        onAuthSuccess(
          signedInUser.emailVerified
            ? `Welcome back, ${signedInUser.displayName || signedInUser.email}! Cloud sync is active.`
            : `Signed in as ${signedInUser.email}. Verify your email in Account Settings to sync events to Firestore.`
        );
        onClose();
      }
    } catch (err) {
      setErrorState(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FCFBF8] border border-stone-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 bg-white border-b border-stone-200/80 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-rose-800">
              Celebrate AI Account · Cloud Sync
            </p>
            <h2 className="font-editorial text-2xl font-bold text-stone-900 mt-0.5">
              {mode === "signin"
                ? "Sign in to your workspace"
                : "Create your planner account"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="p-2 text-stone-400 hover:text-stone-900 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorState(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === "signin"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorState(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === "signup"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Primary Verified Google Sign-In */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 text-sm font-semibold rounded-xl flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.8 3.1 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.6 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-stone-400">
            <div className="h-px flex-1 bg-stone-200" />
            <span>or continue with email</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          {/* Error & Firebase Console Provider Walkthrough */}
          {errorState && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
              <p className="font-medium">{errorState.message}</p>
              {errorState.needsEmailProviderSetup && (
                <div className="pt-1 text-stone-700 space-y-1 border-t border-rose-200/70">
                  <p className="font-semibold text-stone-900">
                    Quick 30-second setup in Firebase Console:
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>
                      Open Firebase Console for project{" "}
                      <span className="font-mono font-semibold">celebrate-ai-ab5f6</span>
                    </li>
                    <li>
                      Go to <span className="font-semibold">Authentication &rarr; Sign-in method</span>
                    </li>
                    <li>
                      Click <span className="font-semibold">Email/Password</span>, toggle{" "}
                      <span className="font-semibold">Enable</span>, and click Save.
                    </li>
                  </ol>
                  <p className="text-stone-600 pt-0.5">
                    Or click <span className="font-semibold">Continue with Google</span> above, which is already enabled and verified.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={BLUEPRINT_LIMITS.DISPLAY_NAME_MAX}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aarav & Meera Kulkarni"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-rose-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">
                    Default Planning City
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={preferredCity}
                      onChange={(e) => setPreferredCity(e.target.value as City)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-rose-700"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-stone-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  maxLength={BLUEPRINT_LIMITS.EMAIL_MAX}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="host@familycelebration.in"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-rose-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-stone-700">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-rose-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSubmitting
                ? "Authenticating..."
                : mode === "signin"
                ? "Sign In with Email"
                : "Create Account & Save Plans"}
            </button>
          </form>

          <p className="text-xs text-stone-500 text-center">
            Your celebrations, budgets, guest RSVPs, and checklists are isolated to your account in Cloud Firestore.
          </p>
        </div>
      </div>
    </div>
  );
}

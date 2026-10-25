import React, { useEffect, useState } from "react";
import { X, Trash2, Plus, LogOut, RefreshCw, CloudUpload } from "lucide-react";
import { City, HydratedEvent } from "../shared/schemas";
import { useAuth } from "../context/AuthContext";
import { BLUEPRINT_LIMITS } from "../lib/firestoreStore";
import { formatInr, formatReadableDate } from "../lib/format";

interface AccountDrawerProps {
  isOpen: boolean;
  activeEvent: HydratedEvent | null;
  onClose: () => void;
  onSelectCloudEvent: (eventId: string) => Promise<void>;
  onDeleteCloudEvent: (eventId: string) => Promise<void>;
  onSyncCurrentEvent: () => Promise<void>;
  onStartNewEvent: () => void;
  onShowToast: (msg: string) => void;
}

const CITIES: City[] = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai"];

export function AccountDrawer({
  isOpen,
  activeEvent,
  onClose,
  onSelectCloudEvent,
  onDeleteCloudEvent,
  onSyncCurrentEvent,
  onStartNewEvent,
  onShowToast,
}: AccountDrawerProps) {
  const {
    user,
    profile,
    privateInfo,
    savedEvents,
    resendVerificationEmail,
    refreshVerificationStatus,
    saveUserProfile,
    signOutUser,
  } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [preferredCity, setPreferredCity] = useState<City>("Bengaluru");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setPreferredCity(profile.preferredCity);
    } else if (user?.displayName) {
      setDisplayName(user.displayName);
    }
    if (privateInfo) {
      setPhone(privateInfo.phone);
    }
  }, [profile, privateInfo, user]);

  if (!isOpen || !user) return null;

  const isCurrentEventSaved = activeEvent
    ? savedEvents.some((e) => e.id === activeEvent.id)
    : true;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await saveUserProfile({ displayName, preferredCity, phone });
      onShowToast("Saved planner profile & isolated contact details to Firestore.");
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/45 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-[#FCFBF8] h-full shadow-2xl border-l border-stone-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-stone-500 truncate">{user.email}</p>
            <h2 className="font-editorial text-xl font-bold text-stone-900 truncate">
              {profile?.displayName || user.displayName || "Planner Account"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account drawer"
            className="p-2 text-stone-500 hover:text-stone-900 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Email Verification Gate Banner (only shown if signed up with unverified email) */}
          {!user.emailVerified && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-950">
                  Verify your email to unlock Cloud Firestore storage
                </p>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  For security, Firestore rules require a verified email address before storing personal plans and guest lists. Check your inbox for our verification link.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={isCheckingVerify}
                  onClick={async () => {
                    setIsCheckingVerify(true);
                    try {
                      const verified = await refreshVerificationStatus();
                      if (verified) {
                        onShowToast("Email verified! Syncing your workspace to Firestore.");
                        await onSyncCurrentEvent();
                      } else {
                        onShowToast("Email is not marked verified yet. Please click the link in your email.");
                      }
                    } finally {
                      setIsCheckingVerify(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingVerify ? "animate-spin" : ""}`} />
                  I&apos;ve Verified — Sync Now
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await resendVerificationEmail();
                      onShowToast(`Sent fresh verification link to ${user.email}.`);
                    } catch (err) {
                      onShowToast(err instanceof Error ? err.message : "Could not resend email");
                    }
                  }}
                  className="px-3 py-2 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-950 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Resend Email
                </button>
              </div>
            </div>
          )}

          {/* My Saved Celebrations */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  Saved Celebrations ({savedEvents.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Synced live to your Firebase project (celebrate-ai-ab5f6)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onStartNewEvent();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                New Plan
              </button>
            </div>

            {user.emailVerified && activeEvent && !isCurrentEventSaved && (
              <button
                type="button"
                onClick={async () => {
                  await onSyncCurrentEvent();
                }}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                Save &ldquo;{activeEvent.input.title}&rdquo; to My Account
              </button>
            )}

            {savedEvents.length === 0 ? (
              <div className="p-5 bg-white border border-stone-200/90 rounded-xl text-center space-y-1">
                <p className="text-sm font-medium text-stone-800">
                  No cloud celebrations saved yet
                </p>
                <p className="text-xs text-stone-500">
                  {user.emailVerified
                    ? "Create a new celebration or load the demo event—it will automatically save to your account."
                    : "Verify your email above to start saving celebrations to Cloud Firestore."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedEvents.map((ev) => {
                  const isActive = activeEvent?.id === ev.id;
                  const isConfirmingDelete = confirmDeleteId === ev.id;
                  return (
                    <div
                      key={ev.id}
                      className={`p-4 bg-white border rounded-xl transition-colors ${
                        isActive ? "border-rose-700" : "border-stone-200/90"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                            <span className="capitalize font-medium text-rose-800">
                              {ev.eventType}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{ev.city}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {formatReadableDate(ev.date)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-stone-900 truncate">
                            {ev.title}
                          </p>
                          <p className="text-xs font-mono tabular-nums text-stone-600">
                            {formatInr(ev.totalBudget)} · {ev.guestCount} guests
                            {isActive ? " · Currently open" : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              disabled={loadingEventId === ev.id}
                              onClick={async () => {
                                setLoadingEventId(ev.id);
                                try {
                                  await onSelectCloudEvent(ev.id);
                                  onClose();
                                } finally {
                                  setLoadingEventId(null);
                                }
                              }}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              {loadingEventId === ev.id ? "Opening..." : "Open"}
                            </button>
                          )}

                          {isConfirmingDelete ? (
                            <button
                              type="button"
                              onClick={async () => {
                                await onDeleteCloudEvent(ev.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1.5 bg-rose-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(ev.id)}
                              aria-label={`Delete ${ev.title}`}
                              className="p-1.5 text-stone-400 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Planner Profile Preferences */}
          {user.emailVerified && (
            <section className="pt-6 border-t border-stone-200/80 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  Planner Profile &amp; Coordinator Contact
                </h3>
                <p className="text-xs text-stone-500">
                  Phone &amp; email are isolated in a private owner-only subcollection.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-stone-700">
                    Host / Planner Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.DISPLAY_NAME_MAX}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-rose-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-stone-700">
                      Preferred City
                    </label>
                    <select
                      value={preferredCity}
                      onChange={(e) => setPreferredCity(e.target.value as City)}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-rose-700"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-stone-700">
                      Coordinator Phone (Private)
                    </label>
                    <input
                      type="tel"
                      maxLength={BLUEPRINT_LIMITS.PHONE_MAX}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98450 00000"
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-rose-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </section>
          )}
        </div>

        {/* Footer Sign Out */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            {user.emailVerified ? "Firestore Sync Active" : "Local Mode (Unverified Email)"}
          </span>
          <button
            type="button"
            onClick={async () => {
              await signOutUser();
              onClose();
              onShowToast("Signed out of Celebrate AI.");
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

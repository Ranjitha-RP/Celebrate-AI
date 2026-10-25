/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, User as UserIcon } from "lucide-react";
import { EventInput, HydratedEvent } from "./shared/schemas";
import { api } from "./api/client";
import { formatInr, daysUntil, formatReadableDate } from "./lib/format";
import { useAuth } from "./context/AuthContext";
import {
  syncHydratedEventToFirestore,
  loadHydratedEventFromFirestore,
  deleteEventFromFirestore,
} from "./lib/firestoreStore";
import { SetupWizard } from "./components/SetupWizard";
import { OverviewTab } from "./components/OverviewTab";
import { BudgetTab } from "./components/BudgetTab";
import { TimelineTab } from "./components/TimelineTab";
import { GuestsTab } from "./components/GuestsTab";
import { VendorsTab } from "./components/VendorsTab";
import { ChatPlannerPanel } from "./components/ChatPlannerPanel";
import { PublicRsvpPortal } from "./components/PublicRsvpPortal";
import { AuthModal } from "./components/AuthModal";
import { AccountDrawer } from "./components/AccountDrawer";

type DashboardTab =
  | "overview"
  | "budget"
  | "timeline"
  | "guests"
  | "vendors"
  | "chat";

export default function App() {
  const { user, isAuthReady, profile, savedEvents } = useAuth();

  const [event, setEvent] = useState<HydratedEvent | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [accountDrawerOpen, setAccountDrawerOpen] = useState<boolean>(false);
  const [highlightedSections, setHighlightedSections] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [publicRsvpToken, setPublicRsvpToken] = useState<string | null>(null);

  const [isInitialLocalChecked, setIsInitialLocalChecked] = useState<boolean>(false);
  const autoRestoredForUidRef = useRef<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? "" : curr));
    }, 4500);
  };

  const persistEventEverywhere = async (nextEvent: HydratedEvent) => {
    setEvent(nextEvent);
    localStorage.setItem("celebrate_ai_active_event_id", nextEvent.id);
    if (user && user.emailVerified) {
      try {
        await syncHydratedEventToFirestore(user, nextEvent);
      } catch (err) {
        console.error("Cloud sync error:", err);
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("rsvp");
    if (token) {
      setPublicRsvpToken(token);
      setIsInitialLocalChecked(true);
      return;
    }

    const savedEventId = localStorage.getItem("celebrate_ai_active_event_id");
    if (savedEventId) {
      api
        .getEvent(savedEventId)
        .then((loaded) => setEvent(loaded))
        .catch(() => {
          localStorage.removeItem("celebrate_ai_active_event_id");
        })
        .finally(() => {
          setIsInitialLocalChecked(true);
        });
    } else {
      setIsInitialLocalChecked(true);
    }
  }, []);

  // Auto-restore latest cloud celebration when a verified user signs in with an empty workspace
  // or auto-save an existing local celebration (if non-demo) into their cloud account.
  useEffect(() => {
    if (!isInitialLocalChecked || !isAuthReady || !user || !user.emailVerified || publicRsvpToken) return;

    if (event) {
      // Avoid overwriting another user's shared static demo ID; only auto-sync user-scoped or custom events
      if (event.id !== "evt-golden-jubilee-blr") {
        void syncHydratedEventToFirestore(user, event).catch((err) =>
          console.error("Auto-sync warning:", err)
        );
      }
      return;
    }

    if (
      savedEvents.length > 0 &&
      autoRestoredForUidRef.current !== user.uid
    ) {
      autoRestoredForUidRef.current = user.uid;
      const latestId = savedEvents[0].id;
      void (async () => {
        try {
          const fromCloud = await loadHydratedEventFromFirestore(user, latestId);
          if (fromCloud) {
            const hydrated = await api.hydrateFromCloud(fromCloud);
            setEvent(hydrated);
            localStorage.setItem("celebrate_ai_active_event_id", hydrated.id);
          }
        } catch (err) {
          console.error("Cloud auto-restore error:", err);
        }
      })();
    }
  }, [isInitialLocalChecked, isAuthReady, user, user?.emailVerified, savedEvents, event, publicRsvpToken]);

  const handleSelectCloudEvent = async (cloudEventId: string) => {
    if (!user || !user.emailVerified) return;
    setIsGenerating(true);
    setLoadingStage("Restoring celebration plan from Cloud Firestore...");
    try {
      const fromCloud = await loadHydratedEventFromFirestore(user, cloudEventId);
      if (!fromCloud) {
        showToast("Celebration could not be found in Cloud Firestore.");
        return;
      }
      const hydrated = await api.hydrateFromCloud(fromCloud);
      setEvent(hydrated);
      localStorage.setItem("celebrate_ai_active_event_id", hydrated.id);
      setPublicRsvpToken(null);
      setActiveTab("overview");
      showToast(`Opened "${hydrated.input.title}" from your account.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to open cloud celebration");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCloudEvent = async (cloudEventId: string) => {
    if (!user || !user.emailVerified) return;
    try {
      await deleteEventFromFirestore(user, cloudEventId);
      if (event?.id === cloudEventId) {
        setEvent(null);
        localStorage.removeItem("celebrate_ai_active_event_id");
      }
      showToast("Removed celebration from your Cloud Firestore account.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete celebration");
    }
  };

  const handleSyncCurrentToCloud = async () => {
    if (!user || !user.emailVerified || !event) return;
    try {
      let targetEvent = event;
      if (event.id === "evt-golden-jubilee-blr") {
        // Re-scope shared demo ID to this user's own UID before writing to Firestore
        targetEvent = await api.loadDemoEvent(user.uid.slice(0, 12));
        setEvent(targetEvent);
        localStorage.setItem("celebrate_ai_active_event_id", targetEvent.id);
      }
      await syncHydratedEventToFirestore(user, targetEvent);
      showToast(`Saved "${targetEvent.input.title}" to Cloud Firestore.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Cloud save failed");
    }
  };

  const handleLoadDemo = async () => {
    setIsGenerating(true);
    setLoadingStage(
      "Loading 50th Anniversary Demo (120 Guests · ₹5,00,000 · Bengaluru)..."
    );
    try {
      const scope = user ? user.uid.slice(0, 12) : undefined;
      const demo = await api.loadDemoEvent(scope);
      await persistEventEverywhere(demo);
      setPublicRsvpToken(null);
      setActiveTab("overview");
      showToast(
        user?.emailVerified
          ? "Loaded Golden Jubilee Demo & saved to your Firestore account."
          : "Loaded Golden Jubilee Demo Event (Bengaluru · 120 Guests · ₹5,00,000)"
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load demo");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateAndGenerate = async (input: EventInput) => {
    setIsGenerating(true);
    setLoadingStage(
      `Synthesizing ${input.city} vendor blueprint & ${formatInr(input.totalBudget)} budget...`
    );
    try {
      const hydrated = await api.createAndGenerate(input);
      await persistEventEverywhere(hydrated);
      setActiveTab("overview");
      showToast(
        user?.emailVerified
          ? "Celebration blueprint generated and synced to Cloud Firestore."
          : "Celebration blueprint generated. Sign in anytime to save to your account."
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not generate celebration plan"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendChat = async (message: string) => {
    if (!event) return;
    setIsChatSending(true);
    try {
      const { event: updated, patch } = await api.sendChat(event.id, message);
      await persistEventEverywhere(updated);
      if (patch.changedSections.length > 0) {
        setHighlightedSections(patch.changedSections);
        showToast(
          `Updated ${patch.changedSections.join(", ")} via Conversational Planner`
        );
        setTimeout(() => setHighlightedSections([]), 9000);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Chat update failed");
    } finally {
      setIsChatSending(false);
    }
  };

  const handleExitPublicRsvp = async () => {
    setPublicRsvpToken(null);
    if (window.location.search.includes("rsvp=")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (event) {
      const refreshed = await api.getEvent(event.id);
      await persistEventEverywhere(refreshed);
      setActiveTab("guests");
    }
  };

  const confirmedHeadcount = event
    ? event.guests
        .filter((g) => g.status === "yes")
        .reduce((s, g) => s + g.partySize, 0)
    : 0;

  const totalPlanned = event
    ? event.budget.reduce((s, b) => s + b.plannedAmount, 0)
    : 0;

  const accountDisplayLabel =
    profile?.displayName ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "Account");

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] text-stone-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-200 px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Wordmark */}
        <button
          type="button"
          onClick={() => {
            setPublicRsvpToken(null);
            if (event) setActiveTab("overview");
          }}
          className="font-editorial text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Celebrate AI
        </button>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        {event && !publicRsvpToken ? (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            {(
              [
                { id: "overview", label: "Overview" },
                { id: "budget", label: "Budget" },
                { id: "timeline", label: "Timeline" },
                { id: "guests", label: "Guests" },
                { id: "vendors", label: "Vendors" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === item.id
                    ? "text-rose-800 font-semibold underline underline-offset-8 decoration-2 decoration-rose-700"
                    : "hover:text-stone-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <span className="whitespace-nowrap shrink-0">Grounded RAG</span>
            <span className="whitespace-nowrap shrink-0">Budget Solver</span>
            <span className="whitespace-nowrap shrink-0">Indian Rituals</span>
            <span className="whitespace-nowrap shrink-0">Cloud Sync</span>
          </nav>
        )}

        {/* Zone 3: Compact Utility & Account Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {event ? (
            <button
              type="button"
              onClick={() => {
                setPublicRsvpToken(null);
                setEvent(null);
                localStorage.removeItem("celebrate_ai_active_event_id");
              }}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              New Event
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLoadDemo}
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Load Demo
            </button>
          )}

          {user ? (
            <button
              type="button"
              onClick={() => setAccountDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[200px]"
            >
              <UserIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{accountDisplayLabel}</span>
              {savedEvents.length > 0 && (
                <span className="font-mono tabular-nums text-stone-300">
                  ({savedEvents.length})
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthModalMode("signin");
                setAuthModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In / Sign Up
            </button>
          )}
        </div>
      </header>

      {/* Subtle Toast Banner */}
      {toastMessage && (
        <div className="bg-stone-900 text-white text-xs font-medium px-6 py-2.5 text-center">
          {toastMessage}
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1">
        {publicRsvpToken ? (
          <PublicRsvpPortal
            token={publicRsvpToken}
            onBackToHostDashboard={event ? handleExitPublicRsvp : undefined}
          />
        ) : !event || isGenerating ? (
          <SetupWizard
            onCreateAndGenerate={handleCreateAndGenerate}
            onLoadDemo={handleLoadDemo}
            isLoading={isGenerating}
            loadingStage={loadingStage}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Celebration Workspace Summary Header */}
            <div className="bg-white border border-stone-200/90 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span className="capitalize font-medium text-rose-800">
                    {event.input.eventType}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{event.input.city}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {formatReadableDate(event.input.date)} (
                    {Math.max(0, daysUntil(event.input.date))} days away)
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{event.input.dietaryNeeds.join(", ")}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {user?.emailVerified
                      ? "Saved to Cloud Firestore"
                      : "Sign in to save to cloud"}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-stone-900">
                  {event.input.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs text-stone-500">Target Budget</p>
                  <p className="text-lg font-mono font-semibold tabular-nums text-stone-900">
                    {formatInr(event.input.totalBudget)}
                  </p>
                </div>
                <div className="h-8 w-px bg-stone-200 hidden sm:block" />
                <div>
                  <p className="text-xs text-stone-500">Allocated</p>
                  <p className="text-lg font-mono font-semibold tabular-nums text-rose-800">
                    {formatInr(totalPlanned)}
                  </p>
                </div>
                <div className="h-8 w-px bg-stone-200 hidden sm:block" />
                <div>
                  <p className="text-xs text-stone-500">Confirmed Guests</p>
                  <p className="text-lg font-mono font-semibold tabular-nums text-emerald-800">
                    {confirmedHeadcount} / {event.input.guestCount}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setChatDrawerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Refine via Chat
                </button>
              </div>
            </div>

            {/* Segmented Workspace Tab Bar (includes mobile & desktop 6-tab access) */}
            <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1">
              <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-lg">
                {(
                  [
                    { id: "overview", label: "Overview" },
                    { id: "budget", label: "Budget" },
                    { id: "timeline", label: "Timeline & Run Sheet" },
                    { id: "guests", label: "Guests & RSVP" },
                    { id: "vendors", label: "Vendors" },
                    { id: "chat", label: "Chat Co-Planner" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === t.id
                        ? "bg-white text-stone-900 shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleLoadDemo}
                className="text-xs font-medium text-stone-500 hover:text-stone-900 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Reset to 50th Anniversary Demo
              </button>
            </div>

            {/* Active Tab Body */}
            {activeTab === "overview" && (
              <OverviewTab
                event={event}
                highlightedSections={highlightedSections}
                onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
                onRegenerateInvite={async (tone, hostLine) => {
                  const updated = await api.generateInvitation(
                    event.id,
                    tone,
                    hostLine
                  );
                  await persistEventEverywhere(updated);
                  showToast("Updated English, Hindi & Kannada invitation cards.");
                }}
                onOpenPublicRsvp={() => setPublicRsvpToken(event.rsvpToken)}
              />
            )}

            {activeTab === "budget" && (
              <BudgetTab
                event={event}
                isHighlighted={highlightedSections.includes("budget")}
                onSaveBudget={async (payload) => {
                  const updated = await api.updateBudget(event.id, payload);
                  await persistEventEverywhere(updated);
                  showToast(
                    payload.autoRebalance
                      ? "Constraint solver rebalanced budget categories."
                      : "Saved budget allocations."
                  );
                }}
              />
            )}

            {activeTab === "timeline" && (
              <TimelineTab
                event={event}
                isHighlighted={highlightedSections.includes("tasks")}
                onToggleTask={async (taskId, completed) => {
                  const updated = await api.toggleTask(
                    event.id,
                    taskId,
                    completed
                  );
                  await persistEventEverywhere(updated);
                }}
                onAddTask={async (payload) => {
                  const updated = await api.addTask(event.id, payload);
                  await persistEventEverywhere(updated);
                  showToast("Added milestone to countdown checklist.");
                }}
                onUpdateRunSheet={async (itemId, status) => {
                  const updated = await api.updateRunSheetStatus(
                    event.id,
                    itemId,
                    status
                  );
                  await persistEventEverywhere(updated);
                }}
              />
            )}

            {activeTab === "guests" && (
              <GuestsTab
                event={event}
                onUpsertGuest={async (guest) => {
                  const updated = await api.upsertGuest(event.id, guest);
                  await persistEventEverywhere(updated);
                }}
                onOpenPublicRsvp={() => setPublicRsvpToken(event.rsvpToken)}
              />
            )}

            {activeTab === "vendors" && (
              <VendorsTab
                event={event}
                onToggleShortlist={async (vendorId) => {
                  const updated = await api.toggleShortlist(event.id, vendorId);
                  await persistEventEverywhere(updated);
                }}
              />
            )}

            {activeTab === "chat" && (
              <ChatPlannerPanel
                event={event}
                onSendMessage={handleSendChat}
                isSending={isChatSending}
              />
            )}
          </div>
        )}
      </main>

      {/* Slide-over Conversational Planner Drawer (accessible from any tab) */}
      {event && chatDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 flex justify-end">
          <div className="w-full max-w-xl bg-[#FCFBF8] h-full shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-900">
                Live Plan Co-Architect
              </span>
              <button
                type="button"
                onClick={() => setChatDrawerOpen(false)}
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <ChatPlannerPanel
                event={event}
                onSendMessage={handleSendChat}
                isSending={isChatSending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Firebase Sign In / Sign Up Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(msg) => showToast(msg)}
      />

      {/* Authenticated Account & Saved Cloud Celebrations Drawer */}
      <AccountDrawer
        isOpen={accountDrawerOpen}
        activeEvent={event}
        onClose={() => setAccountDrawerOpen(false)}
        onSelectCloudEvent={handleSelectCloudEvent}
        onDeleteCloudEvent={handleDeleteCloudEvent}
        onSyncCurrentEvent={handleSyncCurrentToCloud}
        onStartNewEvent={() => {
          setPublicRsvpToken(null);
          setEvent(null);
          localStorage.removeItem("celebrate_ai_active_event_id");
        }}
        onShowToast={showToast}
      />

      {/* Clean Quiet Footer */}
      <footer className="border-t border-stone-200/80 py-6 px-6 mt-12 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl w-full mx-auto">
        <span>
          Celebrate AI · Grounded Celebration Planning for Weddings, Milestones
          &amp; Festivals across India
        </span>
        <span>
          Firebase Auth &amp; Cloud Firestore Connected · Offline Demo Ready
        </span>
      </footer>
    </div>
  );
}

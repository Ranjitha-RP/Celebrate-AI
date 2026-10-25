import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Calendar, MapPin } from "lucide-react";
import { api } from "../api/client";
import { formatReadableDate } from "../lib/format";

interface PublicRsvpPortalProps {
  token: string;
  onBackToHostDashboard?: () => void;
}

export const PublicRsvpPortal: React.FC<PublicRsvpPortalProps> = ({
  token,
  onBackToHostDashboard,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventInfo, setEventInfo] = useState<Awaited<
    ReturnType<typeof api.getPublicRsvp>
  > | null>(null);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"yes" | "no">("yes");
  const [partySize, setPartySize] = useState(2);
  const [dietaryPreference, setDietaryPreference] = useState("Pure Veg");
  const [notes, setNotes] = useState("");
  const [submittedMsg, setSubmittedMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getPublicRsvp(token)
      .then((data) => {
        setEventInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Invitation link could not be loaded.");
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.submitPublicRsvp(token, {
        name: name.trim(),
        contact: contact.trim(),
        status,
        partySize: status === "no" ? 1 : partySize,
        dietaryPreference,
        notes: notes.trim(),
      });
      setSubmittedMsg(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 space-y-4 animate-pulse">
          <div className="h-4 w-36 bg-stone-200 rounded mx-auto" />
          <div className="h-8 w-3/4 bg-stone-200 rounded mx-auto" />
          <div className="h-24 w-full bg-stone-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !eventInfo) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-base font-semibold text-stone-900">
          {error || "RSVP Invitation Not Found"}
        </p>
        {onBackToHostDashboard && (
          <button
            type="button"
            onClick={onBackToHostDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Planner
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      {onBackToHostDashboard && (
        <button
          type="button"
          onClick={onBackToHostDashboard}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Host Dashboard (Live
          Headcount Syncs Automatically)
        </button>
      )}

      <div className="bg-white border-2 border-amber-500/60 rounded-2xl p-8 md:p-10 space-y-6">
        {/* Invitation Header */}
        <div className="text-center space-y-3 border-b border-stone-200 pb-6">
          <p className="text-xs tracking-widest uppercase text-amber-800 font-medium">
            || शुभ निमंत्रण · ಶುಭ ಆಮಂತ್ರಣ · Cordial Invitation ||
          </p>
          <h1 className="font-editorial text-2xl md:text-3xl font-semibold text-rose-900">
            {eventInfo.invitation?.english.headline || eventInfo.title}
          </h1>
          <p className="text-sm text-stone-700 leading-relaxed max-w-lg mx-auto">
            {eventInfo.invitation?.english.body ||
              `We warmly invite you to celebrate ${eventInfo.title} with our family.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-stone-600 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-700" />
              {formatReadableDate(eventInfo.date)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-700" />
              {eventInfo.venueName}, {eventInfo.city}
            </span>
          </div>

          {eventInfo.muhuratWindow && (
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200/70 rounded-lg px-3 py-2 mt-2">
              {eventInfo.muhuratWindow}
            </p>
          )}
        </div>

        {/* RSVP Form or Confirmation */}
        {submittedMsg ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
            <h2 className="text-xl font-semibold text-stone-900">
              {submittedMsg}
            </h2>
            <p className="text-sm text-stone-600">
              Recorded for <strong>{name}</strong> (
              {status === "yes"
                ? `Attending · Party of ${partySize} · ${dietaryPreference}`
                : "Sending warm wishes from afar"}
              ).
            </p>
            {onBackToHostDashboard && (
              <button
                type="button"
                onClick={onBackToHostDashboard}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer"
              >
                Return to Host Guest Tracker to Verify Live Count
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-base font-semibold text-stone-900">
              Share Your RSVP
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Your Full Name / Family Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Smt. Sudha & Sri Mohan"
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Phone Number or Email
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+91 98450..."
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("yes")}
                className={`py-2.5 px-4 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  status === "yes"
                    ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                    : "border-stone-200 bg-white text-stone-700"
                }`}
              >
                Joyfully Attending
              </button>
              <button
                type="button"
                onClick={() => setStatus("no")}
                className={`py-2.5 px-4 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  status === "no"
                    ? "border-stone-800 bg-stone-100 text-stone-900"
                    : "border-stone-200 bg-white text-stone-700"
                }`}
              >
                Unable to Attend
              </button>
            </div>

            {status === "yes" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Number of Guests Attending
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Dietary Preference
                  </label>
                  <select
                    value={dietaryPreference}
                    onChange={(e) => setDietaryPreference(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
                  >
                    <option value="Pure Veg">Pure Vegetarian</option>
                    <option value="Jain">Jain (No Onion / No Garlic)</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Halal">Halal</option>
                    <option value="Non-Veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Blessings, Arrival Timing or Elder Seating Requests
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note for the host family..."
                className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Submitting RSVP..." : "Confirm RSVP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

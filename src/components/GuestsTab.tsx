import React, { useState } from "react";
import { Copy, Check, ExternalLink, UserPlus } from "lucide-react";
import { HydratedEvent } from "../shared/schemas";

interface GuestsTabProps {
  event: HydratedEvent;
  onUpsertGuest: (guest: {
    id?: string;
    name: string;
    contact?: string;
    status: "yes" | "no" | "pending";
    partySize: number;
    dietaryPreference: string;
    notes?: string;
  }) => Promise<void>;
  onOpenPublicRsvp: () => void;
}

export const GuestsTab: React.FC<GuestsTabProps> = ({
  event,
  onUpsertGuest,
  onOpenPublicRsvp,
}) => {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [dietary, setDietary] = useState("Pure Veg");
  const [notes, setNotes] = useState("");

  const rsvpUrl = `${window.location.origin}/?rsvp=${event.rsvpToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rsvpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onUpsertGuest({
      name: name.trim(),
      contact: contact.trim(),
      status: "pending",
      partySize,
      dietaryPreference: dietary,
      notes: notes.trim(),
    });
    setName("");
    setContact("");
    setPartySize(2);
    setNotes("");
  };

  const confirmedHeadcount = event.guests
    .filter((g) => g.status === "yes")
    .reduce((s, g) => s + g.partySize, 0);
  const pendingHeadcount = event.guests
    .filter((g) => g.status === "pending")
    .reduce((s, g) => s + g.partySize, 0);
  const declinedHeadcount = event.guests
    .filter((g) => g.status === "no")
    .reduce((s, g) => s + g.partySize, 0);

  // Dietary tally among confirmed + pending
  const dietaryCounts = event.guests
    .filter((g) => g.status !== "no")
    .reduce<Record<string, number>>((acc, g) => {
      acc[g.dietaryPreference] = (acc[g.dietaryPreference] || 0) + g.partySize;
      return acc;
    }, {});

  return (
    <div className="space-y-8">
      {/* Shareable RSVP Link Banner + Headcount KPI Strip */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Shareable Guest RSVP Link
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Send this link to family &amp; guests—responses update your live
              catering headcount and dietary split automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <code className="px-3 py-2 text-xs font-mono bg-stone-100 text-stone-800 rounded-lg border border-stone-200 max-w-xs truncate">
              {rsvpUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenPublicRsvp}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Guest RSVP Portal
            </button>
          </div>
        </div>

        {/* Headcount Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-stone-500">Confirmed Attending</p>
            <p className="text-2xl font-mono font-semibold tabular-nums text-emerald-800 mt-1">
              {confirmedHeadcount}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Awaiting Response</p>
            <p className="text-2xl font-mono font-semibold tabular-nums text-amber-800 mt-1">
              {pendingHeadcount}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Regrets / Declined</p>
            <p className="text-2xl font-mono font-semibold tabular-nums text-stone-500 mt-1">
              {declinedHeadcount}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Dietary Plate Breakdown</p>
            <p className="text-xs font-mono tabular-nums text-stone-800 mt-2 leading-relaxed">
              {Object.entries(dietaryCounts)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ") || "No guests added"}
            </p>
          </div>
        </div>
      </div>

      {/* Add Guest Form */}
      <form
        onSubmit={handleAddGuest}
        className="bg-white border border-stone-200/90 rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
      >
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Guest / Family Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sri Ramesh & Family"
            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Phone or Email
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+91 98450..."
            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Headcount
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-stone-50 border border-stone-300 rounded-lg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Dietary Preference
          </label>
          <select
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
          >
            <option value="Pure Veg">Pure Veg</option>
            <option value="Jain">Jain (No Onion/Garlic)</option>
            <option value="Vegan">Vegan</option>
            <option value="Halal">Halal</option>
            <option value="Non-Veg">Non-Veg</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Guest
          </button>
        </div>
      </form>

      {/* Guest List Table */}
      <div className="bg-white border border-stone-200/90 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-xs font-semibold text-stone-600">
                <th className="py-3 px-5">Family / Guest</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Party Size</th>
                <th className="py-3 px-4">Dietary</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-5 text-right">RSVP Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/80 text-sm">
              {event.guests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-sm text-stone-500"
                  >
                    No guests added yet. Add a family above or open the Guest
                    RSVP Portal to test live submissions.
                  </td>
                </tr>
              ) : (
                event.guests.map((g) => (
                  <tr key={g.id} className="hover:bg-stone-50/60">
                    <td className="py-3.5 px-5 font-medium text-stone-900">
                      {g.name}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-stone-600">
                      {g.contact || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-stone-900">
                      {g.partySize}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-700">
                      {g.dietaryPreference}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-500 max-w-xs truncate">
                      {g.notes || "—"}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <select
                        value={g.status}
                        onChange={(e) =>
                          onUpsertGuest({
                            ...g,
                            status: e.target.value as "yes" | "no" | "pending",
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border cursor-pointer ${
                          g.status === "yes"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : g.status === "no"
                            ? "border-stone-300 bg-stone-100 text-stone-600"
                            : "border-amber-300 bg-amber-50 text-amber-900"
                        }`}
                      >
                        <option value="yes">Attending (Yes)</option>
                        <option value="pending">Pending</option>
                        <option value="no">Declined (No)</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

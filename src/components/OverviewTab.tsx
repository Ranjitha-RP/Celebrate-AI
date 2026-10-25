import React, { useState } from "react";
import {
  Printer,
  RefreshCw,
  BookmarkCheck,
  Share2,
  Download,
  Copy,
  Check,
  X,
} from "lucide-react";
import { HydratedEvent } from "../shared/schemas";
import { formatInr } from "../lib/format";
import {
  renderInvitationCardPng,
  printImageViaHiddenFrame,
} from "../lib/invitationImage";
import moodAnniversary from "../assets/images/mood_golden_anniversary_1792912111997.jpg";
import moodCourtyard from "../assets/images/mood_royal_courtyard_1792912110204.jpg";

interface OverviewTabProps {
  event: HydratedEvent;
  highlightedSections: string[];
  onNavigateTab: (tab: string) => void;
  onRegenerateInvite: (tone: string, hostLine: string) => Promise<void>;
  onOpenPublicRsvp: () => void;
}

const INVITE_TONES = [
  "Warm Traditional",
  "Regal Poetic",
  "Modern Minimal",
  "Joyful Family Casual",
];

export const OverviewTab: React.FC<OverviewTabProps> = ({
  event,
  highlightedSections,
  onNavigateTab,
  onRegenerateInvite,
  onOpenPublicRsvp,
}) => {
  const [inviteLang, setInviteLang] = useState<"english" | "hindi" | "kannada">(
    "english"
  );
  const [tone, setTone] = useState(
    event.invitation?.tone || "Warm Traditional"
  );
  const [hostLine, setHostLine] = useState(
    event.invitation?.hostLine || "Hosted with love by the Family"
  );
  const [isUpdatingInvite, setIsUpdatingInvite] = useState(false);
  const [isRenderingImage, setIsRenderingImage] = useState(false);
  const [cardModalData, setCardModalData] = useState<{
    dataUrl: string;
    blob: Blob;
    fileName: string;
  } | null>(null);
  const [shareFeedback, setShareFeedback] = useState("");
  const [img1Err, setImg1Err] = useState(false);
  const [img2Err, setImg2Err] = useState(false);

  const plan = event.plan;
  if (!plan) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
        <p className="text-sm text-stone-600">
          No AI plan generated yet for this celebration.
        </p>
      </div>
    );
  }

  const isHighlighted = (sec: string) => highlightedSections.includes(sec);

  const handleUpdateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingInvite(true);
    try {
      await onRegenerateInvite(tone, hostLine);
    } finally {
      setIsUpdatingInvite(false);
    }
  };

  const activeCopy = event.invitation
    ? event.invitation[inviteLang]
    : {
        headline: event.input.title,
        body: plan.summaryPitch,
        rsvpNote: `${event.input.date} · ${event.input.city}`,
      };

  const rsvpShareUrl = `${window.location.origin}/?rsvp=${event.rsvpToken}`;

  const handleOpenCardImageAndPrint = async () => {
    setIsRenderingImage(true);
    setShareFeedback("");
    try {
      const rendered = await renderInvitationCardPng({
        kicker: "|| शुभमस्तु · ಶುಭಮಸ್ತು · Auspicious Celebration ||",
        headline: activeCopy.headline,
        body: activeCopy.body,
        rsvpNote: activeCopy.rsvpNote,
        hostLine: event.invitation?.hostLine || hostLine,
        rsvpUrl: rsvpShareUrl,
      });
      const safeSlug = event.input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const fileName = `${safeSlug || "celebration"}-${inviteLang}-invite.png`;
      setCardModalData({ ...rendered, fileName });
    } finally {
      setIsRenderingImage(false);
    }
  };

  const handleDownloadCardPng = () => {
    if (!cardModalData) return;
    const link = document.createElement("a");
    link.href = cardModalData.dataUrl;
    link.download = cardModalData.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setShareFeedback("Invitation image downloaded as PNG.");
  };

  const handleShareOrCopyCardImage = async () => {
    if (!cardModalData) return;
    const file = new File([cardModalData.blob], cardModalData.fileName, {
      type: "image/png",
    });

    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      (!navigator.canShare || navigator.canShare({ files: [file] }))
    ) {
      try {
        await navigator.share({
          title: activeCopy.headline,
          text: `${activeCopy.headline}\n${activeCopy.rsvpNote}\nRSVP: ${rsvpShareUrl}`,
          files: [file],
        });
        setShareFeedback("Shared invitation card image.");
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      "ClipboardItem" in window
    ) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": cardModalData.blob }),
        ]);
        setShareFeedback(
          "Copied invitation card image to clipboard — paste directly into WhatsApp, Email, or Messages."
        );
        return;
      } catch {
        // Fallback to downloading PNG if clipboard image write is restricted in iframe
      }
    }

    handleDownloadCardPng();
  };

  return (
    <div className="space-y-10">
      {/* Executive Pitch & Theme Mood Board */}
      <section className="bg-white border border-stone-200/90 rounded-xl p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span>Cited Theme: {plan.theme.sourceThemeId}</span>
              <span aria-hidden="true">·</span>
              <span>{event.input.subTradition}</span>
              <span aria-hidden="true">·</span>
              <span>
                {plan.generatedVia === "gemini-rag"
                  ? "Grounded via Gemini + RAG"
                  : "Verified RAG Catalog"}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold text-stone-900">
              {plan.theme.name}
            </h2>
            <p className="text-sm md:text-base text-stone-700 leading-relaxed">
              {plan.summaryPitch}
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">
              {plan.theme.description}
            </p>

            {/* Color Palette Swatches */}
            <div className="pt-2">
              <p className="text-xs font-medium text-stone-500 mb-2.5">
                Theme Colour Palette &amp; Scenography Notes
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {plan.theme.palette.map((hex, i) => (
                  <div key={hex + i} className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-md border border-stone-300 shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="text-xs">
                      <p className="font-medium text-stone-800">
                        {plan.theme.paletteNames[i] || "Accent"}
                      </p>
                      <p className="font-mono text-stone-500">{hex}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-600 mt-3 leading-relaxed">
                {plan.theme.moodBoardDescription}
              </p>
            </div>
          </div>

          {/* Mood Board Visual Pair */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg overflow-hidden border border-stone-200 aspect-[4/3] bg-stone-100">
              {!img1Err ? (
                <img
                  src={moodAnniversary}
                  alt="Festive silk runner, brass lamps, and banana leaf dining moodboard"
                  referrerPolicy="no-referrer"
                  onError={() => setImg1Err(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-amber-50 flex items-center justify-center text-xs text-amber-900 p-3 text-center">
                  Kanjeevaram &amp; Brass Tablescape
                </div>
              )}
            </div>
            <div className="rounded-lg overflow-hidden border border-stone-200 aspect-[4/3] bg-stone-100">
              {!img2Err ? (
                <img
                  src={moodCourtyard}
                  alt="Warm Indian sandstone courtyard lit with dusk string lights"
                  referrerPolicy="no-referrer"
                  onError={() => setImg2Err(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-rose-50 flex items-center justify-center text-xs text-rose-900 p-3 text-center">
                  Dusk Courtyard Lighting
                </div>
              )}
            </div>
            <div className="col-span-2 bg-stone-50 border border-stone-200/80 rounded-lg p-3.5 flex items-center justify-between gap-4">
              <div className="text-xs text-stone-600">
                <span className="font-semibold text-stone-900">
                  Shortlisted Vendors:
                </span>{" "}
                {event.shortlistedVendorIds.length} saved from {event.input.city}{" "}
                catalog
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("vendors")}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 whitespace-nowrap cursor-pointer"
              >
                Explore Directory →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Cited Recommendations Grid (Venue, Catering, Decor, Entertainment, Photo) */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-stone-900">
            Dataset-Cited Celebration Blueprint
          </h2>
          <span className="text-xs text-stone-500">
            Every vendor ID verified against {event.input.city} seed catalog
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Venue Card */}
          <div
            className={`bg-white rounded-xl p-6 border transition-colors ${
              isHighlighted("venue")
                ? "border-amber-500 ring-2 ring-amber-200/70"
                : "border-stone-200/90"
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-2">
              <span>
                Venue · Source ID:{" "}
                <strong className="font-mono text-stone-800">
                  {plan.venueSuggestions[0]?.citedVendorId}
                </strong>
              </span>
              {isHighlighted("venue") && (
                <span className="text-amber-800 font-semibold">
                  Updated via Chat
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-semibold text-stone-900">
                {plan.venueSuggestions[0]?.citedVendorName}
              </h3>
              <span className="text-base font-mono font-semibold tabular-nums text-rose-800 shrink-0">
                {formatInr(plan.venueSuggestions[0]?.estimatedCostInr || 0)}
              </span>
            </div>
            <p className="text-sm text-stone-600 mt-2">
              {plan.venueSuggestions[0]?.rationale}
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-stone-700">
              {plan.venueSuggestions[0]?.highlights.map((h, i) => (
                <li key={i}>• {h}</li>
              ))}
            </ul>
            {plan.venueSuggestions[1] && (
              <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
                <span>
                  Backup: {plan.venueSuggestions[1].citedVendorName} (
                  {plan.venueSuggestions[1].citedVendorId})
                </span>
                <span className="font-mono tabular-nums">
                  {formatInr(plan.venueSuggestions[1].estimatedCostInr)}
                </span>
              </div>
            )}
          </div>

          {/* Catering Menu Card */}
          <div
            className={`bg-white rounded-xl p-6 border transition-colors ${
              isHighlighted("catering")
                ? "border-amber-500 ring-2 ring-amber-200/70"
                : "border-stone-200/90"
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-2">
              <span>
                Catering · Source ID:{" "}
                <strong className="font-mono text-stone-800">
                  {plan.cateringPlan.citedVendorId}
                </strong>
              </span>
              {isHighlighted("catering") && (
                <span className="text-amber-800 font-semibold">
                  Updated via Chat
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-semibold text-stone-900">
                {plan.cateringPlan.citedVendorName}
              </h3>
              <span className="text-base font-mono font-semibold tabular-nums text-rose-800 shrink-0">
                {formatInr(plan.cateringPlan.estimatedTotalInr)}{" "}
                <span className="text-xs font-normal text-stone-500">
                  ({formatInr(plan.cateringPlan.perPlateInr)}/plate)
                </span>
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-1.5 font-medium">
              {plan.cateringPlan.dietaryComplianceNote}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-stone-700">
              <div>
                <p className="font-semibold text-stone-900 mb-1">
                  Welcome &amp; Starters
                </p>
                <p>
                  {[
                    ...plan.cateringPlan.welcomeDrinks.slice(0, 1),
                    ...plan.cateringPlan.starters.slice(0, 2),
                  ].join(" · ")}
                </p>
              </div>
              <div>
                <p className="font-semibold text-stone-900 mb-1">
                  Mains &amp; Mithai
                </p>
                <p>
                  {[
                    ...plan.cateringPlan.mainCourse.slice(0, 2),
                    ...plan.cateringPlan.desserts.slice(0, 2),
                  ].join(" · ")}
                </p>
              </div>
            </div>
          </div>

          {/* Decor Card */}
          <div
            className={`bg-white rounded-xl p-6 border transition-colors ${
              isHighlighted("decor")
                ? "border-amber-500 ring-2 ring-amber-200/70"
                : "border-stone-200/90"
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-2">
              <span>
                Decor · Source ID:{" "}
                <strong className="font-mono text-stone-800">
                  {plan.decorPlan.citedVendorId}
                </strong>
              </span>
              {isHighlighted("decor") && (
                <span className="text-amber-800 font-semibold">
                  Updated via Chat
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-semibold text-stone-900">
                {plan.decorPlan.citedVendorName}
              </h3>
              <span className="text-base font-mono font-semibold tabular-nums text-rose-800 shrink-0">
                {formatInr(plan.decorPlan.estimatedCostInr)}
              </span>
            </div>
            <p className="text-sm text-stone-600 mt-1.5">
              {plan.decorPlan.rationale}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-stone-700">
              {plan.decorPlan.highlights.map((h, i) => (
                <li key={i}>• {h}</li>
              ))}
            </ul>
          </div>

          {/* Entertainment & Photography Card */}
          <div
            className={`bg-white rounded-xl p-6 border transition-colors space-y-4 ${
              isHighlighted("entertainment") || isHighlighted("photography")
                ? "border-amber-500 ring-2 ring-amber-200/70"
                : "border-stone-200/90"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>
                  Entertainment ·{" "}
                  <strong className="font-mono text-stone-800">
                    {plan.entertainmentPlan.citedVendorId}
                  </strong>
                </span>
                <span className="font-mono font-semibold tabular-nums text-rose-800">
                  {formatInr(plan.entertainmentPlan.estimatedCostInr)}
                </span>
              </div>
              <h3 className="text-base font-semibold text-stone-900">
                {plan.entertainmentPlan.citedVendorName}
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                {plan.entertainmentPlan.rationale}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>
                  Photography ·{" "}
                  <strong className="font-mono text-stone-800">
                    {plan.photographyPlan.citedVendorId}
                  </strong>
                </span>
                <span className="font-mono font-semibold tabular-nums text-rose-800">
                  {formatInr(plan.photographyPlan.estimatedCostInr)}
                </span>
              </div>
              <h3 className="text-base font-semibold text-stone-900">
                {plan.photographyPlan.citedVendorName}
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                {plan.photographyPlan.rationale}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiator 11: Cultural, Muhurat & Regional Ritual Intelligence */}
      <section className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 mb-2">
          <span>
            Cultural &amp; Muhurat Knowledge Base · Source ID:{" "}
            <strong className="font-mono">
              {plan.culturalAdvisory.sourceCultureId}
            </strong>
          </span>
          <span>{plan.culturalAdvisory.sourceCultureTitle}</span>
        </div>
        <h2 className="text-xl font-semibold text-stone-900">
          Auspicious Timing (Muhurat) &amp; Regional Customs
        </h2>
        <p className="text-sm font-medium text-stone-800 mt-2 bg-white/90 border border-amber-200/70 rounded-lg p-3.5">
          {plan.culturalAdvisory.muhuratWindow}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 mb-2">
              Key Ceremonial Moments
            </h3>
            <ul className="space-y-2 text-sm text-stone-700">
              {plan.culturalAdvisory.rituals.map((r, idx) => (
                <li key={idx} className="leading-snug">
                  0{idx + 1}. {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 mb-2">
                Regional Culinary &amp; Hospitality Notes
              </h3>
              <ul className="space-y-1.5 text-sm text-stone-700">
                {plan.culturalAdvisory.regionalFoodNotes.map((fn, idx) => (
                  <li key={idx}>• {fn}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-stone-600 pt-2 border-t border-amber-200/60">
              <strong className="text-stone-800">Host Etiquette Tip:</strong>{" "}
              {plan.culturalAdvisory.etiquetteTip}
            </p>
          </div>
        </div>
      </section>

      {/* Differentiator 9: Trilingual AI Invitation Studio (English, Hindi, Kannada) */}
      <section className="bg-white border border-stone-200/90 rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">
              Trilingual Printable Invitation Studio
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Switch instantaneously between English, हिन्दी (Hindi), and ಕನ್ನಡ
              (Kannada), customize tone, or print/save PDF.
            </p>
          </div>

          {/* Language Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg self-start">
            {(
              [
                { id: "english", label: "English" },
                { id: "hindi", label: "हिन्दी" },
                { id: "kannada", label: "ಕನ್ನಡ" },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setInviteLang(l.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  inviteLang === l.id
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 items-start">
          {/* Tone & Host Controls */}
          <form
            onSubmit={handleUpdateInvite}
            className="lg:col-span-5 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Invitation Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
              >
                {INVITE_TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Host Signature Line
              </label>
              <input
                type="text"
                value={hostLine}
                onChange={(e) => setHostLine(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
              />
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="submit"
                disabled={isUpdatingInvite}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isUpdatingInvite ? "animate-spin" : ""
                  }`}
                />
                {isUpdatingInvite ? "Composing..." : "Rewrite in 3 Languages"}
              </button>

              <button
                type="button"
                disabled={isRenderingImage}
                onClick={handleOpenCardImageAndPrint}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                {isRenderingImage
                  ? "Generating Card..."
                  : "Print & Share Card Image"}
              </button>

              <button
                type="button"
                onClick={onOpenPublicRsvp}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                Preview Guest RSVP Link
              </button>
            </div>
          </form>

          {/* Printable Festive Stationery Card */}
          <div className="lg:col-span-7">
            <div
              id="printable-invitation-card"
              className="bg-[#FCFBF8] border-2 border-amber-500/70 rounded-xl p-8 md:p-10 text-center space-y-5"
            >
              <p className="text-xs tracking-widest uppercase text-amber-800 font-medium">
                || शुभमस्तु · ಶುಭಮಸ್ತು · Auspicious Celebration ||
              </p>
              <h3 className="font-editorial text-2xl md:text-3xl font-semibold text-rose-900 leading-snug">
                {activeCopy.headline}
              </h3>
              <div className="w-16 h-px bg-amber-500 mx-auto" />
              <p className="text-sm md:text-base text-stone-800 leading-relaxed max-w-xl mx-auto">
                {activeCopy.body}
              </p>
              <p className="text-xs md:text-sm font-medium text-stone-700 pt-2">
                {activeCopy.rsvpNote}
              </p>
              <p className="text-xs italic text-stone-500 pt-2">
                {event.invitation?.hostLine || hostLine}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Printable & Shareable Invitation Image Modal */}
      {cardModalData && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setCardModalData(null)}
        >
          <div
            className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  Invitation Card Image Ready to Print &amp; Share
                </h3>
                <p className="text-xs text-stone-500">
                  High-resolution PNG stationery card ({inviteLang.toUpperCase()})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCardModalData(null)}
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-stone-100/80 overflow-y-auto flex-1 flex flex-col items-center justify-center">
              <img
                src={cardModalData.dataUrl}
                alt={`${event.input.title} Invitation Card`}
                className="max-h-[54vh] w-auto rounded-lg shadow-md border border-stone-200"
              />
              {shareFeedback && (
                <p className="mt-3 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5 inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {shareFeedback}
                </p>
              )}
            </div>

            <div className="px-6 py-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() =>
                  printImageViaHiddenFrame(
                    cardModalData.dataUrl,
                    event.input.title
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Card
              </button>

              <button
                type="button"
                onClick={handleShareOrCopyCardImage}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                { typeof navigator !== "undefined" && "share" in navigator ? (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    Share / Copy Image
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Image to Share
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadCardPng}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Download PNG Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Roadmap ("Coming Soon" strip per hackathon spec) */}
      <section className="border-t border-stone-200 pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h3 className="text-sm font-semibold text-stone-900">
            Product Roadmap · Upcoming Capabilities
          </h3>
          <span className="text-xs text-stone-500">
            Preview of Phase 2 post-hackathon integrations
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "UPI Escrow & Vendor Milestones",
              desc: "Split advance & post-delivery vendor payouts with milestone protection.",
            },
            {
              title: "WhatsApp Business RSVP Bot",
              desc: "One-tap automated family reminders & location pins via WhatsApp.",
            },
            {
              title: "Face-Clustered Photo Album",
              desc: "AI post-event gallery delivering each guest's candid photos privately.",
            },
            {
              title: "Zero-Waste & Carbon Estimator",
              desc: "Surplus food donation routing to local NGOs & steel/leaf footprint tracker.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-stone-50/90 border border-stone-200/70 rounded-lg p-4 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-stone-800">
                  {item.title}
                </span>
                <BookmarkCheck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                {item.desc}
              </p>
              <p className="text-[11px] text-amber-800 font-medium pt-1">
                Coming soon
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

import React, { useState } from "react";
import { ArrowRight, Calendar, Users, IndianRupee, MapPin, Check } from "lucide-react";
import { EventInput, City, EventType } from "../shared/schemas";
import { formatInr } from "../lib/format";
import heroImage from "../assets/images/hero_indian_celebration_1792912108085.jpg";

interface SetupWizardProps {
  onCreateAndGenerate: (input: EventInput) => Promise<void>;
  onLoadDemo: () => Promise<void>;
  isLoading: boolean;
  loadingStage: string;
}

const CITIES: City[] = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai"];

const EVENT_TYPES: Array<{ value: EventType; label: string; defaultTradition: string }> = [
  { value: "anniversary", label: "Anniversary", defaultTradition: "South Indian Golden Jubilee (Suvarna Mahotsava)" },
  { value: "wedding", label: "Wedding", defaultTradition: "Traditional Kalyana / Courtyard Wedding" },
  { value: "birthday", label: "Birthday", defaultTradition: "Multi-Generational Milestone Celebration" },
  { value: "festival", label: "Festival", defaultTradition: "Deepavali / Ganesh / Harvest Utsav" },
  { value: "corporate", label: "Corporate", defaultTradition: "Boutique Founders Townhall & Dinner" },
];

const DIETARY_OPTIONS = [
  "Pure Veg",
  "Jain Friendly",
  "Vegan Options",
  "Halal",
  "Veg & Non-Veg",
];

export const SetupWizard: React.FC<SetupWizardProps> = ({
  onCreateAndGenerate,
  onLoadDemo,
  isLoading,
  loadingStage,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [imgFailed, setImgFailed] = useState(false);

  const [title, setTitle] = useState("Aarav & Meera's Courtyard Celebration");
  const [eventType, setEventType] = useState<EventType>("anniversary");
  const [subTradition, setSubTradition] = useState(
    "South Indian Golden Jubilee (Suvarna Mahotsava)"
  );
  const [city, setCity] = useState<City>("Bengaluru");
  const [date, setDate] = useState("2026-12-18");
  const [guestCount, setGuestCount] = useState(120);
  const [totalBudget, setTotalBudget] = useState(500000);
  const [vibePreferences, setVibePreferences] = useState(
    "Warm stone courtyard, Mysore jasmine & brass lamps, live acoustic melodies, elder-friendly seating"
  );
  const [dietaryNeeds, setDietaryNeeds] = useState<string[]>([
    "Pure Veg",
    "Jain Friendly",
  ]);

  const toggleDietary = (opt: string) => {
    setDietaryNeeds((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateAndGenerate({
      title: title.trim() || "Family Celebration",
      eventType,
      subTradition,
      date,
      city,
      guestCount: Math.max(10, guestCount),
      totalBudget: Math.max(25000, totalBudget),
      vibePreferences,
      dietaryNeeds: dietaryNeeds.length > 0 ? dietaryNeeds : ["Pure Veg"],
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-white border border-stone-200/90 rounded-2xl p-8 md:p-12">
          <p className="text-xs font-medium text-rose-700 tracking-wide">
            Synthesizing Grounded Celebration Plan
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-stone-900 mt-2">
            {loadingStage}
          </h2>
          <p className="text-sm text-stone-600 mt-2 max-w-xl">
            Retrieving top-rated {city} vendors from our 45-vendor RAG catalog,
            calibrating category constraints, and checking regional muhurat windows.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="border border-stone-200/80 rounded-xl p-5 space-y-3 animate-pulse"
              >
                <div className="h-4 w-28 bg-stone-200 rounded" />
                <div className="h-6 w-3/4 bg-stone-200 rounded" />
                <div className="h-3 w-full bg-stone-100 rounded" />
                <div className="h-3 w-5/6 bg-stone-100 rounded" />
                <div className="h-8 w-24 bg-stone-200 rounded mt-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 lg:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Column: Editorial Story + Instant Demo CTA */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
          <div className="space-y-5">
            <p className="text-sm font-medium text-rose-800">
              Built for Indian Weddings, Milestones &amp; Festivals
            </p>
            <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-stone-900 leading-[1.12]">
              Every vendor, rupee, ritual, and guest—planned in one calm workspace.
            </h1>
            <p className="text-base text-stone-600 leading-relaxed max-w-xl">
              Stop juggling spreadsheets and unverified vendor quotes. Enter your
              celebration details to get a dataset-cited plan, mathematically balanced
              ₹ budget, auspicious muhurat notes, trilingual invitations, and live
              RSVP tracking in under two minutes.
            </p>

            {/* Instant Demo Callout Box */}
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-amber-900">
                  Instant 3-Minute Demo Scenario
                </span>
                <span className="text-xs font-mono tabular-nums text-amber-800">
                  Bengaluru · 120 Guests · ₹5,00,000
                </span>
              </div>
              <p className="text-sm text-stone-700">
                50th Golden Wedding Anniversary (Suvarna Mahotsava) with Pure Veg &amp;
                Jain leaf catering, Carnatic acoustic quartet, and live RSVP portal.
              </p>
              <button
                type="button"
                onClick={onLoadDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Load Demo Event Instantly
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Editorial Hero Visual */}
          <div className="relative rounded-xl overflow-hidden border border-stone-200/80 min-h-[240px] lg:h-full bg-stone-900">
            {!imgFailed ? (
              <img
                src={heroImage}
                alt="Evening Indian courtyard celebration with marigold garlands and brass diyas"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover min-h-[240px]"
              />
            ) : (
              <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-rose-950 via-stone-900 to-amber-950 p-6 flex items-end" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5">
              <p className="text-xs text-amber-200 font-mono tabular-nums">
                45 Verified Vendors · 5 Indian Cities · Zero Hallucinations
              </p>
              <p className="text-sm text-white/95 mt-1">
                Every recommendation cites its exact source from our Bengaluru,
                Mumbai, Delhi, Hyderabad &amp; Chennai catalog.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 3-Step Event Setup Wizard */}
        <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            {/* Step Indicator */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-5 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">
                  Design Your Celebration
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Step {step} of 3 ·{" "}
                  {step === 1
                    ? "Occasion & Location"
                    : step === 2
                    ? "Scale & Rupee Budget"
                    : "Tradition, Vibe & Dietary"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(s as 1 | 2 | 3)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      step === s
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    0{s}
                  </button>
                ))}
              </div>
            </div>

            <form id="wizard-form" onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-1.5">
                      Celebration Title
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Vatsala & Krishnan's 50th Anniversary"
                      className="w-full px-3.5 py-2.5 text-sm bg-stone-50/60 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-2">
                      Event Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {EVENT_TYPES.map((et) => (
                        <button
                          key={et.value}
                          type="button"
                          onClick={() => {
                            setEventType(et.value);
                            setSubTradition(et.defaultTradition);
                          }}
                          className={`py-2.5 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer whitespace-nowrap ${
                            eventType === et.value
                              ? "border-rose-700 bg-rose-50/70 text-rose-900"
                              : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                          }`}
                        >
                          {et.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-800 mb-1.5">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-stone-500" /> City
                        </span>
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value as City)}
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-50/60 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-800 mb-1.5">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-stone-500" /> Event Date
                        </span>
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-stone-50/60 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-stone-800 inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-stone-500" /> Expected Guest
                        Count
                      </label>
                      <span className="text-base font-mono font-semibold tabular-nums text-stone-900">
                        {guestCount} Guests
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={800}
                      step={10}
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full accent-rose-700 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-stone-500 font-mono tabular-nums mt-1">
                      <span>20 intimate</span>
                      <span>120 boutique</span>
                      <span>350 grand</span>
                      <span>800+</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-stone-800 inline-flex items-center gap-1.5">
                        <IndianRupee className="w-4 h-4 text-stone-500" /> Total
                        Celebration Budget (INR)
                      </label>
                      <span className="text-lg font-mono font-semibold tabular-nums text-rose-800">
                        {formatInr(totalBudget)}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={25000}
                      max={50000000}
                      step={5000}
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-stone-50/60 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 mb-3"
                    />
                    <div className="flex flex-wrap gap-2">
                      {[150000, 300000, 500000, 1000000, 2500000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTotalBudget(preset)}
                          className={`px-3 py-1.5 text-xs font-mono tabular-nums rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                            totalBudget === preset
                              ? "border-rose-700 bg-rose-50 text-rose-900 font-semibold"
                              : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {formatInr(preset)}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-stone-500 mt-2 font-mono tabular-nums">
                      Approx. {formatInr(Math.round(totalBudget / Math.max(1, guestCount)))} per
                      guest all-inclusive
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-1.5">
                      Cultural / Regional Tradition
                    </label>
                    <input
                      type="text"
                      value={subTradition}
                      onChange={(e) => setSubTradition(e.target.value)}
                      placeholder="e.g., Kannada Brahmin, Punjabi Sangeet, Diwali Milan, Maharashtrian"
                      className="w-full px-3.5 py-2.5 text-sm bg-stone-50/60 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-2">
                      Dietary Requirements
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((opt) => {
                        const active = dietaryNeeds.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleDietary(opt)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                              active
                                ? "border-emerald-700 bg-emerald-50/80 text-emerald-900"
                                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                            }`}
                          >
                            {active && <Check className="w-3.5 h-3.5" />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-1.5">
                      Vibe, Music &amp; Special Preferences
                    </label>
                    <textarea
                      rows={3}
                      value={vibePreferences}
                      onChange={(e) => setVibePreferences(e.target.value)}
                      placeholder="Describe florals, music style, seating comfort for elders, sustainability..."
                      className="w-full px-3.5 py-2.5 text-sm bg-stone-50/60 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Step Navigation Footer */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-stone-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 cursor-pointer whitespace-nowrap"
              >
                Back
              </button>
            ) : (
              <span className="text-xs text-stone-500">
                Takes under 60 seconds
              </span>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                form="wizard-form"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Generate Grounded AI Plan
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Proof Strip Below Hero Split */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-8 border-t border-stone-200/90">
        <div>
          <p className="text-2xl font-mono font-semibold tabular-nums text-stone-900">
            45+ Vendors
          </p>
          <p className="text-xs text-stone-600 mt-1">
            Cited across Bengaluru, Mumbai, Delhi, Hyderabad &amp; Chennai
          </p>
        </div>
        <div>
          <p className="text-2xl font-mono font-semibold tabular-nums text-stone-900">
            KKT Solver
          </p>
          <p className="text-xs text-stone-600 mt-1">
            Constraint-based rupee rebalancing with min/max category floors
          </p>
        </div>
        <div>
          <p className="text-2xl font-mono font-semibold tabular-nums text-stone-900">
            3 Languages
          </p>
          <p className="text-xs text-stone-600 mt-1">
            Printable invitations in English, हिन्दी (Hindi) &amp; ಕನ್ನಡ (Kannada)
          </p>
        </div>
        <div>
          <p className="text-2xl font-mono font-semibold tabular-nums text-stone-900">
            100% Offline Ready
          </p>
          <p className="text-xs text-stone-600 mt-1">
            SQLite persistence + cached Golden Jubilee scenario fallback
          </p>
        </div>
      </div>
    </div>
  );
};

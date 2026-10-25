import React, { useState, useEffect } from "react";
import { Search, Bookmark } from "lucide-react";
import { HydratedEvent, Vendor } from "../shared/schemas";
import { api } from "../api/client";
import { formatInr } from "../lib/format";

interface VendorsTabProps {
  event: HydratedEvent;
  onToggleShortlist: (vendorId: string) => Promise<void>;
}

const CATEGORIES = [
  "all",
  "venue",
  "catering",
  "decor",
  "entertainment",
  "photography",
  "makeup",
];

const CITIES = ["All", "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai"];

export const VendorsTab: React.FC<VendorsTabProps> = ({
  event,
  onToggleShortlist,
}) => {
  const [city, setCity] = useState<string>(event.input.city);
  const [category, setCategory] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(
    Math.round(event.input.totalBudget * 0.55)
  );
  const [search, setSearch] = useState<string>("");
  const [onlyShortlisted, setOnlyShortlisted] = useState<boolean>(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setCity(event.input.city);
    setMaxPrice(Math.round(event.input.totalBudget * 0.6));
  }, [event.id, event.input.city, event.input.totalBudget]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .listVendors({
        city,
        category,
        maxPrice: maxPrice > 0 ? maxPrice : undefined,
        search,
      })
      .then((res) => {
        if (active) {
          setVendors(res.vendors);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [city, category, maxPrice, search]);

  const citedIds = new Set<string>();
  if (event.plan) {
    event.plan.venueSuggestions.forEach((v) => citedIds.add(v.citedVendorId));
    citedIds.add(event.plan.cateringPlan.citedVendorId);
    citedIds.add(event.plan.decorPlan.citedVendorId);
    citedIds.add(event.plan.entertainmentPlan.citedVendorId);
    citedIds.add(event.plan.photographyPlan.citedVendorId);
  }

  const displayed = onlyShortlisted
    ? vendors.filter((v) => event.shortlistedVendorIds.includes(v.id))
    : vendors;

  return (
    <div className="space-y-6">
      {/* Filter Controls Bar */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Search Vendors, Cuisine or Specialty
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g., Jain, banana leaf, Carnatic, courtyard..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-stone-700 mb-1">
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
              <span>Max Starting Price</span>
              <span className="font-mono tabular-nums">
                {formatInr(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={20000}
              max={500000}
              step={10000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-rose-700 cursor-pointer"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => setOnlyShortlisted((s) => !s)}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                onlyShortlisted
                  ? "border-rose-700 bg-rose-50 text-rose-900"
                  : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
              }`}
            >
              Shortlisted ({event.shortlistedVendorIds.length})
            </button>
          </div>
        </div>

        {/* Category Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                category === cat
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:text-stone-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white border border-stone-200 rounded-xl p-6 space-y-3 animate-pulse"
            >
              <div className="h-3 w-32 bg-stone-200 rounded" />
              <div className="h-5 w-3/4 bg-stone-200 rounded" />
              <div className="h-3 w-full bg-stone-100 rounded" />
              <div className="h-8 w-28 bg-stone-200 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-3">
          <p className="text-sm text-stone-600">
            No vendors match your current filter ceiling. Try raising the Max
            Starting Price slider or switching City to &ldquo;All&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setCity("All");
              setCategory("all");
              setMaxPrice(500000);
              setOnlyShortlisted(false);
              setSearch("");
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((v) => {
            const isShortlisted = event.shortlistedVendorIds.includes(v.id);
            const isCited = citedIds.has(v.id);

            return (
              <div
                key={v.id}
                className="bg-white border border-stone-200/90 rounded-xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  {/* Clean unboxed typographic metadata per Zero-Pill constitution */}
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>
                      <span className="capitalize font-medium text-stone-700">
                        {v.category}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{v.city}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums text-amber-800 font-semibold">
                        ★ {v.rating.toFixed(1)}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-stone-400">
                      {v.id}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-stone-900 leading-snug">
                    {v.name}
                  </h3>

                  {isCited && (
                    <p className="text-xs font-medium text-rose-800">
                      Cited in your AI Plan
                    </p>
                  )}

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {v.description}
                  </p>

                  <p className="text-[11px] text-stone-500 pt-1">
                    {v.tags.join(" · ")}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-stone-500">Price Range</p>
                    <p className="text-xs font-mono font-semibold tabular-nums text-stone-900">
                      {formatInr(v.priceMin)} – {formatInr(v.priceMax)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleShortlist(v.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      isShortlisted
                        ? "border-rose-700 bg-rose-700 text-white"
                        : "border-stone-300 bg-white text-stone-800 hover:bg-stone-50"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {isShortlisted ? "Shortlisted" : "Shortlist"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

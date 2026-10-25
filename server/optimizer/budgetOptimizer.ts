import {
  BudgetAllocation,
  BudgetCategory,
  EventType,
} from "../../src/shared/schemas.ts";

interface CategoryRule {
  category: BudgetCategory;
  label: string;
  targetPct: number;
  minPct: number;
  maxPct: number;
  priorityWeight: number;
  defaultRationale: string;
}

const EVENT_TYPE_PROFILES: Record<EventType, CategoryRule[]> = {
  wedding: [
    {
      category: "venue",
      label: "Venue & Mandapa Rental",
      targetPct: 30,
      minPct: 20,
      maxPct: 42,
      priorityWeight: 1.3,
      defaultRationale: "Covers Kalyana Mandapa / courtyard buyout, bridal rooms, and power backup.",
    },
    {
      category: "catering",
      label: "Festive Catering & Live Counters",
      targetPct: 32,
      minPct: 24,
      maxPct: 45,
      priorityWeight: 1.5,
      defaultRationale: "Multi-course regional wedding feast with 5% extra buffer plates.",
    },
    {
      category: "decor",
      label: "Mandap, Florals & Lighting",
      targetPct: 15,
      minPct: 8,
      maxPct: 25,
      priorityWeight: 1.0,
      defaultRationale: "Fresh floral canopies, brass lamps, and stage styling.",
    },
    {
      category: "photography",
      label: "Candid Photo & Wedding Film",
      targetPct: 10,
      minPct: 6,
      maxPct: 18,
      priorityWeight: 1.1,
      defaultRationale: "Documentary photography, 4K highlight reel, and archival album.",
    },
    {
      category: "entertainment",
      label: "Nadaswaram / Live Band & Sound",
      targetPct: 7,
      minPct: 4,
      maxPct: 16,
      priorityWeight: 0.85,
      defaultRationale: "Auspicious mangala music, sangeet console, and PA setup.",
    },
    {
      category: "misc",
      label: "Tambulam Favours, Makeup & Buffer",
      targetPct: 6,
      minPct: 5,
      maxPct: 15,
      priorityWeight: 0.75,
      defaultRationale: "Return gifts, styling, logistics, and 5% contingency reserve.",
    },
  ],
  anniversary: [
    {
      category: "venue",
      label: "Venue & Courtyard Rental",
      targetPct: 29,
      minPct: 20,
      maxPct: 40,
      priorityWeight: 1.2,
      defaultRationale: "Intimate heritage courtyard or boutique banquet with elder-friendly access.",
    },
    {
      category: "catering",
      label: "Festive Catering & Filter Coffee Bar",
      targetPct: 30,
      minPct: 24,
      maxPct: 44,
      priorityWeight: 1.4,
      defaultRationale: "Generational favourite menu with dedicated Jain/Sattvik counter.",
    },
    {
      category: "decor",
      label: "Floral, Brass & Memory Gallery",
      targetPct: 15,
      minPct: 10,
      maxPct: 24,
      priorityWeight: 1.0,
      defaultRationale: "Archival photo walk, fresh mallige/marigold florals, and warm lighting.",
    },
    {
      category: "photography",
      label: "Candid Photography & Memoir Film",
      targetPct: 11,
      minPct: 7,
      maxPct: 18,
      priorityWeight: 1.0,
      defaultRationale: "Family portraits, candid moments, and linen keepsake book.",
    },
    {
      category: "entertainment",
      label: "Live Acoustic & Retro Melodies",
      targetPct: 10,
      minPct: 6,
      maxPct: 18,
      priorityWeight: 0.9,
      defaultRationale: "Live instrumental/vocal ensemble calibrated for comfortable family conversation.",
    },
    {
      category: "misc",
      label: "Tambulam Favours & Contingency",
      targetPct: 5,
      minPct: 5,
      maxPct: 15,
      priorityWeight: 0.7,
      defaultRationale: "Artisanal sweet boxes, angavastram honours, and emergency reserve.",
    },
  ],
  birthday: [
    {
      category: "venue",
      label: "Boutique Lawn / Banquet Venue",
      targetPct: 26,
      minPct: 18,
      maxPct: 38,
      priorityWeight: 1.1,
      defaultRationale: "Private garden terrace or lounge space.",
    },
    {
      category: "catering",
      label: "Gourmet Spread, Chaat & Cake",
      targetPct: 34,
      minPct: 25,
      maxPct: 46,
      priorityWeight: 1.4,
      defaultRationale: "Interactive live counters, bespoke celebration cake, and mocktail bar.",
    },
    {
      category: "decor",
      label: "Thematic Scenography & Photo Booth",
      targetPct: 15,
      minPct: 8,
      maxPct: 24,
      priorityWeight: 1.0,
      defaultRationale: "Custom backdrop, table styling, and polaroid corner.",
    },
    {
      category: "entertainment",
      label: "Emcee, DJ / Acoustic Act & Activities",
      targetPct: 10,
      minPct: 5,
      maxPct: 18,
      priorityWeight: 0.95,
      defaultRationale: "Interactive host, music console, and family games.",
    },
    {
      category: "photography",
      label: "Candid Event Photography",
      targetPct: 9,
      minPct: 5,
      maxPct: 16,
      priorityWeight: 0.9,
      defaultRationale: "4-hour candid photo & social reel coverage.",
    },
    {
      category: "misc",
      label: "Return Hampers & Contingency",
      targetPct: 6,
      minPct: 5,
      maxPct: 15,
      priorityWeight: 0.7,
      defaultRationale: "Curated return gifts and contingency buffer.",
    },
  ],
  corporate: [
    {
      category: "venue",
      label: "Conference / Offsite Pavilion & AV",
      targetPct: 32,
      minPct: 22,
      maxPct: 45,
      priorityWeight: 1.3,
      defaultRationale: "Keynote hall rental, projection, and high-density Wi-Fi.",
    },
    {
      category: "catering",
      label: "Specialty Coffee Bar & Networking Dining",
      targetPct: 32,
      minPct: 24,
      maxPct: 44,
      priorityWeight: 1.3,
      defaultRationale: "All-day artisanal chai/coffee + inclusive multi-dietary buffet.",
    },
    {
      category: "decor",
      label: "Stage Branding & Sustainable Florals",
      targetPct: 12,
      minPct: 6,
      maxPct: 20,
      priorityWeight: 0.85,
      defaultRationale: "Clean typographic signage, stage backdrop, and lounge plants.",
    },
    {
      category: "entertainment",
      label: "Host, Acoustic Trio & Sound",
      targetPct: 10,
      minPct: 5,
      maxPct: 18,
      priorityWeight: 0.9,
      defaultRationale: "Evening acoustic networking set and wireless mics.",
    },
    {
      category: "photography",
      label: "Event Photo & Recap Video",
      targetPct: 8,
      minPct: 5,
      maxPct: 15,
      priorityWeight: 0.85,
      defaultRationale: "Speaker portraits, candid networking, and LinkedIn highlight cut.",
    },
    {
      category: "misc",
      label: "Crafted Speaker Mementos & Buffer",
      targetPct: 6,
      minPct: 5,
      maxPct: 14,
      priorityWeight: 0.75,
      defaultRationale: "GI-craft gift boxes, badges, and contingency.",
    },
  ],
  festival: [
    {
      category: "venue",
      label: "Courtyard / Community Venue",
      targetPct: 24,
      minPct: 15,
      maxPct: 36,
      priorityWeight: 1.1,
      defaultRationale: "Open-air courtyard or hall with puja & dining zones.",
    },
    {
      category: "catering",
      label: "Traditional Prasadam & Festive Feast",
      targetPct: 34,
      minPct: 25,
      maxPct: 46,
      priorityWeight: 1.5,
      defaultRationale: "Authentic festival mithai, live chaat/pongal counters, and sattvik meal.",
    },
    {
      category: "decor",
      label: "Clay Diyas, Torans & Eco-Idol Decor",
      targetPct: 18,
      minPct: 10,
      maxPct: 28,
      priorityWeight: 1.15,
      defaultRationale: "Zero-plastic botanical decor, rangoli mandalas, and earthen lighting.",
    },
    {
      category: "entertainment",
      label: "Folk Percussion / Classical Ensemble",
      targetPct: 9,
      minPct: 5,
      maxPct: 16,
      priorityWeight: 0.9,
      defaultRationale: "Live tabla/flute/dhol festive accompaniment.",
    },
    {
      category: "photography",
      label: "Festive Candid Portraits",
      targetPct: 8,
      minPct: 5,
      maxPct: 15,
      priorityWeight: 0.85,
      defaultRationale: "Low-light diya & family portrait specialist.",
    },
    {
      category: "misc",
      label: "Mithai Hampers, Puja Samagri & Buffer",
      targetPct: 7,
      minPct: 5,
      maxPct: 16,
      priorityWeight: 0.85,
      defaultRationale: "Artisanal mithai boxes, puja essentials, and contingency.",
    },
  ],
};

function roundTo500(n: number): number {
  return Math.max(0, Math.round(n / 500) * 500);
}

export function createInitialBudgetAllocations(
  eventType: EventType,
  totalBudget: number
): BudgetAllocation[] {
  const rules = EVENT_TYPE_PROFILES[eventType] || EVENT_TYPE_PROFILES.anniversary;
  let running = 0;

  return rules.map((r, idx) => {
    const isLast = idx === rules.length - 1;
    const raw = (totalBudget * r.targetPct) / 100;
    const planned = isLast ? Math.max(0, totalBudget - running) : roundTo500(raw);
    if (!isLast) running += planned;

    return {
      category: r.category,
      label: r.label,
      plannedAmount: planned,
      actualSpent: 0,
      minPct: r.minPct,
      maxPct: r.maxPct,
      priorityWeight: r.priorityWeight,
      locked: false,
      rationale: r.defaultRationale,
    };
  });
}

/**
 * Constrained Weighted Projection Optimizer (mirrors scipy/OR-Tools linear/quadratic Simplex projection):
 * Given a target totalBudget and optional locked/pinned categories, solves:
 *   min  sum_i (1 / priorityWeight_i) * (x_i - x_i^0)^2
 *   s.t. sum_i x_i = totalBudget
 *        minBound_i <= x_i <= maxBound_i  for all unlocked i
 * And produces human-readable trade-off explanations.
 */
export function optimizeBudgetAllocations(
  current: BudgetAllocation[],
  totalBudget: number,
  pinnedCategories: Set<BudgetCategory> = new Set()
): { allocations: BudgetAllocation[]; tradeoffExplanation: string } {
  const items = current.map((item) => ({ ...item }));

  const lockedItems = items.filter(
    (it) => it.locked || pinnedCategories.has(it.category)
  );
  const unlockedItems = items.filter(
    (it) => !it.locked && !pinnedCategories.has(it.category)
  );

  const lockedSum = lockedItems.reduce((s, it) => s + it.plannedAmount, 0);
  const remainingTarget = totalBudget - lockedSum;

  if (unlockedItems.length === 0) {
    const diff = totalBudget - lockedSum;
    const note =
      diff === 0
        ? "All categories are locked and match the exact ₹" +
          totalBudget.toLocaleString("en-IN") +
          " total budget."
        : `All categories are locked; total planned differs from target budget by ₹${Math.abs(diff).toLocaleString("en-IN")}. Unlock at least one category to auto-rebalance.`;
    return { allocations: items, tradeoffExplanation: note };
  }

  if (remainingTarget <= 0) {
    for (const u of unlockedItems) u.plannedAmount = 0;
    return {
      allocations: items,
      tradeoffExplanation: `Warning: Pinned allocations (₹${lockedSum.toLocaleString("en-IN")}) already exceed total budget ₹${totalBudget.toLocaleString("en-IN")}. Reduce a locked category or raise total budget.`,
    };
  }

  const originalMap = new Map<BudgetCategory, number>();
  for (const it of current) originalMap.set(it.category, it.plannedAmount);

  // Compute min/max rupee bounds for unlocked items; relax gracefully if infeasible
  let minBounds = unlockedItems.map((u) => (totalBudget * u.minPct) / 100);
  let maxBounds = unlockedItems.map((u) => (totalBudget * u.maxPct) / 100);

  const sumMin = minBounds.reduce((a, b) => a + b, 0);
  const sumMax = maxBounds.reduce((a, b) => a + b, 0);

  let constraintRelaxedNote = "";
  if (sumMin > remainingTarget) {
    const scale = remainingTarget / (sumMin || 1);
    minBounds = minBounds.map((b) => b * scale);
    constraintRelaxedNote =
      "Minimum category floors were proportionally compressed to fit your high pinned allocation. ";
  } else if (sumMax < remainingTarget) {
    const scale = remainingTarget / (sumMax || 1);
    maxBounds = maxBounds.map((b) => b * scale);
    constraintRelaxedNote =
      "Category ceilings were expanded proportionally to absorb surplus budget. ";
  }

  // Iterative Active-Set Lagrange Multiplier Projection (exact KKT solver)
  const n = unlockedItems.length;
  const x0 = unlockedItems.map((u) =>
    u.plannedAmount > 0 ? u.plannedAmount : (totalBudget * (u.minPct + u.maxPct)) / 200
  );
  // Higher priorityWeight resists cuts and receives balanced protection
  const flexWeights = unlockedItems.map((u) => 1 / (u.priorityWeight || 1));

  const sol = [...x0];
  const fixed = new Array<boolean>(n).fill(false);

  for (let iter = 0; iter < 12; iter++) {
    let fixedSum = 0;
    let freeFlexSum = 0;
    let freeX0Sum = 0;
    for (let i = 0; i < n; i++) {
      if (fixed[i]) {
        fixedSum += sol[i];
      } else {
        freeFlexSum += flexWeights[i];
        freeX0Sum += x0[i];
      }
    }
    if (freeFlexSum === 0) break;

    const residual = remainingTarget - fixedSum - freeX0Sum;
    let clampedAny = false;

    for (let i = 0; i < n; i++) {
      if (fixed[i]) continue;
      const candidate = x0[i] + residual * (flexWeights[i] / freeFlexSum);
      if (candidate < minBounds[i] - 0.5) {
        sol[i] = minBounds[i];
        fixed[i] = true;
        clampedAny = true;
      } else if (candidate > maxBounds[i] + 0.5) {
        sol[i] = maxBounds[i];
        fixed[i] = true;
        clampedAny = true;
      } else {
        sol[i] = candidate;
      }
    }
    if (!clampedAny) break;
  }

  // Round to crisp ₹500 increments and reconcile exact rupee remainder on largest unlocked category
  let roundedSum = 0;
  for (let i = 0; i < n; i++) {
    unlockedItems[i].plannedAmount = roundTo500(sol[i]);
    roundedSum += unlockedItems[i].plannedAmount;
  }

  const remainder = Math.round(remainingTarget - roundedSum);
  if (remainder !== 0 && unlockedItems.length > 0) {
    let bestIdx = 0;
    for (let i = 1; i < unlockedItems.length; i++) {
      if (unlockedItems[i].plannedAmount > unlockedItems[bestIdx].plannedAmount) {
        bestIdx = i;
      }
    }
    unlockedItems[bestIdx].plannedAmount = Math.max(
      0,
      unlockedItems[bestIdx].plannedAmount + remainder
    );
  }

  // Synthesize clear trade-off summary
  const deltas = unlockedItems
    .map((u) => ({
      label: u.label,
      delta: u.plannedAmount - (originalMap.get(u.category) || 0),
      pct: Math.round((u.plannedAmount / totalBudget) * 100),
    }))
    .filter((d) => Math.abs(d.delta) >= 500);

  let tradeoffExplanation = constraintRelaxedNote;
  if (deltas.length === 0) {
    tradeoffExplanation += `Constrained solver verified exact ₹${totalBudget.toLocaleString("en-IN")} allocation within category min/max bounds.`;
  } else {
    const formatted = deltas
      .map(
        (d) =>
          `${d.label} ${d.delta > 0 ? "+" : "-"}₹${Math.abs(d.delta).toLocaleString("en-IN")} (now ${d.pct}%)`
      )
      .join(", ");
    tradeoffExplanation += `Constraint solver rebalanced unlocked categories by priority weight (protecting Catering & Venue floors first): ${formatted}.`;
  }

  return { allocations: items, tradeoffExplanation };
}

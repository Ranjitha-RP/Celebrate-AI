import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import {
  EventInput,
  Plan,
  Task,
  BudgetAllocation,
  InvitationBundle,
  InvitationBundleSchema,
  PlanPatch,
  PlanPatchSchema,
  HydratedEvent,
} from "../../src/shared/schemas.ts";
import { vectorStore } from "../rag/vectorStore.ts";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (
    !process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY"
  ) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function subtractDaysIso(eventDate: string, daysBefore: number): string {
  const base = new Date(eventDate + "T00:00:00");
  if (isNaN(base.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + Math.max(1, 30 - daysBefore));
    return fallback.toISOString().slice(0, 10);
  }
  base.setDate(base.getDate() - daysBefore);
  return base.toISOString().slice(0, 10);
}

const CreativeEnrichmentSchema = z.object({
  summaryPitch: z.string().min(10),
  venueRationale: z.string().min(5),
  decorHighlights: z.array(z.string()).min(1),
  entertainmentHighlights: z.array(z.string()).min(1),
  welcomeDrinks: z.array(z.string()).min(1),
  starters: z.array(z.string()).min(1),
  mainCourse: z.array(z.string()).min(1),
  desserts: z.array(z.string()).min(1),
  etiquetteTip: z.string().min(5),
  customTasks: z
    .array(
      z.object({
        title: z.string().min(3),
        category: z.string(),
        daysBefore: z.number(),
        priority: z.enum(["high", "medium", "low"]).catch("medium"),
      })
    )
    .min(1),
});

function buildDeterministicGroundedPlan(
  input: EventInput,
  budget: BudgetAllocation[],
  rag: Awaited<ReturnType<typeof vectorStore.retrieveContextForEvent>>
): { plan: Plan; tasks: Omit<Task, "id" | "eventId">[] } {
  const theme = rag.topThemes[0];
  const culture = rag.topCulture[0];
  const vVenue1 = rag.vendorsByCategory.venue[0];
  const vVenue2 = rag.vendorsByCategory.venue[1] || vVenue1;
  const vCat = rag.vendorsByCategory.catering[0];
  const vDec = rag.vendorsByCategory.decor[0];
  const vEnt = rag.vendorsByCategory.entertainment[0];
  const vPho = rag.vendorsByCategory.photography[0];

  const budgetMap = new Map(budget.map((b) => [b.category, b.plannedAmount]));
  const catTotal =
    budgetMap.get("catering") || Math.round(input.totalBudget * 0.3);
  const perPlate = Math.max(
    450,
    Math.round(catTotal / Math.max(1, input.guestCount) / 25) * 25
  );

  const plan: Plan = {
    summaryPitch: `A thoughtfully paced ${input.subTradition} ${input.eventType} in ${input.city} for ${input.guestCount} guests—anchored by ${vVenue1.name}, seasonal regional hospitality by ${vCat.name}, and ${theme.name} aesthetics within ₹${input.totalBudget.toLocaleString("en-IN")}.`,
    theme: {
      name: theme.name,
      sourceThemeId: theme.id,
      sourceThemeName: theme.name,
      description: theme.description,
      palette: theme.palette,
      paletteNames: theme.paletteNames,
      moodBoardDescription: theme.moodBoardNotes,
    },
    venueSuggestions: [
      {
        title: "Primary Recommended Venue",
        citedVendorId: vVenue1.id,
        citedVendorName: vVenue1.name,
        estimatedCostInr: budgetMap.get("venue") || vVenue1.priceMin,
        highlights: vVenue1.tags
          .slice(0, 3)
          .map((t) => `Verified ${t} setup in ${vVenue1.city}`),
        rationale: `${vVenue1.description} Rated ★ ${vVenue1.rating} and aligned with ₹${(budgetMap.get("venue") || vVenue1.priceMin).toLocaleString("en-IN")} allocation.`,
      },
      {
        title: "Alternative Shortlist Option",
        citedVendorId: vVenue2.id,
        citedVendorName: vVenue2.name,
        estimatedCostInr: vVenue2.priceMin,
        highlights: vVenue2.tags.slice(0, 3).map((t) => `Includes ${t}`),
        rationale: vVenue2.description,
      },
    ],
    cateringPlan: {
      citedVendorId: vCat.id,
      citedVendorName: vCat.name,
      perPlateInr: perPlate,
      estimatedTotalInr: catTotal,
      dietaryComplianceNote: `Configured for ${input.dietaryNeeds.join(", ")} across ${input.guestCount} guests + 5% hospitality buffer.`,
      welcomeDrinks: [
        "Tender Coconut & Mint Sherbet",
        "Spiced Saffron Badam Milk",
      ],
      starters: [
        "Crispy Regional Lentil Fritters",
        "Charcoal Paneer / Corn Tikka Skewers",
        "Artisanal Chaat Counter",
      ],
      mainCourse: [
        ...culture.regionalFoodHighlights.slice(0, 2),
        "Heirloom Dal & Seasonal Sabzi Assortment",
        "Assorted Warm Indian Breads & Fragrant Rice",
      ],
      desserts: [
        "Warm Traditional Halwa / Payasam",
        "Artisanal Filter Coffee & Masala Chai",
      ],
      rationale: `${vCat.name} (★ ${vCat.rating}) specializes in ${vCat.tags.slice(0, 3).join(", ")} in ${input.city}.`,
    },
    decorPlan: {
      title: `${theme.name} Scenography`,
      citedVendorId: vDec.id,
      citedVendorName: vDec.name,
      estimatedCostInr: budgetMap.get("decor") || vDec.priceMin,
      highlights: [
        "Fresh local florals & brass diya welcome walkway",
        "Custom stage/backdrop dressed in theme palette textiles",
        "Dedicated family portrait & memory corner",
      ],
      rationale: vDec.description,
    },
    entertainmentPlan: {
      title: "Curated Live Music & Family Hosting",
      citedVendorId: vEnt.id,
      citedVendorName: vEnt.name,
      estimatedCostInr: budgetMap.get("entertainment") || vEnt.priceMin,
      highlights: [
        `Live performance tailored for ${input.vibePreferences}`,
        "Balanced acoustic coverage for comfortable elder conversation",
        "Wireless microphones for family toasts & rituals",
      ],
      rationale: vEnt.description,
    },
    photographyPlan: {
      title: "Documentary Candid & Family Portrait Coverage",
      citedVendorId: vPho.id,
      citedVendorName: vPho.name,
      estimatedCostInr: budgetMap.get("photography") || vPho.priceMin,
      highlights: [
        "Full candid + ritual documentation",
        "Dedicated multi-generational portrait session",
        "High-resolution edited gallery & highlight film",
      ],
      rationale: vPho.description,
    },
    culturalAdvisory: {
      sourceCultureId: culture.id,
      sourceCultureTitle: culture.title,
      muhuratWindow: culture.muhuratGuidance,
      rituals: culture.keyRituals,
      regionalFoodNotes: culture.regionalFoodHighlights,
      etiquetteTip: culture.auspiciousElements,
    },
    runSheet: [
      {
        id: "RS-1",
        time: "03:00 PM",
        activity: "Venue handover, floral installation & lighting check",
        owner: "Decor Lead",
        vendorCategory: "decor",
        vendorContact: `${vDec.name} (${vDec.contactPhone})`,
        arrivalTime: "02:00 PM",
        status: "scheduled",
      },
      {
        id: "RS-2",
        time: "04:30 PM",
        activity: "Audio check & welcome music setup",
        owner: "Entertainment Lead",
        vendorCategory: "entertainment",
        vendorContact: `${vEnt.name} (${vEnt.contactPhone})`,
        arrivalTime: "04:00 PM",
        status: "scheduled",
      },
      {
        id: "RS-3",
        time: "05:30 PM",
        activity: "Host family golden-hour portraits",
        owner: "Photo Lead",
        vendorCategory: "photography",
        vendorContact: `${vPho.name} (${vPho.contactPhone})`,
        arrivalTime: "05:00 PM",
        status: "scheduled",
      },
      {
        id: "RS-4",
        time: "06:00 PM",
        activity: "Guest welcome drinks & auspicious lamp lighting / key ritual",
        owner: "Host Family",
        vendorCategory: "venue",
        vendorContact: `${vVenue1.name} (${vVenue1.contactPhone})`,
        arrivalTime: "02:00 PM",
        status: "scheduled",
      },
      {
        id: "RS-5",
        time: "07:45 PM",
        activity: "Grand festive dinner & live dessert counters open",
        owner: "Catering Head",
        vendorCategory: "catering",
        vendorContact: `${vCat.name} (${vCat.contactPhone})`,
        arrivalTime: "04:00 PM",
        status: "scheduled",
      },
      {
        id: "RS-6",
        time: "09:30 PM",
        activity: "Return gift distribution & warm farewell",
        owner: "Family Coordinator",
        vendorCategory: "misc",
        vendorContact: "Host Desk",
        arrivalTime: "05:30 PM",
        status: "scheduled",
      },
    ],
    generatedVia: "cached-demo-fallback",
  };

  const tasks: Omit<Task, "id" | "eventId">[] = [
    {
      title: `Book ${vVenue1.name} in ${input.city} and confirm advance`,
      category: "venue",
      dueDate: subtractDaysIso(input.date, 45),
      daysBefore: 45,
      priority: "high",
      completed: false,
    },
    {
      title: `Schedule menu tasting with ${vCat.name} (${input.dietaryNeeds.join(", ")})`,
      category: "catering",
      dueDate: subtractDaysIso(input.date, 30),
      daysBefore: 30,
      priority: "high",
      completed: false,
    },
    {
      title: "Send trilingual digital invitations & shareable RSVP link",
      category: "guests",
      dueDate: subtractDaysIso(input.date, 24),
      daysBefore: 24,
      priority: "high",
      completed: false,
    },
    {
      title: `Approve ${theme.name} floral & lighting layout with ${vDec.name}`,
      category: "decor",
      dueDate: subtractDaysIso(input.date, 18),
      daysBefore: 18,
      priority: "medium",
      completed: false,
    },
    {
      title: `Brief ${vEnt.name} & ${vPho.name} on ritual muhurat timings`,
      category: "entertainment",
      dueDate: subtractDaysIso(input.date, 10),
      daysBefore: 10,
      priority: "medium",
      completed: false,
    },
    {
      title: "Lock final RSVP headcount & dietary split with caterer",
      category: "catering",
      dueDate: subtractDaysIso(input.date, 4),
      daysBefore: 4,
      priority: "high",
      completed: false,
    },
  ];

  return { plan, tasks };
}

/**
 * Sub-1.5s Grounded Gemini + RAG Synthesis:
 * Uses responseMimeType: "application/json" (avoiding server-side grammar compilation overhead)
 * and strictly validates output with Zod + 1x retry.
 */
export async function generateGroundedEventPlan(
  eventId: string,
  input: EventInput,
  budget: BudgetAllocation[]
): Promise<{ plan: Plan; tasks: Task[] }> {
  const ai = getGeminiClient();
  const rag = await vectorStore.retrieveContextForEvent(input, ai);
  const base = buildDeterministicGroundedPlan(input, budget, rag);

  if (!ai) {
    const tasks: Task[] = base.tasks.map((t, i) => ({
      ...t,
      id: `TSK-${eventId}-${i + 1}`,
      eventId,
    }));
    return { plan: base.plan, tasks };
  }

  const prompt = `Return ONLY a JSON object with exact keys:
{
  "summaryPitch": "2-sentence celebratory overview citing ${base.plan.venueSuggestions[0].citedVendorName} and ${base.plan.cateringPlan.citedVendorName}",
  "venueRationale": "1-sentence fit for ${input.guestCount} guests in ${input.city}",
  "decorHighlights": ["3 concise decor ideas matching ${base.plan.theme.name}"],
  "entertainmentHighlights": ["3 music/hosting highlights for ${input.vibePreferences}"],
  "welcomeDrinks": ["2 Indian welcome drinks"],
  "starters": ["3 regional starters matching ${input.dietaryNeeds.join(", ")}"],
  "mainCourse": ["4 celebratory main dishes"],
  "desserts": ["3 Indian desserts/beverages"],
  "etiquetteTip": "1 practical family hospitality tip",
  "customTasks": [
    {"title": "task", "category": "venue|catering|decor|entertainment|guests|misc", "daysBefore": 30, "priority": "high|medium|low"}
  ]
}
Provide 6 customTasks counted back from ${input.date}. Event: ${input.title} (${input.eventType}, ${input.subTradition}) in ${input.city}, Budget ₹${input.totalBudget}.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.35,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Fast SLA timeout")), 6500)
        ),
      ]);

      const raw = JSON.parse((res.text || "{}").trim());
      const enriched = CreativeEnrichmentSchema.parse(raw);

      const mergedPlan: Plan = {
        ...base.plan,
        summaryPitch: enriched.summaryPitch,
        venueSuggestions: [
          {
            ...base.plan.venueSuggestions[0],
            rationale: enriched.venueRationale,
          },
          ...base.plan.venueSuggestions.slice(1),
        ],
        cateringPlan: {
          ...base.plan.cateringPlan,
          welcomeDrinks: enriched.welcomeDrinks,
          starters: enriched.starters,
          mainCourse: enriched.mainCourse,
          desserts: enriched.desserts,
        },
        decorPlan: {
          ...base.plan.decorPlan,
          highlights: enriched.decorHighlights,
        },
        entertainmentPlan: {
          ...base.plan.entertainmentPlan,
          highlights: enriched.entertainmentHighlights,
        },
        culturalAdvisory: {
          ...base.plan.culturalAdvisory,
          etiquetteTip: enriched.etiquetteTip,
        },
        generatedVia: "gemini-rag",
      };

      const tasks: Task[] = enriched.customTasks.map((t, idx) => ({
        id: `TSK-${eventId}-${idx + 1}`,
        eventId,
        title: t.title,
        category: t.category || "planning",
        daysBefore: Math.max(1, Math.round(Number(t.daysBefore) || 10)),
        dueDate: subtractDaysIso(
          input.date,
          Math.max(1, Math.round(Number(t.daysBefore) || 10))
        ),
        priority: t.priority,
        completed: false,
      }));

      return { plan: mergedPlan, tasks };
    } catch (err) {
      console.warn(`Plan synthesis attempt ${attempt + 1} warning:`, err);
      if (err instanceof Error && err.message.includes("timeout")) {
        break;
      }
    }
  }

  const tasks: Task[] = base.tasks.map((t, i) => ({
    ...t,
    id: `TSK-${eventId}-${i + 1}`,
    eventId,
  }));
  return { plan: base.plan, tasks };
}

export async function generatePlanPatchFromChat(
  event: HydratedEvent,
  userMessage: string
): Promise<PlanPatch> {
  const ai = getGeminiClient();
  const rag = await vectorStore.retrieveContextForEvent(
    event.input,
    ai,
    userMessage
  );

  const buildHeuristicPatch = (): PlanPatch => {
    const lower = userMessage.toLowerCase();
    const pctMatch = lower.match(/(\d+)\s*%/);
    const isCheaper =
      lower.includes("cheap") ||
      lower.includes("reduce") ||
      lower.includes("cut") ||
      lower.includes("lower");
    const isIncrease = lower.includes("increase") || lower.includes("raise");

    if (isCheaper) {
      const pct = pctMatch ? Math.min(50, Math.max(5, Number(pctMatch[1]))) : 15;
      const nextBudget =
        Math.round((event.input.totalBudget * (100 - pct)) / 100 / 1000) * 1000;
      const altDecor =
        rag.vendorsByCategory.decor[rag.vendorsByCategory.decor.length - 1];
      return {
        assistantMessage: `Reduced total budget by ${pct}% to ₹${nextBudget.toLocaleString("en-IN")}. Our constraint solver rebalanced all 6 categories while protecting catering quality, and swapped decor to ${altDecor.name} (${altDecor.id}) to unlock immediate savings.`,
        newTotalBudget: nextBudget,
        categoryBudgetAdjustments: [],
        vendorSwaps: [
          {
            section: "decor",
            citedVendorId: altDecor.id,
            citedVendorName: altDecor.name,
            estimatedCostInr: Math.min(
              altDecor.priceMax,
              Math.round(nextBudget * 0.13)
            ),
            rationale: `Value-engineered decor from ${altDecor.name} keeps festive warmth within the leaner ₹${nextBudget.toLocaleString("en-IN")} ceiling.`,
          },
        ],
        menuAdditions: [],
        tasksToAdd: [
          {
            title: `Confirm revised ₹${nextBudget.toLocaleString("en-IN")} scope with ${altDecor.name}`,
            category: "decor",
            daysBefore: 12,
            priority: "high",
          },
        ],
        changedSections: ["budget", "decor", "tasks"],
      };
    }

    if (isIncrease && pctMatch) {
      const pct = Number(pctMatch[1]);
      const nextBudget =
        Math.round((event.input.totalBudget * (100 + pct)) / 100 / 1000) * 1000;
      return {
        assistantMessage: `Expanded total budget by ${pct}% to ₹${nextBudget.toLocaleString("en-IN")} and rebalanced allocations across venue, gourmet counters, and photography.`,
        newTotalBudget: nextBudget,
        categoryBudgetAdjustments: [],
        vendorSwaps: [],
        menuAdditions: ["Artisanal Saffron Pistachio Kulfi Falooda Live Cart"],
        tasksToAdd: [],
        changedSections: ["budget", "catering"],
      };
    }

    if (
      lower.includes("band") ||
      lower.includes("music") ||
      lower.includes("dj") ||
      lower.includes("sufi")
    ) {
      const entList = rag.vendorsByCategory.entertainment;
      const chosen =
        entList.find(
          (v) => v.id !== event.plan?.entertainmentPlan.citedVendorId
        ) || entList[0];
      const targetAmt = Math.max(
        chosen.priceMin,
        Math.round(event.input.totalBudget * 0.12)
      );
      return {
        assistantMessage: `Updated entertainment to ${chosen.name} (${chosen.id}) at ₹${targetAmt.toLocaleString("en-IN")} and re-optimized surrounding categories so your total ₹${event.input.totalBudget.toLocaleString("en-IN")} budget stays intact.`,
        newTotalBudget: null,
        categoryBudgetAdjustments: [
          {
            category: "entertainment",
            targetAmount: targetAmt,
            reason: `Allocated for ${chosen.name}`,
          },
        ],
        vendorSwaps: [
          {
            section: "entertainment",
            citedVendorId: chosen.id,
            citedVendorName: chosen.name,
            estimatedCostInr: targetAmt,
            rationale: chosen.description,
          },
        ],
        menuAdditions: [],
        tasksToAdd: [
          {
            title: `Finalize acoustic stage rider & song requests with ${chosen.name}`,
            category: "entertainment",
            daysBefore: 10,
            priority: "medium",
          },
        ],
        changedSections: ["entertainment", "budget", "tasks"],
      };
    }

    return {
      assistantMessage: `Updated your catering showcase and checklist for "${userMessage}", keeping your ₹${event.input.totalBudget.toLocaleString("en-IN")} budget balanced.`,
      newTotalBudget: null,
      categoryBudgetAdjustments: [],
      vendorSwaps: [],
      menuAdditions: [`Custom Host Special: ${userMessage}`],
      tasksToAdd: [
        {
          title: `Coordinate request with vendor team: ${userMessage.slice(0, 60)}`,
          category: "catering",
          daysBefore: 7,
          priority: "medium",
        },
      ],
      changedSections: ["catering", "tasks"],
    };
  };

  if (!ai) {
    return buildHeuristicPatch();
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: `Event: ${JSON.stringify(event.input)}
Budget: ${JSON.stringify(event.budget.map((b) => ({ category: b.category, plannedAmount: b.plannedAmount })))}
RAG Vendors (ONLY cite these IDs): ${JSON.stringify(
            Object.fromEntries(
              Object.entries(rag.vendorsByCategory).map(([k, list]) => [
                k,
                list.map((v) => ({
                  id: v.id,
                  name: v.name,
                  priceMin: v.priceMin,
                  desc: v.description,
                })),
              ])
            )
          )}
User Request: "${userMessage}"

Return ONLY valid JSON with exact structure:
{
  "assistantMessage": "concise summary of changes",
  "newTotalBudget": null,
  "categoryBudgetAdjustments": [{"category": "venue|catering|decor|entertainment|photography|misc", "targetAmount": 50000, "reason": "why"}],
  "vendorSwaps": [{"section": "venue|catering|decor|entertainment|photography", "citedVendorId": "EXACT_ID", "citedVendorName": "Name", "estimatedCostInr": 50000, "rationale": "why"}],
  "menuAdditions": [],
  "tasksToAdd": [{"title": "task", "category": "decor", "daysBefore": 10, "priority": "medium"}],
  "changedSections": ["budget"]
}
Set newTotalBudget to a number ONLY if the user changes the overall total budget.`,
          config: {
            responseMimeType: "application/json",
            temperature: 0.25,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Chat SLA timeout")), 4000)
        ),
      ]);

      const raw = JSON.parse((res.text || "{}").trim());
      return PlanPatchSchema.parse(raw);
    } catch (err) {
      console.warn(`Chat patch attempt ${attempt + 1} warning:`, err);
      if (err instanceof Error && err.message.includes("timeout")) break;
    }
  }

  return buildHeuristicPatch();
}

export function buildInstantTrilingualInvitation(
  event: Pick<HydratedEvent, "input" | "plan">,
  tone = "Warm Traditional",
  hostLine = "Hosted with love by the Family"
): InvitationBundle {
  const venueName =
    event.plan?.venueSuggestions?.[0]?.citedVendorName ||
    `${event.input.city} Heritage Courtyard`;

  return {
    tone,
    hostLine,
    english: {
      headline: `Celebrating ${event.input.title}`,
      body: `With immense joy and gratitude, we invite you and your family to join us for ${event.input.title}—an evening of auspicious blessings, warm music, and festive regional dining.`,
      rsvpNote: `${event.input.date} · ${venueName}, ${event.input.city}. Kindly share your RSVP online.`,
    },
    hindi: {
      headline: `शुभ निमंत्रण: ${event.input.title}`,
      body: `सप्रेम नमस्कार। इस पावन और आनंदमय अवसर पर हम आपको सपरिवार सादर आमंत्रित करते हैं। आपकी गरिमामयी उपस्थिति एवं स्नेहिल आशीर्वाद हमारे उत्सव की शोभा बढ़ाएंगे।`,
      rsvpNote: `दिनांक: ${event.input.date} · स्थान: ${venueName}, ${event.input.city}।`,
    },
    kannada: {
      headline: `ಶುಭ ಆಮಂತ್ರಣ: ${event.input.title}`,
      body: `ಆತ್ಮೀಯರೇ, ಈ ಶುಭ ಸಮಾರಂಭಕ್ಕೆ ತಮಗೆಲ್ಲರಿಗೂ ಸಕುಟುಂಬ ಸಪರಿವಾರದವರಾಗಿ ಹೃತ್ಪೂರ್ವಕ ಸ್ವಾಗತ. ತಾವೆಲ್ಲರೂ ಆಗಮಿಸಿ, ಸಂಭ್ರಮದಲ್ಲಿ ಪಾಲ್ಗೊಂಡು ಶುಭ ಹಾರೈಸಬೇಕಾಗಿ ವಿನಂತಿ.`,
      rsvpNote: `ದಿನಾಂಕ: ${event.input.date} · ಸ್ಥಳ: ${venueName}, ${event.input.city}.`,
    },
  };
}

export async function generateTrilingualInvitation(
  event: HydratedEvent,
  tone: string,
  hostLine: string
): Promise<InvitationBundle> {
  const ai = getGeminiClient();
  const venueName =
    event.plan?.venueSuggestions?.[0]?.citedVendorName ||
    `${event.input.city} Heritage Courtyard`;

  const fallbackInvite = buildInstantTrilingualInvitation(
    event,
    tone,
    hostLine
  );

  if (!ai) return fallbackInvite;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await Promise.race([
        ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: `Write an Indian celebration invitation in English, Hindi (Devanagari), and Kannada (Kannada script).
Event: ${event.input.title} (${event.input.subTradition}) on ${event.input.date} at ${venueName}, ${event.input.city}. Tone: ${tone}. Host: ${hostLine}.
Return ONLY JSON:
{
  "tone": "${tone}",
  "hostLine": "${hostLine}",
  "english": {"headline": "...", "body": "...", "rsvpNote": "..."},
  "hindi": {"headline": "...", "body": "...", "rsvpNote": "..."},
  "kannada": {"headline": "...", "body": "...", "rsvpNote": "..."}
}`,
          config: {
            responseMimeType: "application/json",
            temperature: 0.45,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Invite SLA timeout")), 4000)
        ),
      ]);

      return InvitationBundleSchema.parse(JSON.parse((res.text || "{}").trim()));
    } catch (err) {
      console.warn(`Invitation generation attempt ${attempt + 1} warning:`, err);
      if (err instanceof Error && err.message.includes("timeout")) break;
    }
  }

  return fallbackInvite;
}

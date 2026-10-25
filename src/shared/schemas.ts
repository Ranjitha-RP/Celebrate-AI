import { z } from "zod";

export const CityEnum = z.enum([
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai",
]);
export type City = z.infer<typeof CityEnum>;

export const EventTypeEnum = z.enum([
  "wedding",
  "birthday",
  "anniversary",
  "corporate",
  "festival",
]);
export type EventType = z.infer<typeof EventTypeEnum>;

export const BudgetCategoryEnum = z.enum([
  "venue",
  "catering",
  "decor",
  "entertainment",
  "photography",
  "misc",
]);
export type BudgetCategory = z.infer<typeof BudgetCategoryEnum>;

export const VendorCategoryEnum = z.enum([
  "venue",
  "catering",
  "decor",
  "photography",
  "entertainment",
  "makeup",
]);
export type VendorCategory = z.infer<typeof VendorCategoryEnum>;

export const EventInputSchema = z.object({
  title: z.string().min(2).max(120),
  eventType: EventTypeEnum,
  subTradition: z.string().default("Pan-Indian Contemporary"),
  date: z.string(),
  city: CityEnum,
  guestCount: z.number().int().min(10).max(5000),
  totalBudget: z.number().min(25000).max(100000000),
  vibePreferences: z.string().default("Warm, celebratory, family-focused"),
  dietaryNeeds: z.array(z.string()).default(["Pure Veg"]),
});
export type EventInput = z.infer<typeof EventInputSchema>;

export const VendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: VendorCategoryEnum,
  city: CityEnum,
  priceMin: z.number(),
  priceMax: z.number(),
  rating: z.number().min(1).max(5),
  tags: z.array(z.string()),
  description: z.string(),
  contactPerson: z.string(),
  contactPhone: z.string(),
});
export type Vendor = z.infer<typeof VendorSchema>;

export const ThemeSeedSchema = z.object({
  id: z.string(),
  name: z.string(),
  eventTypes: z.array(EventTypeEnum),
  palette: z.array(z.string()),
  paletteNames: z.array(z.string()),
  vibeTags: z.array(z.string()),
  description: z.string(),
  moodBoardNotes: z.string(),
});
export type ThemeSeed = z.infer<typeof ThemeSeedSchema>;

export const CultureSeedSchema = z.object({
  id: z.string(),
  title: z.string(),
  eventTypes: z.array(EventTypeEnum),
  regionOrTradition: z.string(),
  muhuratGuidance: z.string(),
  keyRituals: z.array(z.string()),
  regionalFoodHighlights: z.array(z.string()),
  auspiciousElements: z.string(),
});
export type CultureSeed = z.infer<typeof CultureSeedSchema>;

export const CitedRecommendationSchema = z.object({
  title: z.string(),
  citedVendorId: z.string(),
  citedVendorName: z.string(),
  estimatedCostInr: z.number(),
  highlights: z.array(z.string()),
  rationale: z.string(),
});
export type CitedRecommendation = z.infer<typeof CitedRecommendationSchema>;

export const CateringPlanSchema = z.object({
  citedVendorId: z.string(),
  citedVendorName: z.string(),
  perPlateInr: z.number(),
  estimatedTotalInr: z.number(),
  dietaryComplianceNote: z.string(),
  welcomeDrinks: z.array(z.string()),
  starters: z.array(z.string()),
  mainCourse: z.array(z.string()),
  desserts: z.array(z.string()),
  rationale: z.string(),
});
export type CateringPlan = z.infer<typeof CateringPlanSchema>;

export const RunSheetItemSchema = z.object({
  id: z.string(),
  time: z.string(),
  activity: z.string(),
  owner: z.string(),
  vendorCategory: z.string(),
  vendorContact: z.string(),
  arrivalTime: z.string(),
  status: z.enum(["scheduled", "arrived", "completed"]),
});
export type RunSheetItem = z.infer<typeof RunSheetItemSchema>;

export const PlanSchema = z.object({
  summaryPitch: z.string(),
  theme: z.object({
    name: z.string(),
    sourceThemeId: z.string(),
    sourceThemeName: z.string(),
    description: z.string(),
    palette: z.array(z.string()),
    paletteNames: z.array(z.string()),
    moodBoardDescription: z.string(),
  }),
  venueSuggestions: z.array(CitedRecommendationSchema).min(1),
  cateringPlan: CateringPlanSchema,
  decorPlan: CitedRecommendationSchema,
  entertainmentPlan: CitedRecommendationSchema,
  photographyPlan: CitedRecommendationSchema,
  culturalAdvisory: z.object({
    sourceCultureId: z.string(),
    sourceCultureTitle: z.string(),
    muhuratWindow: z.string(),
    rituals: z.array(z.string()),
    regionalFoodNotes: z.array(z.string()),
    etiquetteTip: z.string(),
  }),
  runSheet: z.array(RunSheetItemSchema),
  generatedVia: z.enum(["gemini-rag", "cached-demo-fallback"]),
});
export type Plan = z.infer<typeof PlanSchema>;

export const BudgetAllocationSchema = z.object({
  category: BudgetCategoryEnum,
  label: z.string(),
  plannedAmount: z.number(),
  actualSpent: z.number(),
  minPct: z.number(),
  maxPct: z.number(),
  priorityWeight: z.number(),
  locked: z.boolean(),
  rationale: z.string(),
});
export type BudgetAllocation = z.infer<typeof BudgetAllocationSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string(),
  category: z.string(),
  dueDate: z.string(),
  daysBefore: z.number(),
  priority: z.enum(["high", "medium", "low"]),
  completed: z.boolean(),
});
export type Task = z.infer<typeof TaskSchema>;

export const GuestSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  name: z.string().min(1),
  contact: z.string().default(""),
  status: z.enum(["yes", "no", "pending"]),
  partySize: z.number().int().min(1).max(20).default(1),
  dietaryPreference: z.string().default("Pure Veg"),
  notes: z.string().default(""),
});
export type Guest = z.infer<typeof GuestSchema>;

export const InvitationBundleSchema = z.object({
  tone: z.string(),
  hostLine: z.string(),
  english: z.object({
    headline: z.string(),
    body: z.string(),
    rsvpNote: z.string(),
  }),
  hindi: z.object({
    headline: z.string(),
    body: z.string(),
    rsvpNote: z.string(),
  }),
  kannada: z.object({
    headline: z.string(),
    body: z.string(),
    rsvpNote: z.string(),
  }),
});
export type InvitationBundle = z.infer<typeof InvitationBundleSchema>;

export const PlanPatchSchema = z.object({
  assistantMessage: z.string(),
  newTotalBudget: z.number().nullable().optional(),
  categoryBudgetAdjustments: z
    .array(
      z.object({
        category: BudgetCategoryEnum,
        targetAmount: z.number(),
        reason: z.string(),
      })
    )
    .default([]),
  vendorSwaps: z
    .array(
      z.object({
        section: z.enum(["venue", "catering", "decor", "entertainment", "photography"]),
        citedVendorId: z.string(),
        citedVendorName: z.string(),
        estimatedCostInr: z.number(),
        rationale: z.string(),
      })
    )
    .default([]),
  menuAdditions: z.array(z.string()).default([]),
  tasksToAdd: z
    .array(
      z.object({
        title: z.string(),
        category: z.string(),
        daysBefore: z.number(),
        priority: z.enum(["high", "medium", "low"]),
      })
    )
    .default([]),
  changedSections: z.array(z.string()).default([]),
});
export type PlanPatch = z.infer<typeof PlanPatchSchema>;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  changedSections?: string[];
  createdAt: string;
}

export interface HydratedEvent {
  id: string;
  rsvpToken: string;
  input: EventInput;
  plan: Plan | null;
  budget: BudgetAllocation[];
  budgetTradeoffNote: string;
  tasks: Task[];
  guests: Guest[];
  shortlistedVendorIds: string[];
  invitation: InvitationBundle | null;
  chatHistory: ChatMessage[];
  createdAt: string;
}

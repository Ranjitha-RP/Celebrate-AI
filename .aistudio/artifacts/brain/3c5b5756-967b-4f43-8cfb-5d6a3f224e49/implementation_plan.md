# Celebrate AI — Intelligent Celebration & Event Planner

Celebrate AI replaces fragmented spreadsheets, vendor phone calls, and runaway budgets with a unified, culturally grounded workspace where Indian families and individuals generate, optimize, chat-refine, and execute complete celebration plans in under two minutes.

## User Review & Critical Decisions

> [!IMPORTANT]
> Below are the architectural and product choices confirmed during Phase 1 so the hackathon prototype runs natively out of the box with zero external setup friction.

- **Confirmed Stack & AI Engine**: Node.js + Express backend with Vite middleware serving React + Tailwind CSS on port 3000, powered server-side by the Google Gemini API (`gemini-3.8-flash` for structured JSON generation & chat patching, `gemini-embedding-2-preview` + cosine/BM25 hybrid vector retrieval for RAG) with Zod schema validation and automatic 1-retry fallback.
- **Confirmed Scope**: Full end-to-end prototype delivering all 6 core must-haves (Setup Wizard, Grounded AI Plan, Smart Budget Planner, Countdown Timeline, Guest RSVP Portal, Vendor Shortlisting) plus all 5 differentiators (Conversational Plan Patching with live diff highlights, Constraint-Solver Budget Optimizer, Trilingual Printable Invitations & Mood Board, Day-of Run Sheet, and Indian Cultural/Muhurat Intelligence), plus a subtle "Coming Soon" roadmap strip.
- **Confirmed Aesthetic Direction**: Modern Indian Festive Editorial — warm ivory alabaster surfaces (`#FCFBF8`), deep charcoal ink (`#1C1917`), festive crimson primary actions (`#BE123C`), marigold saffron highlights (`#D97706`), and tabular monospace numerals for every rupee figure and countdown metric.
- **Persistence & Zero-Network Resilience**: Embedded SQLite database (`better-sqlite3`) storing events, budgets, tasks, guests, RSVP tokens, shortlists, invitations, and chat history, paired with a pre-cached, deterministic JSON scenario (`"50th Golden Wedding Anniversary, 120 guests, ₹5,00,000, Bengaluru"`) so the 3-minute hackathon demo works instantaneously even completely offline.

---

## 1. Overview & Core Concept

- **What It Does**: Users complete a guided 60-second setup wizard (or click **Load Demo Event**) to receive a structured, dataset-grounded celebration blueprint: curated theme & mood board, cited local venue/catering/decor/entertainment recommendations, smart rupee budget splits, backward-counted task checklists, day-of minute-by-minute run sheets, Indian auspicious muhurat & regional ritual guidance, trilingual invitations (English, Hindi, Kannada), and a shareable guest RSVP link. Users can then chat naturally (e.g., *"Reduce budget by 20%"* or *"Add a live Carnatic fusion band"*) to watch the plan patch itself live with changed items highlighted.
- **Target Audience / Persona**: Indian families, couples, and organizers across Bengaluru, Mumbai, Delhi, Hyderabad, and Chennai planning weddings, milestone anniversaries, birthdays, regional festivals (Diwali, Ganesh Chaturthi, Pongal), and boutique corporate gatherings.
- **Key Value**: Eliminates hallucinated vendor advice by grounding every AI suggestion in a curated 45-vendor, 18-theme, and cultural rituals dataset with explicit source citations, while mathematically preventing budget overruns via a constrained weighted budget solver.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Zero-State Hero & Instant Setup (< 2 Minutes)**:
   - Clean landing/setup experience featuring a prominent **Load Demo Event** action (`50th Anniversary · 120 Guests · ₹5,00,000 · Bengaluru`) alongside a streamlined 3-step Event Setup Wizard (Basics & City → Budget & Guest Count → Vibe, Tradition & Dietary Needs).
   - Submitting triggers a multi-stage progress state (Retrieving city vendors & cultural rituals → Running constraint budget allocation → Synthesizing grounded event blueprint) with geometry-matched loading skeletons.
2. **Unified Celebration Workspace**:
   - Opens into a crisp 1440px desktop-first workspace with contextual event summary bar (Event Title, Date Countdown, Total Budget vs. Allocated, Confirmed Guests) and clean segmented navigation across:
     - **Overview**: Curated Theme & Mood Board palette, Cited Venue/Catering/Decor/Entertainment Plan Cards (each citing its exact dataset source), Cultural & Muhurat Advisory panel, Printable Trilingual Invitation Studio (English, हिन्दी, ಕನ್ನಡ), Day-of Run Sheet toggle, and Roadmap ("Coming Soon") preview strip.
     - **Budget**: Interactive SVG Donut Chart + category progress bars (Venue, Catering, Decor, Entertainment, Photography, Misc). Users edit planned or actual spent amounts inline, lock categories, or click **Auto-Rebalance** to run the constraint solver with plain-English trade-off explanations and overspend alerts.
     - **Timeline**: Tasks auto-scheduled backward from the event date (e.g., T-90 days, T-30 days, T-7 days, Event Morning), filterable by category and priority, with interactive checkboxes and custom task creation, plus the **Day-of Run Sheet** (minute-by-minute schedule & vendor arrival/contact coordination table).
     - **Guests & RSVP**: Summary metrics (Total Invited, Attending, Declined, Pending, Dietary Breakdown), quick guest entry, and a one-click **Open / Share Public RSVP Page** (`/rsvp/:token` view) where guests submit attendance, headcount, and dietary preferences (Jain, Pure Veg, Vegan, Halal, Non-Veg) that immediately update the host's totals.
     - **Vendors**: Searchable, filterable directory of 45+ real-format Indian vendors across 5 cities and 6 categories, pre-filtered to the user's city and budget ceiling, showing rating, INR price range, tags, AI citation match indicator, and one-click **Shortlist** toggle.
     - **Chat Planner (Slide-Over & Dedicated Tab)**: Persistent conversational co-planner with quick-action prompts (*"Reduce total budget by 20%"*, *"Add a live acoustic/fusion band"*, *"Make catering strictly South Indian & Jain friendly"*). Returns a validated `PlanPatch` JSON that mutates budget, vendors, menu, or tasks in place and highlights modified elements with subtle saffron diff indicators.

### Visual Identity & Theme
- **Aesthetic Direction**: *Modern Indian Festive Editorial* — warm, celebratory sophistication inspired by bespoke Indian wedding stationery and architectural hospitality journals, avoiding cluttered SaaS chrome or garish neon gradients.
- **Color Palette & 60-30-10 Discipline**:
  - **60% Dominant Canvas (`--background`)**: Warm Ivory Alabaster (`#FCFBF8`) with crisp pure-white elevated surfaces (`#FFFFFF`) and subtle warm stone hairline borders (`#E7E5E4`).
  - **30% Structural Surfaces & Typography**: Deep Charcoal Espresso (`#1C1917`) for high-contrast display and prose, paired with Warm Stone Muted (`#57534E`) for clean unboxed metadata (`Bengaluru · ₹1.2L–₹2.0L · ★ 4.8`).
  - **10% Celebratory Accent Budget**: Festive Kumkum Crimson (`#BE123C`) for primary CTAs and active states, paired with Marigold Saffron (`#D97706`) for budget rebalancing highlights/changed-item diffs, and Emerald Leaf (`#15803D`) for on-budget/confirmed RSVP states.
- **Typography & Hierarchy**:
  - *Display & Editorial Headings*: `Fraunces` (expressive warm serif for hero titles, event names, and printable invitation headers, `text-wrap: balance`).
  - *UI & Body Prose*: `Plus Jakarta Sans` (clean, legible geometric sans for navigation, forms, vendor descriptions, and chat).
  - *Financials, Timestamps & Metrics*: `JetBrains Mono` with `tabular-nums` strictly enforced on all ₹ INR figures (formatted in Indian numbering system `₹5,00,000`), percentages, dates, and run-sheet timestamps.
- **Component Styling & Anti-Slop Discipline**:
  - Strict Top Bar Contract: Zone 1 single-line wordmark (`Celebrate AI`), Zone 2 concise workspace view links, Zone 3 primary action (`New Event` / `Load Demo Event`).
  - Zero static pill sandwiches on cards: vendor categories, cities, ratings, and task dates render as clean inline typographic metadata separated by `·`.
  - Single-elevation card surfaces (`border border-stone-200/80 bg-white rounded-xl`) with generous outer padding (`p-6`) exceeding inner grid gaps (`gap-4`).

### Interactive Feedback & Motion
- **Fast Settling Micro-Interactions**: Tab transitions, shortlist toggles, and budget bar updates settle within `180ms` (`transform` and `opacity` only).
- **Live Patch Highlighting**: When the Chat Planner applies a `PlanPatch`, affected budget rows, tasks, or menu cards briefly illuminate with a soft marigold border + `"Updated via Chat"` inline indicator so judges clearly see the AI mutation during a live 3-minute demo.
- **Resilient States**: Geometry-matched skeleton loaders during AI generation, clear empty states, friendly toast banners on save/copy, and seamless automatic fallback to the cached golden demo scenario if `GEMINI_API_KEY` is absent or offline.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Node.js + Express + Gemini API over Python FastAPI + Claude**
  - *Chosen Approach*: Full-stack TypeScript Express server integrated directly with Vite on port 3000, calling `gemini-3.8-flash` with `responseSchema` + `zod` runtime schema validation and 1-retry self-correction.
  - *Why*: Runs natively in the Google AI Studio Cloud Run container with pre-injected `GEMINI_API_KEY` and zero external key friction, while fulfilling every REST endpoint, strict schema validation (`Zod` equivalent to `Pydantic`), and structured JSON contract specified in the prompt.
- **Decision 2: Deterministic Hybrid Vector RAG Engine**
  - *Chosen Approach*: Seed 45+ Indian vendors (Bengaluru, Mumbai, Delhi, Hyderabad, Chennai), 18+ celebration themes, and 12+ regional cultural/ritual guides in structured JSON; index them in an in-memory vector store combining `gemini-embedding-2-preview` embeddings (with deterministic TF-IDF/BM25 cosine fallback when offline) and metadata pre-filtering (city + budget ceiling).
  - *Why*: Guarantees zero hallucinated vendor names, enforces dataset ID citations on every AI recommendation, and works instantaneously even with zero network connectivity.
- **Decision 3: Constrained Weighted Least-Squares Budget Solver**
  - *Chosen Approach*: Dedicated server-side mathematical optimizer enforcing hard category min/max bounds (e.g., Catering $\ge 22\%$, Venue $20\%–42\%$, Contingency $\ge 5\%$), locked user categories, and event-type priority weights so total allocations always sum to exact `total_budget` in ₹ INR, paired with deterministic trade-off explanations.
  - *Why*: Delivers genuine algorithmic optimization (the exact role of `scipy` / `OR-Tools` linear/quadratic allocation) in pure TypeScript with zero native binary compilation failures and sub-millisecond recalculation.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT: React 19 + Tailwind CSS                           │
│                                                                                   │
│  ┌──────────────────────┐   ┌──────────────────────────────────────────────────┐  │
│  │ Top Navigation Bar   │   │ Public Guest Portal (/rsvp/:token)               │  │
│  │ Brand · Views · Demo │   │ Event Card · Attendance · Headcount · Dietary    │  │
│  └──────────┬───────────┘   └────────────────────────┬─────────────────────────┘  │
│             ▼                                        │                            │
│  ┌──────────────────────┐   ┌────────────────────────┼─────────────────────────┐  │
│  │ Event Setup Wizard   │──▶│ Celebration Dashboard Workspace                  │  │
│  │ • Step 1: Basics     │   │ ┌──────────┬────────┬──────────┬───────────────┐ │  │
│  │ • Step 2: ₹ & Guests │   │ │ Overview │ Budget │ Timeline │ Guests/Vendors│ │  │
│  │ • Step 3: Vibe/Diet  │   │ └────┬─────┴───┬────┴────┬─────┴───────┬───────┘ │  │
│  │ • [Load Demo Event]  │   │      ▼         ▼         ▼             ▼         │  │
│  └──────────────────────┘   │  Theme/Mood  Donut +   Countdown   Shortlist +   │  │
│                             │  Rituals &   Solver    Checklist   RSVP Tracker  │  │
│                             │  Trilingual  Sliders   & Day-Of                  │  │
│                             │  Invite Card           Run Sheet                 │  │
│                             └────────────────────────┬─────────────────────────┘  │
│                                                      ▼                            │
│                             ┌──────────────────────────────────────────────────┐  │
│                             │ Conversational Co-Planner (Chat Drawer & Tab)    │  │
│                             │ Prompt Chips ─▶ Structured PlanPatch ─▶ Diff UI  │  │
│                             └────────────────────────┬─────────────────────────┘  │
└──────────────────────────────────────────────────────┼────────────────────────────┘
                                                       │ REST JSON (/api/*)
┌──────────────────────────────────────────────────────▼────────────────────────────┐
│                     SERVER: Express + TypeScript (Port 3000)                      │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ REST Router (/api/events, /api/vendors, /api/rsvp/:token)                   │  │
│  │ Strict Zod Schema Validation (EventInput, Plan, BudgetAllocation, PlanPatch)│  │
│  └──────────┬─────────────────────────┬──────────────────────────┬─────────────┘  │
│             ▼                         ▼                          ▼                │
│  ┌─────────────────────┐   ┌──────────────────────┐   ┌────────────────────────┐  │
│  │ RAG Vector Store    │   │ Gemini AI Service    │   │ Constraint Optimizer   │  │
│  │ • 45+ City Vendors  │   │ • gemini-3.8-flash   │   │ • Min/Max Category %   │  │
│  │ • 18+ Event Themes  │   │ • Strict JSON Schema │   │ • Priority Weights     │  │
│  │ • 12+ Ritual Guides │   │ • Dataset Citations  │   │ • Locked Allocations   │  │
│  │ • Cosine + BM25     │   │ • 1x Retry + Offline │   │ • Trade-off Explainer  │  │
│  │   Top-K Retrieval   │   │   Demo Cache Fallback│   │                        │  │
│  └──────────┬──────────┘   └──────────┬───────────┘   └──────────┬─────────────┘  │
│             └─────────────────────────┼──────────────────────────┘                │
│                                       ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ SQLite Database (better-sqlite3) + Seeded Offline Golden Demo Cache         │  │
│  │ Tables: events, plans, budget_items, tasks, guests, vendor_shortlists, msgs │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Validated Schemas
All inputs and LLM outputs are strictly validated via shared Zod schemas (mirroring the requested Pydantic models):
- **`EventInput`**: `title`, `eventType` (`wedding` | `birthday` | `anniversary` | `corporate` | `festival`), `subTradition` (e.g., South Indian, North Indian, Diwali, Golden Jubilee), `date`, `city` (`Bengaluru` | `Mumbai` | `Delhi` | `Hyderabad` | `Chennai`), `guestCount`, `totalBudget` (INR), `vibePreferences`, `dietaryNeeds` (`Veg`, `Jain`, `Vegan`, `Halal`, `Non-Veg`).
- **`Plan`**:
  - `theme`: Title, description, color palette hexes, mood-board visual direction, and `sourceThemeId` citation.
  - `venueSuggestions`, `cateringPlan`, `decorPlan`, `entertainmentPlan`: Structured recommendations where every vendor/concept explicitly carries `citedVendorId`, `citedVendorName`, `estimatedCostInr`, and rationale.
  - `culturalAdvisory`: Auspicious `muhuratWindow`, regional rituals/customs, traditional culinary must-haves, and `sourceCultureId` citation.
  - `runSheet`: Minute-by-minute event-day schedule (`time`, `activity`, `owner`, `vendorCategory`, `arrivalTime`, `status`).
- **`BudgetAllocation`**: Category (`venue`, `catering`, `decor`, `entertainment`, `photography`, `misc`), `plannedAmount`, `actualSpent`, `minPct`, `maxPct`, `locked`, `rationale`.
- **`Task`**: `id`, `title`, `category`, `dueDate` (counted back from event date), `daysBefore`, `priority` (`high` | `medium` | `low`), `completed`.
- **`Guest`**: `id`, `name`, `phoneOrEmail`, `status` (`yes` | `no` | `pending`), `partySize`, `dietaryPreference`, `notes`, linked to event `rsvpToken`.
- **`Vendor`**: 45+ seeded items with `id`, `name`, `category`, `city`, `priceMin`, `priceMax`, `rating`, `tags`, `description`, `contactPerson`.
- **`PlanPatch`**: Structured delta returned by `POST /api/events/:id/chat` containing `assistantSummary`, `budgetUpdates`, `menuUpdates`, `vendorSwaps` (restricted to retrieved RAG vendor IDs), `tasksAdded`, `changedSections` (used by UI to highlight diffs).
- **`InvitationBundle`**: Generated trilingual copy (`english`, `hindi`, `kannada`), tone (`Warm Traditional`, `Regal Poetic`, `Modern Minimal`), color palette, and layout metadata for print/share.

### REST API Contract & State Mapping
- `POST /api/events` & `POST /api/events/demo`: Creates an event (or instant-loads the cached `"50th Anniversary, 120 guests, ₹5,00,000, Bengaluru"` scenario with zero network latency).
- `POST /api/events/:id/generate-plan`: Runs RAG top-k retrieval over city vendors, themes, and Indian cultural guides → runs the Constraint Budget Optimizer → calls `gemini-3.8-flash` with strict JSON schema → validates citations & schema (retrying once on validation error, falling back cleanly if offline) → persists full plan, timeline tasks, and run sheet.
- `GET /api/events/:id`: Returns hydrated event, plan, budget allocations, tasks, guests, shortlisted vendors, invitations, and chat history.
- `PATCH /api/events/:id/budget`: Updates planned or actual spent amounts, locks modified categories if requested, executes the constraint solver to rebalance unlocked categories within min/max bounds, and returns plain-language trade-off explanations.
- `POST /api/events/:id/tasks` & `PATCH /api/events/:id/tasks/:taskId`: Toggles task completion, updates run-sheet vendor arrival statuses, or adds custom checklist items.
- `POST /api/events/:id/chat`: Retrieves matching alternative vendors/themes via RAG for the user's request (e.g., *"make it 20% cheaper"*, *"add a live band"*), requests a structured `PlanPatch` from Gemini, applies budget rebalancing + plan updates atomically in SQLite, and returns the updated state + `changedSections` diff array.
- `GET /api/events/:id/guests`, `POST /api/events/:id/guests`, `GET /api/rsvp/:token`, `POST /api/rsvp/:token`: Powers host guest tracking and the standalone shareable RSVP view without requiring guest login.
- `GET /api/vendors` & `POST /api/events/:id/shortlist`: Filters the 45+ vendor catalog by city, category, search query, and max budget, and toggles event shortlists.
- `POST /api/events/:id/invitation`: Generates/updates English, Hindi, and Kannada invitation copy in the chosen tone and renders a print-ready (`window.print()` CSS `@media print` isolated) invitation card & mood board.
